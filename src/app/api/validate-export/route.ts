import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { appConfigManager } from '@/storage/database/appConfigManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';

/**
 * 辅助函数：将数据库中的字符串数值转换为数字
 */
function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * 辅助函数：验证数值精度
 */
function validateNumericPrecision(
  value: any,
  fieldName: string,
  precision: number,
  scale: number
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const num = safeNumber(value);

  if (num === null) {
    issues.push(`${fieldName}: 值为 null`);
    return { valid: false, issues };
  }

  const strValue = value.toString();
  const decimalPart = strValue.split('.')[1] || '';

  // 检查小数位数
  if (decimalPart.length > scale) {
    issues.push(`${fieldName}: 小数位数 ${decimalPart.length} 超过限制 ${scale}`);
  }

  // 检查整数位数
  const integerPart = strValue.split('.')[0] || '0';
  const maxIntegerDigits = precision - scale;
  if (integerPart.replace('-', '').length > maxIntegerDigits) {
    issues.push(`${fieldName}: 整数位数 ${integerPart.replace('-', '').length} 超过限制 ${maxIntegerDigits}`);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * 辅助函数：验证价格计算的准确性
 */
function validatePriceCalculation(product: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // 基本检查
  if (!product.weight || parseFloat(product.weight) <= 0) {
    issues.push(`重量必须大于 0，当前值: ${product.weight}`);
  }

  if (!product.laborCost || parseFloat(product.laborCost) < 0) {
    issues.push(`工费不能为负数，当前值: ${product.laborCost}`);
  }

  if (!product.goldPrice || parseFloat(product.goldPrice) <= 0) {
    issues.push(`金价必须大于 0，当前值: ${product.goldPrice}`);
  }

  // 检查价格合理性
  const wholesalePrice = parseFloat(product.wholesalePrice);
  const retailPrice = parseFloat(product.retailPrice);

  if (wholesalePrice < 0) {
    issues.push(`批发价不能为负数，当前值: ${wholesalePrice}`);
  }

  if (retailPrice < 0) {
    issues.push(`零售价不能为负数，当前值: ${retailPrice}`);
  }

  // 批发价应该小于零售价（正常情况下）
  if (wholesalePrice > 0 && retailPrice > 0 && wholesalePrice >= retailPrice) {
    issues.push(`批发价 (${wholesalePrice}) 应该小于零售价 (${retailPrice})`);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * GET /api/validate-export - 验证导出数据的准确性
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 开始验证导出数据的准确性...');

    // 获取所有数据
    const products = await productManager.getProducts(user.id, { limit: 10000 });
    const configs = await appConfigManager.getAllConfigs(user.id);
    const priceHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });

    console.log('📊 加载数据:', {
      productsCount: products.length,
      configsCount: configs.length,
      historyCount: priceHistory.length,
    });

    const validationResults = {
      overallStatus: '✅ 通过' as string,
      timestamp: new Date().toISOString(),
      dataCounts: {
        products: products.length,
        configs: configs.length,
        history: priceHistory.length,
      },
      productValidation: {
        valid: true,
        total: products.length,
        validCount: 0,
        invalidCount: 0,
        issues: [] as any[],
      },
      historyValidation: {
        valid: true,
        total: priceHistory.length,
        validCount: 0,
        invalidCount: 0,
        issues: [] as any[],
      },
      configValidation: {
        valid: true,
        total: configs.length,
        validCount: 0,
        invalidCount: 0,
        issues: [] as any[],
      },
    };

    // 1. 验证产品数据
    console.log('📦 验证产品数据...');
    for (const product of products) {
      const issues: string[] = [];

      // 验证必填字段
      if (!product.id) issues.push('缺少 id');
      if (!product.productCode) issues.push('缺少 productCode');
      if (!product.productName) issues.push('缺少 productName');
      if (!product.category) issues.push('缺少 category');
      if (!product.karat) issues.push('缺少 karat');
      if (!product.goldColor) issues.push('缺少 goldColor');

      // 验证数值精度
      const weightValidation = validateNumericPrecision(product.weight, '重量', 10, 3);
      if (!weightValidation.valid) {
        issues.push(...weightValidation.issues);
      }

      const laborCostValidation = validateNumericPrecision(product.laborCost, '工费', 10, 2);
      if (!laborCostValidation.valid) {
        issues.push(...laborCostValidation.issues);
      }

      const goldPriceValidation = validateNumericPrecision(product.goldPrice, '金价', 10, 2);
      if (!goldPriceValidation.valid) {
        issues.push(...goldPriceValidation.issues);
      }

      const retailPriceValidation = validateNumericPrecision(product.retailPrice, '零售价', 12, 2);
      if (!retailPriceValidation.valid) {
        issues.push(...retailPriceValidation.issues);
      }

      const wholesalePriceValidation = validateNumericPrecision(product.wholesalePrice, '批发价', 12, 2);
      if (!wholesalePriceValidation.valid) {
        issues.push(...wholesalePriceValidation.issues);
      }

      // 验证价格计算
      const priceValidation = validatePriceCalculation(product);
      if (!priceValidation.valid) {
        issues.push(...priceValidation.issues);
      }

      // 检查特殊系数
      if (product.specialMaterialLoss !== null) {
        const specialLossValidation = validateNumericPrecision(product.specialMaterialLoss, '特殊材料损耗', 5, 2);
        if (!specialLossValidation.valid) {
          issues.push(...specialLossValidation.issues);
        }
      }

      if (product.specialMaterialCost !== null) {
        const specialCostValidation = validateNumericPrecision(product.specialMaterialCost, '特殊材料浮动', 5, 2);
        if (!specialCostValidation.valid) {
          issues.push(...specialCostValidation.issues);
        }
      }

      if (product.specialProfitMargin !== null) {
        const specialMarginValidation = validateNumericPrecision(product.specialProfitMargin, '特殊关税系数', 5, 2);
        if (!specialMarginValidation.valid) {
          issues.push(...specialMarginValidation.issues);
        }
      }

      if (product.specialLaborFactorRetail !== null) {
        const specialRetailValidation = validateNumericPrecision(product.specialLaborFactorRetail, '特殊零售工费系数', 5, 2);
        if (!specialRetailValidation.valid) {
          issues.push(...specialRetailValidation.issues);
        }
      }

      if (product.specialLaborFactorWholesale !== null) {
        const specialWholesaleValidation = validateNumericPrecision(product.specialLaborFactorWholesale, '特殊批发工费系数', 5, 2);
        if (!specialWholesaleValidation.valid) {
          issues.push(...specialWholesaleValidation.issues);
        }
      }

      if (issues.length > 0) {
        validationResults.productValidation.valid = false;
        validationResults.productValidation.invalidCount++;
        validationResults.productValidation.issues.push({
          productCode: product.productCode,
          issues: issues,
        });
      } else {
        validationResults.productValidation.validCount++;
      }
    }

    console.log('✅ 产品数据验证完成:', {
      valid: validationResults.productValidation.validCount,
      invalid: validationResults.productValidation.invalidCount,
    });

    // 2. 验证价格历史
    console.log('📈 验证价格历史...');
    for (const history of priceHistory) {
      const issues: string[] = [];

      // 验证必填字段
      if (!history.id) issues.push('缺少 id');
      if (!history.productId) issues.push('缺少 productId');
      if (!history.productCode) issues.push('缺少 productCode');

      // 验证数值精度
      const goldPriceValidation = validateNumericPrecision(history.goldPrice, '金价', 10, 2);
      if (!goldPriceValidation.valid) {
        issues.push(...goldPriceValidation.issues);
      }

      const retailPriceValidation = validateNumericPrecision(history.retailPrice, '零售价', 12, 2);
      if (!retailPriceValidation.valid) {
        issues.push(...retailPriceValidation.issues);
      }

      const wholesalePriceValidation = validateNumericPrecision(history.wholesalePrice, '批发价', 12, 2);
      if (!wholesalePriceValidation.valid) {
        issues.push(...wholesalePriceValidation.issues);
      }

      if (issues.length > 0) {
        validationResults.historyValidation.valid = false;
        validationResults.historyValidation.invalidCount++;
        validationResults.historyValidation.issues.push({
          productCode: history.productCode,
          issues: issues,
        });
      } else {
        validationResults.historyValidation.validCount++;
      }
    }

    console.log('✅ 价格历史验证完成:', {
      valid: validationResults.historyValidation.validCount,
      invalid: validationResults.historyValidation.invalidCount,
    });

    // 3. 验证配置数据
    console.log('⚙️  验证配置数据...');
    for (const config of configs) {
      const issues: string[] = [];

      // 验证必填字段
      if (!config.configKey) issues.push('缺少 configKey');
      if (!config.configValue) issues.push('缺少 configValue');

      // 验证特定配置的值
      if (config.configKey === 'goldPrice') {
        const goldPrice = parseFloat(String(config.configValue));
        if (isNaN(goldPrice) || goldPrice <= 0) {
          issues.push(`金价配置值无效: ${config.configValue}`);
        }
      }

      if (config.configKey === 'priceCoefficients') {
        const coeffs = config.configValue as any;
        if (!coeffs.goldFactor10K || !coeffs.goldFactor14K || !coeffs.goldFactor18K) {
          issues.push('价格系数缺少金重因子');
        }
        if (!coeffs.laborFactorRetail || !coeffs.laborFactorWholesale) {
          issues.push('价格系数缺少工费因子');
        }
        if (!coeffs.materialLoss || !coeffs.materialCost || !coeffs.profitMargin) {
          issues.push('价格系数缺少材料或关税因子');
        }
      }

      if (config.configKey === 'dataVersion') {
        const version = parseInt(String(config.configValue));
        if (isNaN(version) || version < 0) {
          issues.push(`数据版本号无效: ${config.configValue}`);
        }
      }

      if (issues.length > 0) {
        validationResults.configValidation.valid = false;
        validationResults.configValidation.invalidCount++;
        validationResults.configValidation.issues.push({
          configKey: config.configKey,
          issues: issues,
        });
      } else {
        validationResults.configValidation.validCount++;
      }
    }

    console.log('✅ 配置数据验证完成:', {
      valid: validationResults.configValidation.validCount,
      invalid: validationResults.configValidation.invalidCount,
    });

    // 4. 确定整体状态
    if (
      !validationResults.productValidation.valid ||
      !validationResults.historyValidation.valid ||
      !validationResults.configValidation.valid
    ) {
      validationResults.overallStatus = '⚠️ 发现问题';
    }

    console.log('✅ 验证完成:', validationResults.overallStatus);

    return NextResponse.json(validationResults);
  } catch (error: any) {
    console.error('❌ 验证导出数据失败:', error);
    return NextResponse.json(
      { error: error.message || '验证导出数据失败' },
      { status: 500 }
    );
  }
}

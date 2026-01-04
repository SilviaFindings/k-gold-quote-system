import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { appConfigManager } from '@/storage/database/appConfigManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';

/**
 * POST /api/verify - 验证数据完整性
 * Body:
 * - localProductCount: localStorage 中的产品数量
 * - localHistoryCount: localStorage 中的历史记录数量
 * - hasGoldPrice: 是否有金价配置
 * - hasCoefficients: 是否有价格系数配置
 * - hasDataVersion: 是否有数据版本号
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      localProductCount = 0,
      localHistoryCount = 0,
      localProductIds = [],
      localHistoryIds = [],
      hasGoldPrice = false,
      hasCoefficients = false,
      hasDataVersion = false,
    } = body;

    console.log('🔍 开始验证数据完整性:', {
      userId: user.id,
      localProductCount,
      localHistoryCount,
      localProductIds: localProductIds.length,
      localHistoryIds: localHistoryIds.length,
      hasGoldPrice,
      hasCoefficients,
      hasDataVersion,
    });

    // 1. 检查产品数据
    const dbProducts = await productManager.getProducts(user.id, { limit: 10000 });
    const dbProductCount = dbProducts.length;

    // 判断产品数据是否匹配
    let productsMatch = false;
    let productsMessage = '';
    let productsStatus = '';
    let mismatchedIds: string[] = [];

    if (localProductCount === 0 && dbProductCount === 0) {
      // 暂无数据
      productsMatch = true;
      productsStatus = 'ℹ️ 暂无数据';
      productsMessage = 'ℹ️ 本地和数据库都没有产品数据';
    } else if (localProductIds.length > 0 && localProductIds.length === localProductCount) {
      // 如果前端传递了ID列表，进行详细的ID匹配检查
      const dbProductIds = dbProducts.map(p => p.id);
      const missingInDb = localProductIds.filter((id: string) => !dbProductIds.includes(id));
      const extraInDb = dbProductIds.filter(id => !localProductIds.includes(id));

      if (missingInDb.length === 0 && extraInDb.length === 0) {
        productsMatch = true;
        productsStatus = '✅ 完整';
        productsMessage = '✅ 数据完全一致';
      } else if (missingInDb.length > 0) {
        productsMatch = false;
        productsStatus = '⚠️ ID不匹配';
        mismatchedIds = missingInDb;
        productsMessage = `⚠️ 本地有 ${missingInDb.length} 个产品的ID在数据库中不存在，需要同步`;
      } else if (extraInDb.length > 0) {
        productsMatch = true;
        productsStatus = 'ℹ️ 数据库有额外数据';
        productsMessage = `ℹ️ 数据库有 ${extraInDb.length} 个产品是本地没有的`;
      }
    } else if (dbProductCount === localProductCount) {
      // 没有传递ID列表，只检查数量
      productsMatch = true;
      productsStatus = '⚠️ 需要详细验证';
      productsMessage = '⚠️ 数量一致，但建议进行详细验证';
    } else if (dbProductCount > localProductCount) {
      productsMatch = true;
      productsStatus = '✅ 完整';
      productsMessage = `✅ 数据库有更多数据 (${dbProductCount} > ${localProductCount})`;
    } else {
      productsMatch = false;
      productsStatus = '⚠️ 数量不匹配';
      const diffCount = localProductCount - dbProductCount;
      productsMessage = `⚠️ 本地有 ${diffCount} 条未同步的产品数据，需要同步到数据库`;
    }

    console.log('产品数据验证:', {
      localStorage: localProductCount,
      database: dbProductCount,
      localIds: localProductIds.length,
      match: productsMatch,
      message: productsMessage,
      mismatchedIds: mismatchedIds.length,
    });

    // 2. 检查价格历史
    const dbHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });
    const dbHistoryCount = dbHistory.length;

    // 判断价格历史是否匹配
    let historyMatch = false;
    let historyMessage = '';
    let historyStatus = '';
    let mismatchedHistoryIds: string[] = [];

    if (localHistoryCount === 0 && dbHistoryCount === 0) {
      // 暂无数据
      historyMatch = true;
      historyStatus = 'ℹ️ 暂无数据';
      historyMessage = 'ℹ️ 本地和数据库都没有价格历史数据';
    } else if (localHistoryIds.length > 0 && localHistoryIds.length === localHistoryCount) {
      // 如果前端传递了ID列表，进行详细的ID匹配检查
      const dbHistoryIds = dbHistory.map(h => h.id);
      const missingInDb = localHistoryIds.filter((id: string) => !dbHistoryIds.includes(id));
      const extraInDb = dbHistoryIds.filter(id => !localHistoryIds.includes(id));

      if (missingInDb.length === 0 && extraInDb.length === 0) {
        historyMatch = true;
        historyStatus = '✅ 完整';
        historyMessage = '✅ 数据完全一致';
      } else if (missingInDb.length > 0) {
        historyMatch = false;
        historyStatus = '⚠️ ID不匹配';
        mismatchedHistoryIds = missingInDb;
        historyMessage = `⚠️ 本地有 ${missingInDb.length} 条历史记录的ID在数据库中不存在，需要同步`;
      } else if (extraInDb.length > 0) {
        historyMatch = true;
        historyStatus = 'ℹ️ 数据库有额外数据';
        historyMessage = `ℹ️ 数据库有 ${extraInDb.length} 条历史记录是本地没有的`;
      }
    } else if (dbHistoryCount === localHistoryCount) {
      // 没有传递ID列表，只检查数量
      historyMatch = true;
      historyStatus = '⚠️ 需要详细验证';
      historyMessage = '⚠️ 数量一致，但建议进行详细验证';
    } else if (dbHistoryCount > localHistoryCount) {
      historyMatch = true;
      historyStatus = '✅ 完整';
      historyMessage = `✅ 数据库有更多数据 (${dbHistoryCount} > ${localHistoryCount})`;
    } else {
      historyMatch = false;
      historyStatus = '⚠️ 数量不匹配';
      const diffCount = localHistoryCount - dbHistoryCount;
      historyMessage = `⚠️ 本地有 ${diffCount} 条未同步的价格历史，需要同步到数据库`;
    }

    console.log('价格历史验证:', {
      localStorage: localHistoryCount,
      database: dbHistoryCount,
      localIds: localHistoryIds.length,
      match: historyMatch,
      message: historyMessage,
      mismatchedIds: mismatchedHistoryIds.length,
    });

    // 3. 检查配置数据
    const dbConfigs = await appConfigManager.getAllConfigs(user.id);
    const goldPriceConfig = dbConfigs.find(c => c.configKey === 'goldPrice');
    const coefficientsConfig = dbConfigs.find(c => c.configKey === 'priceCoefficients');
    const dataVersionConfig = dbConfigs.find(c => c.configKey === 'dataVersion');

    const goldPriceMatch = !!goldPriceConfig === hasGoldPrice;
    const coefficientsMatch = !!coefficientsConfig === hasCoefficients;
    const dataVersionMatch = !!dataVersionConfig === hasDataVersion;

    console.log('配置数据验证:', {
      goldPrice: { local: hasGoldPrice, database: !!goldPriceConfig, match: goldPriceMatch },
      coefficients: { local: hasCoefficients, database: !!coefficientsConfig, match: coefficientsMatch },
      dataVersion: { local: hasDataVersion, database: !!dataVersionConfig, match: dataVersionMatch },
    });

    // 4. 检查产品数据的完整性（抽样检查）
    let sampleProductsValid = true;
    let sampleIssues = [];

    if (dbProducts.length > 0) {
      // 抽样检查前 10 个产品
      const sampleSize = Math.min(10, dbProducts.length);
      const samples = dbProducts.slice(0, sampleSize);

      for (const product of samples) {
        const issues = [];

        // 检查必填字段
        if (!product.id) issues.push('缺少 id');
        if (!product.productCode) issues.push('缺少 productCode');
        if (!product.productName) issues.push('缺少 productName');
        if (!product.category) issues.push('缺少 category');
        if (!product.karat) issues.push('缺少 karat');
        if (!product.goldColor) issues.push('缺少 goldColor');

        // 检查数值字段
        if (product.weight === null || product.weight === undefined) issues.push('缺少 weight');
        if (product.laborCost === null || product.laborCost === undefined) issues.push('缺少 laborCost');
        if (product.goldPrice === null || product.goldPrice === undefined) issues.push('缺少 goldPrice');

        if (issues.length > 0) {
          sampleProductsValid = false;
          sampleIssues.push({ productCode: product.productCode, issues });
        }
      }

      console.log('产品数据抽样验证:', {
        sampleSize,
        valid: sampleProductsValid,
        issues: sampleIssues.length,
      });
    }

    // 5. 检查历史记录的完整性
    let sampleHistoryValid = true;
    let historyIssues = [];

    if (dbHistory.length > 0) {
      const sampleSize = Math.min(10, dbHistory.length);
      const samples = dbHistory.slice(0, sampleSize);

      for (const history of samples) {
        const issues = [];

        if (!history.id) issues.push('缺少 id');
        if (!history.productId) issues.push('缺少 productId');
        if (!history.productCode) issues.push('缺少 productCode');
        if (!history.goldPrice) issues.push('缺少 goldPrice');
        if (!history.retailPrice) issues.push('缺少 retailPrice');
        if (!history.wholesalePrice) issues.push('缺少 wholesalePrice');

        if (issues.length > 0) {
          sampleHistoryValid = false;
          historyIssues.push({ productCode: history.productCode, issues });
        }
      }

      console.log('历史记录抽样验证:', {
        sampleSize,
        valid: sampleHistoryValid,
        issues: historyIssues.length,
      });
    }

    // 6. 生成验证报告
    const allChecksPass =
      productsMatch &&
      historyMatch &&
      goldPriceMatch &&
      coefficientsMatch &&
      dataVersionMatch &&
      sampleProductsValid &&
      sampleHistoryValid;

    // 生成建议
    const recommendations = [];

    // 当数据为0时的特殊处理
    if (localProductCount === 0 && dbProductCount === 0) {
      recommendations.push('💡 提示：目前没有产品数据');
      if (localProductCount === 0) {
        recommendations.push('📝 建议：通过Excel导入或手动录入添加产品');
      }
    } else if (!productsMatch) {
      const diffCount = localProductCount - dbProductCount;
      recommendations.push(`💡 建议：本地有 ${diffCount} 条未同步的产品数据，点击"🔄 同步到数据库"按钮进行同步`);
    }

    if (localHistoryCount === 0 && dbHistoryCount === 0) {
      recommendations.push('💡 提示：目前没有价格历史数据（这是正常的，价格历史会在修改产品价格时自动生成）');
    } else if (!historyMatch) {
      const diffCount = localHistoryCount - dbHistoryCount;
      recommendations.push(`💡 建议：本地有 ${diffCount} 条未同步的价格历史，点击"🔄 同步到数据库"按钮进行同步`);
    }

    if (!goldPriceMatch && hasGoldPrice) {
      recommendations.push('💡 建议：重新同步数据以同步金价配置');
    }

    if (!coefficientsMatch && hasCoefficients) {
      recommendations.push('💡 建议：重新同步数据以同步价格系数配置');
    }

    if (!sampleProductsValid) {
      const issueCount = sampleIssues.length;
      recommendations.push(`⚠️ 警告：发现 ${issueCount} 个产品数据质量问题，请检查数据完整性`);
    }

    if (!sampleHistoryValid) {
      const issueCount = historyIssues.length;
      recommendations.push(`⚠️ 警告：发现 ${issueCount} 条历史记录数据质量问题，请检查数据完整性`);
    }

    if (allChecksPass && localProductCount > 0) {
      recommendations.push('🎉 所有数据验证通过，可以放心导出！');
    } else if (allChecksPass && localProductCount === 0) {
      recommendations.push('✅ 系统运行正常，请添加产品数据后使用');
    }

    const verificationResult = {
      success: allChecksPass,
      overallStatus: allChecksPass ? '✅ 数据完整性验证通过' : '⚠️ 数据完整性验证未通过',
      timestamp: new Date().toISOString(),
      details: {
        products: {
          localCount: localProductCount,
          databaseCount: dbProductCount,
          match: productsMatch,
          status: productsStatus,
          message: productsMessage,
          mismatchedIds: mismatchedIds,
        },
        history: {
          localCount: localHistoryCount,
          databaseCount: dbHistoryCount,
          match: historyMatch,
          status: historyStatus,
          message: historyMessage,
          mismatchedIds: mismatchedHistoryIds,
        },
        configs: {
          goldPrice: {
            local: hasGoldPrice,
            database: !!goldPriceConfig,
            match: goldPriceMatch,
            status: goldPriceMatch ? '✅ 完整' : '⚠️ 配置缺失',
          },
          coefficients: {
            local: hasCoefficients,
            database: !!coefficientsConfig,
            match: coefficientsMatch,
            status: coefficientsMatch ? '✅ 完整' : '⚠️ 配置缺失',
          },
          dataVersion: {
            local: hasDataVersion,
            database: !!dataVersionConfig,
            match: dataVersionMatch,
            status: dataVersionMatch ? '✅ 完整' : '⚠️ 配置缺失',
          },
        },
        dataQuality: {
          products: {
            status: sampleProductsValid ? '✅ 完整' : '⚠️ 发现问题',
            issues: sampleIssues,
          },
          history: {
            status: sampleHistoryValid ? '✅ 完整' : '⚠️ 发现问题',
            issues: historyIssues,
          },
        },
      },
      recommendations: recommendations,
    };

    console.log('✅ 数据完整性验证完成:', verificationResult.overallStatus);

    return NextResponse.json(verificationResult);
  } catch (error: any) {
    console.error('❌ 数据完整性验证失败:', error);
    return NextResponse.json(
      { error: error.message || '数据完整性验证失败' },
      { status: 500 }
    );
  }
}

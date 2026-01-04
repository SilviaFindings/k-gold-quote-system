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
      hasGoldPrice = false,
      hasCoefficients = false,
      hasDataVersion = false,
    } = body;

    console.log('🔍 开始验证数据完整性:', {
      userId: user.id,
      localProductCount,
      localHistoryCount,
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
    if (dbProductCount === localProductCount) {
      productsMatch = true;
      productsMessage = '✅ 数据一致';
    } else if (dbProductCount > localProductCount) {
      productsMatch = true;
      productsMessage = `✅ 数据库有更多数据 (${dbProductCount} > ${localProductCount})`;
    } else {
      productsMatch = false;
      productsMessage = `⚠️ 本地有未同步数据 (${dbProductCount} < ${localProductCount})，需要重新同步到数据库`;
    }

    console.log('产品数据验证:', {
      localStorage: localProductCount,
      database: dbProductCount,
      match: productsMatch,
      message: productsMessage,
    });

    // 2. 检查价格历史
    const dbHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });
    const dbHistoryCount = dbHistory.length;

    // 判断价格历史是否匹配
    let historyMatch = false;
    let historyMessage = '';
    if (dbHistoryCount === localHistoryCount) {
      historyMatch = true;
      historyMessage = '✅ 数据一致';
    } else if (dbHistoryCount > localHistoryCount) {
      historyMatch = true;
      historyMessage = `✅ 数据库有更多数据 (${dbHistoryCount} > ${localHistoryCount})`;
    } else {
      historyMatch = false;
      historyMessage = `⚠️ 本地有未同步数据 (${dbHistoryCount} < ${localHistoryCount})，需要重新同步到数据库`;
    }

    console.log('价格历史验证:', {
      localStorage: localHistoryCount,
      database: dbHistoryCount,
      match: historyMatch,
      message: historyMessage,
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

    if (!productsMatch) {
      recommendations.push('💡 建议：点击"🔄 同步到数据库"按钮，将本地未同步的数据同步到数据库');
    }

    if (!historyMatch) {
      recommendations.push('💡 建议：点击"🔄 同步到数据库"按钮，将本地未同步的历史记录同步到数据库');
    }

    if (!goldPriceMatch && hasGoldPrice) {
      recommendations.push('💡 建议：重新同步数据以同步金价配置');
    }

    if (!coefficientsMatch && hasCoefficients) {
      recommendations.push('💡 建议：重新同步数据以同步价格系数配置');
    }

    if (!sampleProductsValid) {
      recommendations.push('⚠️ 警告：发现产品数据质量问题，请检查数据完整性');
    }

    if (!sampleHistoryValid) {
      recommendations.push('⚠️ 警告：发现历史记录数据质量问题，请检查数据完整性');
    }

    if (allChecksPass) {
      recommendations.push('🎉 所有数据验证通过，可以放心导出！');
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
          status: productsMatch ? '✅ 完整' : '⚠️ 数量不匹配',
          message: productsMessage,
        },
        history: {
          localCount: localHistoryCount,
          databaseCount: dbHistoryCount,
          match: historyMatch,
          status: historyMatch ? '✅ 完整' : '⚠️ 数量不匹配',
          message: historyMessage,
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

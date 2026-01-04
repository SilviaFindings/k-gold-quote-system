import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { appConfigManager } from '@/storage/database/appConfigManager';

/**
 * GET /api/test-config - 测试配置数据的读取和解析
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 开始测试配置数据的读取和解析...');

    // 获取所有配置
    const configs = await appConfigManager.getAllConfigs(user.id);

    console.log('📊 配置数量:', configs.length);

    const testResults = {
      totalConfigs: configs.length,
      configs: configs.map(config => {
        console.log(`\n🔍 测试配置: ${config.configKey}`);
        console.log(`  原始值类型: ${typeof config.configValue}`);
        console.log(`  原始值:`, config.configValue);

        // 测试序列化和反序列化
        const serialized = JSON.stringify(config.configValue, null, 2);
        console.log(`  序列化后长度: ${serialized.length} 字符`);

        const deserialized = JSON.parse(serialized);
        console.log(`  反序列化后类型: ${typeof deserialized}`);
        console.log(`  反序列化后值:`, deserialized);

        // 特定配置的测试
        let specificTests: any = {};

        if (config.configKey === 'goldPrice') {
          const goldPrice = parseFloat(String(config.configValue));
          specificTests = {
            isNumber: !isNaN(goldPrice),
            isPositive: goldPrice > 0,
            value: goldPrice,
            precision: String(config.configValue).split('.')[1]?.length || 0,
          };
          console.log(`  金价测试:`, specificTests);
        }

        if (config.configKey === 'priceCoefficients') {
          const coeffs = config.configValue as any;
          specificTests = {
            hasGoldFactor10K: !!coeffs.goldFactor10K,
            hasGoldFactor14K: !!coeffs.goldFactor14K,
            hasGoldFactor18K: !!coeffs.goldFactor18K,
            hasLaborFactorRetail: !!coeffs.laborFactorRetail,
            hasLaborFactorWholesale: !!coeffs.laborFactorWholesale,
            hasMaterialLoss: !!coeffs.materialLoss,
            hasMaterialCost: !!coeffs.materialCost,
            hasProfitMargin: !!coeffs.profitMargin,
            hasExchangeRate: !!coeffs.exchangeRate,
            goldFactor10K: coeffs.goldFactor10K,
            goldFactor14K: coeffs.goldFactor14K,
            goldFactor18K: coeffs.goldFactor18K,
          };
          console.log(`  价格系数测试:`, specificTests);
        }

        if (config.configKey === 'dataVersion') {
          const version = parseInt(String(config.configValue));
          specificTests = {
            isInteger: !isNaN(version) && Number.isInteger(version),
            value: version,
          };
          console.log(`  数据版本测试:`, specificTests);
        }

        return {
          configKey: config.configKey,
          valueType: typeof config.configValue,
          serializedLength: serialized.length,
          deserializedType: typeof deserialized,
          specificTests,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        };
      }),
      summary: {
        hasGoldPrice: configs.some(c => c.configKey === 'goldPrice'),
        hasPriceCoefficients: configs.some(c => c.configKey === 'priceCoefficients'),
        hasDataVersion: configs.some(c => c.configKey === 'dataVersion'),
        allConfigsValid: configs.every(c => {
          // 检查所有配置是否有效
          if (c.configKey === 'goldPrice') {
            const goldPrice = parseFloat(String(c.configValue));
            return !isNaN(goldPrice) && goldPrice > 0;
          }
          if (c.configKey === 'priceCoefficients') {
            const coeffs = c.configValue as any;
            return (
              coeffs.goldFactor10K &&
              coeffs.goldFactor14K &&
              coeffs.goldFactor18K &&
              coeffs.laborFactorRetail &&
              coeffs.laborFactorWholesale &&
              coeffs.materialLoss &&
              coeffs.materialCost &&
              coeffs.profitMargin
            );
          }
          if (c.configKey === 'dataVersion') {
            const version = parseInt(String(c.configValue));
            return !isNaN(version) && Number.isInteger(version);
          }
          return true;
        }),
      },
    };

    console.log('✅ 测试完成');
    console.log('📋 测试摘要:', testResults.summary);

    return NextResponse.json(testResults);
  } catch (error: any) {
    console.error('❌ 测试配置数据失败:', error);
    return NextResponse.json(
      { error: error.message || '测试配置数据失败' },
      { status: 500 }
    );
  }
}

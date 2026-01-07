"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import XLSX from "xlsx-js-style";
import { AuthProtection } from "@/components/AuthProtection";

// ========== 银制品分类 ==========

// 产品分类列表
export const SILVER_PRODUCT_CATEGORIES = [
  "配件",
  "宝石托",
  "链条",
] as const;

export type SilverProductCategory = typeof SILVER_PRODUCT_CATEGORIES[number];

// 大分类和子分类的映射关系
export const SILVER_SUB_CATEGORIES: Record<SilverProductCategory, string[]> = {
  "配件": [
    "耳环/耳逼",
    "扣子",
    "开口圈/闭口圈",
    "圆珠",
    "车花珠",
    "定位珠/短管",
    "包扣",
    "字印片/吊牌",
    "珠针",
    "空心管",
    "珠托",
    "吊坠夹",
    "镶嵌配件",
    "珍珠配件",
    "银线",
  ],
  "宝石托": [
    "戒子托",
    "耳环托",
    "耳钉托",
    "吊坠托",
  ],
  "链条": [
    "银链",
    "延长链",
  ],
};

// 数据版本号
const SILVER_DATA_VERSION = 1;

// ========== 银制品智能识别 ==========

// 智能识别产品分类（根据产品名称关键词）
const detectSilverCategoryFromName = (productName: string): SilverProductCategory | null => {
  const name = productName.toLowerCase();

  // 宝石托类关键词 - 必须放在前面，避免被其他关键词匹配
  const settingsKeywords = [
    "戒子托", "耳环托", "耳钉托", "吊坠托",
    "戒指托", "耳饰托", "吊饰托", "镶嵌托"
  ];

  // 链条类关键词
  const chainKeywords = [
    "银链", "延长链", "项链", "手链", "链子"
  ];

  // 配件类关键词 - 放在最后，使用更具体的关键词，避免误匹配
  const accessoriesKeywords = [
    "水滴扣", "龙虾扣", "螺丝扣", "弹簧扣",
    "开口圈", "闭口圈",
    "圆珠", "车花珠", "车花",
    "定位珠", "短管",
    "包扣",
    "字印", "吊牌",
    "珠针",
    "空心管",
    "珠托", "托珠",
    "镶嵌配件", "镶嵌",
    "珍珠配件", "珍珠",
    "银线",
    "耳逼", "耳夹",
  ];

  // 按优先级检查：宝石托 > 链条 > 配件

  // 先检查宝石托类（优先级最高）
  if (settingsKeywords.some(keyword => name.includes(keyword))) {
    return "宝石托";
  }

  // 再检查链条类
  if (chainKeywords.some(keyword => name.includes(keyword))) {
    return "链条";
  }

  // 最后检查配件类
  if (accessoriesKeywords.some(keyword => name.includes(keyword))) {
    return "配件";
  }

  return null;
};

// 智能识别产品子分类
const detectSilverSubCategoryFromName = (productName: string): string | null => {
  const name = productName.toLowerCase();

  // 定义子分类关键词（按优先级排序：具体关键词优先）
  const subCategoryKeywords: Array<{ subCat: string; keywords: string[] }> = [
    // 宝石托类（优先级最高）
    { subCat: "戒子托", keywords: ["戒子托", "戒指托"] },
    { subCat: "耳环托", keywords: ["耳环托"] },
    { subCat: "耳钉托", keywords: ["耳钉托"] },
    { subCat: "吊坠托", keywords: ["吊坠托"] },

    // 配件类 - 使用更具体的关键词
    { subCat: "扣子", keywords: ["水滴扣", "龙虾扣", "螺丝扣", "弹簧扣", "弹簧夹扣"] },
    { subCat: "开口圈/闭口圈", keywords: ["开口圈", "闭口圈"] },
    { subCat: "圆珠", keywords: ["圆珠"] },
    { subCat: "车花珠", keywords: ["车花珠", "车花"] },
    { subCat: "定位珠/短管", keywords: ["定位珠", "短管"] },
    { subCat: "包扣", keywords: ["包扣"] },
    { subCat: "字印片/吊牌", keywords: ["字印", "吊牌"] },
    { subCat: "珠针", keywords: ["珠针"] },
    { subCat: "空心管", keywords: ["空心管"] },
    { subCat: "珠托", keywords: ["珠托", "托珠"] },
    { subCat: "吊坠夹", keywords: ["吊坠夹"] },
    { subCat: "镶嵌配件", keywords: ["镶嵌配件", "镶嵌"] },
    { subCat: "珍珠配件", keywords: ["珍珠配件", "珍珠"] },
    { subCat: "银线", keywords: ["银线"] },
    { subCat: "耳环/耳逼", keywords: ["耳环", "耳逼", "耳夹"] },

    // 链条类
    { subCat: "银链", keywords: ["银链", "项链", "手链"] },
    { subCat: "延长链", keywords: ["延长链"] },
  ];

  // 找出所有匹配的子分类及其匹配的关键词
  const matches: Array<{ subCat: string; keyword: string; length: number }> = [];

  for (const { subCat, keywords } of subCategoryKeywords) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        matches.push({ subCat, keyword, length: keyword.length });
      }
    }
  }

  // 如果没有匹配，返回 null
  if (matches.length === 0) {
    return null;
  }

  // 如果只有一个匹配，直接返回
  if (matches.length === 1) {
    return matches[0].subCat;
  }

  // 如果有多个匹配，选择关键词最长的（最具体的）
  matches.sort((a, b) => b.length - a.length);
  return matches[0].subCat;
};

// ========== 银制品货号识别 ==========

// 判断是否为银制品货号
// 银制品：纯货号（如 KEW001）或 纯货号+供应商代码（如 KEW001E1），没有 /K 前缀
// 金制品：货号 /K + K数（如 KEW001/14k）
export const isSilverProductCode = (productCode: string): boolean => {
  // 如果包含 /K，说明是金制品
  if (productCode.includes('/K') || productCode.includes('/k')) {
    return false;
  }
  return true;
};

// 解析银制品货号，提取纯货号和供应商代码
// 例如：KEW001 -> {code: "KEW001", supplierCode: "E1"}
// KEW001E1 -> {code: "KEW001", supplierCode: "E1"}
// KEW001-K5 -> {code: "KEW001", supplierCode: "K5"}
export const parseSilverProductCode = (productCode: string): { code: string; supplierCode: string } => {
  // 尝试匹配：货号-供应商代码 或 货号+供应商代码
  const match = productCode.match(/^([A-Z]+[0-9]+)([-]?)([A-Z0-9]+)$/);

  if (match && match[2]) {
    // 有分隔符的情况，如 KEW001-K5
    return {
      code: match[1],
      supplierCode: match[3],
    };
  } else if (match) {
    // 无分隔符的情况，如 KEW001E1
    return {
      code: match[1],
      supplierCode: match[3],
    };
  }

  // 没有供应商代码，使用默认值 E1
  return {
    code: productCode,
    supplierCode: "E1",
  };
};

// ========== 银制品类型定义 ==========

interface SilverProduct {
  id: string;
  category: SilverProductCategory | "";
  subCategory: string;
  productCode: string;
  productName: string;
  specification: string;
  weight: number;  // 克重
  laborCost: number;  // 工费（人民币）
  silverColor: "银色" | "镀金" | "镀玫瑰金" | "银色/镀金/镀玫瑰金";
  silverPrice: number;  // 银价（人民币）
  wholesalePrice: number;  // 批发价（加币）
  retailPrice: number;  // 零售价（加币）
  accessoryCost: number;  // 配件成本（人民币）
  stoneCost: number;  // 石头成本（人民币）
  platingCost: number;  // 电镀成本（人民币）
  moldCost: number;  // 模具费（人民币）
  commission: number;  // 佣金（人民币）
  supplierCode: string;  // 供应商代码
  remarks: string;  // 备注
  quantity: number;  // 累计数量
  quantityDate: string;  // 数量录入时间
  laborCostDate: string;
  accessoryCostDate: string;
  stoneCostDate: string;
  platingCostDate: string;
  moldCostDate: string;
  commissionDate: string;
  timestamp: string;
}

interface SilverPriceHistory {
  id: string;
  productId: string;
  category: SilverProductCategory | "";
  subCategory: string;
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  silverColor: string;
  silverPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  accessoryCost: number;
  stoneCost: number;
  platingCost: number;
  moldCost: number;
  commission: number;
  supplierCode: string;
  remarks: string;
  quantity: number;
  quantityDate: string;
  laborCostDate: string;
  accessoryCostDate: string;
  stoneCostDate: string;
  platingCostDate: string;
  moldCostDate: string;
  commissionDate: string;
  timestamp: string;
}

function SilverQuotePage() {
  const router = useRouter();

  // ========== 银价和系数配置 ==========

  const [silverPrice, setSilverPrice] = useState<number>(() => {
    if (typeof window === 'undefined') return 20;
    const savedSilverPrice = localStorage.getItem("silverPrice");
    return savedSilverPrice ? Number(savedSilverPrice) : 20;
  });

  // 银制品价格系数配置
  const [silverCoefficients, setSilverCoefficients] = useState<{
    silverPrice: number;  // 银价系数（默认20）
    laborFactorRetail: number;  // 零售工费系数（默认5）
    laborFactorWholesale: number;  // 批发工费系数（默认3.5）
    silverMaterialLoss: number;  // 银材料损耗系数（默认1.05）
    silverMaterialFloat: number;  // 材料浮动系数（默认1.1）
    internationalShippingTaxFactor: number;  // 国际运输和关税系数（默认1.25）
    exchangeRate: number;  // 汇率（人民币/加币，默认5）
    commissionFactor: number;  // 佣金系数（默认1.1，即佣金 = 工费 × 1.1）
    stoneMarkupFactor: number;  // 石头加成系数（默认1.3）
    // T字头特殊系数
    tSilverMaterialLoss: number;  // T字头银材料损耗系数（默认1.05）
    tMaterialLossFactor2: number;  // T字头材料损耗系数2（默认1.15）
    tMaterialFloatFactor: number;  // T字头材料浮动系数（默认1.1）
    tInternationalShippingTaxFactor: number;  // T字头国际运输和关税系数（默认1.25）
    usdToCadExchangeRate: number;  // 美金折加币汇率（1.4）
  }>(() => {
    if (typeof window === 'undefined') {
      return {
        silverPrice: 20,
        laborFactorRetail: 5,
        laborFactorWholesale: 3.5,
        silverMaterialLoss: 1.05,
        silverMaterialFloat: 1.1,
        internationalShippingTaxFactor: 1.25,
        exchangeRate: 5,
        commissionFactor: 1.1,
        stoneMarkupFactor: 1.3,
        // T字头特殊系数
        tSilverMaterialLoss: 1.05,
        tMaterialLossFactor2: 1.15,
        tMaterialFloatFactor: 1.1,
        tInternationalShippingTaxFactor: 1.25,
        usdToCadExchangeRate: 1.4,
      };
    }
    const savedCoefficients = localStorage.getItem("silverPriceCoefficients");
    if (savedCoefficients) {
      const parsed = JSON.parse(savedCoefficients);
      return {
        silverPrice: parsed.silverPrice ?? 20,
        laborFactorRetail: parsed.laborFactorRetail ?? 5,
        laborFactorWholesale: parsed.laborFactorWholesale ?? 3.5,
        silverMaterialLoss: parsed.silverMaterialLoss ?? 1.05,
        silverMaterialFloat: parsed.silverMaterialFloat ?? 1.1,
        internationalShippingTaxFactor: parsed.internationalShippingTaxFactor ?? 1.25,
        exchangeRate: parsed.exchangeRate ?? 5,
        commissionFactor: parsed.commissionFactor ?? 1.1,
        stoneMarkupFactor: parsed.stoneMarkupFactor ?? 1.3,
        // T字头特殊系数
        tSilverMaterialLoss: parsed.tSilverMaterialLoss ?? 1.05,
        tMaterialLossFactor2: parsed.tMaterialLossFactor2 ?? 1.15,
        tMaterialFloatFactor: parsed.tMaterialFloatFactor ?? 1.1,
        tInternationalShippingTaxFactor: parsed.tInternationalShippingTaxFactor ?? 1.25,
        usdToCadExchangeRate: parsed.usdToCadExchangeRate ?? 1.4,
      };
    }
    return {
      silverPrice: 20,
      laborFactorRetail: 5,
      laborFactorWholesale: 3.5,
      silverMaterialLoss: 1.05,
      silverMaterialFloat: 1.1,
      internationalShippingTaxFactor: 1.25,
      exchangeRate: 5,
      commissionFactor: 1.1,
      stoneMarkupFactor: 1.3,
      // T字头特殊系数
      tSilverMaterialLoss: 1.05,
      tMaterialLossFactor2: 1.15,
      tMaterialFloatFactor: 1.1,
      tInternationalShippingTaxFactor: 1.25,
      usdToCadExchangeRate: 1.4,
    };
  });

  // ========== 银制品计算公式 ==========

  // 计算银制品价格
  const calculateSilverPrice = (
    product: SilverProduct,
    isRetail: boolean = true
  ): number => {
    const {
      weight,
      laborCost,
      silverPrice,
      accessoryCost,
      stoneCost,
      platingCost,
      commission,
      supplierCode,
    } = product;

    const coeff = silverCoefficients;

    // 判断是否为T字头供应商
    const isTSupplier = supplierCode.toUpperCase().startsWith('T');

    if (isTSupplier) {
      // ========== T字头供应商计算公式（美金基数折加币） ==========

      // 1. 材料价(US$) = 银价 × 克重 × 银材料损耗系数 × 材料浮动系数
      const materialPriceUSD = silverPrice * weight * coeff.tSilverMaterialLoss * coeff.tMaterialFloatFactor;

      // 2. 工费(US$) = 输入工费（已是美金）
      const laborFeeUSD = laborCost;

      // 3. 损耗(US$) = 材料价(US$) × 损耗百分比
      const tLossPercentage = 0.1;
      const lossUSD = materialPriceUSD * tLossPercentage;

      // 4. 其他成本(US$) = (配件 + 石头 + 电镀 + 佣金) × 材料损耗系数2
      const otherCostsUSD = ((accessoryCost || 0) + (stoneCost || 0) + (platingCost || 0) + (commission || 0)) * coeff.tMaterialLossFactor2;

      // 5. 零售价/批发价(US$) -> 折算为加币(CAD)
      let finalPrice: number;
      if (isRetail) {
        // 零售价 = (材料价 × 1.15 × 1.1 + 工费 × 5 + 其他成本) × 1.25 × 1.4（美金折加币）
        const tLaborFactorRetail = coeff.laborFactorRetail;  // 默认5
        finalPrice = (materialPriceUSD * coeff.tMaterialLossFactor2 * coeff.tMaterialFloatFactor + laborFeeUSD * tLaborFactorRetail + otherCostsUSD) * coeff.tInternationalShippingTaxFactor * coeff.usdToCadExchangeRate;
      } else {
        // 批发价 = (材料价 × 1.15 × 1.1 + 工费 × 3 + 其他成本) × 1.25 × 1.4（美金折加币）
        const tLaborFactorWholesale = coeff.laborFactorWholesale;  // 默认3
        finalPrice = (materialPriceUSD * coeff.tMaterialLossFactor2 * coeff.tMaterialFloatFactor + laborFeeUSD * tLaborFactorWholesale + otherCostsUSD) * coeff.tInternationalShippingTaxFactor * coeff.usdToCadExchangeRate;
      }

      return Math.round(finalPrice * 100) / 100;
    } else {
      // ========== 通用银制品计算公式（人民币基数转加币） ==========

      // 1. 材料价(CNY) = 银价 × 克重 × 银材料损耗系数 × 材料浮动系数
      const materialPriceCNY = silverPrice * weight * coeff.silverMaterialLoss * coeff.silverMaterialFloat;

      // 2. 佣金 = 工费 × 佣金系数
      const calculatedCommission = laborCost * coeff.commissionFactor;

      // 3. 计算价格（加币）
      let finalPrice: number;
      if (isRetail) {
        // 零售价 = 材料价/汇率 + (工费/汇率 + 配件/汇率 + 电镀/汇率) × 零售工费系数 + 石头/汇率 × 石头加成系数 + 佣金/汇率
        finalPrice = (materialPriceCNY / coeff.exchangeRate) +
                     ((laborCost / coeff.exchangeRate) + (accessoryCost / coeff.exchangeRate) + (platingCost / coeff.exchangeRate)) * coeff.laborFactorRetail +
                     ((stoneCost / coeff.exchangeRate) * coeff.stoneMarkupFactor) +
                     (calculatedCommission / coeff.exchangeRate);
      } else {
        // 批发价 = 材料价/汇率 + (工费/汇率 + 配件/汇率 + 电镀/汇率) × 批发工费系数 + 石头/汇率 × 石头加成系数 + 佣金/汇率
        finalPrice = (materialPriceCNY / coeff.exchangeRate) +
                     ((laborCost / coeff.exchangeRate) + (accessoryCost / coeff.exchangeRate) + (platingCost / coeff.exchangeRate)) * coeff.laborFactorWholesale +
                     ((stoneCost / coeff.exchangeRate) * coeff.stoneMarkupFactor) +
                     (calculatedCommission / coeff.exchangeRate);
      }

      return Math.round(finalPrice * 100) / 100;
    }
  };

  // ========== 页面UI ==========

  const [products, setProducts] = useState<SilverProduct[]>([]);
  const [currentCategory, setCurrentCategory] = useState<SilverProductCategory>("配件");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AuthProtection>
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">银制品报价操作平台</h1>
            <p className="text-gray-600">925银制品价格计算和管理系统</p>
          </div>

          {/* 银价配置 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">银价配置</h2>
            <div className="flex items-center gap-4">
              <label className="text-gray-700 font-medium">银价（人民币/克）:</label>
              <input
                type="number"
                value={silverPrice}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSilverPrice(value);
                  localStorage.setItem("silverPrice", value.toString());
                }}
                className="border border-gray-300 rounded px-3 py-2 w-32 text-black"
              />
            </div>
          </div>

          {/* 系数配置 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">价格系数配置</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">零售工费系数</label>
                <input
                  type="number"
                  step="0.1"
                  value={silverCoefficients.laborFactorRetail}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, laborFactorRetail: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">批发工费系数</label>
                <input
                  type="number"
                  step="0.1"
                  value={silverCoefficients.laborFactorWholesale}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, laborFactorWholesale: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">银材料损耗系数</label>
                <input
                  type="number"
                  step="0.01"
                  value={silverCoefficients.silverMaterialLoss}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, silverMaterialLoss: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">材料浮动系数</label>
                <input
                  type="number"
                  step="0.01"
                  value={silverCoefficients.silverMaterialFloat}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, silverMaterialFloat: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">国际运输和关税系数</label>
                <input
                  type="number"
                  step="0.01"
                  value={silverCoefficients.internationalShippingTaxFactor}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, internationalShippingTaxFactor: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">汇率（人民币/加币）</label>
                <input
                  type="number"
                  step="0.1"
                  value={silverCoefficients.exchangeRate}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, exchangeRate: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">佣金系数（工费×系数=佣金）</label>
                <input
                  type="number"
                  step="0.1"
                  value={silverCoefficients.commissionFactor}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, commissionFactor: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">石头加成系数</label>
                <input
                  type="number"
                  step="0.1"
                  value={silverCoefficients.stoneMarkupFactor}
                  onChange={(e) => {
                    const updated = { ...silverCoefficients, stoneMarkupFactor: Number(e.target.value) };
                    setSilverCoefficients(updated);
                    localStorage.setItem("silverPriceCoefficients", JSON.stringify(updated));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-black"
                />
              </div>
            </div>
          </div>

          {/* 计算公式展示 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">计算公式</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">通用银制品（人民币基数为加币）</h3>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                  <p><strong>材料价</strong> = 银价 × 克重 × 1.05 × 1.1</p>
                  <p><strong>佣金</strong> = 工费 × 1.1</p>
                  <p><strong>零售价</strong> = 材料价/5 + (工费/5 + 配件/5 + 电镀/5) × 5 + 石头/5 × 1.3 + 佣金/5</p>
                  <p><strong>批发价</strong> = 材料价/5 + (工费/5 + 配件/5 + 电镀/5) × 3.5 + 石头/5 × 1.3 + 佣金/5</p>
                </div>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">T字头供应商（美金基数折加币）</h3>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                  <p><strong>零售价</strong> = (材料价 × 1.15 × 1.1 + 工费 × 5 + 其他成本) × 1.25 × 1.4（美金折加币）</p>
                  <p><strong>批发价</strong> = (材料价 × 1.15 × 1.1 + 工费 × 3 + 其他成本) × 1.25 × 1.4（美金折加币）</p>
                  <p className="text-gray-600 mt-2">其中：其他成本 = (配件 + 石头 + 电镀 + 佣金) × 1.15</p>
                </div>
              </div>
            </div>
          </div>

          {/* 测试区域 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">测试计算</h2>
            <button
              onClick={() => {
                const testProduct: SilverProduct = {
                  id: "test",
                  category: "配件",
                  subCategory: "扣子",
                  productCode: "KEW001",
                  productName: "测试产品",
                  specification: "测试规格",
                  weight: 1.0,
                  laborCost: 10,
                  silverColor: "银色",
                  silverPrice: 20,
                  wholesalePrice: 0,
                  retailPrice: 0,
                  accessoryCost: 5,
                  stoneCost: 10,
                  platingCost: 5,
                  moldCost: 0,
                  commission: 0,
                  supplierCode: "E1",
                  remarks: "",
                  quantity: 0,
                  quantityDate: "",
                  laborCostDate: "",
                  accessoryCostDate: "",
                  stoneCostDate: "",
                  platingCostDate: "",
                  moldCostDate: "",
                  commissionDate: "",
                  timestamp: new Date().toISOString(),
                };

                const retail = calculateSilverPrice(testProduct, true);
                const wholesale = calculateSilverPrice(testProduct, false);

                alert(`零售价: $${retail.toFixed(2)}\n批发价: $${wholesale.toFixed(2)}`);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              测试计算
            </button>
          </div>

          {/* 返回金制品页面 */}
          <div className="text-center">
            <button
              onClick={() => router.push('/quote')}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              返回金制品报价系统
            </button>
          </div>
        </div>
      </AuthProtection>
    </div>
  );
}

export default SilverQuotePage;

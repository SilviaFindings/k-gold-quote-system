"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import XLSX from "xlsx-js-style";
import { AuthProtection } from "@/components/AuthProtection";

// ========== 银制品分类 ==========

// 产品分类列表
export const SILVER_PRODUCT_CATEGORIES = [
  "配件",
  "宝石托",
  "链条",
  "其它",
] as const;

export type SilverProductCategory = typeof SILVER_PRODUCT_CATEGORIES[number];

// 大分类和子分类的映射关系
export const SILVER_SUB_CATEGORIES: Record<SilverProductCategory, string[]> = {
  "配件": [
    "吊坠夹",
    "间珠",
    "珠托",
    "花边",
    "水滴扣/方扣/弹簧扣",
    "排扣",
    "磁铁扣",
    "异形扣",
    "链接件",
    "耳环/耳钩",
    "耳钉",
    "耳逼",
    "链头夹",
    "边框",
    "珠针",
    "尾圈",
    "OT扣",
    "间通",
    "字印牌",
  ],
  "宝石托": [
    "戒子托",
    "耳环托",
    "耳钉托",
    "吊坠托",
    "手链托",
    "手镯托",
    "首饰配件托",
  ],
  "链条": [
    "延长链",
    "项链",
    "散链",
    "皮绳",
  ],
  "其它": [
    "银板",
    "银线",
    "银花边",
  ],
};

// 数据版本号
const SILVER_DATA_VERSION = 1;

// ========== 银制品智能识别 ==========

// 智能识别产品分类（根据产品名称关键词）
const detectSilverCategoryFromName = (productName: string): SilverProductCategory | null => {
  const name = productName.toLowerCase();

  // 其它类关键词 - 优先级最高
  const otherKeywords = [
    "银板", "银花边"
  ];

  // 宝石托类关键词
  const settingsKeywords = [
    "戒子托", "耳环托", "耳钉托", "吊坠托", "手链托", "手镯托", "首饰配件托",
    "戒指托", "耳饰托", "吊饰托", "镶嵌托"
  ];

  // 链条类关键词
  const chainKeywords = [
    "延长链", "项链", "散链", "皮绳", "手链", "链子"
  ];

  // 配件类关键词 - 使用更具体的关键词
  const accessoriesKeywords = [
    "吊坠夹",
    "间珠",
    "花边",
    "水滴扣", "方扣", "弹簧扣",
    "排扣",
    "磁铁扣",
    "异形扣",
    "链接件",
    "耳环", "耳钩",
    "耳逼",
    "链头夹",
    "边框",
    "珠针",
    "尾圈",
    "OT扣",
    "间通",
    "字印牌",
    "珠托", "托珠",
  ];

  // 按优先级检查：其它 > 宝石托 > 链条 > 配件

  // 先检查其它类（优先级最高）
  if (otherKeywords.some(keyword => name.includes(keyword))) {
    return "其它";
  }

  // 再检查宝石托类
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
    // 其它类（优先级最高）
    { subCat: "银板", keywords: ["银板"] },
    { subCat: "银线", keywords: ["银线"] },
    { subCat: "银花边", keywords: ["银花边", "花边"] },

    // 宝石托类
    { subCat: "戒子托", keywords: ["戒子托", "戒指托"] },
    { subCat: "耳环托", keywords: ["耳环托"] },
    { subCat: "耳钉托", keywords: ["耳钉托"] },
    { subCat: "吊坠托", keywords: ["吊坠托"] },
    { subCat: "手链托", keywords: ["手链托"] },
    { subCat: "手镯托", keywords: ["手镯托"] },
    { subCat: "首饰配件托", keywords: ["首饰配件托"] },

    // 链条类
    { subCat: "延长链", keywords: ["延长链"] },
    { subCat: "项链", keywords: ["项链", "银链"] },
    { subCat: "散链", keywords: ["散链"] },
    { subCat: "皮绳", keywords: ["皮绳"] },

    // 配件类 - 使用更具体的关键词
    { subCat: "吊坠夹", keywords: ["吊坠夹"] },
    { subCat: "间珠", keywords: ["间珠"] },
    { subCat: "花边", keywords: ["花边"] },
    { subCat: "水滴扣/方扣/弹簧扣", keywords: ["水滴扣", "方扣", "弹簧扣"] },
    { subCat: "排扣", keywords: ["排扣"] },
    { subCat: "磁铁扣", keywords: ["磁铁扣"] },
    { subCat: "异形扣", keywords: ["异形扣"] },
    { subCat: "链接件", keywords: ["链接件"] },
    { subCat: "耳环/耳钩", keywords: ["耳环", "耳钩"] },
    { subCat: "耳钉", keywords: ["耳钉"] },
    { subCat: "耳逼", keywords: ["耳逼", "耳夹"] },
    { subCat: "链头夹", keywords: ["链头夹"] },
    { subCat: "边框", keywords: ["边框"] },
    { subCat: "珠针", keywords: ["珠针"] },
    { subCat: "尾圈", keywords: ["尾圈"] },
    { subCat: "OT扣", keywords: ["OT扣", "ot扣"] },
    { subCat: "间通", keywords: ["间通"] },
    { subCat: "字印牌", keywords: ["字印牌"] },
    { subCat: "珠托", keywords: ["珠托", "托珠"] },
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

// ========== 银制品Excel导入列名映射（支持中英文） ==========

// 定义列名映射表：{ 中文列名: 英文列名 }
const SILVER_COLUMN_MAPPING: Record<string, string> = {
  "分类": "Category",
  "子分类": "Sub Category",
  "货号": "Product Code",
  "产品名称": "Product Name",
  "规格": "Specification",
  "克重": "Weight",
  "工费": "Labor Cost",
  "银色": "Silver Color",
  "配件成本": "Accessory Cost",
  "石头成本": "Stone Cost",
  "电镀成本": "Plating Cost",
  "供应商代码": "Supplier Code",
  "备注": "Remarks",
  "数量": "Quantity",
  "累计数量": "Cumulative Quantity",
};

// 从行中获取值，支持中英文列名
const getSilverColumnValue = (row: any, chineseColumnName: string): any => {
  // 优先使用中文列名
  if (row[chineseColumnName] !== undefined) {
    return row[chineseColumnName];
  }
  // 尝试使用英文列名
  const englishColumnName = SILVER_COLUMN_MAPPING[chineseColumnName];
  if (englishColumnName && row[englishColumnName] !== undefined) {
    return row[englishColumnName];
  }
  return undefined;
};

// 查找最右边包含关键词的列的值（自动选择最新的一列）
// 用于处理Excel中有多列相同类型数据的情况（如重量1、重量2、重量3...）
const findLatestColumnValue = (row: any, chineseColumnName: string, ...keywords: string[]): any => {
  const rowKeys = Object.keys(row);

  // 查找所有匹配的列
  const matchingColumns = rowKeys.filter(key => {
    const keyLower = String(key).toLowerCase();
    // 检查中文列名
    if (chineseColumnName && keyLower === chineseColumnName.toLowerCase()) {
      return true;
    }
    // 检查英文列名
    const englishColumnName = SILVER_COLUMN_MAPPING[chineseColumnName];
    if (englishColumnName && keyLower === englishColumnName.toLowerCase()) {
      return true;
    }
    // 检查关键词
    for (const keyword of keywords) {
      if (keyLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    return false;
  });

  if (matchingColumns.length === 0) {
    return undefined;
  }

  // 返回最右边一列的值（最新的值）
  const latestColumn = matchingColumns[matchingColumns.length - 1];
  return row[latestColumn];
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
  batchQuantity: number;  // 数量
  quantity: number;  // 累计数量
  quantityDate: string;  // 数量录入时间
  laborCostDate: string;
  accessoryCostDate: string;
  stoneCostDate: string;
  platingCostDate: string;
  moldCostDate: string;
  commissionDate: string;
  timestamp: string;
  syncStatus: "synced" | "unsynced";  // 同步状态：已同步/未同步
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
  batchQuantity: number;  // 数量
  quantity: number;  // 累计数量
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
    const isTSupplier = (supplierCode || "").toUpperCase().startsWith('T');

    // 确保所有数值都有默认值
    const safeWeight = weight ?? 0;
    const safeLaborCost = laborCost ?? 0;
    const safeSilverPrice = silverPrice ?? 20;
    const safeAccessoryCost = accessoryCost ?? 0;
    const safeStoneCost = stoneCost ?? 0;
    const safePlatingCost = platingCost ?? 0;
    const safeCommission = commission ?? 0;

    if (isTSupplier) {
      // ========== T字头供应商计算公式（美金基数折加币） ==========

      // 1. 材料价(US$) = 银价 × 克重 × 银材料损耗系数 × 材料浮动系数
      const materialPriceUSD = safeSilverPrice * safeWeight * coeff.tSilverMaterialLoss * coeff.tMaterialFloatFactor;

      // 2. 工费(US$) = 输入工费（已是美金）
      const laborFeeUSD = safeLaborCost;

      // 3. 损耗(US$) = 材料价(US$) × 损耗百分比
      const tLossPercentage = 0.1;
      const lossUSD = materialPriceUSD * tLossPercentage;

      // 4. 其他成本(US$) = (配件 + 石头 + 电镀 + 佣金) × 材料损耗系数2
      const otherCostsUSD = (safeAccessoryCost + safeStoneCost + safePlatingCost + safeCommission) * coeff.tMaterialLossFactor2;

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

      const result = Math.round(finalPrice * 100) / 100;
      return isNaN(result) ? 0 : result;
    } else {
      // ========== 通用银制品计算公式（人民币基数转加币） ==========

      // 1. 材料价(CNY) = 银价 × 克重 × 银材料损耗系数 × 材料浮动系数
      const materialPriceCNY = safeSilverPrice * safeWeight * coeff.silverMaterialLoss * coeff.silverMaterialFloat;

      // 2. 佣金 = 工费 × 佣金系数
      const calculatedCommission = safeLaborCost * coeff.commissionFactor;

      // 3. 计算价格（加币）
      let finalPrice: number;
      if (isRetail) {
        // 零售价 = 材料价/汇率 + (工费/汇率 + 配件/汇率 + 电镀/汇率) × 零售工费系数 + 石头/汇率 × 石头加成系数 + 佣金/汇率
        finalPrice = (materialPriceCNY / coeff.exchangeRate) +
                     ((safeLaborCost / coeff.exchangeRate) + (safeAccessoryCost / coeff.exchangeRate) + (safePlatingCost / coeff.exchangeRate)) * coeff.laborFactorRetail +
                     ((safeStoneCost / coeff.exchangeRate) * coeff.stoneMarkupFactor) +
                     (calculatedCommission / coeff.exchangeRate);
      } else {
        // 批发价 = 材料价/汇率 + (工费/汇率 + 配件/汇率 + 电镀/汇率) × 批发工费系数 + 石头/汇率 × 石头加成系数 + 佣金/汇率
        finalPrice = (materialPriceCNY / coeff.exchangeRate) +
                     ((safeLaborCost / coeff.exchangeRate) + (safeAccessoryCost / coeff.exchangeRate) + (safePlatingCost / coeff.exchangeRate)) * coeff.laborFactorWholesale +
                     ((safeStoneCost / coeff.exchangeRate) * coeff.stoneMarkupFactor) +
                     (calculatedCommission / coeff.exchangeRate);
      }

      const result = Math.round(finalPrice * 100) / 100;
      return isNaN(result) ? 0 : result;
    }
  };

  // ========== 产品和历史记录状态管理 ==========

  const [products, setProducts] = useState<SilverProduct[]>([]);
  const [priceHistory, setPriceHistory] = useState<SilverPriceHistory[]>([]);

  // 跟踪本地数据是否已加载（使用 ref 避免状态延迟导致误判）
  const localDataLoadedRef = useRef(false);

  // 调试信息：验证页面加载
  useEffect(() => {
    console.log('🔧 银制品页面已加载 - 版本: 2025-01-07');
    console.log('📋 当前产品数量:', products.length);
  }, [products.length]);

  const [currentCategory, setCurrentCategory] = useState<SilverProductCategory>("配件");
  const [currentSubCategory, setCurrentSubCategory] = useState<string | null>(null);

  // 搜索查询
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchTrigger, setSearchTrigger] = useState<number>(0);

  // 批量操作状态
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // 批量选择操作
  const toggleSelectAll = (checked: boolean) => {
    const filtered = products.filter(p => {
      if (p.category !== currentCategory) return false;
      if (currentSubCategory && p.subCategory !== currentSubCategory) return false;
      return true;
    });
    setSelectedProductIds(checked ? new Set(filtered.map(p => p.id)) : new Set());
  };

  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProductIds(newSelected);
  };

  // 批量删除
  const batchDelete = () => {
    if (selectedProductIds.size === 0) {
      alert("请先选择要删除的产品");
      return;
    }
    if (window.confirm(`确认删除选中的 ${selectedProductIds.size} 个产品？`)) {
      const newProducts = products.filter(p => !selectedProductIds.has(p.id));
      const newHistory = priceHistory.filter(h => !selectedProductIds.has(h.productId));
      setProducts(newProducts);
      setPriceHistory(newHistory);
      saveToLocalStorage(newProducts, newHistory);
      setSelectedProductIds(new Set());
    }
  };

  // 批量编辑 - 修改工费
  const batchEditLaborCost = () => {
    if (selectedProductIds.size === 0) {
      alert("请先选择要编辑的产品");
      return;
    }
    const newLaborCost = prompt(`请输入新的工费值（将应用于 ${selectedProductIds.size} 个产品）:`);
    if (newLaborCost === null || newLaborCost.trim() === "") return;

    const laborCostNum = Number(newLaborCost);
    if (isNaN(laborCostNum)) {
      alert("请输入有效的数字");
      return;
    }

    const updatedProducts = products.map(p => {
      if (selectedProductIds.has(p.id)) {
        const updated = { ...p, laborCost: laborCostNum };
        const retail = calculateSilverPrice(updated, true);
        const wholesale = calculateSilverPrice(updated, false);
        updated.retailPrice = isNaN(retail) ? 0 : retail;
        updated.wholesalePrice = isNaN(wholesale) ? 0 : wholesale;
        return updated;
      }
      return p;
    });

    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
    alert(`已更新 ${selectedProductIds.size} 个产品的工费`);
  };

  // 添加产品
  const addProduct = () => {
    const newProduct: SilverProduct = {
      id: Date.now().toString(),
      category: currentCategory,
      subCategory: SILVER_SUB_CATEGORIES[currentCategory][0],
      productCode: "",
      productName: "",
      specification: "",
      weight: 0,
      laborCost: 0,
      silverColor: "银色",
      silverPrice: silverPrice,
      wholesalePrice: 0,
      retailPrice: 0,
      accessoryCost: 0,
      stoneCost: 0,
      platingCost: 0,
      moldCost: 0,
      commission: 0,
      supplierCode: "E1",
      remarks: "",
      batchQuantity: 0,  // 数量
      quantity: 0,
      quantityDate: "",
      laborCostDate: "",
      accessoryCostDate: "",
      stoneCostDate: "",
      platingCostDate: "",
      moldCostDate: "",
      commissionDate: "",
      timestamp: new Date().toISOString(),
      syncStatus: "unsynced",
    };

    setProducts([...products, newProduct]);
  };

  // 更新产品
  const updateProduct = (id: string, field: keyof SilverProduct, value: any) => {
    const updatedProducts = products.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };

        // 智能识别货号和分类
        if (field === "productCode" && value) {
          const parsed = parseSilverProductCode(value);
          updated.supplierCode = parsed.supplierCode;
        }

        // 智能识别产品名称对应的分类
        if (field === "productName" && value) {
          const detectedCategory = detectSilverCategoryFromName(value);
          const detectedSubCategory = detectSilverSubCategoryFromName(value);
          if (detectedCategory) {
            updated.category = detectedCategory;
          }
          if (detectedSubCategory) {
            updated.subCategory = detectedSubCategory;
          }
        }

        // 自动计算价格
        const retailPriceCalc = calculateSilverPrice(updated, true);
        const wholesalePriceCalc = calculateSilverPrice(updated, false);
        updated.retailPrice = isNaN(retailPriceCalc) ? 0 : retailPriceCalc;
        updated.wholesalePrice = isNaN(wholesalePriceCalc) ? 0 : wholesalePriceCalc;

        // 修改产品后标记为未同步
        updated.syncStatus = "unsynced";

        return updated;
      }
      return p;
    });

    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
  };

  // 删除产品
  const deleteProduct = (id: string) => {
    if (window.confirm("确认删除此产品？")) {
      setProducts(products.filter(p => p.id !== id));
      setPriceHistory(priceHistory.filter(h => h.productId !== id));
      saveToLocalStorage(products.filter(p => p.id !== id), priceHistory.filter(h => h.productId !== id));
    }
  };

  // 保存历史记录
  const saveToHistory = (product: SilverProduct) => {
    const historyItem: SilverPriceHistory = {
      id: Date.now().toString(),
      productId: product.id,
      category: product.category || "",
      subCategory: product.subCategory || "",
      productCode: product.productCode || "",
      productName: product.productName || "",
      specification: product.specification || "",
      weight: product.weight ?? 0,
      laborCost: product.laborCost ?? 0,
      silverColor: product.silverColor || "银色",
      silverPrice: product.silverPrice ?? silverPrice,
      wholesalePrice: product.wholesalePrice ?? 0,
      retailPrice: product.retailPrice ?? 0,
      accessoryCost: product.accessoryCost ?? 0,
      stoneCost: product.stoneCost ?? 0,
      platingCost: product.platingCost ?? 0,
      moldCost: product.moldCost ?? 0,
      commission: product.commission ?? 0,
      supplierCode: product.supplierCode || "E1",
      remarks: product.remarks || "",
      batchQuantity: product.batchQuantity ?? 0,
      quantity: product.quantity ?? 0,
      quantityDate: product.quantityDate || "",
      laborCostDate: product.laborCostDate || "",
      accessoryCostDate: product.accessoryCostDate || "",
      stoneCostDate: product.stoneCostDate || "",
      platingCostDate: product.platingCostDate || "",
      moldCostDate: product.moldCostDate || "",
      commissionDate: product.commissionDate || "",
      timestamp: new Date().toISOString(),
    };

    setPriceHistory([historyItem, ...priceHistory]);
    saveToLocalStorage(products, [historyItem, ...priceHistory]);
  };

  // 本地存储操作
  const saveToLocalStorage = (productsList?: SilverProduct[], historyList?: SilverPriceHistory[]) => {
    const prods = productsList || products;
    const hist = historyList || priceHistory;

    localStorage.setItem("silverProducts", JSON.stringify(prods));
    localStorage.setItem("silverPriceHistory", JSON.stringify(hist));
  };

  // ========== 云端同步功能 ==========

  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [cloudDataExists, setCloudDataExists] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");

  // 导入Excel相关状态
  const [importSubCategory, setImportSubCategory] = useState<string>(""); // 导入前选择的子分类

  // 检查云端数据是否存在
  const checkCloudData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('❌ 未找到auth_token');
        setCloudDataExists(false);
        return;
      }

      console.log('🔍 检查云端数据...');
      const response = await fetch('/api/silver-sync', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      console.log('📡 API响应状态:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 云端数据:', {
          productsCount: data.products?.length || 0,
          historyCount: data.history?.length || 0,
          silverPrice: data.silverPrice,
          hasData: data && data.products && data.products.length > 0
        });

        const hasData = data && data.products && data.products.length > 0;
        setCloudDataExists(hasData);

        // 如果云端有数据且本地还没加载到任何数据，自动下载
        // 使用 ref 检查本地数据是否已加载，避免状态延迟导致的误判
        if (hasData && !localDataLoadedRef.current) {
          console.log('🔄 云端有数据但本地无数据，自动下载...');
          await downloadFromCloud("replace");
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API返回错误:', response.status, response.statusText, errorText);
        setCloudDataExists(false);
      }
    } catch (error) {
      console.error('❌ 检查云端数据失败:', error);
      setCloudDataExists(false);
    }
  };

  // 上传数据到云端
  const uploadToCloud = async () => {
    console.log('🚀 开始上传数据到云端...');
    setSyncStatus("syncing");
    setSyncMessage("正在上传数据到云端...");

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ 未找到auth_token');
        alert('请先登录');
        setSyncStatus("error");
        setSyncMessage("需要登录");
        return;
      }

      // 上传银制品数据
      console.log('📤 发送数据:', {
        productsCount: products.length,
        historyCount: priceHistory.length,
        silverPrice,
        coefficients: silverCoefficients,
      });

      const response = await fetch('/api/silver-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          products: products,
          priceHistory: priceHistory,
          configs: {
            silverPrice: silverPrice,
            coefficients: silverCoefficients,
            dataVersion: SILVER_DATA_VERSION,
          },
        }),
      });

      console.log('📡 上传响应状态:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 上传成功:', result);

        // 上传成功后，标记所有产品为已同步
        const syncedProducts = products.map(p => ({ ...p, syncStatus: "synced" as const }));
        setProducts(syncedProducts);
        saveToLocalStorage(syncedProducts);

        setSyncStatus("success");
        // 从 result.stats 中读取统计信息
        const stats = result.stats || {};
        setSyncMessage(`上传成功！产品: ${stats.syncedProducts || 0} 个（新建 ${stats.newProducts || 0}，更新 ${stats.updatedProducts || 0}），历史记录: ${stats.syncedHistory || 0} 条`);
        setCloudDataExists(true);
        setTimeout(() => {
          setSyncStatus("idle");
          setSyncMessage("");
          setShowSyncMenu(false);
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('❌ 上传失败:', response.status, errorText);
        throw new Error(`上传失败: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ 上传到云端失败:', error);
      setSyncStatus("error");
      setSyncMessage(`上传失败: ${error instanceof Error ? error.message : '请重试'}`);
      // 5秒后重置状态
      setTimeout(() => {
        setSyncStatus("idle");
        setSyncMessage("");
      }, 5000);
    }
  };

  // 从云端下载数据
  const downloadFromCloud = async (mode: "replace" | "merge") => {
    console.log(`🚀 开始${mode === 'replace' ? '覆盖' : '合并'}下载数据...`);
    setSyncStatus("syncing");
    setSyncMessage("正在从云端下载数据...");

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ 未找到auth_token');
        alert('请先登录');
        setSyncStatus("error");
        setSyncMessage("需要登录");
        return;
      }

      console.log('📡 请求数据...');
      const response = await fetch('/api/silver-sync', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('📡 下载响应状态:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 云端数据:', {
          productsCount: data.products?.length || 0,
          historyCount: data.history?.length || 0,
          silverPrice: data.silverPrice,
          coefficients: data.coefficients,
        });

        if (mode === "replace") {
          console.log('🔄 覆盖模式：替换所有本地数据');
          // 覆盖模式：标记所有产品为已同步，并标准化字段
          const syncedProducts = (data.products || []).map((p: any): SilverProduct => ({
            id: p.id || "",
            category: p.category || "",
            subCategory: p.subCategory || "",
            productCode: p.productCode || "",
            productName: p.productName || "",
            specification: p.specification || "",
            weight: p.weight ?? 0,
            laborCost: p.laborCost ?? 0,
            silverColor: p.silverColor || "银色",
            silverPrice: p.silverPrice ?? data.silverPrice ?? silverPrice,
            wholesalePrice: p.wholesalePrice ?? 0,
            retailPrice: p.retailPrice ?? 0,
            accessoryCost: p.accessoryCost ?? 0,
            stoneCost: p.stoneCost ?? 0,
            platingCost: p.platingCost ?? 0,
            moldCost: p.moldCost ?? 0,
            commission: p.commission ?? 0,
            supplierCode: p.supplierCode || "E1",
            remarks: p.remarks || "",
            batchQuantity: p.batchQuantity ?? 0,
            quantity: p.quantity ?? 0,
            quantityDate: p.quantityDate || "",
            laborCostDate: p.laborCostDate || "",
            accessoryCostDate: p.accessoryCostDate || "",
            stoneCostDate: p.stoneCostDate || "",
            platingCostDate: p.platingCostDate || "",
            moldCostDate: p.moldCostDate || "",
            commissionDate: p.commissionDate || "",
            timestamp: p.timestamp || new Date().toISOString(),
            syncStatus: "synced" as const,
          }));
          setProducts(syncedProducts);
          setPriceHistory(data.history || []);
          setSilverPrice(data.silverPrice || 20);
          setSilverCoefficients(data.coefficients || silverCoefficients);
          saveToLocalStorage(syncedProducts, data.history || []);
        } else {
          console.log('🔀 合并模式：保留本地，添加云端数据');
          // 合并模式：保留本地数据，添加云端不存在的数据，并标准化字段
          const existingIds = new Set(products.map(p => p.id));
          const newProducts = (data.products || [])
            .filter((p: any) => !existingIds.has(p.id))
            .map((p: any): SilverProduct => ({
              id: p.id || "",
              category: p.category || "",
              subCategory: p.subCategory || "",
              productCode: p.productCode || "",
              productName: p.productName || "",
              specification: p.specification || "",
              weight: p.weight ?? 0,
              laborCost: p.laborCost ?? 0,
              silverColor: p.silverColor || "银色",
              silverPrice: p.silverPrice ?? data.silverPrice ?? silverPrice,
              wholesalePrice: p.wholesalePrice ?? 0,
              retailPrice: p.retailPrice ?? 0,
              accessoryCost: p.accessoryCost ?? 0,
              stoneCost: p.stoneCost ?? 0,
              platingCost: p.platingCost ?? 0,
              moldCost: p.moldCost ?? 0,
              commission: p.commission ?? 0,
              supplierCode: p.supplierCode || "E1",
              remarks: p.remarks || "",
              batchQuantity: p.batchQuantity ?? 0,
              quantity: p.quantity ?? 0,
              quantityDate: p.quantityDate || "",
              laborCostDate: p.laborCostDate || "",
              accessoryCostDate: p.accessoryCostDate || "",
              stoneCostDate: p.stoneCostDate || "",
              platingCostDate: p.platingCostDate || "",
              moldCostDate: p.moldCostDate || "",
              commissionDate: p.commissionDate || "",
              timestamp: p.timestamp || new Date().toISOString(),
              syncStatus: "synced" as const,
            }));
          const mergedProducts = [...products, ...newProducts];
          setProducts(mergedProducts);
          setPriceHistory([...priceHistory, ...(data.history || [])]);
          saveToLocalStorage(mergedProducts, [...priceHistory, ...(data.history || [])]);
          console.log(`📊 合并结果: 本地 ${products.length} + 云端 ${newProducts.length} = 总计 ${mergedProducts.length}`);
        }

        setSyncStatus("success");
        setSyncMessage(`下载成功！云端产品数: ${data.products?.length || 0}`);
        setTimeout(() => {
          setSyncStatus("idle");
          setSyncMessage("");
          setShowSyncMenu(false);
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('❌ 下载失败:', response.status, errorText);
        throw new Error(`下载失败: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ 从云端下载失败:', error);
      setSyncStatus("error");
      setSyncMessage(`下载失败: ${error instanceof Error ? error.message : '请重试'}`);
      // 5秒后重置状态
      setTimeout(() => {
        setSyncStatus("idle");
        setSyncMessage("");
      }, 5000);
    }
  };

  // 初始化：先加载本地数据，然后检查云端数据
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔄 初始化：开始加载本地数据...');

    // 步骤1：加载本地数据
    const savedProducts = localStorage.getItem("silverProducts");
    const savedHistory = localStorage.getItem("silverPriceHistory");

    if (savedProducts) {
      try {
        // 兼容旧数据，为所有可能缺失的字段添加默认值
        const loadedProducts: any[] = JSON.parse(savedProducts);
        const normalizedProducts: SilverProduct[] = loadedProducts.map(p => ({
          id: p.id || "",
          category: p.category || "",
          subCategory: p.subCategory || "",
          productCode: p.productCode || "",
          productName: p.productName || "",
          specification: p.specification || "",
          weight: p.weight ?? 0,
          laborCost: p.laborCost ?? 0,
          silverColor: p.silverColor || "银色",
          silverPrice: p.silverPrice ?? silverPrice,
          wholesalePrice: p.wholesalePrice ?? 0,
          retailPrice: p.retailPrice ?? 0,
          accessoryCost: p.accessoryCost ?? 0,
          stoneCost: p.stoneCost ?? 0,
          platingCost: p.platingCost ?? 0,
          moldCost: p.moldCost ?? 0,
          commission: p.commission ?? 0,
          supplierCode: p.supplierCode || "E1",
          remarks: p.remarks || "",
          batchQuantity: p.batchQuantity ?? 0,
          quantity: p.quantity ?? 0,
          quantityDate: p.quantityDate || "",
          laborCostDate: p.laborCostDate || "",
          accessoryCostDate: p.accessoryCostDate || "",
          stoneCostDate: p.stoneCostDate || "",
          platingCostDate: p.platingCostDate || "",
          moldCostDate: p.moldCostDate || "",
          commissionDate: p.commissionDate || "",
          timestamp: p.timestamp || new Date().toISOString(),
          syncStatus: p.syncStatus || "unsynced",
        }));
        setProducts(normalizedProducts);
        localDataLoadedRef.current = true;
        console.log(`✅ 本地数据已加载，产品数量: ${normalizedProducts.length}`);
      } catch (error) {
        console.error('❌ 加载本地产品数据失败:', error);
        setProducts([]);
        localDataLoadedRef.current = true;
      }
    } else {
      setProducts([]);
      // 不设置 localDataLoadedRef.current = true，让云端数据自动下载
      console.log('📭 本地无数据，等待云端同步...');
    }

    if (savedHistory) {
      try {
        setPriceHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('❌ 加载本地历史数据失败:', error);
        setPriceHistory([]);
      }
    } else {
      setPriceHistory([]);
    }

    // 步骤2：延迟检查云端数据，避免状态竞态
    setTimeout(() => {
      console.log('🔄 初始化：检查云端数据...');
      checkCloudData();
    }, 100);
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 处理同步按钮点击
  const handleSyncButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🖱️ 点击云端同步按钮，当前菜单状态:', showSyncMenu);
    console.log('🖱️ 当前产品数量:', products.length);

    try {
      setShowSyncMenu(!showSyncMenu);
      checkCloudData();
    } catch (error) {
      console.error('❌ 处理同步按钮点击失败:', error);
      alert('同步按钮点击失败，请刷新页面重试');
    }
  };

  // Excel 导出
  const exportToExcel = () => {
    const filteredProducts = products.filter(p => p.category === currentCategory);

    if (filteredProducts.length === 0) {
      alert("没有数据可导出");
      return;
    }

    const data = filteredProducts.map(p => ({
      "分类": p.category,
      "子分类": p.subCategory,
      "货号": p.productCode,
      "产品名称": p.productName,
      "规格": p.specification,
      "克重": p.weight,
      "工费": p.laborCost,
      "银色": p.silverColor,
      "银价": p.silverPrice,
      "配件成本": p.accessoryCost,
      "石头成本": p.stoneCost,
      "电镀成本": p.platingCost,
      "供应商代码": p.supplierCode,
      "零售价(CAD$)": Number(p.retailPrice || 0).toFixed(2),
      "批发价(CAD$)": Number(p.wholesalePrice || 0).toFixed(2),
      "数量": p.batchQuantity || 0,
      "累计数量": p.quantity || 0,
      "备注": p.remarks,
      "更新时间": formatDate(p.timestamp),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "银制品列表");
    XLSX.writeFile(wb, `银制品报价_${currentCategory}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Excel 导入
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🔥 检查是否选择了子分类
    if (!importSubCategory) {
      alert("⚠️ 请先选择要导入的产品小类！\n\n在页面左侧的'导入选项'区域选择产品小类后再导入。");
      e.target.value = ""; // 清空文件输入
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // 获取用户选择的子分类对应的大分类
      let importCategory: SilverProductCategory = currentCategory;
      for (const [cat, subList] of Object.entries(SILVER_SUB_CATEGORIES)) {
        if (subList.includes(importSubCategory)) {
          importCategory = cat as SilverProductCategory;
          break;
        }
      }

      // 检查Excel中是否包含"分类"列
      const hasCategoryColumn = jsonData.length > 0 && getSilverColumnValue(jsonData[0] as any, "分类") !== undefined;
      const categoriesInFile = hasCategoryColumn
        ? [...new Set(jsonData.map((row: any) => getSilverColumnValue(row, "分类")).filter(cat => cat))]
        : [];

      // 确认导入方式
      let importMode: "all" | "selected" = "selected";

      if (hasCategoryColumn && categoriesInFile.length > 0) {
        // Excel中有分类列，询问用户导入模式
        const message = `检测到Excel文件包含以下分类：\n${categoriesInFile.join(", ")}\n\n请选择导入方式：\n• 点击"确定"：导入所有分类的产品\n• 点击"取消"：仅导入您选择的子分类（${importSubCategory}）的产品`;
        importMode = window.confirm(message) ? "all" : "selected";
      }

      // 导入产品 - 使用智能查找最新列的功能
      const importedProducts: SilverProduct[] = jsonData
        .filter((row: any) => {
          // 如果选择了"仅导入选中分类"，则过滤
          if (importMode === "selected") {
            const rowSubCategory = getSilverColumnValue(row, "子分类");
            if (!rowSubCategory) return false; // 没有子分类的也不导入
            return rowSubCategory === importSubCategory;
          }
          return true;
        })
        .map((row: any, index) => ({
          id: Date.now().toString() + index,
          category: importMode === "all" ? (getSilverColumnValue(row, "分类") || importCategory) : importCategory,
          subCategory: importMode === "all" ? (getSilverColumnValue(row, "子分类") || importSubCategory) : importSubCategory,
          productCode: getSilverColumnValue(row, "货号") || "",
          productName: getSilverColumnValue(row, "产品名称") || "",
          specification: getSilverColumnValue(row, "规格") || "",
          // 🔥 自动选择最右边的重量列（最新的重量）
          weight: Number(findLatestColumnValue(row, "克重", "重量", "克重", "净重", "重量(g)", "重量(克)")) || 0,
          // 🔥 自动选择最右边的工费列（最新的工费）
          laborCost: Number(findLatestColumnValue(row, "工费", "工费", "人工费", "加工费", "手工费")) || 0,
          silverColor: getSilverColumnValue(row, "银色") || "银色",
          silverPrice: silverPrice,
          wholesalePrice: 0,
          retailPrice: 0,
          // 🔥 自动选择最右边的成本列（最新的成本）
          accessoryCost: Number(findLatestColumnValue(row, "配件成本", "配件", "配件成本")) || 0,
          stoneCost: Number(findLatestColumnValue(row, "石头成本", "石头", "石头成本")) || 0,
          platingCost: Number(findLatestColumnValue(row, "电镀成本", "电镀", "电镀成本")) || 0,
          moldCost: 0,
          commission: 0,
          supplierCode: getSilverColumnValue(row, "供应商代码") || "E1",
          remarks: getSilverColumnValue(row, "备注") || "",
          batchQuantity: Number(getSilverColumnValue(row, "数量")) || 0,
          quantity: Number(getSilverColumnValue(row, "累计数量")) || 0,
          quantityDate: "",
          laborCostDate: "",
          accessoryCostDate: "",
          stoneCostDate: "",
          platingCostDate: "",
          moldCostDate: "",
          commissionDate: "",
          timestamp: new Date().toISOString(),
          syncStatus: "unsynced",
        }));

      if (importedProducts.length === 0) {
        alert("没有找到符合导入条件的产品");
        return;
      }

      // 计算价格
      const withPrices = importedProducts.map(p => {
        const retail = calculateSilverPrice(p, true);
        const wholesale = calculateSilverPrice(p, false);
        return {
          ...p,
          retailPrice: isNaN(retail) ? 0 : retail,
          wholesalePrice: isNaN(wholesale) ? 0 : wholesale,
        };
      });

      setProducts([...products, ...withPrices]);
      saveToLocalStorage([...products, ...withPrices]);

      // 显示导入详情
      const categoryCount = importedProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const details = Object.entries(categoryCount)
        .map(([cat, count]) => `${cat}: ${count}个`)
        .join("\n");

      alert(`✓ 成功导入 ${importedProducts.length} 个产品\n\n导入详情：\n${details}`);
    };
    reader.readAsBinaryString(file);
  };

  // 验证数据
  const validateData = () => {
    const errors: string[] = [];

    products.forEach(p => {
      if (!p.productName) {
        errors.push(`货号 ${p.productCode || "未填写"}：产品名称为空`);
      }
      if (p.weight <= 0) {
        errors.push(`货号 ${p.productCode || "未填写"}：克重必须大于0`);
      }
      if (!p.productCode) {
        errors.push(`产品 ${p.productName || "未填写"}：货号为空`);
      }
    });

    if (errors.length === 0) {
      alert(`✓ 数据验证通过！共 ${products.length} 个产品`);
    } else {
      alert(`✗ 发现 ${errors.length} 个问题：\n\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? `\n...还有 ${errors.length - 10} 个问题` : ""}`);
    }
  };

  // ========== 页面UI ==========

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AuthProtection>
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">银制品报价操作平台</h1>
                <p className="text-black">925银制品价格计算和管理系统</p>
              </div>
              <button
                onClick={() => router.push('/quote')}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
              >
                <span>←</span>
                <span>返回金制品</span>
              </button>
            </div>
            <div className="relative z-10">
              <button
                onClick={handleSyncButtonClick}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transition-all active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                type="button"
              >
                <span className="text-lg">☁️</span>
                <span className="font-medium">云端同步</span>
              </button>

              {/* 云端同步菜单 */}
              {showSyncMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden" style={{ zIndex: 9999 }}>
                  {/* 菜单头部 - 始终显示同步状态 */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
                    <div className="text-white font-bold text-lg mb-1">云端数据同步</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${cloudDataExists ? "text-green-200" : "text-yellow-200"}`}>
                        {cloudDataExists ? "● 云端已有数据" : "○ 云端暂无数据"}
                      </span>
                    </div>
                    {syncStatus !== "idle" && (
                      <div className="mt-2 text-sm text-white bg-white/20 rounded px-3 py-2">
                        {syncStatus === "syncing" && "⏳ "}{syncStatus === "error" && "❌ "}{syncStatus === "success" && "✅ "}
                        {syncMessage}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮区 */}
                  <div className="p-4 space-y-2">
                    <button
                      onClick={() => {
                        console.log('🖱️ 点击上传到云端按钮');
                        uploadToCloud();
                      }}
                      disabled={syncStatus === "syncing"}
                      className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📤</span>
                        <div className="text-left">
                          <div className="font-semibold">上传到云端</div>
                          <div className="text-xs text-blue-600">将本地数据上传到服务器</div>
                        </div>
                      </div>
                      <span className="text-blue-400">→</span>
                    </button>

                    <button
                      onClick={() => {
                        console.log('🖱️ 点击合并下载按钮');
                        downloadFromCloud("merge");
                      }}
                      disabled={syncStatus === "syncing"}
                      className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📥</span>
                        <div className="text-left">
                          <div className="font-semibold">合并下载</div>
                          <div className="text-xs text-green-600">保留本地数据，添加云端数据</div>
                        </div>
                      </div>
                      <span className="text-green-400">→</span>
                    </button>

                    <button
                      onClick={() => {
                        console.log('🖱️ 点击覆盖下载按钮');
                        downloadFromCloud("replace");
                      }}
                      disabled={syncStatus === "syncing"}
                      className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-orange-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔄</span>
                        <div className="text-left">
                          <div className="font-semibold">覆盖下载</div>
                          <div className="text-xs text-orange-600">完全替换本地数据</div>
                        </div>
                      </div>
                      <span className="text-orange-400">→</span>
                    </button>
                  </div>

                  {/* 底部说明 */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-600 font-medium mb-1">同步内容包含:</div>
                    <div className="text-xs text-gray-500">产品数据、历史记录、银价设置、价格系数</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 操作指引 */}
          <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6 border border-blue-200">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <span>📖</span>
              <span>操作指引</span>
            </h2>
            <div className="space-y-3 text-sm text-black">
              <div className="flex gap-2">
                <span className="font-bold text-blue-600">1. 数据导入：</span>
                <span>选择产品小类后导入Excel文件，系统会自动识别分类和字段</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-blue-600">2. 产品管理：</span>
                <span>可以添加、编辑、删除产品，批量修改工费或删除</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-blue-600">3. 价格计算：</span>
                <span>修改克重、工费等参数后，系统自动计算零售价和批发价</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-blue-600">4. 云端同步：</span>
                <span>可将数据上传到云端，或从云端下载数据，支持合并和覆盖模式</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-blue-600">5. 数据导出：</span>
                <span>支持导出Excel文件，方便备份和分享</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-blue-600">6. 智能识别：</span>
                <span>输入货号自动识别供应商代码，输入产品名称自动识别分类</span>
              </div>
            </div>
          </div>

          {/* 银价配置 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">银价配置</h2>
            <div className="flex items-center gap-4">
              <label className="text-black font-medium">银价（人民币/克）:</label>
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
            <h2 className="text-xl font-bold text-black mb-4">价格系数配置</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-black mb-1">零售工费系数</label>
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
                <label className="block text-black mb-1">批发工费系数</label>
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
                <label className="block text-black mb-1">银材料损耗系数</label>
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
                <label className="block text-black mb-1">材料浮动系数</label>
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
                <label className="block text-black mb-1">国际运输和关税系数</label>
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
                <label className="block text-black mb-1">汇率（人民币/加币）</label>
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
                <label className="block text-black mb-1">佣金系数（工费×系数=佣金）</label>
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
                <label className="block text-black mb-1">石头加成系数</label>
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
            <h2 className="text-xl font-bold text-black mb-4">计算公式</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-black mb-2">通用银制品（人民币基数为加币）</h3>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2 text-black">
                  <p><strong>材料价</strong> = 银价 × 克重 × 1.05 × 1.1</p>
                  <p><strong>佣金</strong> = 工费 × 1.1</p>
                  <p><strong>零售价</strong> = 材料价/5 + (工费/5 + 配件/5 + 电镀/5) × 5 + 石头/5 × 1.3 + 佣金/5</p>
                  <p><strong>批发价</strong> = 材料价/5 + (工费/5 + 配件/5 + 电镀/5) × 3.5 + 石头/5 × 1.3 + 佣金/5</p>
                </div>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-black mb-2">T字头供应商（美金基数折加币）</h3>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2 text-black">
                  <p><strong>零售价</strong> = (材料价 × 1.15 × 1.1 + 工费 × 5 + 其他成本) × 1.25 × 1.4（美金折加币）</p>
                  <p><strong>批发价</strong> = (材料价 × 1.15 × 1.1 + 工费 × 3 + 其他成本) × 1.25 × 1.4（美金折加币）</p>
                  <p className="text-black mt-2">其中：其他成本 = (配件 + 石头 + 电镀 + 佣金) × 1.15</p>
                </div>
              </div>
            </div>
          </div>

          {/* 产品管理区 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <span>📦</span>
              <span>产品管理区</span>
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-black">产品管理</h2>
                {selectedProductIds.size > 0 && (
                  <div className="text-sm text-blue-600 mt-1">
                    已选择 {selectedProductIds.size} 个产品
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={addProduct}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  添加产品
                </button>
                {selectedProductIds.size > 0 && (
                  <>
                    <button
                      onClick={batchEditLaborCost}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      批量修改工费
                    </button>
                    <button
                      onClick={batchDelete}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      批量删除
                    </button>
                  </>
                )}
                <button
                  onClick={validateData}
                  className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
                >
                  验证数据
                </button>
                <button
                  onClick={() => {
                    setShowSyncMenu(!showSyncMenu);
                    checkCloudData();
                  }}
                  className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600"
                >
                  同步数据
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  导出Excel
                </button>
                <label className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 cursor-pointer">
                  导入Excel
                  <input type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" />
                </label>
              </div>

            {/* 导入选项 */}
            <div className="rounded-lg bg-gray-50 border-2 border-blue-200 p-3">
              <p className="mb-2 text-sm font-medium text-black">导入选项：</p>
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
                  <label className="block text-sm font-semibold text-black mb-2">
                    🎯 选择产品小类（导入前必选）
                  </label>
                  <p className="text-xs text-black mb-2">
                    选择要导入的产品小类，系统将使用您选择的小类
                  </p>
                  <select
                    value={importSubCategory}
                    onChange={(e) => setImportSubCategory(e.target.value)}
                    className="w-full rounded border-2 border-blue-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none text-black font-medium"
                  >
                    <option value="">请选择产品小类...</option>
                    {Object.entries(SILVER_SUB_CATEGORIES).map(([category, subCats]) => (
                      <optgroup key={category} label={category}>
                        {subCats.map(subCat => (
                          <option key={subCat} value={subCat}>
                            {subCat}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {!importSubCategory && (
                    <p className="mt-2 text-xs text-red-600">
                      ⚠️ 请先选择产品小类再导入！
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 分类选择 */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-black font-medium">选择分类:</span>
              <div className="flex gap-2">
                {SILVER_PRODUCT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCurrentCategory(cat);
                      setCurrentSubCategory(null);
                    }}
                    className={`px-4 py-2 rounded ${currentCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 子分类选择 */}
            {currentCategory && SILVER_SUB_CATEGORIES[currentCategory] && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-black font-medium">选择子分类:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentSubCategory(null)}
                    className={`px-3 py-1 rounded text-sm ${currentSubCategory === null ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  >
                    全部
                  </button>
                  {SILVER_SUB_CATEGORIES[currentCategory].map(subCat => (
                    <button
                      key={subCat}
                      onClick={() => setCurrentSubCategory(subCat)}
                      className={`px-3 py-1 rounded text-sm ${currentSubCategory === subCat ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                    >
                      {subCat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 产品列表 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">产品列表</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="搜索货号或产品名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTrigger(Date.now());
                    }
                  }}
                  className="border border-gray-300 rounded px-3 py-1.5 w-64 text-sm text-black"
                />
                <button
                  onClick={() => setSearchTrigger(Date.now())}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 text-sm"
                >
                  搜索
                </button>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchTrigger(Date.now());
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-center w-12">
                      <input
                        type="checkbox"
                        checked={
                          products.filter(p => {
                            if (p.category !== currentCategory) return false;
                            if (currentSubCategory && p.subCategory !== currentSubCategory) return false;
                            return true;
                          }).length > 0 &&
                          products.filter(p => {
                            if (p.category !== currentCategory) return false;
                            if (currentSubCategory && p.subCategory !== currentSubCategory) return false;
                            return true;
                          }).every(p => selectedProductIds.has(p.id))
                        }
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-black w-16">同步</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">操作</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">货号</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">产品名称</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">规格</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">克重</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">工费</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black min-w-[160px]">银色</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">配件成本</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">石头成本</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">电镀成本</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">供应商代码</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">零售价(CAD$)</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">批发价(CAD$)</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">数量</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">累计数量</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">备注</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => {
                    if (p.category !== currentCategory) return false;
                    if (currentSubCategory && p.subCategory !== currentSubCategory) return false;
                    // 搜索过滤
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const matchesCode = (p.productCode || "").toLowerCase().includes(query);
                      const matchesName = (p.productName || "").toLowerCase().includes(query);
                      return matchesCode || matchesName;
                    }
                    return true;
                  }).map(product => (
                    <tr key={product.id}>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        {product.syncStatus === "synced" ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full" title="已同步">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full" title="未同步">
                            !
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="text"
                          value={product.productCode || ""}
                          onChange={(e) => updateProduct(product.id, "productCode", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="text"
                          value={product.productName || ""}
                          onChange={(e) => updateProduct(product.id, "productName", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="text"
                          value={product.specification || ""}
                          onChange={(e) => updateProduct(product.id, "specification", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={product.weight ?? 0}
                          onChange={(e) => updateProduct(product.id, "weight", Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black text-right"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={product.laborCost ?? 0}
                          onChange={(e) => updateProduct(product.id, "laborCost", Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black text-right"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2 min-w-[160px]">
                        <select
                          value={product.silverColor || "银色"}
                          onChange={(e) => updateProduct(product.id, "silverColor", e.target.value as any)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black"
                        >
                          <option value="银色">银色</option>
                          <option value="镀金">镀金</option>
                          <option value="镀玫瑰金">镀玫瑰金</option>
                          <option value="银色/镀金/镀玫瑰金">银色/镀金/镀玫瑰金</option>
                        </select>
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={product.accessoryCost ?? 0}
                          onChange={(e) => updateProduct(product.id, "accessoryCost", Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black text-right"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={product.stoneCost ?? 0}
                          onChange={(e) => updateProduct(product.id, "stoneCost", Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black text-right"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={product.platingCost ?? 0}
                          onChange={(e) => updateProduct(product.id, "platingCost", Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black text-right"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="text"
                          value={product.supplierCode || ""}
                          onChange={(e) => updateProduct(product.id, "supplierCode", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right font-bold text-blue-700">
                        {Number(product.retailPrice || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right font-bold text-green-700">
                        {Number(product.wholesalePrice || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="number"
                          step="1"
                          value={product.batchQuantity || 0}
                          onChange={(e) => updateProduct(product.id, "batchQuantity", Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black text-right"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right font-bold text-black">
                        {product.quantity || 0}
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <input
                          type="text"
                          value={product.remarks || ""}
                          onChange={(e) => updateProduct(product.id, "remarks", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-black"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-xs text-black">
                        {formatDate(product.timestamp)}
                      </td>
                    </tr>
                  ))}
                  {products.filter(p => p.category === currentCategory).length === 0 && (
                    <tr>
                      <td colSpan={20} className="border border-gray-200 px-3 py-4 text-center text-black">
                        暂无{currentCategory}产品数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 历史记录 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>数据管理区 - 价格历史记录</span>
            </h2>
            <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">时间</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">货号</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">名称</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">克重</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">工费</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black">银色</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">零售价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black">批发价</th>
                  </tr>
                </thead>
                <tbody>
                  {priceHistory.filter(h => h.category === currentCategory).slice(0, 100).map(history => (
                    <tr key={history.id}>
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-black text-xs">
                        {formatDate(history.timestamp)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-black">{history.productCode}</td>
                      <td className="border border-gray-200 px-3 py-2 text-black">{history.productName}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right text-black">{history.weight}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right text-black">{history.laborCost}</td>
                      <td className="border border-gray-200 px-3 py-2 text-black">{history.silverColor}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right text-black">{Number(history.retailPrice || 0).toFixed(2)}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right text-black">{Number(history.wholesalePrice || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {priceHistory.filter(h => h.category === currentCategory).length === 0 && (
                    <tr>
                      <td colSpan={8} className="border border-gray-200 px-3 py-4 text-center text-black">
                        暂无历史记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AuthProtection>
    </div>
  );
}

export default SilverQuotePage;

"use client";

import React, { useState, useEffect } from "react";
import XLSX from "xlsx-js-style";
import { AuthProtection } from "@/components/AuthProtection";

// 产品分类列表（新的三大类）
export const PRODUCT_CATEGORIES = [
  "配件",
  "宝石托",
  "链条",
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// 旧的产品分类列表（用于数据迁移）
export const OLD_PRODUCT_CATEGORIES = [
  "耳环/耳逼",
  "扣子",
  "开口圈/闭口圈",
  "圆珠",
  "车花珠",
  "定位珠/短管",
  "包扣",
  "字印片/吊牌",
  "延长链",
  "珠针",
  "空心管",
  "珠托",
  "吊坠托",
  "戒子托",
  "耳环托",
  "耳钉托",
  "吊坠夹",
  "镶嵌配件",
  "珍珠配件",
  "金线",
  "金链",
] as const;

// 大分类和子分类的映射关系
export const SUB_CATEGORIES: Record<ProductCategory, string[]> = {
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
    "金线",
  ],
  "宝石托": [
    "戒子托",
    "耳环托",
    "耳钉托",
    "吊坠托",
  ],
  "链条": [
    "金链",
    "延长链",
  ],
};

// 数据版本号（用于触发数据重新迁移）
const DATA_VERSION = 3;  // v2: 修复 subCategory 映射逻辑; v3: 自动设置默认子分类

// 旧分类到新分类的映射
const CATEGORY_MAPPING: Record<string, ProductCategory> = {
  // 链条类
  "金链": "链条",
  "延长链": "链条",

  // 宝石托类
  "戒子托": "宝石托",
  "耳环托": "宝石托",
  "耳钉托": "宝石托",
  "吊坠托": "宝石托",

  // 配件类（其他所有分类）
  "耳环/耳逼": "配件",
  "扣子": "配件",
  "开口圈/闭口圈": "配件",
  "圆珠": "配件",
  "车花珠": "配件",
  "定位珠/短管": "配件",
  "包扣": "配件",
  "字印片/吊牌": "配件",
  "珠针": "配件",
  "空心管": "配件",
  "珠托": "配件",
  "吊坠夹": "配件",
  "镶嵌配件": "配件",
  "珍珠配件": "配件",
  "金线": "配件",
};

// 智能识别产品分类（根据产品名称关键词）
const detectCategoryFromName = (productName: string): ProductCategory | null => {
  const name = productName.toLowerCase();

  // 🔥 重要：先检查更具体的关键词（优先级更高）
  // 宝石托类关键词 - 必须放在前面，避免被其他关键词匹配
  const settingsKeywords = [
    "戒子托", "耳环托", "耳钉托", "吊坠托",
    "戒指托", "耳饰托", "吊饰托", "镶嵌托"
  ];

  // 链条类关键词
  const chainKeywords = [
    "金链", "延长链", "项链", "手链", "链子"
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
    "金线",
    "耳逼", "耳夹",
    // 注意：简单的"扣"、"圈"、"珠"等单字关键词容易误匹配，不使用
  ];

  // 🔥 按优先级检查：宝石托 > 链条 > 配件

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
const detectSubCategoryFromName = (productName: string): string | null => {
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
    { subCat: "金线", keywords: ["金线"] },
    { subCat: "耳环/耳逼", keywords: ["耳环", "耳逼", "耳夹"] },

    // 链条类
    { subCat: "金链", keywords: ["金链", "项链", "手链"] },
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

// 下单口列表
export const ORDER_CHANNELS = [
  { code: "Van", name: "Van (Vancouver)" },
  { code: "US201", name: "US201 (US office)" },
  { code: "US202", name: "US202 (Show team)" },
] as const;

export type OrderChannel = typeof ORDER_CHANNELS[number]["code"];

// 形状列表
export const PRODUCT_SHAPES = [
  "圆形",
  "椭圆形",
  "心形",
  "方形",
  "长方形",
  "马蹄形",
  "水滴形",
  "菱形",
  "肥方",
  "肥三角",
  "其他",
] as const;

export type ProductShape = typeof PRODUCT_SHAPES[number] | "";

// 产品信息类型
interface Product {
  id: string;
  category: ProductCategory | "";  // 允许空字符串（兼容旧数据）
  subCategory: string;  // 子分类
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  karat: "10K" | "14K" | "18K";
  goldColor: "黄金" | "白金" | "玫瑰金";  // 金子颜色
  goldPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  accessoryCost: number;        // 配件成本
  stoneCost: number;            // 石头成本
  platingCost: number;          // 电镀成本
  moldCost: number;             // 模具成本
  commission: number;            // 佣金
  supplierCode: string;         // 供应商代码
  orderChannel: OrderChannel | "";  // 下单口
  shape: ProductShape;          // 形状
  // 特殊系数（可选，如果设置则优先使用）
  specialMaterialLoss?: number;      // 特殊材料损耗系数
  specialMaterialCost?: number;      // 特殊材料浮动系数
  specialProfitMargin?: number;     // 特殊关税系数
  specialLaborFactorRetail?: number;   // 特殊零售价工费系数
  specialLaborFactorWholesale?: number; // 特殊批发价工费系数
  // 成本时间戳
  laborCostDate: string;        // 工费更新时间
  accessoryCostDate: string;    // 配件成本更新时间
  stoneCostDate: string;        // 石头成本更新时间
  platingCostDate: string;      // 电镀成本更新时间
  moldCostDate: string;         // 模具成本更新时间
  commissionDate: string;       // 佣金更新时间
  timestamp: string;
}

// 历史记录类型
interface PriceHistory {
  id: string;
  productId: string;
  category: ProductCategory | "";  // 允许空字符串（兼容旧数据）
  subCategory: string;  // 子分类
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  karat: "10K" | "14K" | "18K";
  goldColor: "黄金" | "白金" | "玫瑰金";  // 金子颜色
  goldPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  accessoryCost: number;        // 配件成本
  stoneCost: number;            // 石头成本
  platingCost: number;          // 电镀成本
  moldCost: number;             // 模具成本
  commission: number;            // 佣金
  supplierCode: string;         // 供应商代码
  orderChannel: OrderChannel | "";  // 下单口
  shape: ProductShape;          // 形状
  // 特殊系数（可选，如果设置则优先使用）
  specialMaterialLoss?: number;      // 特殊材料损耗系数
  specialMaterialCost?: number;      // 特殊材料浮动系数
  specialProfitMargin?: number;     // 特殊关税系数
  specialLaborFactorRetail?: number;   // 特殊零售价工费系数
  specialLaborFactorWholesale?: number; // 特殊批发价工费系数
  // 成本时间戳
  laborCostDate: string;        // 工费更新时间
  accessoryCostDate: string;    // 配件成本更新时间
  stoneCostDate: string;        // 石头成本更新时间
  platingCostDate: string;      // 电镀成本更新时间
  moldCostDate: string;         // 模具成本更新时间
  commissionDate: string;       // 佣金更新时间
  timestamp: string;
}

// 历史记录类型
interface PriceHistory {
  id: string;
  productId: string;
  category: ProductCategory | "";  // 允许空字符串（兼容旧数据）
  subCategory: string;  // 子分类
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  karat: "10K" | "14K" | "18K";
  goldColor: "黄金" | "白金" | "玫瑰金";  // 金子颜色
  goldPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  accessoryCost: number;        // 配件成本
  stoneCost: number;            // 石头成本
  platingCost: number;          // 电镀成本
  moldCost: number;             // 模具成本
  commission: number;            // 佣金
  supplierCode: string;         // 供应商代码
  orderChannel: OrderChannel | "";  // 下单口
  shape: ProductShape;          // 形状
  // 成本时间戳
  laborCostDate: string;        // 工费更新时间
  accessoryCostDate: string;    // 配件成本更新时间
  stoneCostDate: string;        // 石头成本更新时间
  platingCostDate: string;      // 电镀成本更新时间
  moldCostDate: string;         // 模具成本更新时间
  commissionDate: string;       // 佣金更新时间
  timestamp: string;
}

function QuotePage() {
  const [goldPrice, setGoldPrice] = useState<number>(() => {
    if (typeof window === 'undefined') return 500;
    const savedGoldPrice = localStorage.getItem("goldPrice");
    return savedGoldPrice ? Number(savedGoldPrice) : 500;
  });

  // 滚动同步ref
  const scrollBarRef = React.useRef<HTMLDivElement>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // 同步滚动（双向同步）
  const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
    if (target) {
      target.scrollLeft = source.scrollLeft;
    }
  };

  // 更新滚动条宽度以匹配表格
  const updateScrollBarWidth = () => {
    const table = tableContainerRef.current?.querySelector('table');
    const scrollBarContent = scrollBarRef.current?.querySelector('div[style*="width"]');
    if (table && scrollBarContent && tableContainerRef.current) {
      const tableWidth = table.scrollWidth;
      const containerWidth = tableContainerRef.current.clientWidth;
      // 设置足够大的滚动条宽度，确保能滚动到所有列（至少20000px）
      const scrollBarWidth = Math.max(tableWidth + 5000, containerWidth + 10000, 20000);
      (scrollBarContent as HTMLElement).style.width = `${scrollBarWidth}px`;
      console.log('更新滚动条宽度: tableWidth=', tableWidth, 'containerWidth=', containerWidth, 'scrollBarWidth=', scrollBarWidth);
    }
  };

  // 表格滚动监听
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    syncScroll(target, scrollBarRef.current!);

    // 动态更新滚动条宽度
    const table = target.querySelector('table');
    const scrollBarContent = scrollBarRef.current?.querySelector('div[style*="width"]');
    if (table && scrollBarContent) {
      const tableWidth = table.scrollWidth;
      const scrollBarWidth = Math.max(tableWidth + 5000, target.clientWidth + 10000, 20000);
      (scrollBarContent as HTMLElement).style.width = `${scrollBarWidth}px`;
    }
  };
  const [goldPriceTimestamp, setGoldPriceTimestamp] = useState<string>(() => {
    if (typeof window === 'undefined') return new Date().toLocaleString("zh-CN");
    const savedGoldPriceTimestamp = localStorage.getItem("goldPriceTimestamp");
    return savedGoldPriceTimestamp || new Date().toLocaleString("zh-CN");
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [currentCategory, setCurrentCategory] = useState<ProductCategory>("配件");
  const [currentSubCategory, setCurrentSubCategory] = useState<string>(""); // 当前选中的子分类

  // 分类展开/折叠状态
  const [expandedCategories, setExpandedCategories] = useState<Set<ProductCategory>>(new Set(["配件"]));

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"name" | "specification" | "supplierCode" | "karat" | "shape" | "all">("all");
  const [searchScope, setSearchScope] = useState<"current" | "all">("current"); // 搜索范围：当前分类/全部分类
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    category: "配件",
    subCategory: "",
    productCode: "",
    productName: "",
    specification: "",
    weight: 0,
    laborCost: 0,
    karat: "14K",
    goldColor: "黄金",
    accessoryCost: 0,
    stoneCost: 0,
    platingCost: 0,
    moldCost: 0,
    commission: 0,
    supplierCode: "K14",
    orderChannel: "Van",
    shape: "",
    // 特殊系数（可选，默认为空表示使用全局固定系数）
    specialMaterialLoss: undefined,
    specialMaterialCost: undefined,
    specialProfitMargin: undefined,
    specialLaborFactorRetail: undefined,
    specialLaborFactorWholesale: undefined,
  });

  // 导入Excel相关状态
  const [importWeight, setImportWeight] = useState<boolean>(true);
  const [importLaborCost, setImportLaborCost] = useState<boolean>(true);
  const [defaultKarat, setDefaultKarat] = useState<"10K" | "14K" | "18K">("14K");
  const [importSubCategory, setImportSubCategory] = useState<string>(""); // 导入前选择的小类

  // 导出Excel范围选择
  const [exportScope, setExportScope] = useState<"current" | "all">("current");

  // 导出备份相关状态
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportBackupFormat, setExportBackupFormat] = useState<"excel" | "json">("excel");

  // 数据同步相关状态
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [isValidatingExport, setIsValidatingExport] = useState<boolean>(false);

  // 更多工具菜单状态
  const [showMoreToolsMenu, setShowMoreToolsMenu] = useState<boolean>(false);

  // 导出选项菜单状态
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // 操作指引模态框状态
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [helpSearchQuery, setHelpSearchQuery] = useState<string>("");

  // 批量更新供应商代码相关状态
  const [showBatchUpdateModal, setShowBatchUpdateModal] = useState<boolean>(false);
  const [batchUpdateRules, setBatchUpdateRules] = useState<{
    productCodes: string;
    supplierCode: string;
  }[]>([
    { productCodes: "KEW001,KEW002,KEW003,KEW004,KEW005,KEW006,KEW007,KEW008,KEW009,KEW010,KEW011,KEW012,KEW013,KEW014,KEW015,KEW016,KEW017,KEW018,KEW019,KEW020,KEW021", supplierCode: "J5" },
    { productCodes: "KEW022,KEW023,KEW024,KEW025,KEW026,KEW027,KEW028,KEW029,KEW030", supplierCode: "K2" },
    { productCodes: "KEW031/14k,KEW032/18k,KEW033/10k", supplierCode: "K15" },
    { productCodes: "K14KEW027/K14", supplierCode: "K14" },
  ]);

  // 批量修改下单口相关状态
  const [showBatchUpdateChannelModal, setShowBatchUpdateChannelModal] = useState<boolean>(false);
  const [batchUpdateChannelRules, setBatchUpdateChannelRules] = useState<{
    productCodes: string;
    orderChannel: OrderChannel | "";
  }[]>([
    { productCodes: "", orderChannel: "" },
  ]);

  // 批量修改价格系数相关状态
  const [showBatchModifyModal, setShowBatchModifyModal] = useState<boolean>(false);
  const [batchModifyConfig, setBatchModifyConfig] = useState<{
    scope: "current" | "all";
    fields: {
      laborCost: boolean;
      accessoryCost: boolean;
      stoneCost: boolean;
      platingCost: boolean;
      moldCost: boolean;
      commission: boolean;
      weight: boolean;
      goldPrice: boolean;
    };
    filters: {
      productName: string;
      productCode: string;
      supplierCode: string;
      shape: string;
      karat: string;
    };
    newValues: {
      laborCost: number;
      accessoryCost: number;
      stoneCost: number;
      platingCost: number;
      moldCost: number;
      commission: number;
      weight: number;
      goldPrice: number;
    };
  }>({
    scope: "current",
    fields: {
      laborCost: false,
      accessoryCost: false,
      stoneCost: false,
      platingCost: false,
      moldCost: false,
      commission: false,
      weight: false,
      goldPrice: false,
    },
    filters: {
      productName: "",
      productCode: "",
      supplierCode: "",
      shape: "",
      karat: "",
    },
    newValues: {
      laborCost: 0,
      accessoryCost: 0,
      stoneCost: 0,
      platingCost: 0,
      moldCost: 0,
      commission: 0,
      weight: 0,
      goldPrice: goldPrice,
    },
  });

  // ========== 数据同步相关状态 ==========
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem("autoSyncEnabled");
    return saved ? saved === "true" : true;
  });
  const [showSyncMenu, setShowSyncMenu] = useState<boolean>(false);
  const [cloudDataExists, setCloudDataExists] = useState<boolean>(false);

  // 价格系数配置
  const [coefficients, setCoefficients] = useState<{
    goldFactor10K: number;
    goldFactor14K: number;
    goldFactor18K: number;
    laborFactorRetail: number;
    laborFactorWholesale: number;
    laborFactorRetailMode: "fixed" | "special";
    laborFactorWholesaleMode: "fixed" | "special";
    materialLoss: number;
    materialCost: number;
    profitMargin: number;
    exchangeRate: number;
    // 系数模式：fixed（固定）或 special（特殊）
    materialLossMode: "fixed" | "special";
    materialCostMode: "fixed" | "special";
    profitMarginMode: "fixed" | "special";
  }>(() => {
    if (typeof window === 'undefined') {
      return {
        goldFactor10K: 0.417,
        goldFactor14K: 0.586,
        goldFactor18K: 0.755,
        laborFactorRetail: 5,
        laborFactorWholesale: 3,
        laborFactorRetailMode: "fixed",
        laborFactorWholesaleMode: "fixed",
        materialLoss: 1.15,
        materialCost: 1.1,
        profitMargin: 1.25,
        exchangeRate: 5,
        materialLossMode: "fixed",
        materialCostMode: "fixed",
        profitMarginMode: "fixed",
      };
    }
    const savedCoefficients = localStorage.getItem("priceCoefficients");
    if (savedCoefficients) {
      const parsed = JSON.parse(savedCoefficients);
      // 兼容旧数据，确保所有字段都存在
      return {
        goldFactor10K: parsed.goldFactor10K ?? 0.417,
        goldFactor14K: parsed.goldFactor14K ?? 0.586,
        goldFactor18K: parsed.goldFactor18K ?? 0.755,
        laborFactorRetail: parsed.laborFactorRetail ?? 5,
        laborFactorWholesale: parsed.laborFactorWholesale ?? 3,
        laborFactorRetailMode: parsed.laborFactorRetailMode ?? "fixed",
        laborFactorWholesaleMode: parsed.laborFactorWholesaleMode ?? "fixed",
        materialLoss: parsed.materialLoss ?? 1.15,
        materialCost: parsed.materialCost ?? 1.1,
        profitMargin: parsed.profitMargin ?? 1.25,
        exchangeRate: parsed.exchangeRate ?? 5,
        materialLossMode: parsed.materialLossMode ?? "fixed",
        materialCostMode: parsed.materialCostMode ?? "fixed",
        profitMarginMode: parsed.profitMarginMode ?? "fixed",
      };
    }
    return {
      goldFactor10K: 0.417,
      goldFactor14K: 0.586,
      goldFactor18K: 0.755,
      laborFactorRetail: 5,
      laborFactorWholesale: 3,
      laborFactorRetailMode: "fixed",
      laborFactorWholesaleMode: "fixed",
      materialLoss: 1.15,
      materialCost: 1.1,
      profitMargin: 1.25,
      exchangeRate: 5,
      materialLossMode: "fixed",
      materialCostMode: "fixed",
      profitMarginMode: "fixed",
    };
  });

  // 格式化日期为年月日
  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString("zh-CN");
  };

  // 判断产品是否被修改过（通过历史记录数量判断）
  const isProductModified = (productId: string): boolean => {
    const historyCount = priceHistory.filter(h => h.productId === productId).length;
    return historyCount > 1;
  };

  // 从货号智能识别K金材质类型
  const detectMaterialFromCode = (productCode: string): { karat: "10K" | "14K" | "18K", goldColor: "黄金" | "白金" | "玫瑰金" } => {
    const code = productCode.toUpperCase();

    // 1. 检查白金（KW）- 如 KW10, KW14, KW18
    const whiteGoldPrefixMatch = code.match(/^(KW10|KW14|KW18)/i);
    if (whiteGoldPrefixMatch) {
      const karatMap: Record<string, "10K" | "14K" | "18K"> = {
        "KW10": "10K",
        "KW14": "14K",
        "KW18": "18K"
      };
      return { karat: karatMap[whiteGoldPrefixMatch[1].toUpperCase()], goldColor: "白金" };
    }

    const whiteGoldSlashMatch = code.match(/\/(KW10|KW14|KW18)(?=\/|$|[^A-Z])/i);
    if (whiteGoldSlashMatch) {
      const karatMap: Record<string, "10K" | "14K" | "18K"> = {
        "KW10": "10K",
        "KW14": "14K",
        "KW18": "18K"
      };
      return { karat: karatMap[whiteGoldSlashMatch[1].toUpperCase()], goldColor: "白金" };
    }

    // 2. 检查玫瑰金（KR）- 如 10KR, 14KR, 18KR
    const roseGoldSuffixMatch = code.match(/(10KR|14KR|18KR)$/i);
    if (roseGoldSuffixMatch) {
      const karatMap: Record<string, "10K" | "14K" | "18K"> = {
        "10KR": "10K",
        "14KR": "14K",
        "18KR": "18K"
      };
      return { karat: karatMap[roseGoldSuffixMatch[1].toUpperCase()], goldColor: "玫瑰金" };
    }

    const roseGoldSlashMatch = code.match(/\/(10KR|14KR|18KR)(?=\/|$|[^A-Z])/i);
    if (roseGoldSlashMatch) {
      const karatMap: Record<string, "10K" | "14K" | "18K"> = {
        "10KR": "10K",
        "14KR": "14K",
        "18KR": "18K"
      };
      return { karat: karatMap[roseGoldSlashMatch[1].toUpperCase()], goldColor: "玫瑰金" };
    }

    // 检查包含KR但不匹配标准格式的情况（如 K14KR, /14KR/ 等）
    if (code.includes("KR")) {
      // 尝试从货号中提取成色
      let detectedKarat: "10K" | "14K" | "18K" = "14K"; // 默认值

      // 检查是否有 K10, K14, K18 前缀
      const karatPrefixMatch = code.match(/^(K10|K14|K18)/i);
      if (karatPrefixMatch) {
        const karatMap: Record<string, "10K" | "14K" | "18K"> = {
          "K10": "10K",
          "K14": "14K",
          "K18": "18K"
        };
        detectedKarat = karatMap[karatPrefixMatch[1].toUpperCase()];
      } else {
        // 检查是否有 10K, 14K, 18K
        const karatNumberMatch = code.match(/(10K|14K|18K)/i);
        if (karatNumberMatch) {
          const karatMap: Record<string, "10K" | "14K" | "18K"> = {
            "10K": "10K",
            "14K": "14K",
            "18K": "18K"
          };
          detectedKarat = karatMap[karatNumberMatch[1].toUpperCase()];
        }
      }

      // 如果找到了KR，就返回玫瑰金
      return { karat: detectedKarat, goldColor: "玫瑰金" };
    }

    // 3. 检查黄金（K）- 如 K10, K14, K18, 10K, 14K, 18K
    const goldPrefixMatch = code.match(/^(K10|K14|K18)/i);
    if (goldPrefixMatch) {
      const karatMap: Record<string, "10K" | "14K" | "18K"> = {
        "K10": "10K",
        "K14": "14K",
        "K18": "18K"
      };
      return { karat: karatMap[goldPrefixMatch[1].toUpperCase()], goldColor: "黄金" };
    }

    const goldSuffixMatch = code.match(/(10K|14K|18K)$/i);
    if (goldSuffixMatch) {
      const karatMap: Record<string, "10K" | "14K" | "18K"> = {
        "10K": "10K",
        "14K": "14K",
        "18K": "18K"
      };
      return { karat: karatMap[goldSuffixMatch[1].toUpperCase()], goldColor: "黄金" };
    }

    const goldSlashMatch = code.match(/\/(K10|K14|K18|10K|14K|18K)(?=\/|$|[^A-Z])/i);
    if (goldSlashMatch) {
      const karatMap: Record<string, "10K" | "14K" | "18K"> = {
        "K10": "10K",
        "K14": "14K",
        "K18": "18K",
        "10K": "10K",
        "14K": "14K",
        "18K": "18K"
      };
      return { karat: karatMap[goldSlashMatch[1].toUpperCase()], goldColor: "黄金" };
    }

    // 默认返回 14K 黄金
    return { karat: "14K", goldColor: "黄金" };
  };

  // 根据货号查找产品（获取当前分类的最新记录）
  const findLatestProductByCode = (code: string): Product | undefined => {
    const codeProducts = products.filter((p) => p.productCode === code && p.category === currentCategory);
    if (codeProducts.length === 0) return undefined;
    // 返回最新的记录
    return codeProducts[codeProducts.length - 1];
  };

  // 当货号改变时，自动填充已存在产品的信息，并智能识别材质
  useEffect(() => {
    if (currentProduct.productCode) {
      // 智能识别材质
      const detected = detectMaterialFromCode(currentProduct.productCode);

      const existingProduct = findLatestProductByCode(currentProduct.productCode);
      if (existingProduct) {
        // 自动填充已存在产品的信息
        setCurrentProduct({
          ...currentProduct,
          productName: existingProduct.productName,
          specification: existingProduct.specification,
          weight: existingProduct.weight,
          laborCost: existingProduct.laborCost,
          karat: detected.karat,  // 使用智能识别的材质
          goldColor: detected.goldColor,  // 使用智能识别的金子颜色
        });
      } else {
        // 没有找到现有产品，仅应用智能识别的材质
        setCurrentProduct({
          ...currentProduct,
          karat: detected.karat,
          goldColor: detected.goldColor,  // 使用智能识别的金子颜色
        });
      }
    }
  }, [currentProduct.productCode]);

  // 从 localStorage 加载数据
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log("========== 开始从 localStorage 加载数据 ==========");

    const savedProducts = localStorage.getItem("goldProducts");
    const savedHistory = localStorage.getItem("goldPriceHistory");
    const savedGoldPrice = localStorage.getItem("goldPrice");
    const savedDataVersion = localStorage.getItem("dataVersion");

    // 检查数据版本，如果版本不匹配则需要重新迁移数据
    const currentVersion = parseInt(savedDataVersion || "0");
    const needsMigration = currentVersion < DATA_VERSION;
    console.log("数据版本检查: 当前版本 =", currentVersion, "期望版本 =", DATA_VERSION, "需要迁移 =", needsMigration);
    const savedCoefficients = localStorage.getItem("priceCoefficients");

    console.log("LocalStorage中的产品数据:", savedProducts);
    console.log("LocalStorage中的历史记录:", savedHistory);
    console.log("LocalStorage中的金价:", savedGoldPrice);
    console.log("LocalStorage中的系数:", savedCoefficients);

    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        console.log("解析后的产品数量:", parsedProducts.length);
        console.log("产品列表样例:", parsedProducts.slice(0, 2));

        // 数据迁移：将旧分类映射到新分类，并添加新字段的默认值（兼容旧数据）
        const migratedProducts = parsedProducts.map((p: Product) => {
          // 保存旧分类名称（原始值，用于映射子分类）
          const oldCategory = p.category as string;

          // 旧分类迁移逻辑
          let newCategory = p.category as any;
          if (oldCategory === "水滴扣") {
            newCategory = "扣子";  // 旧的迁移
          } else if (CATEGORY_MAPPING[oldCategory]) {
            newCategory = CATEGORY_MAPPING[oldCategory];  // 新的迁移（21分类 -> 3大类）
          }

          // 计算正确的 subCategory
          let subCategoryValue = (p as any).subCategory || "";
          if (!subCategoryValue && oldCategory) {
            // 如果产品没有 subCategory，检查旧分类名称是否在对应大类的子分类列表中
            Object.values(SUB_CATEGORIES).forEach((subList) => {
              if (subList.includes(oldCategory)) {
                subCategoryValue = oldCategory;
              }
            });
          }

          return {
            ...p,
            category: newCategory,
            // 使用计算出的 subCategory
            subCategory: subCategoryValue,
            accessoryCost: p.accessoryCost || 0,
            stoneCost: p.stoneCost || 0,
            platingCost: p.platingCost || 0,
            moldCost: p.moldCost || 0,
            commission: p.commission || 0,
            supplierCode: p.supplierCode || "",
            goldColor: (p as any).goldColor || "黄金",
            // 添加成本时间戳（兼容旧数据）
            laborCostDate: (p as any).laborCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            accessoryCostDate: (p as any).accessoryCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            stoneCostDate: (p as any).stoneCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            platingCostDate: (p as any).platingCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            moldCostDate: (p as any).moldCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            commissionDate: (p as any).commissionDate || p.timestamp || new Date().toLocaleString("zh-CN"),
          };
        });

        console.log("设置 products state，数量:", migratedProducts.length);

        // 强制修复 subCategory 字段：遍历所有子分类，检查是否有匹配的产品
        // 如果产品的 subCategory 为空，但产品名称或规格中包含子分类关键字，则自动设置
        const fixedProducts = migratedProducts.map((p: Product) => {
          // 如果已经有 subCategory，保持不变
          if (p.subCategory) {
            return p;
          }

          // 如果没有 subCategory，根据大类设置默认子分类
          const subCategoryList = SUB_CATEGORIES[p.category as ProductCategory];
          if (subCategoryList && subCategoryList.length > 0) {
            console.log(`产品 ${p.productCode} 使用默认子分类: ${subCategoryList[0]} (大类: ${p.category})`);
            return { ...p, subCategory: subCategoryList[0] };
          }

          return p;
        });

        // 统计各子分类的产品数量
        const subCategoryCounts: Record<string, number> = {};
        fixedProducts.forEach((p: Product) => {
          if (p.subCategory) {
            subCategoryCounts[p.subCategory] = (subCategoryCounts[p.subCategory] || 0) + 1;
          }
        });
        console.log("子分类产品数量统计:", subCategoryCounts);

        console.log("修复后的产品数量:", fixedProducts.length);
        setProducts(fixedProducts);
      } catch (e) {
        console.error("解析产品数据失败:", e);
      }
    } else {
      console.log("LocalStorage中没有产品数据");
    }

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        console.log("解析后的历史记录数量:", parsedHistory.length);

        // 数据迁移：将旧分类映射到新分类，并添加新字段的默认值（兼容旧数据）
        const migratedHistory = parsedHistory.map((h: PriceHistory) => {
          // 保存旧分类名称（原始值，用于映射子分类）
          const oldCategory = h.category as string;

          // 旧分类迁移逻辑
          let newCategory = h.category as any;
          if (oldCategory === "水滴扣") {
            newCategory = "扣子";  // 旧的迁移
          } else if (CATEGORY_MAPPING[oldCategory]) {
            newCategory = CATEGORY_MAPPING[oldCategory];  // 新的迁移（21分类 -> 3大类）
          }

          // 计算正确的 subCategory
          let subCategoryValue = (h as any).subCategory || "";
          if (!subCategoryValue && oldCategory) {
            // 如果历史记录没有 subCategory，检查旧分类名称是否在对应大类的子分类列表中
            Object.values(SUB_CATEGORIES).forEach((subList) => {
              if (subList.includes(oldCategory)) {
                subCategoryValue = oldCategory;
              }
            });
          }

          return {
            ...h,
            category: newCategory,
            // 使用计算出的 subCategory
            subCategory: subCategoryValue,
            accessoryCost: h.accessoryCost || 0,
            stoneCost: h.stoneCost || 0,
            platingCost: h.platingCost || 0,
            moldCost: h.moldCost || 0,
            commission: h.commission || 0,
            supplierCode: h.supplierCode || "",
            goldColor: (h as any).goldColor || "黄金",
            // 添加成本时间戳（兼容旧数据）
            laborCostDate: (h as any).laborCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            accessoryCostDate: (h as any).accessoryCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            stoneCostDate: (h as any).stoneCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            platingCostDate: (h as any).platingCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            moldCostDate: (h as any).moldCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            commissionDate: (h as any).commissionDate || h.timestamp || new Date().toLocaleString("zh-CN"),
          };
        });

        // 强制修复历史记录的 subCategory 字段：确保所有历史记录都有子分类
        const fixedHistory = migratedHistory.map((h: PriceHistory) => {
          // 如果已经有 subCategory，保持不变
          if (h.subCategory) {
            return h;
          }

          // 如果没有 subCategory，根据大类设置默认子分类
          const subCategoryList = SUB_CATEGORIES[h.category as ProductCategory];
          if (subCategoryList && subCategoryList.length > 0) {
            console.log(`历史记录 ${h.productCode} 使用默认子分类: ${subCategoryList[0]} (大类: ${h.category})`);
            return { ...h, subCategory: subCategoryList[0] };
          }

          return h;
        });

        console.log("设置 priceHistory state，数量:", fixedHistory.length);
        setPriceHistory(fixedHistory);
      } catch (e) {
        console.error("解析历史记录失败:", e);
      }
    } else {
      console.log("LocalStorage中没有历史记录");
    }

    // 加载金价
    if (savedGoldPrice) {
      try {
        const goldPriceNum = Number(savedGoldPrice);
        console.log("设置金价:", goldPriceNum);
        setGoldPrice(goldPriceNum);
      } catch (e) {
        console.error("解析金价失败:", e);
      }
    }

    // 加载系数
    if (savedCoefficients) {
      try {
        const coeff = JSON.parse(savedCoefficients);
        // 兼容旧数据，确保所有字段都存在
        const completeCoeff = {
          goldFactor10K: coeff.goldFactor10K ?? 0.417,
          goldFactor14K: coeff.goldFactor14K ?? 0.586,
          goldFactor18K: coeff.goldFactor18K ?? 0.755,
          laborFactorRetail: coeff.laborFactorRetail ?? 5,
          laborFactorWholesale: coeff.laborFactorWholesale ?? 3,
          materialLoss: coeff.materialLoss ?? 1.15,
          materialCost: coeff.materialCost ?? 1.1,
          profitMargin: coeff.profitMargin ?? 1.25,
          exchangeRate: coeff.exchangeRate ?? 5,
          materialLossMode: coeff.materialLossMode ?? "fixed",
          materialCostMode: coeff.materialCostMode ?? "fixed",
          profitMarginMode: coeff.profitMarginMode ?? "fixed",
          laborFactorRetailMode: coeff.laborFactorRetailMode ?? "fixed",
          laborFactorWholesaleMode: coeff.laborFactorWholesaleMode ?? "fixed",
        };
        console.log("设置系数:", completeCoeff);
        setCoefficients(completeCoeff);
      } catch (e) {
        console.error("解析系数失败:", e);
      }
    }

    // 更新数据版本号
    localStorage.setItem("dataVersion", DATA_VERSION.toString());
    console.log("更新数据版本号到:", DATA_VERSION);

    // 检查是否需要自动修复子分类数据（在产品数据加载后）
    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts);
      const emptySubCategoryCount = parsedProducts.filter((p: any) => !p.subCategory).length;
      if (emptySubCategoryCount > 0) {
        console.log(`检测到 ${emptySubCategoryCount} 个产品缺少子分类，准备自动修复...`);
        // 延迟修复，确保数据已完全加载
        setTimeout(() => {
          console.log("开始自动修复子分类数据...");
          // 这里可以调用修复函数，但为了避免用户困惑，暂时不自动修复
          // 让用户手动点击"修复子分类"按钮
          console.log("提示：请点击\"修复子分类\"按钮来自动修复数据");
        }, 1000);
      }
    }

    console.log("========== 数据加载完成 ==========");
  }, []);

  // ========== 云端数据同步逻辑 ==========

  // 检查云端数据并在首次加载时提示用户
  useEffect(() => {
    const checkCloudAndPrompt = async () => {
      // 检查是否已登录
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return;
      }

      // 检查是否已经提示过（避免每次刷新都提示）
      const prompted = sessionStorage.getItem("cloudDataPrompted");
      if (prompted) {
        return;
      }

      // 延迟检查，确保页面加载完成
      setTimeout(async () => {
        try {
          console.log("🔍 检查云端数据...");
          const hasCloudData = await checkCloudData();

          if (hasCloudData) {
            console.log("✅ 发现云端数据，提示用户");

            // 标记已提示
            sessionStorage.setItem("cloudDataPrompted", "true");

            // 询问用户是否下载
            const shouldDownload = confirm(
              "检测到云端有数据！\n\n" +
              "您可以选择：\n" +
              "• 确定 - 从云端下载数据（合并模式）\n" +
              "• 取消 - 继续使用本地数据\n\n" +
              "您也可以通过顶部的「云端同步」按钮随时同步数据。"
            );

            if (shouldDownload) {
              await downloadFromCloud("merge");
            } else {
              console.log("用户取消下载，继续使用本地数据");
            }
          } else {
            console.log("ℹ️ 云端暂无数据");
          }
        } catch (error) {
          console.error("检查云端数据失败:", error);
        }
      }, 2000); // 延迟2秒执行
    };

    checkCloudAndPrompt();
  }, []);

  // ========== 云端数据同步逻辑结束 ==========

  // ========== 自动同步防抖逻辑 ==========
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // 触发自动同步（带防抖）
  const triggerAutoSync = () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // 延迟3秒执行同步，避免频繁同步
    syncTimeoutRef.current = setTimeout(() => {
      autoSync();
    }, 3000);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  // ========== 自动同步防抖逻辑结束 ==========

  // 保存数据到 localStorage
  useEffect(() => {
    // 延迟更新，确保表格渲染完成
    setTimeout(() => {
      updateScrollBarWidth();
      updateWidthInfo();
    }, 100);
  }, [products, currentCategory, searchQuery]);

  // 更新宽度信息显示
  const updateWidthInfo = () => {
    const table = tableContainerRef.current?.querySelector('table');
    const scrollBarContent = document.getElementById('scrollBarContent');
    const tableWidthInfo = document.getElementById('tableWidthInfo');
    const scrollBarWidthInfo = document.getElementById('scrollBarWidthInfo');
    
    if (table && scrollBarContent && tableWidthInfo && scrollBarWidthInfo) {
      const tableWidth = table.scrollWidth;
      const scrollBarWidth = (scrollBarContent as HTMLElement).style.width;
      tableWidthInfo.textContent = tableWidth.toString();
      scrollBarWidthInfo.textContent = scrollBarWidth;
      console.log('表格宽度:', tableWidth, '滚动条宽度:', scrollBarWidth);
    }
  };

  // 手动重新加载数据的函数
  const reloadFromLocalStorage = () => {
    console.log("========== 手动重新加载数据 ==========");

    const savedProducts = localStorage.getItem("goldProducts");
    const savedHistory = localStorage.getItem("goldPriceHistory");
    const savedGoldPrice = localStorage.getItem("goldPrice");
    const savedCoefficients = localStorage.getItem("priceCoefficients");

    console.log("LocalStorage 中的产品数据:", savedProducts ? `${savedProducts.length} 字符` : "null");
    console.log("LocalStorage 中的历史记录:", savedHistory ? `${savedHistory.length} 字符` : "null");

    let loadedCount = 0;

    // 加载产品数据
    if (savedProducts && savedProducts !== "null") {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        console.log("✅ 解析产品数据成功:", parsedProducts.length, "条");

        // 数据迁移
        const migratedProducts = parsedProducts.map((p: Product) => {
          // 旧分类迁移逻辑
          let newCategory = p.category as any;
          if ((p.category as any) === "水滴扣") {
            newCategory = "扣子";  // 旧的迁移
          } else if (CATEGORY_MAPPING[p.category as string]) {
            newCategory = CATEGORY_MAPPING[p.category as string];  // 新的迁移（21分类 -> 3大类）
          }

          return {
            ...p,
            category: newCategory,
            // 确保新字段有默认值（兼容旧数据）
            // 如果产品没有subCategory，且旧分类名称在SUB_CATEGORIES中，则自动映射
            subCategory: (p as any).subCategory ||
              (p.category as string && SUB_CATEGORIES[newCategory as ProductCategory]?.includes(p.category as string)
                ? p.category as string
                : ""),
            accessoryCost: p.accessoryCost || 0,
            stoneCost: p.stoneCost || 0,
            platingCost: p.platingCost || 0,
            moldCost: p.moldCost || 0,
            commission: p.commission || 0,
            supplierCode: p.supplierCode || "",
            goldColor: (p as any).goldColor || "黄金",
            // 添加成本时间戳（兼容旧数据）
            laborCostDate: (p as any).laborCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            accessoryCostDate: (p as any).accessoryCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            stoneCostDate: (p as any).stoneCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            platingCostDate: (p as any).platingCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            moldCostDate: (p as any).moldCostDate || p.timestamp || new Date().toLocaleString("zh-CN"),
            commissionDate: (p as any).commissionDate || p.timestamp || new Date().toLocaleString("zh-CN"),
          };
        });

        console.log("设置 products state...");
        setProducts(migratedProducts);
        loadedCount += parsedProducts.length;
      } catch (e) {
        console.error("❌ 解析产品数据失败:", e);
      }
    } else {
      console.log("⚠️ LocalStorage 中没有有效的产品数据");
    }

    // 加载历史记录
    if (savedHistory && savedHistory !== "null") {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        console.log("✅ 解析历史记录成功:", parsedHistory.length, "条");

        const migratedHistory = parsedHistory.map((h: PriceHistory) => {
          // 旧分类迁移逻辑
          let newCategory = h.category as any;
          if ((h.category as any) === "水滴扣") {
            newCategory = "扣子";  // 旧的迁移
          } else if (CATEGORY_MAPPING[h.category as string]) {
            newCategory = CATEGORY_MAPPING[h.category as string];  // 新的迁移（21分类 -> 3大类）
          }

          return {
            ...h,
            category: newCategory,
            // 确保新字段有默认值（兼容旧数据）
            // 如果历史记录没有subCategory，且旧分类名称在SUB_CATEGORIES中，则自动映射
            subCategory: (h as any).subCategory ||
              (h.category as string && SUB_CATEGORIES[newCategory as ProductCategory]?.includes(h.category as string)
                ? h.category as string
                : ""),
            accessoryCost: h.accessoryCost || 0,
            stoneCost: h.stoneCost || 0,
            platingCost: h.platingCost || 0,
            moldCost: h.moldCost || 0,
            commission: h.commission || 0,
            supplierCode: h.supplierCode || "",
            goldColor: (h as any).goldColor || "黄金",
            // 添加成本时间戳（兼容旧数据）
            laborCostDate: (h as any).laborCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            accessoryCostDate: (h as any).accessoryCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            stoneCostDate: (h as any).stoneCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            platingCostDate: (h as any).platingCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            moldCostDate: (h as any).moldCostDate || h.timestamp || new Date().toLocaleString("zh-CN"),
            commissionDate: (h as any).commissionDate || h.timestamp || new Date().toLocaleString("zh-CN"),
          };
        });

        console.log("设置 priceHistory state...");
        setPriceHistory(migratedHistory);
      } catch (e) {
        console.error("❌ 解析历史记录失败:", e);
      }
    } else {
      console.log("⚠️ LocalStorage 中没有有效的历史记录");
    }

    // 加载金价
    if (savedGoldPrice && savedGoldPrice !== "null") {
      try {
        const goldPriceNum = Number(savedGoldPrice);
        console.log("✅ 加载金价:", goldPriceNum);
        setGoldPrice(goldPriceNum);
      } catch (e) {
        console.error("❌ 解析金价失败:", e);
      }
    }

    // 加载系数
    if (savedCoefficients && savedCoefficients !== "null") {
      try {
        const coeff = JSON.parse(savedCoefficients);
        // 兼容旧数据，确保所有字段都存在
        const completeCoeff = {
          goldFactor10K: coeff.goldFactor10K ?? 0.417,
          goldFactor14K: coeff.goldFactor14K ?? 0.586,
          goldFactor18K: coeff.goldFactor18K ?? 0.755,
          laborFactorRetail: coeff.laborFactorRetail ?? 5,
          laborFactorWholesale: coeff.laborFactorWholesale ?? 3,
          materialLoss: coeff.materialLoss ?? 1.15,
          materialCost: coeff.materialCost ?? 1.1,
          profitMargin: coeff.profitMargin ?? 1.25,
          exchangeRate: coeff.exchangeRate ?? 5,
          materialLossMode: coeff.materialLossMode ?? "fixed",
          materialCostMode: coeff.materialCostMode ?? "fixed",
          profitMarginMode: coeff.profitMarginMode ?? "fixed",
          laborFactorRetailMode: coeff.laborFactorRetailMode ?? "fixed",
          laborFactorWholesaleMode: coeff.laborFactorWholesaleMode ?? "fixed",
        };
        console.log("✅ 加载系数:", completeCoeff);
        setCoefficients(completeCoeff);
      } catch (e) {
        console.error("❌ 解析系数失败:", e);
      }
    }

    console.log("========== 手动重新加载完成 ==========");

    // 显示结果
    setTimeout(() => {
      let message = `📊 数据重新加载结果\n\n`;
      message += `产品数据: ${savedProducts && savedProducts !== "null" ? "✅ 已加载" : "❌ 无数据"}\n`;
      message += `历史记录: ${savedHistory && savedHistory !== "null" ? "✅ 已加载" : "❌ 无数据"}\n`;
      message += `金价设置: ${savedGoldPrice && savedGoldPrice !== "null" ? "✅ 已加载" : "❌ 无数据"}\n`;
      message += `价格系数: ${savedCoefficients && savedCoefficients !== "null" ? "✅ 已加载" : "❌ 无数据"}\n\n`;
      message += `总计加载产品: ${loadedCount} 条\n\n`;

      // 统计各分类的产品数量
      if (savedProducts && savedProducts !== "null") {
        try {
          const parsedProducts = JSON.parse(savedProducts);
          const categoryCounts: Record<string, number> = {};
          parsedProducts.forEach((p: Product) => {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
          });

          if (Object.keys(categoryCounts).length > 0) {
            message += `📂 各分类产品数量：\n`;
            Object.entries(categoryCounts).forEach(([category, count]) => {
              message += `  • ${category}: ${count} 个\n`;
            });
            message += `\n⚠️ 重要提示：\n`;
            message += `产品列表只显示当前选中分类的数据。\n`;
            message += `请点击顶部的分类按钮切换到有数据的分类！\n`;
          }
        } catch (e) {
          message += `⚠️ 无法统计分类信息\n`;
        }
      }

      message += `\n💡 详细信息请查看控制台 (F12)`;

      alert(message);
    }, 500);
  };

  // ========== 数据同步函数 ==========

  /**
   * 上传数据到云端
   */
  const uploadToCloud = async () => {
    setSyncStatus("syncing");
    setSyncMessage("正在上传数据到云端...");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("未登录，请先登录");
      }

      // 准备同步数据
      const syncData = {
        products: products,
        priceHistory: priceHistory,
        configs: {
          goldPrice,
          goldPriceTimestamp,
          priceCoefficients: coefficients,
          dataVersion: DATA_VERSION,
        },
      };

      console.log("📤 开始上传数据到云端...");
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(syncData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }));
        throw new Error(errorData.error || "上传失败");
      }

      const result = await response.json();
      console.log("✅ 上传成功:", result);

      setLastSyncTime(new Date().toLocaleString("zh-CN"));
      setSyncStatus("success");
      setSyncMessage(`上传成功！产品: ${result.syncedProducts || 0} 个，历史记录: ${result.syncedHistory || 0} 条`);

      // 3秒后清除成功状态
      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);

      return result;
    } catch (error: any) {
      console.error("❌ 上传失败:", error);
      setSyncStatus("error");
      setSyncMessage(`上传失败: ${error.message || "未知错误"}`);

      // 5秒后清除错误状态
      setTimeout(() => {
        setSyncStatus("idle");
      }, 5000);

      throw error;
    }
  };

  /**
   * 从云端下载数据
   */
  const downloadFromCloud = async (mergeMode: "replace" | "merge" = "merge") => {
    setSyncStatus("syncing");
    setSyncMessage("正在从云端下载数据...");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("未登录，请先登录");
      }

      console.log("📥 开始从云端下载数据...");

      // 并行获取产品和配置数据
      const [productsRes, configRes] = await Promise.all([
        fetch("/api/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/config", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!productsRes.ok) {
        throw new Error("获取产品数据失败");
      }

      const productsData = await productsRes.json();
      let cloudProducts: Product[] = productsData.products || [];
      let cloudConfigs: any = {};

      if (configRes.ok) {
        const configData = await configRes.json();
        cloudConfigs = configData.config || {};
      }

      console.log("✅ 下载成功:", {
        productsCount: cloudProducts.length,
        hasConfig: Object.keys(cloudConfigs).length > 0,
      });

      if (mergeMode === "replace") {
        // 完全替换模式：直接使用云端数据
        console.log("🔄 使用云端数据完全替换本地数据");

        setProducts(cloudProducts);
        setCloudDataExists(cloudProducts.length > 0);

        // 更新配置
        if (cloudConfigs.goldPrice) {
          setGoldPrice(cloudConfigs.goldPrice);
          localStorage.setItem("goldPrice", cloudConfigs.goldPrice);
        }

        if (cloudConfigs.goldPriceTimestamp) {
          setGoldPriceTimestamp(cloudConfigs.goldPriceTimestamp);
          localStorage.setItem("goldPriceTimestamp", cloudConfigs.goldPriceTimestamp);
        }

        if (cloudConfigs.priceCoefficients) {
          setCoefficients(cloudConfigs.priceCoefficients);
          localStorage.setItem("priceCoefficients", JSON.stringify(cloudConfigs.priceCoefficients));
        }

        // 保存到 localStorage
        localStorage.setItem("goldProducts", JSON.stringify(cloudProducts));

        setSyncMessage(`下载成功！已加载 ${cloudProducts.length} 个产品数据（替换模式）`);
      } else {
        // 合并模式：合并云端和本地数据
        console.log("🔄 合并云端数据和本地数据");

        // 创建产品 ID 映射
        const localProductMap = new Map(products.map(p => [p.id, p]));
        const cloudProductMap = new Map(cloudProducts.map((p: Product) => [p.id, p]));

        // 合并策略：云端数据优先
        const mergedProducts = new Map([...localProductMap, ...cloudProductMap]);
        const mergedProductsArray = Array.from(mergedProducts.values());

        setProducts(mergedProductsArray);
        setCloudDataExists(cloudProducts.length > 0);

        // 保存到 localStorage
        localStorage.setItem("goldProducts", JSON.stringify(mergedProductsArray));

        setSyncMessage(`下载成功！合并后共有 ${mergedProductsArray.length} 个产品（合并模式）`);
      }

      setLastSyncTime(new Date().toLocaleString("zh-CN"));
      setSyncStatus("success");

      // 3秒后清除成功状态
      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);

      return cloudProducts;
    } catch (error: any) {
      console.error("❌ 下载失败:", error);
      setSyncStatus("error");
      setSyncMessage(`下载失败: ${error.message || "未知错误"}`);

      // 5秒后清除错误状态
      setTimeout(() => {
        setSyncStatus("idle");
      }, 5000);

      throw error;
    }
  };

  /**
   * 检查云端是否有数据
   */
  const checkCloudData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return false;
      }

      const response = await fetch("/api/products?limit=1", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const hasData = data.products && data.products.length > 0;
      setCloudDataExists(hasData);
      return hasData;
    } catch (error) {
      console.error("检查云端数据失败:", error);
      return false;
    }
  };

  /**
   * 自动同步（数据变更时调用）
   */
  const autoSync = async () => {
    if (!autoSyncEnabled || syncStatus === "syncing") {
      return;
    }

    try {
      await uploadToCloud();
    } catch (error) {
      console.error("自动同步失败:", error);
      // 静默失败，不提示用户
    }
  };

  // ========== 数据同步函数结束 ==========

  // 保存数据到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 只有当 products 有数据时才保存，避免覆盖已有的数据
    if (products.length > 0) {
      localStorage.setItem("goldProducts", JSON.stringify(products));
      console.log("已保存产品数据到 localStorage，数量:", products.length);
      // 触发自动同步
      triggerAutoSync();
    }
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 只有当 priceHistory 有数据时才保存
    if (priceHistory.length > 0) {
      localStorage.setItem("goldPriceHistory", JSON.stringify(priceHistory));
      console.log("已保存历史记录到 localStorage，数量:", priceHistory.length);
      // 触发自动同步
      triggerAutoSync();
    }
  }, [priceHistory]);

  // 保存金价到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("goldPrice", goldPrice.toString());
    setGoldPriceTimestamp(new Date().toLocaleString("zh-CN"));
    localStorage.setItem("goldPriceTimestamp", new Date().toLocaleString("zh-CN"));
    // 触发自动同步
    triggerAutoSync();
  }, [goldPrice]);

  // 保存系数到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("priceCoefficients", JSON.stringify(coefficients));
    // 触发自动同步
    triggerAutoSync();
  }, [coefficients]);

  // 计算价格函数
  const calculatePrice = (
    marketGoldPrice: number,
    weight: number,
    laborCost: number,
    karat: "10K" | "14K" | "18K",
    isRetail: boolean,
    accessoryCost: number = 0,
    stoneCost: number = 0,
    platingCost: number = 0,
    moldCost: number = 0,
    commission: number = 0,
    // 特殊系数（可选，如果提供则优先使用）
    specialMaterialLoss?: number,
    specialMaterialCost?: number,
    specialProfitMargin?: number,
    specialLaborFactorRetail?: number,
    specialLaborFactorWholesale?: number
  ): number => {
    let goldFactor: number;
    if (karat === "10K") {
      goldFactor = coefficients.goldFactor10K;
    } else if (karat === "14K") {
      goldFactor = coefficients.goldFactor14K;
    } else {
      goldFactor = coefficients.goldFactor18K;
    }

    // 确定使用的工费系数：优先使用特殊系数，否则使用全局固定系数
    let laborFactor: number;
    if (isRetail) {
      laborFactor = specialLaborFactorRetail !== undefined ? specialLaborFactorRetail : coefficients.laborFactorRetail;
    } else {
      laborFactor = specialLaborFactorWholesale !== undefined ? specialLaborFactorWholesale : coefficients.laborFactorWholesale;
    }

    // 确定使用的其他系数：优先使用特殊系数，否则使用全局固定系数
    const materialLoss = specialMaterialLoss !== undefined ? specialMaterialLoss : coefficients.materialLoss;
    const materialCost = specialMaterialCost !== undefined ? specialMaterialCost : coefficients.materialCost;
    const profitMargin = specialProfitMargin !== undefined ? specialProfitMargin : coefficients.profitMargin;

    // 材料价 = 市场金价 x 金含量 x 重量 x 材料损耗 x 材料浮动系数 / 汇率
    const materialPrice =
      marketGoldPrice * goldFactor * weight * materialLoss * materialCost / coefficients.exchangeRate;

    // 工费 = 人工成本 x 系数 / 汇率
    const laborPrice = laborCost * laborFactor / coefficients.exchangeRate;

    // 其它成本 = (配件 + 石头 + 电镀) x 工费系数 / 汇率
    const otherCosts = (accessoryCost + stoneCost + platingCost) * laborFactor / coefficients.exchangeRate;

    // 总价 = (材料价 + 工费 + 其它成本) x (1 + 佣金率/100) x 国际运输和关税系数
    const basePrice = materialPrice + laborPrice + otherCosts;
    const totalPrice = basePrice * (1 + commission / 100) * profitMargin;

    return Math.round(totalPrice * 100) / 100; // 保留两位小数
  };

  // 从货号中提取基础货号（去掉副号）
  const extractBaseCode = (productCode: string): string => {
    // 匹配 DU\d+ 或 [A-Z]$ 格式的副号，去掉这部分
    return productCode.replace(/DU\d+$|[A-Z]$/, '');
  };

  // 副号生成函数
  const generateSubCode = (
    baseCode: string,
    existingProducts: Product[],
    modificationType: 'coefficient' | 'specification'
  ): string => {
    if (modificationType === 'coefficient') {
      // DU系列：基于基础货号生成，查找最大的DU编号
      const sameCodeProducts = existingProducts.filter(p =>
        p.productCode === baseCode || p.productCode.startsWith(baseCode)
      );

      const duProducts = sameCodeProducts.filter(p =>
        /DU\d+$/.test(p.productCode.slice(baseCode.length))
      );

      let nextDuNumber = 1;
      if (duProducts.length > 0) {
        const duNumbers = duProducts.map(p => {
          const match = p.productCode.match(/DU(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        });
        nextDuNumber = Math.max(...duNumbers) + 1;
      }

      return `${baseCode}DU${nextDuNumber}`;
    } else {
      // 字母系列：基于当前货号生成，查找当前货号的最大字母
      // 查找所有以 baseCode 开头，且以 -[A-Z] 结尾的产品
      const sameCodeProducts = existingProducts.filter(p =>
        p.productCode.startsWith(baseCode)
      );

      // 查找当前货号的所有字母副号
      const letterProducts = sameCodeProducts.filter(p => {
        const suffix = p.productCode.slice(baseCode.length);
        // 匹配以 [A-Z] 结尾的情况
        return /^[A-Z]$/.test(suffix);
      });

      let nextLetter = 'A';
      if (letterProducts.length > 0) {
        const letters = letterProducts.map(p => {
          const match = p.productCode.match(/([A-Z])$/);
          return match ? match[1].charCodeAt(0) : 64; // 64 = '@'
        });
        const maxCharCode = Math.max(...letters);
        nextLetter = String.fromCharCode(maxCharCode + 1);
      }

      return `${baseCode}${nextLetter}`;
    }
  };

    // 检测产品修改类型
  const detectModificationType = (
    oldProduct: Product,
    newProduct: Partial<Product>
  ): 'coefficient' | 'specification' | 'none' | 'clear-coefficients' => {
    // 旧产品的特殊系数集合
    const oldSpecialCoefficients = {
      specialMaterialLoss: oldProduct.specialMaterialLoss,
      specialMaterialCost: oldProduct.specialMaterialCost,
      specialProfitMargin: oldProduct.specialProfitMargin,
      specialLaborFactorRetail: oldProduct.specialLaborFactorRetail,
      specialLaborFactorWholesale: oldProduct.specialLaborFactorWholesale,
    };

    // 新产品的特殊系数集合（未提供则保持原值）
    const newSpecialCoefficients = {
      specialMaterialLoss: newProduct.specialMaterialLoss !== undefined ? newProduct.specialMaterialLoss : oldProduct.specialMaterialLoss,
      specialMaterialCost: newProduct.specialMaterialCost !== undefined ? newProduct.specialMaterialCost : oldProduct.specialMaterialCost,
      specialProfitMargin: newProduct.specialProfitMargin !== undefined ? newProduct.specialProfitMargin : oldProduct.specialProfitMargin,
      specialLaborFactorRetail: newProduct.specialLaborFactorRetail !== undefined ? newProduct.specialLaborFactorRetail : oldProduct.specialLaborFactorRetail,
      specialLaborFactorWholesale: newProduct.specialLaborFactorWholesale !== undefined ? newProduct.specialLaborFactorWholesale : oldProduct.specialLaborFactorWholesale,
    };

    // 检查旧产品是否有任何特殊系数
    const hasOldSpecialCoefficients = Object.values(oldSpecialCoefficients).some(v => v !== undefined);
    // 检查新产品是否有任何特殊系数
    const hasNewSpecialCoefficients = Object.values(newSpecialCoefficients).some(v => v !== undefined);

    // 检查特殊系数是否发生变化
    const coefficientsChanged =
      JSON.stringify(oldSpecialCoefficients) !== JSON.stringify(newSpecialCoefficients);

    // 检查成本是否被修改（工费、配件、石头、电镀、模具、佣金、重量）
    const costChanged =
      (newProduct.laborCost !== undefined && newProduct.laborCost !== oldProduct.laborCost) ||
      (newProduct.accessoryCost !== undefined && newProduct.accessoryCost !== oldProduct.accessoryCost) ||
      (newProduct.stoneCost !== undefined && newProduct.stoneCost !== oldProduct.stoneCost) ||
      (newProduct.platingCost !== undefined && newProduct.platingCost !== oldProduct.platingCost) ||
      (newProduct.moldCost !== undefined && newProduct.moldCost !== oldProduct.moldCost) ||
      (newProduct.commission !== undefined && newProduct.commission !== oldProduct.commission) ||
      (newProduct.weight !== undefined && newProduct.weight !== oldProduct.weight);

    // 检查规格是否被修改
    const specificationChanged =
      newProduct.specification !== undefined &&
      newProduct.specification !== oldProduct.specification;

    // 判断修改类型
    if (specificationChanged) {
      return 'specification';
    } else if (!coefficientsChanged && !costChanged) {
      // 没有任何修改：只是查看产品，不生成副号
      return 'none';
    } else if (!hasOldSpecialCoefficients && !coefficientsChanged && costChanged) {
      // 固定系数模式下：修改成本 → 不生成副号
      return 'none';
    } else if (!hasOldSpecialCoefficients && coefficientsChanged && hasNewSpecialCoefficients) {
      // 固定系数模式下：首次设置特殊系数 → 生成 DU1
      return 'coefficient';
    } else if (hasOldSpecialCoefficients && !hasNewSpecialCoefficients && coefficientsChanged) {
      // 特殊系数模式下：清空所有特殊系数 → 回到基础货号
      return 'clear-coefficients';
    } else if (hasOldSpecialCoefficients) {
      // 特殊系数模式下：修改特殊系数或修改成本 → 生成新副号
      return 'coefficient';
    } else {
      // 固定系数模式下：其他情况 → 不生成副号
      return 'none';
    }
  };

  // 添加/更新产品（覆盖模式：每个货号只保留最新一条记录）
  const addProduct = () => {
    if (!currentProduct.productCode || !currentProduct.productName) {
      alert("请填写产品货号和名称");
      return;
    }

    const wholesalePrice = calculatePrice(
      goldPrice,
      currentProduct.weight || 0,
      currentProduct.laborCost || 0,
      currentProduct.karat || "14K",
      false,
      currentProduct.accessoryCost || 0,
      currentProduct.stoneCost || 0,
      currentProduct.platingCost || 0,
      currentProduct.moldCost || 0,
      currentProduct.commission || 0,
      currentProduct.specialMaterialLoss,
      currentProduct.specialMaterialCost,
      currentProduct.specialProfitMargin
    );

    const retailPrice = calculatePrice(
      goldPrice,
      currentProduct.weight || 0,
      currentProduct.laborCost || 0,
      currentProduct.karat || "14K",
      true,
      currentProduct.accessoryCost || 0,
      currentProduct.stoneCost || 0,
      currentProduct.platingCost || 0,
      currentProduct.moldCost || 0,
      currentProduct.commission || 0,
      currentProduct.specialMaterialLoss,
      currentProduct.specialMaterialCost,
      currentProduct.specialProfitMargin
    );

    // 判断是否为更新操作
    const existingRecords = products.filter((p) => p.productCode === currentProduct.productCode);
    const isUpdate = existingRecords.length > 0;

    // 检测修改类型和生成副号
    let finalProductCode = currentProduct.productCode!;
    let modificationType: 'coefficient' | 'specification' | 'none' | 'clear-coefficients' = 'none';

    if (isUpdate) {
      const latestProduct = existingRecords[existingRecords.length - 1];
      modificationType = detectModificationType(latestProduct, currentProduct);

      // 根据修改类型生成副号
      if (modificationType === 'coefficient') {
        // 修改特殊系数：基于基础货号生成 DU 副号
        const baseCode = extractBaseCode(currentProduct.productCode!);
        finalProductCode = generateSubCode(
          baseCode,
          products,
          modificationType
        );
      } else if (modificationType === 'specification') {
        // 修改规格：基于当前货号生成字母副号（不提取基础货号）
        finalProductCode = generateSubCode(
          currentProduct.productCode!,
          products,
          modificationType
        );
      } else if (modificationType === 'clear-coefficients') {
        // 清空特殊系数：回到基础货号
        const baseCode = extractBaseCode(currentProduct.productCode!);
        finalProductCode = baseCode;
      }
      // modificationType === 'none'：不生成副号，直接覆盖
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      category: currentCategory,
      subCategory: currentSubCategory, // 使用当前选中的子分类
      productCode: finalProductCode, // 使用可能包含副号的货号
      productName: currentProduct.productName!,
      specification: currentProduct.specification || "",
      weight: currentProduct.weight || 0,
      laborCost: currentProduct.laborCost || 0,
      karat: currentProduct.karat || "14K",
      goldColor: currentProduct.goldColor || "黄金",
      wholesalePrice,
      retailPrice,
      goldPrice,
      accessoryCost: currentProduct.accessoryCost || 0,
      stoneCost: currentProduct.stoneCost || 0,
      platingCost: currentProduct.platingCost || 0,
      moldCost: currentProduct.moldCost || 0,
      commission: currentProduct.commission || 0,
      supplierCode: currentProduct.supplierCode || "K14",
      orderChannel: currentProduct.orderChannel || "Van",
      shape: currentProduct.shape || "",
      // 特殊系数（可选）
      specialMaterialLoss: currentProduct.specialMaterialLoss,
      specialMaterialCost: currentProduct.specialMaterialCost,
      specialProfitMargin: currentProduct.specialProfitMargin,
      // 成本时间戳
      laborCostDate: new Date().toLocaleString("zh-CN"),
      accessoryCostDate: new Date().toLocaleString("zh-CN"),
      stoneCostDate: new Date().toLocaleString("zh-CN"),
      platingCostDate: new Date().toLocaleString("zh-CN"),
      moldCostDate: new Date().toLocaleString("zh-CN"),
      commissionDate: new Date().toLocaleString("zh-CN"),
      timestamp: new Date().toLocaleString("zh-CN"),
    };

    // 处理产品记录的更新逻辑
    let finalProducts: Product[];
    if (modificationType === 'coefficient' || modificationType === 'specification') {
      // 生成了副号：保留所有记录，添加新的副号记录
      finalProducts = [...products, newProduct];
    } else if (modificationType === 'clear-coefficients') {
      // 清空特殊系数回到基础货号：更新基础货号记录，保留所有副号记录
      const baseCode = extractBaseCode(currentProduct.productCode!);
      finalProducts = products.map(p => {
        if (p.productCode === baseCode) {
          return newProduct; // 替换基础货号记录
        }
        return p; // 保留所有副号记录
      });
    } else {
      // 没有生成副号（modificationType === 'none'）：删除当前货号的所有旧记录，只保留新的
      finalProducts = products.filter((p) => p.productCode !== currentProduct.productCode);
      finalProducts.push(newProduct);
    }
    setProducts(finalProducts);

    // 添加到历史记录（保留所有历史）
    const historyRecord: PriceHistory = {
      id: Date.now().toString() + "_hist",
      productId: newProduct.id,
      category: currentCategory,
      subCategory: currentSubCategory,
      productCode: finalProductCode, // 使用可能包含副号的货号
      productName: newProduct.productName,
      specification: newProduct.specification,
      weight: newProduct.weight,
      laborCost: currentProduct.laborCost || 0,
      karat: newProduct.karat,
      goldColor: newProduct.goldColor,
      goldPrice,
      wholesalePrice,
      retailPrice,
      accessoryCost: currentProduct.accessoryCost || 0,
      stoneCost: currentProduct.stoneCost || 0,
      platingCost: currentProduct.platingCost || 0,
      moldCost: currentProduct.moldCost || 0,
      commission: currentProduct.commission || 0,
      supplierCode: currentProduct.supplierCode || "K14",
      orderChannel: currentProduct.orderChannel || "Van",
      shape: currentProduct.shape || "",
      // 成本时间戳
      laborCostDate: new Date().toLocaleString("zh-CN"),
      accessoryCostDate: new Date().toLocaleString("zh-CN"),
      stoneCostDate: new Date().toLocaleString("zh-CN"),
      platingCostDate: new Date().toLocaleString("zh-CN"),
      moldCostDate: new Date().toLocaleString("zh-CN"),
      commissionDate: new Date().toLocaleString("zh-CN"),
      timestamp: new Date().toLocaleString("zh-CN"),
    };
    setPriceHistory([...priceHistory, historyRecord]);

    // 重置当前产品表单
    setCurrentProduct({
      category: currentCategory,
      productCode: "",
      productName: "",
      specification: "",
      weight: 0,
      laborCost: 0,
      karat: "14K",
      goldColor: "黄金",
    });

    // 提示用户
    if (modificationType === 'coefficient') {
      alert(`系数已修改，生成副号：${finalProductCode}`);
    } else if (modificationType === 'specification') {
      alert(`规格已修改，生成副号：${finalProductCode}`);
    } else if (modificationType === 'clear-coefficients') {
      alert(`已清空特殊系数，回到原货号：${finalProductCode}（保留所有副号记录）`);
    } else if (isUpdate) {
      alert(`产品 ${finalProductCode} 更新成功！`);
    } else {
      alert("新产品添加成功！");
    }
  };

  // 更新选中产品的价格（覆盖模式：每个货号只保留最新一条记录）
  const updatePrices = () => {
    if (selectedProducts.size === 0) {
      alert("请先选择要更新的产品！");
      return;
    }

    const updatedProducts: Product[] = [];
    selectedProducts.forEach((productId) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const newWholesalePrice = calculatePrice(
        goldPrice,
        product.weight,
        product.laborCost,
        product.karat,
        false,
        product.accessoryCost || 0,
        product.stoneCost || 0,
        product.platingCost || 0,
        product.moldCost || 0,
        product.commission || 0,
        product.specialMaterialLoss,
        product.specialMaterialCost,
        product.specialProfitMargin
      );

      const newRetailPrice = calculatePrice(
        goldPrice,
        product.weight,
        product.laborCost,
        product.karat,
        true,
        product.accessoryCost || 0,
        product.stoneCost || 0,
        product.platingCost || 0,
        product.moldCost || 0,
        product.commission || 0,
        product.specialMaterialLoss,
        product.specialMaterialCost,
        product.specialProfitMargin
      );

      // 创建新的产品记录
      const newProduct: Product = {
        id: Date.now().toString() + "_" + productId,
        category: product.category,
        subCategory: product.subCategory || "",
        productCode: product.productCode,
        productName: product.productName,
        specification: product.specification,
        weight: product.weight,
        laborCost: product.laborCost,
        karat: product.karat,
        goldColor: product.goldColor,
        goldPrice,
        wholesalePrice: newWholesalePrice,
        retailPrice: newRetailPrice,
        accessoryCost: product.accessoryCost || 0,
        stoneCost: product.stoneCost || 0,
        platingCost: product.platingCost || 0,
        moldCost: product.moldCost || 0,
        commission: product.commission || 0,
        supplierCode: product.supplierCode || "",
        orderChannel: product.orderChannel || "",
        shape: product.shape || "",
        // 特殊系数（继承旧记录）
        specialMaterialLoss: product.specialMaterialLoss,
        specialMaterialCost: product.specialMaterialCost,
        specialProfitMargin: product.specialProfitMargin,
        // 成本时间戳（从旧记录继承或使用当前时间）
        laborCostDate: product.laborCostDate || new Date().toLocaleString("zh-CN"),
        accessoryCostDate: product.accessoryCostDate || new Date().toLocaleString("zh-CN"),
        stoneCostDate: product.stoneCostDate || new Date().toLocaleString("zh-CN"),
        platingCostDate: product.platingCostDate || new Date().toLocaleString("zh-CN"),
        moldCostDate: product.moldCostDate || new Date().toLocaleString("zh-CN"),
        commissionDate: product.commissionDate || new Date().toLocaleString("zh-CN"),
        timestamp: new Date().toLocaleString("zh-CN"),
      };

      // 添加到历史记录
      const historyRecord: PriceHistory = {
        id: newProduct.id + "_hist",
        productId: newProduct.id,
        category: product.category,
        subCategory: product.subCategory || "",
        productCode: newProduct.productCode,
        productName: newProduct.productName,
        specification: newProduct.specification,
        weight: newProduct.weight,
        laborCost: newProduct.laborCost,
        karat: newProduct.karat,
        goldColor: newProduct.goldColor,
        goldPrice,
        wholesalePrice: newWholesalePrice,
        retailPrice: newRetailPrice,
        accessoryCost: product.accessoryCost || 0,
        stoneCost: product.stoneCost || 0,
        platingCost: product.platingCost || 0,
        moldCost: product.moldCost || 0,
        commission: product.commission || 0,
        supplierCode: product.supplierCode || "",
        orderChannel: product.orderChannel || "",
        shape: product.shape || "",
        // 成本时间戳（从旧记录继承）
        laborCostDate: product.laborCostDate || new Date().toLocaleString("zh-CN"),
        accessoryCostDate: product.accessoryCostDate || new Date().toLocaleString("zh-CN"),
        stoneCostDate: product.stoneCostDate || new Date().toLocaleString("zh-CN"),
        platingCostDate: product.platingCostDate || new Date().toLocaleString("zh-CN"),
        moldCostDate: product.moldCostDate || new Date().toLocaleString("zh-CN"),
        commissionDate: product.commissionDate || new Date().toLocaleString("zh-CN"),
        timestamp: new Date().toLocaleString("zh-CN"),
      };
      setPriceHistory((prev) => [...prev, historyRecord]);

      updatedProducts.push(newProduct);
    });

    // 删除旧记录，只保留更新后的记录
    const productCodesToUpdate = new Set(
      updatedProducts.map((p) => p.productCode)
    );
    const otherProducts = products.filter(
      (p) => !productCodesToUpdate.has(p.productCode)
    );
    setProducts([...otherProducts, ...updatedProducts]);

    // 清空选择
    setSelectedProducts(new Set());
    alert(`已更新 ${updatedProducts.length} 个产品的价格！`);
  };

  // 批量更新供应商代码
  const batchUpdateSupplierCode = () => {
    let updatedCount = 0;
    const updatedProducts: Product[] = [...products];

    console.log("========== 批量更新供应商代码 ==========");
    console.log("当前分类:", currentCategory);
    console.log("更新规则:", batchUpdateRules);

    // 遍历每个产品，查找第一个匹配的规则
    updatedProducts.forEach((product) => {
      // 只更新当前分类的产品
      if (product.category !== currentCategory) return;

      // 遍历规则，找到第一个匹配的
      for (const rule of batchUpdateRules) {
        if (!rule.productCodes || !rule.supplierCode) continue;

        // 解析货号列表（逗号分隔）
        const codes = rule.productCodes.split(',').map(c => c.trim());

        // 检查产品货号是否在列表中
        if (codes.includes(product.productCode)) {
          const oldCode = product.supplierCode;
          product.supplierCode = rule.supplierCode;
          console.log(`✓ ${product.productCode}: ${oldCode} → ${rule.supplierCode}`);
          updatedCount++;
          break; // 找到匹配的规则后，跳出循环，不再检查其他规则
        }
      }
    });

    console.log(`总计更新 ${updatedCount} 个产品`);
    console.log("=========================================");

    // 更新产品列表
    setProducts(updatedProducts);

    alert(`已批量更新 ${updatedCount} 个产品的供应商代码！`);
    setShowBatchUpdateModal(false);
  };

  // 批量修改下单口
  const batchUpdateOrderChannel = () => {
    let updatedCount = 0;
    const updatedProducts: Product[] = [...products];

    console.log("========== 批量修改下单口 ==========");
    console.log("当前分类:", currentCategory);
    console.log("更新规则:", batchUpdateChannelRules);

    // 遍历每个产品，查找第一个匹配的规则
    updatedProducts.forEach((product) => {
      // 只更新当前分类的产品
      if (product.category !== currentCategory) return;

      // 遍历规则，找到第一个匹配的
      for (const rule of batchUpdateChannelRules) {
        if (!rule.productCodes || !rule.orderChannel) continue;

        // 解析货号列表（逗号分隔）
        const codes = rule.productCodes.split(',').map(c => c.trim());

        // 检查产品货号是否在列表中
        if (codes.includes(product.productCode)) {
          const oldChannel = product.orderChannel;
          product.orderChannel = rule.orderChannel;
          console.log(`✓ ${product.productCode}: ${oldChannel} → ${rule.orderChannel}`);
          updatedCount++;
          break; // 找到匹配的规则后，跳出循环，不再检查其他规则
        }
      }
    });

    console.log(`总计更新 ${updatedCount} 个产品`);
    console.log("=========================================");

    // 更新产品列表
    setProducts(updatedProducts);
    alert(`已批量更新 ${updatedCount} 个产品的下单口！`);
    setShowBatchUpdateChannelModal(false);
  };

  // 批量修改价格系数
  const handleBatchModify = () => {
    const { scope, fields, filters, newValues } = batchModifyConfig;

    // 检查是否至少选择了一个字段
    const selectedFields = Object.entries(fields).filter(([_, selected]) => selected);
    if (selectedFields.length === 0) {
      alert("请至少选择一个要修改的字段！");
      return;
    }

    // 过滤产品
    let filteredProducts = [...products];

    // 应用范围筛选
    if (scope === "current") {
      filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
    }

    // 应用筛选条件
    if (filters.productName) {
      filteredProducts = filteredProducts.filter(p =>
        p.productName.toLowerCase().includes(filters.productName.toLowerCase())
      );
    }
    if (filters.productCode) {
      filteredProducts = filteredProducts.filter(p =>
        p.productCode.toLowerCase().includes(filters.productCode.toLowerCase())
      );
    }
    if (filters.supplierCode) {
      filteredProducts = filteredProducts.filter(p =>
        p.supplierCode.toLowerCase().includes(filters.supplierCode.toLowerCase())
      );
    }
    if (filters.shape) {
      filteredProducts = filteredProducts.filter(p => p.shape === filters.shape);
    }
    if (filters.karat) {
      filteredProducts = filteredProducts.filter(p => p.karat === filters.karat);
    }

    if (filteredProducts.length === 0) {
      alert("没有找到符合条件的产品！");
      return;
    }

    if (!confirm(`找到 ${filteredProducts.length} 个符合条件的产品，确定要修改吗？`)) {
      return;
    }

    console.log("========== 批量修改价格系数 ==========");
    console.log("修改范围:", scope === "current" ? "当前分类" : "全部分类");
    console.log("要修改的字段:", selectedFields.map(([name]) => name).join(", "));
    console.log("筛选条件:", filters);
    console.log("找到产品数量:", filteredProducts.length);

    // 更新产品
    const updatedProducts: Product[] = [];
    const updatedHistory: PriceHistory[] = [];

    filteredProducts.forEach((product) => {
      // 创建更新后的产品
      const updatedProduct: Product = {
        ...product,
        id: Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9),
      };

      // 更新字段
      if (fields.laborCost) {
        updatedProduct.laborCost = newValues.laborCost;
        updatedProduct.laborCostDate = new Date().toLocaleString("zh-CN");
      }
      if (fields.accessoryCost) {
        updatedProduct.accessoryCost = newValues.accessoryCost;
        updatedProduct.accessoryCostDate = new Date().toLocaleString("zh-CN");
      }
      if (fields.stoneCost) {
        updatedProduct.stoneCost = newValues.stoneCost;
        updatedProduct.stoneCostDate = new Date().toLocaleString("zh-CN");
      }
      if (fields.platingCost) {
        updatedProduct.platingCost = newValues.platingCost;
        updatedProduct.platingCostDate = new Date().toLocaleString("zh-CN");
      }
      if (fields.moldCost) {
        updatedProduct.moldCost = newValues.moldCost;
        updatedProduct.moldCostDate = new Date().toLocaleString("zh-CN");
      }
      if (fields.commission) {
        updatedProduct.commission = newValues.commission;
        updatedProduct.commissionDate = new Date().toLocaleString("zh-CN");
      }
      if (fields.weight) {
        updatedProduct.weight = newValues.weight;
      }
      if (fields.goldPrice) {
        updatedProduct.goldPrice = newValues.goldPrice;
      }

      // 重新计算价格
      updatedProduct.wholesalePrice = calculatePrice(
        updatedProduct.goldPrice,
        updatedProduct.weight,
        updatedProduct.laborCost,
        updatedProduct.karat,
        false,
        updatedProduct.accessoryCost,
        updatedProduct.stoneCost,
        updatedProduct.platingCost,
        updatedProduct.moldCost,
        updatedProduct.commission,
        updatedProduct.specialMaterialLoss,
        updatedProduct.specialMaterialCost,
        updatedProduct.specialProfitMargin
      );

      updatedProduct.retailPrice = calculatePrice(
        updatedProduct.goldPrice,
        updatedProduct.weight,
        updatedProduct.laborCost,
        updatedProduct.karat,
        true,
        updatedProduct.accessoryCost,
        updatedProduct.stoneCost,
        updatedProduct.platingCost,
        updatedProduct.moldCost,
        updatedProduct.commission,
        updatedProduct.specialMaterialLoss,
        updatedProduct.specialMaterialCost,
        updatedProduct.specialProfitMargin
      );

      updatedProduct.timestamp = new Date().toLocaleString("zh-CN");

      // 创建历史记录
      const historyRecord: PriceHistory = {
        id: updatedProduct.id + "_hist",
        productId: updatedProduct.id,
        category: updatedProduct.category,
        subCategory: updatedProduct.subCategory,
        productCode: updatedProduct.productCode,
        productName: updatedProduct.productName,
        specification: updatedProduct.specification,
        weight: updatedProduct.weight,
        laborCost: updatedProduct.laborCost,
        karat: updatedProduct.karat,
        goldColor: updatedProduct.goldColor,
        goldPrice: updatedProduct.goldPrice,
        wholesalePrice: updatedProduct.wholesalePrice,
        retailPrice: updatedProduct.retailPrice,
        accessoryCost: updatedProduct.accessoryCost,
        stoneCost: updatedProduct.stoneCost,
        platingCost: updatedProduct.platingCost,
        moldCost: updatedProduct.moldCost,
        commission: updatedProduct.commission,
        supplierCode: updatedProduct.supplierCode,
        orderChannel: updatedProduct.orderChannel,
        shape: updatedProduct.shape,
        // 特殊系数
        specialMaterialLoss: updatedProduct.specialMaterialLoss,
        specialMaterialCost: updatedProduct.specialMaterialCost,
        specialProfitMargin: updatedProduct.specialProfitMargin,
        laborCostDate: updatedProduct.laborCostDate,
        accessoryCostDate: updatedProduct.accessoryCostDate,
        stoneCostDate: updatedProduct.stoneCostDate,
        platingCostDate: updatedProduct.platingCostDate,
        moldCostDate: updatedProduct.moldCostDate,
        commissionDate: updatedProduct.commissionDate,
        timestamp: updatedProduct.timestamp,
      };

      updatedProducts.push(updatedProduct);
      updatedHistory.push(historyRecord);

      console.log(`✓ ${updatedProduct.productCode}: 已更新`);
    });

    // 删除旧记录，只保留更新后的记录
    const productCodesToUpdate = new Set(updatedProducts.map(p => p.productCode));
    const otherProducts = products.filter(p => !productCodesToUpdate.has(p.productCode));
    setProducts([...otherProducts, ...updatedProducts]);
    setPriceHistory([...priceHistory, ...updatedHistory]);

    console.log(`总计更新 ${updatedProducts.length} 个产品`);
    console.log("=========================================");

    alert(`已批量修改 ${updatedProducts.length} 个产品的价格系数！`);
    setShowBatchModifyModal(false);
  };

  // 导出 Excel（xlsx 格式）- 导出当前产品的最新数据，支持冻结表头和颜色标记
  const exportToExcel = () => {
    // 根据选择的范围过滤产品
    const filteredProducts = exportScope === "current"
      ? products.filter(p => p.category === currentCategory)
      : products;

    // 按货号分组，每个货号只保留最新的记录
    const productMap: { [key: string]: Product } = {};
    filteredProducts.forEach((product) => {
      const code = product.productCode;
      // 如果该货号还没有记录，或者当前记录更新，则保存当前记录
      if (!productMap[code] || new Date(product.timestamp) > new Date(productMap[code].timestamp)) {
        productMap[code] = product;
      }
    });

    // 转换为数组并按货号排序
    const productsToExport = Object.values(productMap).sort((a, b) =>
      a.productCode.localeCompare(b.productCode)
    );

    // 判断产品是否被修改过（通过历史记录数量判断）
    const isProductModified = (productId: string): boolean => {
      const historyCount = priceHistory.filter(h => h.productId === productId).length;
      return historyCount > 1;
    };

    // 为每个产品构建一行数据
    const rows: any[] = [];
    productsToExport.forEach((product) => {
      const modified = isProductModified(product.id);

      const row: any = {
        货号: product.productCode,
        分类: product.category,
        名称: product.productName,
        成色: product.karat,
        金子颜色: product.goldColor || "黄金",
        规格: product.specification || "",
        形状: product.shape || "",
        供应商代码: product.supplierCode || "",
        重量: product.weight,
        金价: `¥${product.goldPrice.toFixed(2)}`,
        工费: `¥${product.laborCost.toFixed(2)}`,
        配件: `¥${(product.accessoryCost || 0).toFixed(2)}\n${formatDate(product.accessoryCostDate || product.timestamp)}`,
        石头: `¥${(product.stoneCost || 0).toFixed(2)}\n${formatDate(product.stoneCostDate || product.timestamp)}`,
        电镀: `¥${(product.platingCost || 0).toFixed(2)}\n${formatDate(product.platingCostDate || product.timestamp)}`,
        模具: `¥${(product.moldCost || 0).toFixed(2)}\n${formatDate(product.moldCostDate || product.timestamp)}`,
        佣金: `${(product.commission || 0).toFixed(2)}%\n${formatDate(product.commissionDate || product.timestamp)}`,
        下单口: product.orderChannel ? (ORDER_CHANNELS.find(d => d.code === product.orderChannel)?.code || product.orderChannel) : "",
        // 价格：修改过的用★标记
        零售价: modified ? `★ CAD$${product.retailPrice.toFixed(2)}` : `CAD$${product.retailPrice.toFixed(2)}`,
        批发价: modified ? `★ CAD$${product.wholesalePrice.toFixed(2)}` : `CAD$${product.wholesalePrice.toFixed(2)}`,
        _modified: modified,  // 内部字段，用于标记是否修改过
      };

      rows.push(row);
    });

    // 定义固定的表头顺序
    const allColumns = [
      "货号", "分类", "名称", "成色", "金子颜色", "规格", "形状", "供应商代码",
      "重量", "金价", "工费", "配件", "石头", "电镀", "模具", "佣金", "下单口",
      "零售价", "批发价"
    ];

    // 生成表头和数据数组
    const headerRow = [...allColumns];
    const dataRows = rows.map((row) =>
      allColumns.map((col) => row[col] || "")
    );

    // 智能计算列宽的函数
    const calculateColumnWidth = (columnData: string[], header: string): number => {
      // 统计所有单元格的最大字符数（包括表头）
      const maxLength = Math.max(
        ...columnData.map(cell => String(cell).length),
        header.length
      );

      // 考虑换行情况，取最长的一行
      const getLineLength = (text: string) => {
        const lines = String(text).split('\n');
        return Math.max(...lines.map(line => line.length));
      };

      const maxLineLength = Math.max(
        ...columnData.map(cell => getLineLength(cell)),
        getLineLength(header)
      );

      // 根据列的类型设置不同的最小和最大宽度
      let minWidth = 8;
      let maxWidth = 20;

      // 特殊列的处理
      if (header === "货号") {
        minWidth = 12;
        maxWidth = 18;
      } else if (header === "分类" || header === "金子颜色" || header === "形状" || header === "成色") {
        minWidth = 6;
        maxWidth = 12;
      } else if (header === "名称" || header === "规格") {
        minWidth = 15;
        maxWidth = 30;
      } else if (header === "供应商代码" || header === "下单口") {
        minWidth = 8;
        maxWidth = 12;
      } else if (header === "重量") {
        minWidth = 6;
        maxWidth = 10;
      } else if (header === "零售价" || header === "批发价" || header === "金价") {
        minWidth = 12;
        maxWidth = 16;
      } else if (header === "工费" || header === "配件" || header === "石头" || header === "电镀" || header === "模具" || header === "佣金") {
        // 成本列：价格（约8字符）+ 日期（约8-10字符），两行显示
        minWidth = 8;
        maxWidth = 12;
      }

      // 计算最终宽度：在最小和最大之间，取内容需要的宽度
      // 添加一点余量（1-2个字符），避免太紧
      let width = Math.min(Math.max(maxLineLength + 1, minWidth), maxWidth);

      return width;
    };

    // 创建工作簿和工作表
    const wb = XLSX.utils.book_new();
    const wsData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 智能计算每列的宽度
    const colWidths = allColumns.map((header, colIndex) => {
      const columnData = rows.map(row => row[header] || "");
      return {
        wch: calculateColumnWidth(columnData, header)
      };
    });

    ws['!cols'] = colWidths;

    // 设置表头样式
    for (let col = 0; col < headerRow.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FF000000" } },
          fill: { patternType: "solid", fgColor: { rgb: "FFE0E0E0" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
        };
      }
    }

    // 设置数据行样式（左对齐）
    rows.forEach((row, rowIndex) => {
      for (let col = 0; col < allColumns.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            alignment: { horizontal: "left", vertical: "center", wrapText: true },
          };
        }
      }
    });

    // 设置价格列的颜色和右对齐
    const retailPriceColIndex = allColumns.indexOf("零售价");
    const wholesalePriceColIndex = allColumns.indexOf("批发价");

    rows.forEach((row, rowIndex) => {
      const modified = row._modified;

      // 零售价颜色
      const retailCellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: retailPriceColIndex });
      if (ws[retailCellAddress]) {
        const retailColor = modified ? "FFFF0000" : "FF008000";  // 修改过的红色，否则绿色
        ws[retailCellAddress].s = {
          font: { bold: true, color: { rgb: retailColor } },
          alignment: { horizontal: "right", vertical: "center" },
        };
      }

      // 批发价颜色
      const wholesaleCellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: wholesalePriceColIndex });
      if (ws[wholesaleCellAddress]) {
        const wholesaleColor = modified ? "FFFF0000" : "FF0000FF";  // 修改过的红色，否则蓝色
        ws[wholesaleCellAddress].s = {
          font: { bold: true, color: { rgb: wholesaleColor } },
          alignment: { horizontal: "right", vertical: "center" },
        };
      }
    });

    // 冻结表头（使用 !views 属性）
    ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "产品报价");

    // 导出文件
    const fileName = exportScope === "current"
      ? `${currentCategory}_产品报价单_` + new Date().toLocaleDateString("zh-CN") + ".xlsx"
      : `全部分类_产品报价单_` + new Date().toLocaleDateString("zh-CN") + ".xlsx";

    XLSX.writeFile(wb, fileName);
  };

  // 导出数据备份（包括产品、历史记录、配置）
  const exportDataBackup = async () => {
    // 新功能：支持导出Excel和JSON格式备份
    if (!confirm(`确定要导出${exportBackupFormat === 'excel' ? 'Excel' : 'JSON'}格式备份吗？这将包含所有产品、价格历史和配置数据。`)) {
      return;
    }

    setIsExporting(true);

    try {
      // 调用后端API导出数据
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/export?format=${exportBackupFormat}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = exportBackupFormat === 'excel'
        ? `珠宝报价单备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
        : `珠宝报价单备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('导出成功！');
    } catch (error) {
      console.error('导出备份失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 同步本地数据到数据库
  const syncToDatabase = async () => {
    // 统计本地数据
    const localProducts = localStorage.getItem('goldProducts');
    const localHistory = localStorage.getItem('goldPriceHistory');
    const localGoldPrice = localStorage.getItem('goldPrice');
    const localGoldPriceTimestamp = localStorage.getItem('goldPriceTimestamp');
    const localCoefficients = localStorage.getItem('priceCoefficients');
    const localDataVersion = localStorage.getItem('dataVersion');

    const productCount = localProducts ? JSON.parse(localProducts).length : 0;
    const historyCount = localHistory ? JSON.parse(localHistory).length : 0;
    const hasGoldPrice = !!localGoldPrice;
    const hasCoefficients = !!localCoefficients;
    const hasDataVersion = !!localDataVersion;

    if (productCount === 0 && historyCount === 0 && !hasGoldPrice) {
      alert('本地没有数据，无需同步。');
      return;
    }

    // 显示同步确认
    let confirmMsg = '确定要将本地数据同步到数据库吗？\n\n';
    confirmMsg += '即将同步以下数据：\n';
    confirmMsg += `📦 产品数据: ${productCount} 个\n`;
    confirmMsg += `📈 价格历史: ${historyCount} 条\n`;
    confirmMsg += `💰 金价配置: ${hasGoldPrice ? '✓' : '✗'}\n`;
    confirmMsg += `⚙️  价格系数: ${hasCoefficients ? '✓' : '✗'}\n`;
    confirmMsg += `🔢 数据版本: ${hasDataVersion ? '✓' : '✗'}\n\n`;
    confirmMsg += '同步后，所有数据将保存到数据库，并可以通过"导出备份"功能导出。\n\n';
    confirmMsg += '是否继续？';

    if (!confirm(confirmMsg)) {
      return;
    }

    setIsSyncing(true);

    try {
      // 准备同步数据
      const syncData = {
        products: localProducts ? JSON.parse(localProducts) : [],
        priceHistory: localHistory ? JSON.parse(localHistory) : [],
        configs: {
          goldPrice: localGoldPrice,
          goldPriceTimestamp: localGoldPriceTimestamp,
          priceCoefficients: localCoefficients ? JSON.parse(localCoefficients) : null,
          dataVersion: localDataVersion,
        },
      };

      console.log('📤 开始同步数据:', {
        productsCount: syncData.products.length,
        historyCount: syncData.priceHistory.length,
        hasGoldPrice: !!syncData.configs.goldPrice,
        hasCoefficients: !!syncData.configs.priceCoefficients,
        hasDataVersion: !!syncData.configs.dataVersion,
        dataVersion: syncData.configs.dataVersion,
      });

      // 调用同步 API
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(syncData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('同步失败:', errorText);
        throw new Error('同步失败');
      }

      const result = await response.json();

      console.log('✅ 同步完成:', result);

      // 显示同步结果
      let message = '✅ 数据同步成功！\n\n';
      message += '已同步到数据库：\n\n';
      message += '📦 产品数据：\n';
      message += `  - 新建: ${result.stats.newProducts || 0} 个\n`;
      message += `  - 更新: ${result.stats.updatedProducts || 0} 个\n`;
      message += `  - 总计: ${result.stats.syncedProducts} 个\n\n`;
      message += '📈 价格历史：\n';
      message += `  - 新建: ${result.stats.syncedHistory} 条\n`;
      message += `  - 跳过（已存在）: ${result.stats.skippedHistory || 0} 条\n\n`;
      message += '⚙️  系统配置：\n';
      message += `  - 金价配置: ✓\n`;
      message += `  - 价格系数: ✓\n`;
      message += `  - 数据版本: ${result.stats.dataVersion ? `v${result.stats.dataVersion}` : '-'}\n\n`;
      message += '🎉 现在可以使用"导出备份"功能了！\n\n';
      message += '💡 提示：数据已同步，建议点击"✅ 验证数据"检查数据完整性。';

      alert(message);

      // 同步成功后，自动重新验证数据完整性
      console.log('🔄 同步完成后自动验证数据完整性...');
      setTimeout(async () => {
        try {
          await verifyDataIntegrity();
        } catch (e) {
          console.error('自动验证失败:', e);
        }
      }, 500);
    } catch (error: any) {
      console.error('同步失败:', error);
      alert('同步失败，请重试。\n\n错误信息: ' + (error.message || '未知错误') + '\n\n💡 提示：请检查控制台获取详细的错误日志。');
    } finally {
      setIsSyncing(false);
    }
  };

  // 验证数据完整性
  const verifyDataIntegrity = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // 统计本地数据
      const localProducts = localStorage.getItem('goldProducts');
      const localHistory = localStorage.getItem('goldPriceHistory');
      const localGoldPrice = localStorage.getItem('goldPrice');
      const localCoefficients = localStorage.getItem('priceCoefficients');
      const localDataVersion = localStorage.getItem('dataVersion');

      const products = localProducts ? JSON.parse(localProducts) : [];
      const history = localHistory ? JSON.parse(localHistory) : [];

      const localProductCount = products.length;
      const localHistoryCount = history.length;
      const localProductIds = products.map((p: any) => p.id).filter(Boolean);
      const localHistoryIds = history.map((h: any) => h.id).filter(Boolean);
      const hasGoldPrice = !!localGoldPrice;
      const hasCoefficients = !!localCoefficients;
      const hasDataVersion = !!localDataVersion;

      console.log('🔍 开始验证数据完整性:', {
        localProductCount,
        localHistoryCount,
        localProductIds: localProductIds.length,
        localHistoryIds: localHistoryIds.length,
        hasGoldPrice,
        hasCoefficients,
        hasDataVersion,
      });

      // 调用验证 API
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          localProductCount,
          localHistoryCount,
          localProductIds,
          localHistoryIds,
          hasGoldPrice,
          hasCoefficients,
          hasDataVersion,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('验证失败:', errorText);
        throw new Error('验证失败');
      }

      const result = await response.json();
      setVerificationResult(result);

      console.log('✅ 验证完成:', result);

      // 显示验证结果模态框
      setShowVerificationModal(true);
    } catch (error: any) {
      console.error('验证失败:', error);
      alert('验证失败，请重试。\n\n错误信息: ' + (error.message || '未知错误'));
    } finally {
      setIsVerifying(false);
    }
  };

  // 彻底清除所有数据（数据库+本地）
  const clearAllData = async () => {
    // 二次确认
    const confirmed = confirm(
      '⚠️ 警告：此操作将彻底清除所有数据！\n\n' +
      '这将删除：\n' +
      '  • 数据库中的所有产品数据\n' +
      '  • 数据库中的所有价格历史\n' +
      '  • 数据库中的所有配置\n' +
      '  • 本地localStorage中的所有数据\n\n' +
      '❗ 此操作不可撤销！\n\n' +
      '确定要继续吗？'
    );

    if (!confirmed) {
      return;
    }

    // 三次确认，需要输入 "DELETE"
    const verifyInput = prompt(
      '为了防止误操作，请输入 "DELETE" 以确认清除所有数据：'
    );

    if (verifyInput !== 'DELETE') {
      alert('操作已取消');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');

      // 1. 清除数据库数据
      console.log('🗑️ 开始清除数据库数据...');
      const response = await fetch('/api/clear-all-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('清除数据库数据失败:', errorText);
        throw new Error('清除数据库数据失败');
      }

      const dbResult = await response.json();
      console.log('✅ 数据库数据清除完成:', dbResult);

      // 2. 清除本地数据
      console.log('🗑️ 开始清除本地数据...');
      localStorage.removeItem('goldProducts');
      localStorage.removeItem('goldPriceHistory');
      localStorage.removeItem('goldPrice');
      localStorage.removeItem('goldPriceTimestamp');
      localStorage.removeItem('priceCoefficients');
      localStorage.removeItem('dataVersion');
      localStorage.removeItem('appSettings');
      console.log('✅ 本地数据清除完成');

      // 3. 显示成功消息
      let message = '✅ 所有数据已清除！\n\n';
      message += '数据库数据：\n';
      message += `  - 产品: ${dbResult.deletedCounts.products} 个\n`;
      message += `  - 价格历史: ${dbResult.deletedCounts.history} 条\n`;
      message += `  - 配置: ${dbResult.deletedCounts.configs} 条\n\n`;
      message += '本地数据：\n';
      message += `  - localStorage 已清空\n\n`;
      message += '页面将重新加载...';

      alert(message);

      // 4. 重新加载页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('清除数据失败:', error);
      alert('清除数据失败，请重试。\n\n错误信息: ' + (error.message || '未知错误'));
    }
  };

  // 验证导出数据的准确性
  const validateExportAccuracy = async () => {
    setIsValidatingExport(true);

    try {
      console.log('🔍 开始验证导出数据的准确性...');

      // 调用验证 API
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/validate-export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('验证失败:', errorText);
        throw new Error('验证失败');
      }

      const result = await response.json();

      console.log('✅ 验证完成:', result);

      // 显示验证结果
      let message = result.overallStatus + '\n\n';
      message += `验证时间: ${new Date(result.timestamp).toLocaleString('zh-CN')}\n\n`;
      message += '📊 数据统计：\n';
      message += `  - 产品数据: ${result.dataCounts.products} 条\n`;
      message += `  - 价格历史: ${result.dataCounts.history} 条\n`;
      message += `  - 系统配置: ${result.dataCounts.configs} 条\n\n`;
      message += '📦 产品数据验证：\n';
      message += `  - 总数: ${result.productValidation.total} 条\n`;
      message += `  - 有效: ${result.productValidation.validCount} 条 ✅\n`;
      message += `  - 无效: ${result.productValidation.invalidCount} 条 ${result.productValidation.invalidCount > 0 ? '❌' : '✅'}\n\n`;
      message += '📈 价格历史验证：\n';
      message += `  - 总数: ${result.historyValidation.total} 条\n`;
      message += `  - 有效: ${result.historyValidation.validCount} 条 ✅\n`;
      message += `  - 无效: ${result.historyValidation.invalidCount} 条 ${result.historyValidation.invalidCount > 0 ? '❌' : '✅'}\n\n`;
      message += '⚙️  系统配置验证：\n';
      message += `  - 总数: ${result.configValidation.total} 条\n`;
      message += `  - 有效: ${result.configValidation.validCount} 条 ✅\n`;
      message += `  - 无效: ${result.configValidation.invalidCount} 条 ${result.configValidation.invalidCount > 0 ? '❌' : '✅'}\n\n`;

      // 显示问题详情（最多显示 5 条）
      const showIssues = (issues: any[], title: string) => {
        if (issues.length > 0) {
          message += `${title}（最多显示 5 条）：\n`;
          const displayIssues = issues.slice(0, 5);
          displayIssues.forEach((issue: any) => {
            message += `  • ${issue.productCode || issue.configKey || '未知'}:\n`;
            issue.issues.forEach((err: string) => {
              message += `    - ${err}\n`;
            });
          });
          if (issues.length > 5) {
            message += `  ... 还有 ${issues.length - 5} 条问题\n`;
          }
          message += '\n';
        }
      };

      showIssues(result.productValidation.issues, '📦 产品数据问题');
      showIssues(result.historyValidation.issues, '📈 价格历史问题');
      showIssues(result.configValidation.issues, '⚙️  配置数据问题');

      // 建议
      if (result.productValidation.invalidCount === 0 &&
          result.historyValidation.invalidCount === 0 &&
          result.configValidation.invalidCount === 0) {
        message += '🎉 所有数据验证通过，可以放心导出！';
      } else {
        message += '⚠️  发现数据问题，建议修复后再导出。';
      }

      alert(message);
    } catch (error: any) {
      console.error('验证失败:', error);
      alert('验证失败，请重试。\n\n错误信息: ' + (error.message || '未知错误'));
    } finally {
      setIsValidatingExport(false);
    }
  };

  // 删除产品（同时删除相关的历史记录）
  const deleteProduct = (id: string) => {
    // 从产品列表中删除
    setProducts(products.filter((p) => p.id !== id));

    // 从历史记录中删除该产品的所有记录
    setPriceHistory(priceHistory.filter((h) => h.productId !== id));
  };

  // 批量删除选中的产品
  const deleteSelectedProducts = () => {
    if (selectedProducts.size === 0) {
      alert("请先选择要删除的产品");
      return;
    }

    const count = selectedProducts.size;
    const categoryNames = Array.from(selectedProducts).map(id => {
      const product = products.find(p => p.id === id);
      return product?.category || "";
    });

    // 显示将要删除的产品数量和涉及哪些分类
    const uniqueCategories = [...new Set(categoryNames)].filter(Boolean);
    const categoryText = uniqueCategories.length > 0 ? uniqueCategories.join("、") : "多个分类";

    if (!confirm(`确定要删除选中的 ${count} 个产品吗？\n\n涉及分类：${categoryText}\n\n删除后无法恢复！`)) {
      return;
    }

    // 从产品列表中删除选中的产品
    setProducts(products.filter((p) => !selectedProducts.has(p.id)));

    // 从历史记录中删除相关产品的所有记录
    setPriceHistory(priceHistory.filter((h) => !selectedProducts.has(h.productId)));

    // 清空选择
    setSelectedProducts(new Set());

    alert(`✅ 成功删除 ${count} 个产品及其相关历史记录！`);
  };

  // 导入Excel文件
  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("importExcel 函数被调用");
    const file = e.target.files?.[0];
    console.log("选择的文件:", file);

    if (!file) {
      console.log("没有选择文件");
      return;
    }

    // 🔥 在读取文件之前先检查是否选择了小类，避免不必要的文件读取
    if (!importSubCategory) {
      alert("⚠️ 请先选择要导入的产品小类！\n\n在页面左侧的'导入选项'区域选择产品小类后再导入。");
      e.target.value = ""; // 清空文件输入
      return;
    }

    console.log("开始读取文件...");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        console.log("文件读取完成");
        const data = event.target?.result;
        console.log("数据类型:", typeof data);

        // 尝试多种读取方式
        let workbook;
        try {
          workbook = XLSX.read(data, { type: "array" });
        } catch (err) {
          console.error("array方式失败，尝试binary:", err);
          try {
            workbook = XLSX.read(data, { type: "binary" });
          } catch (err2) {
            console.error("binary方式也失败:", err2);
            alert("无法读取Excel文件，请检查文件格式！");
            return;
          }
        }

        console.log("工作簿:", workbook);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

        console.log("解析的数据:", jsonData);

        if (jsonData.length < 2) {
          alert("Excel文件为空或格式不正确！");
          return;
        }

        // 提示当前金价设置
        console.log(`当前金价设置: ¥${goldPrice}/克`);
        console.log(`localStorage中的金价: ¥${localStorage.getItem("goldPrice")}/克`);

        const headers = jsonData[0] as string[];
        console.log("表头:", headers);
        const rows = jsonData.slice(1);

        // 查找列索引
        const productCodeIndex = headers.findIndex(h =>
          h && String(h).includes("货号")
        );
        const productNameIndex = headers.findIndex(h =>
          h && String(h).includes("名称")
        );
        const specificationIndex = headers.findIndex(h =>
          h && String(h).includes("规格")
        );
        const weightIndex = headers.findIndex(h =>
          h && String(h).includes("重量")
        );
        const laborCostIndex = headers.findIndex(h =>
          h && (String(h).includes("工费") || String(h).includes("人工") ||
               String(h).includes("加工") || String(h).includes("手工"))
        );
        const karatIndex = headers.findIndex(h =>
          h && String(h).includes("成色")
        );

        // 新增的成本列
        const accessoryCostIndex = headers.findIndex(h =>
          h && String(h).includes("配件") && String(h).includes("成本")
        );
        const stoneCostIndex = headers.findIndex(h =>
          h && String(h).includes("石头") && String(h).includes("成本")
        );
        const platingCostIndex = headers.findIndex(h =>
          h && String(h).includes("电镀") && String(h).includes("成本")
        );
        const moldCostIndex = headers.findIndex(h =>
          h && String(h).includes("模具") && String(h).includes("成本")
        );
        const commissionIndex = headers.findIndex(h =>
          h && String(h).includes("佣金")
        );
        const supplierCodeIndex = headers.findIndex(h =>
          h && String(h).includes("供应商")
        );
        const orderChannelIndex = headers.findIndex(h =>
          h && String(h).includes("下单口")
        );
        const shapeIndex = headers.findIndex(h =>
          h && String(h).includes("形状")
        );

        console.log("列索引:", {
          productCodeIndex,
          productNameIndex,
          specificationIndex,
          weightIndex,
          laborCostIndex,
          karatIndex,
          accessoryCostIndex,
          stoneCostIndex,
          platingCostIndex,
          moldCostIndex,
          commissionIndex,
          supplierCodeIndex,
          orderChannelIndex,
          shapeIndex
        });

        if (productCodeIndex === -1 || productNameIndex === -1) {
          alert("Excel文件必须包含货号和名称列！");
          return;
        }

        // 根据用户选择的小类推断所属的大类（所有产品使用相同的大类）
        let importCategory: ProductCategory = "配件";
        for (const [cat, subList] of Object.entries(SUB_CATEGORIES)) {
          if (subList.includes(importSubCategory)) {
            importCategory = cat as ProductCategory;
            break;
          }
        }

        const newProducts: Product[] = [];
        const newHistory: PriceHistory[] = [];

        rows.forEach((row: any) => {
          const productCode = row[productCodeIndex];
          const productName = row[productNameIndex];
          const specification = specificationIndex !== -1 ? row[specificationIndex] : "";
          const weight = importWeight && weightIndex !== -1 ? Number(row[weightIndex]) || 0 : 0;
          const laborCost = importLaborCost && laborCostIndex !== -1 ? Number(row[laborCostIndex]) || 0 : 0;

          // 读取新的成本字段
          const accessoryCost = accessoryCostIndex !== -1 ? Number(row[accessoryCostIndex]) || 0 : 0;
          const stoneCost = stoneCostIndex !== -1 ? Number(row[stoneCostIndex]) || 0 : 0;
          const platingCost = platingCostIndex !== -1 ? Number(row[platingCostIndex]) || 0 : 0;
          const moldCost = moldCostIndex !== -1 ? Number(row[moldCostIndex]) || 0 : 0;
          const commission = commissionIndex !== -1 ? Number(row[commissionIndex]) || 0 : 0;

          // 供应商代码：Excel中有值就用Excel的，没有值就用默认值"K14"
          const supplierCodeRaw = supplierCodeIndex !== -1 ? String(row[supplierCodeIndex]) : "";
          const supplierCode = supplierCodeRaw ? supplierCodeRaw : "K14";

          // 下单口：Excel中有值就用Excel的，没有值就用默认值"Van"
          const orderChannelRaw = orderChannelIndex !== -1 ? String(row[orderChannelIndex]) : "";
          const orderChannel = orderChannelRaw ? orderChannelRaw : "Van";

          const shape = shapeIndex !== -1 ? String(row[shapeIndex]) || "" : "";

          // 读取成色（材质）：优先使用Excel中的成色，如果没有则从货号智能识别
          const karatRaw = karatIndex !== -1 ? String(row[karatIndex]) : "";
          let validKarat: "10K" | "14K" | "18K" = "14K";
          if (karatRaw) {
            const karatValue = String(karatRaw).trim().toUpperCase();
            if (karatValue === "10K" || karatValue === "14K" || karatValue === "18K") {
              validKarat = karatValue as "10K" | "14K" | "18K";
            }
          }

          // 尝试将下单口映射到有效的代码
          let validOrderChannel: OrderChannel | "" = "";
          if (orderChannel) {
            const channelValue = String(orderChannel).trim();
            // 先尝试直接匹配代码
            const foundByCode = ORDER_CHANNELS.find(d => d.code === channelValue);
            if (foundByCode) {
              validOrderChannel = foundByCode.code;
            } else {
              // 尝试匹配名称
              const foundByName = ORDER_CHANNELS.find(d =>
                d.name.toLowerCase() === channelValue.toLowerCase() ||
                d.name.includes(channelValue) ||
                channelValue.includes(d.name)
              );
              if (foundByName) {
                validOrderChannel = foundByName.code;
              }
            }
          }

          // 尝试将形状映射到有效的选项
          let validShape: ProductShape = "";
          if (shape) {
            const shapeValue = String(shape).trim();
            // 尝试匹配
            const foundShape = PRODUCT_SHAPES.find(s =>
              s.toLowerCase() === shapeValue.toLowerCase() ||
              s.includes(shapeValue) ||
              shapeValue.includes(s)
            );
            if (foundShape) {
              validShape = foundShape;
            } else {
              // 如果找不到，直接使用原始值（用户可能自定义了新形状）
              validShape = shapeValue as ProductShape;
            }
          }

          if (!productCode || !productName) return;

          // 使用用户选择的小类和推断的大类
          const finalCategory = importCategory;
          const finalSubCategory = importSubCategory;

          // 调试日志：输出分类结果
          console.log(`产品 ${productCode} (${productName}): 用户选择小类="${importSubCategory}", 自动推断大类="${finalCategory}"`);

          // 确定最终使用的成色：优先使用Excel中的成色，如果没有则从货号智能识别
          const finalKarat = validKarat || "14K";
          const detectedMaterial = detectMaterialFromCode(String(productCode));
          // 如果Excel中有成色内容（非空）就用Excel的，否则使用智能识别的结果
          const karat = (karatRaw && karatRaw.trim() !== "") ? finalKarat : detectedMaterial.karat;

          // 调试日志：输出成色和金价识别结果
          console.log(`产品 ${productCode}: Excel成色="${karatRaw}", 识别成色="${detectedMaterial.karat}", 最终使用="${karat}", 导入金价="${goldPrice}", 工费="${laborCost}"`);

          const wholesalePrice = calculatePrice(
            goldPrice,
            weight,
            laborCost,
            karat,
            false,
            accessoryCost,
            stoneCost,
            platingCost,
            moldCost,
            commission
          );

          const retailPrice = calculatePrice(
            goldPrice,
            weight,
            laborCost,
            karat,
            true,
            accessoryCost,
            stoneCost,
            platingCost,
            moldCost,
            commission
          );

          const newProduct: Product = {
            id: Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9),
            category: finalCategory,
            subCategory: finalSubCategory, // 使用智能识别的子分类
            productCode: String(productCode),
            productName: String(productName),
            specification: String(specification || ""),
            weight,
            laborCost,
            karat: karat,
            goldColor: detectedMaterial.goldColor,
            wholesalePrice,
            retailPrice,
            goldPrice,
            accessoryCost,
            stoneCost,
            platingCost,
            moldCost,
            commission,
            supplierCode,
            orderChannel: validOrderChannel,
            shape: validShape,
            // 成本时间戳
            laborCostDate: new Date().toLocaleString("zh-CN"),
            accessoryCostDate: new Date().toLocaleString("zh-CN"),
            stoneCostDate: new Date().toLocaleString("zh-CN"),
            platingCostDate: new Date().toLocaleString("zh-CN"),
            moldCostDate: new Date().toLocaleString("zh-CN"),
            commissionDate: new Date().toLocaleString("zh-CN"),
            timestamp: new Date().toLocaleString("zh-CN"),
          };

          newProducts.push(newProduct);

          const historyRecord: PriceHistory = {
            id: newProduct.id + "_hist",
            productId: newProduct.id,
            category: finalCategory,
            subCategory: newProduct.subCategory,
            productCode: newProduct.productCode,
            productName: newProduct.productName,
            specification: newProduct.specification,
            weight: newProduct.weight,
            laborCost: newProduct.laborCost,
            karat: newProduct.karat,
            goldColor: "黄金",
            goldPrice,
            wholesalePrice,
            retailPrice,
            accessoryCost,
            stoneCost,
            platingCost,
            moldCost,
            commission,
            supplierCode,
            orderChannel: validOrderChannel,
            shape: validShape,
            // 成本时间戳
            laborCostDate: new Date().toLocaleString("zh-CN"),
            accessoryCostDate: new Date().toLocaleString("zh-CN"),
            stoneCostDate: new Date().toLocaleString("zh-CN"),
            platingCostDate: new Date().toLocaleString("zh-CN"),
            moldCostDate: new Date().toLocaleString("zh-CN"),
            commissionDate: new Date().toLocaleString("zh-CN"),
            timestamp: new Date().toLocaleString("zh-CN"),
          };
          newHistory.push(historyRecord);
        });

        // 删除已存在的重复货号
        const newProductCodes = new Set(newProducts.map(p => p.productCode));
        const filteredProducts = products.filter(p => !newProductCodes.has(p.productCode));

        // 添加新产品
        setProducts([...filteredProducts, ...newProducts]);
        setPriceHistory([...priceHistory, ...newHistory]);

        alert(`✅ 成功导入 ${newProducts.length} 个产品！\n\n📊 导入设置：\n  • 小类: ${importSubCategory}\n  • 大类: ${importCategory}\n\n💡 提示：产品已按照您选择的小类导入，系统不会进行自动分类识别。`);

        // 清空文件输入
        e.target.value = "";
      } catch (error) {
        console.error("导入Excel失败:", error);
        alert("导入Excel失败，请检查文件格式！");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 诊断数据库状态
  const diagnoseData = async () => {
    setIsVerifying(true);
    try {
      console.log("========== 数据诊断开始 ==========");

      const lsProducts = localStorage.getItem("goldProducts");
      const lsHistory = localStorage.getItem("goldPriceHistory");
      const lsGoldPrice = localStorage.getItem("goldPrice");
      const lsGoldPriceTimestamp = localStorage.getItem("goldPriceTimestamp");
      const lsCoefficients = localStorage.getItem("priceCoefficients");

      let message = "🔍 数据诊断报告\n";
      message += "=".repeat(40) + "\n\n";

      // 诊断产品数据
      message += "【产品数据】\n";

      // 检查 React state
      message += `📱 React State: ${products.length} 条\n`;

      // 检查 localStorage
      if (lsProducts) {
        try {
          const parsed = JSON.parse(lsProducts);
          message += `💾 LocalStorage: ${parsed.length} 条\n`;

          if (parsed.length > 0) {
            const categories = [...new Set(parsed.map((p: any) => p.category))];
            message += `📊 分类分布: ${categories.join(", ")}\n`;
            message += `📝 样例数据:\n`;
            message += `   货号: ${parsed[0].productCode}\n`;
            message += `   名称: ${parsed[0].productName}\n`;
            message += `   分类: ${parsed[0].category}\n`;
            message += `   重量: ${parsed[0].weight}g\n`;
            message += `   零售价: CAD$${parsed[0].retailPrice?.toFixed(2) || "N/A"}\n`;
          }

          // 对比状态
          if (parsed.length !== products.length) {
            message += `⚠️ 警告：LocalStorage 和 React State 数据不一致！\n`;
            message += `   建议点击"重新加载数据"按钮\n`;
          }
        } catch (e) {
          message += `❌ 数据解析失败: ${(e as Error).message}\n`;
        }
      } else {
        message += `💾 LocalStorage: 无数据\n`;
      }

      message += "\n";

      // 诊断历史记录
      message += "【历史记录】\n";
      message += `📱 React State: ${priceHistory.length} 条\n`;
      if (lsHistory) {
        try {
          const parsed = JSON.parse(lsHistory);
          message += `💾 LocalStorage: ${parsed.length} 条\n`;
        } catch (e) {
          message += `❌ 数据解析失败: ${(e as Error).message}\n`;
        }
      } else {
        message += `💾 LocalStorage: 无数据\n`;
      }

      message += "\n";

      // 诊断金价
      message += "【金价设置】\n";
      if (lsGoldPrice) {
        message += `✅ 金价: ¥${lsGoldPrice}/克\n`;
        message += `📅 更新时间: ${lsGoldPriceTimestamp || "未知"}\n`;
      } else {
        message += `⚠️ LocalStorage 中没有金价数据\n`;
      }

      message += "\n";

      // 诊断系数
      message += "【价格系数】\n";
      if (lsCoefficients) {
        try {
          const coeff = JSON.parse(lsCoefficients);
          message += `✅ 系数已设置\n`;
          message += `   14K金含量: ${coeff.goldFactor14K}\n`;
          message += `   18K金含量: ${coeff.goldFactor18K}\n`;
          message += `   零售价工费系数: ${coeff.laborFactorRetail}\n`;
          message += `   批发价工费系数: ${coeff.laborFactorWholesale}\n`;
        } catch (e) {
          message += `❌ 系数解析失败: ${(e as Error).message}\n`;
        }
      } else {
        message += `⚠️ LocalStorage 中没有系数数据\n`;
      }

      message += "\n";
      message += "=".repeat(40) + "\n";

      // 诊断数据库
      message += "【数据库诊断】\n";
      try {
        console.log('🔧 开始诊断数据库状态...');
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/diagnostic', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ 诊断结果:', result);

          message += `👤 用户: ${result.user.email}\n`;
          message += `🆔 用户ID: ${result.user.id}\n\n`;
          message += `📦 产品数据: ${result.database.products.count} 条\n`;
          if (result.database.products.count > 0) {
            message += `   示例:\n`;
            result.database.products.sampleIds.forEach((p: any, idx: number) => {
              message += `   ${idx + 1}. ${p.productCode} (${p.productName})\n`;
            });
          } else {
            message += `   ⚠️ 数据库中没有产品数据\n`;
          }
          message += `\n`;
          message += `📈 价格历史: ${result.database.priceHistory.count} 条\n`;
          if (result.database.priceHistory.count > 0) {
            message += `   示例:\n`;
            result.database.priceHistory.sampleIds.forEach((h: any, idx: number) => {
              message += `   ${idx + 1}. ${h.productCode} (产品ID: ${h.productId})\n`;
            });
          } else {
            message += `   ⚠️ 数据库中没有价格历史数据\n`;
          }
          message += `\n`;
          message += `⚙️ 系统配置: ${result.database.configs.count} 条\n`;
          if (result.database.configs.count > 0) {
            message += `   配置键: ${result.database.configs.keys.join(', ')}\n`;
          } else {
            message += `   ⚠️ 数据库中没有配置数据\n`;
          }
        } else {
          message += `❌ 数据库诊断失败: ${response.statusText}\n`;
        }
      } catch (e) {
        message += `❌ 数据库诊断失败: ${(e as Error).message}\n`;
      }

      message += "\n";
      message += "=".repeat(40) + "\n";
      message += "💡 提示：\n";
      message += "1. 如果 React State 和 LocalStorage 不一致，请点击\"重新加载数据\"\n";
      message += "2. 诊断结果已同步到控制台 (F12)\n";
      message += "3. 如果数据库中没有数据，请点击\"同步到数据库\"按钮\n";
      message += "4. 可以使用\"查看备份文件\"功能检查备份文件内容\n";

      alert(message);

      console.log("========== 数据诊断结束 ==========");
    } catch (error: any) {
      console.error("❌ 数据诊断失败:", error);
      alert("数据诊断失败，请检查控制台获取详细错误信息。");
    } finally {
      setIsVerifying(false);
    }
  };

  // 修复子分类数据
  const repairSubCategoryData = () => {
    console.log("========== 开始修复子分类数据 ==========");

    // 统计修复前的数据
    const beforeEmptyCount = products.filter(p => !p.subCategory).length;
    const subCategoryCountsBefore: Record<string, number> = {};
    products.forEach((p) => {
      if (p.subCategory) {
        subCategoryCountsBefore[p.subCategory] = (subCategoryCountsBefore[p.subCategory] || 0) + 1;
      }
    });
    console.log("修复前数据统计:");
    console.log("  - 空子分类产品数:", beforeEmptyCount);
    console.log("  - 子分类分布:", subCategoryCountsBefore);

    // 获取所有子分类列表
    const allSubCategories = Object.values(SUB_CATEGORIES).flat();

    // 修复逻辑：对于没有 subCategory 的产品，根据历史记录或关键字匹配推断
    const fixedProducts = products.map((product) => {
      // 如果已经有 subCategory，保持不变
      if (product.subCategory) {
        return product;
      }

      // 尝试从历史记录中推断 subCategory
      const historyRecords = priceHistory.filter(h => h.productCode === product.productCode);
      if (historyRecords.length > 0) {
        // 找到最新的历史记录，使用它的 subCategory
        const latestHistory = historyRecords[historyRecords.length - 1];
        if (latestHistory.subCategory) {
          console.log(`产品 ${product.productCode} 从历史记录推断子分类: ${latestHistory.subCategory}`);
          return { ...product, subCategory: latestHistory.subCategory };
        }
      }

      // 如果历史记录也没有，尝试从产品名称或规格中关键字匹配
      const productNameLower = product.productName.toLowerCase();
      const specLower = (product.specification || "").toLowerCase();

      // 尝试匹配子分类关键字
      for (const subCat of allSubCategories) {
        // 检查子分类关键字是否在产品名称或规格中
        const keywords = subCat.split(/[\/\s\-，、]+/); // 分割成多个关键字
        for (const keyword of keywords) {
          if (keyword && (productNameLower.includes(keyword) || specLower.includes(keyword))) {
            // 进一步验证：该子分类必须属于产品的大类
            const subCatCategories = Object.entries(SUB_CATEGORIES)
              .filter(([_, subList]) => subList.includes(subCat))
              .map(([cat, _]) => cat);

            if (subCatCategories.includes(product.category)) {
              console.log(`产品 ${product.productCode} 从关键字 "${keyword}" 推断子分类: ${subCat}`);
              return { ...product, subCategory: subCat };
            }
          }
        }
      }

      // 如果无法推断，根据大类设置默认子分类
      const subCategoryList = SUB_CATEGORIES[product.category as ProductCategory];
      if (subCategoryList && subCategoryList.length > 0) {
        console.log(`产品 ${product.productCode} 使用默认子分类: ${subCategoryList[0]} (大类: ${product.category})`);
        return { ...product, subCategory: subCategoryList[0] };
      }

      console.log(`产品 ${product.productCode} 无法推断子分类（大类也没有子分类列表）`);
      return product;
    });

    // 保存修复后的数据
    localStorage.setItem("goldProducts", JSON.stringify(fixedProducts));
    setProducts(fixedProducts);

    // 统计修复后的数据
    const afterEmptyCount = fixedProducts.filter(p => !p.subCategory).length;
    const subCategoryCountsAfter: Record<string, number> = {};
    fixedProducts.forEach((p) => {
      if (p.subCategory) {
        subCategoryCountsAfter[p.subCategory] = (subCategoryCountsAfter[p.subCategory] || 0) + 1;
      }
    });
    console.log("修复后数据统计:");
    console.log("  - 空子分类产品数:", afterEmptyCount);
    console.log("  - 子分类分布:", subCategoryCountsAfter);

    // 显示修复结果
    let message = "✅ 子分类数据修复完成\n\n";
    message += `修复前：${beforeEmptyCount} 个产品缺少子分类\n`;
    message += `修复后：${afterEmptyCount} 个产品缺少子分类\n`;
    message += `成功修复：${beforeEmptyCount - afterEmptyCount} 个产品\n\n`;
    message += "修复后的子分类分布：\n";
    Object.entries(subCategoryCountsAfter)
      .sort((a, b) => b[1] - a[1])
      .forEach(([subCat, count]) => {
        message += `  - ${subCat}: ${count}\n`;
      });

    alert(message);

    console.log("========== 子分类数据修复结束 ==========");
  };

  // 显示分类详情
  const showCategoryDetails = () => {
    console.log("========== 开始显示分类详情 ==========");

    let message = "📂 产品分类详情\n";
    message += "=".repeat(50) + "\n\n";

    // 按大类统计
    PRODUCT_CATEGORIES.forEach((category) => {
      message += `【${category}】\n`;

      // 统计该大类下的产品总数
      const categoryProducts = products.filter(p => p.category === category);
      message += `  总产品数: ${categoryProducts.length}\n\n`;

      // 统计各子分类
      const subCats = SUB_CATEGORIES[category];
      const subCategoryStats: Record<string, number> = {};

      subCats.forEach((subCat) => {
        const count = categoryProducts.filter(p => p.subCategory === subCat).length;
        if (count > 0) {
          subCategoryStats[subCat] = count;
        }
      });

      // 显示有产品的子分类
      const sortedSubCats = Object.entries(subCategoryStats).sort((a, b) => b[1] - a[1]);
      if (sortedSubCats.length > 0) {
        message += "  子分类分布:\n";
        sortedSubCats.forEach(([subCat, count]) => {
          message += `    • ${subCat}: ${count}\n`;
        });
      } else {
        message += "  ⚠️ 所有子分类都没有产品\n";
      }

      // 显示缺少子分类的产品
      const missingSubCategoryProducts = categoryProducts.filter(p => !p.subCategory);
      if (missingSubCategoryProducts.length > 0) {
        message += `\n  ⚠️ 缺少子分类的产品 (${missingSubCategoryProducts.length}个):\n`;
        missingSubCategoryProducts.slice(0, 5).forEach((p) => {
          message += `    • ${p.productCode}: ${p.productName}\n`;
        });
        if (missingSubCategoryProducts.length > 5) {
          message += `    ... 还有 ${missingSubCategoryProducts.length - 5} 个\n`;
        }
      }

      message += "\n";
    });

    // 示例产品（用于调试）
    message += "【示例产品】\n";
    const sampleProducts = products.slice(0, 5);
    sampleProducts.forEach((p, index) => {
      message += `${index + 1}. ${p.productCode}\n`;
      message += `   大类: ${p.category}\n`;
      message += `   子分类: ${p.subCategory || "❌ 无"}\n`;
      message += `   名称: ${p.productName}\n`;
      message += `   规格: ${p.specification || "无"}\n\n`;
    });

    alert(message);

    console.log("========== 分类详情显示结束 ==========");
  };

  // 智能修复产品分类（根据产品名称自动识别分类）
  const repairProductCategories = () => {
    console.log("========== 开始智能修复分类 ==========");

    // 统计修复前的数据
    const categoryCountsBefore: Record<string, number> = {};
    products.forEach((p) => {
      categoryCountsBefore[p.category] = (categoryCountsBefore[p.category] || 0) + 1;
    });

    // 修复逻辑：对所有产品使用智能识别重新设置分类
    const fixedProducts = products.map((product) => {
      // 智能识别分类和子分类
      const detectedCategory = detectCategoryFromName(product.productName);
      const detectedSubCategory = detectSubCategoryFromName(product.productName);

      // 🔥 智能推断：如果子分类识别成功但大类失败，根据子分类推断大类
      let newCategory = detectedCategory || product.category;
      let newSubCategory = detectedSubCategory || product.subCategory;

      if (detectedSubCategory && !detectedCategory) {
        // 根据子分类查找所属的大类
        for (const [cat, subList] of Object.entries(SUB_CATEGORIES)) {
          if (subList.includes(detectedSubCategory)) {
            newCategory = cat as ProductCategory;
            console.log(`产品 ${product.productCode}: 根据子分类"${detectedSubCategory}"推断大类="${newCategory}"`);
            break;
          }
        }
      }

      // 如果分类发生变化，记录日志
      if (newCategory !== product.category || newSubCategory !== product.subCategory) {
        console.log(`产品 ${product.productCode} (${product.productName}):`);
        console.log(`  分类: ${product.category} → ${newCategory}`);
        console.log(`  子分类: ${product.subCategory || '(无)'} → ${newSubCategory || '(无)'}`);
      }

      return {
        ...product,
        category: newCategory,
        subCategory: newSubCategory,
      };
    });

    // 同步更新历史记录中的分类
    const fixedHistory = priceHistory.map((history) => {
      // 智能识别分类和子分类
      const detectedCategory = detectCategoryFromName(history.productName);
      const detectedSubCategory = detectSubCategoryFromName(history.productName);

      // 🔥 智能推断：如果子分类识别成功但大类失败，根据子分类推断大类
      let newCategory = detectedCategory || history.category;
      let newSubCategory = detectedSubCategory || history.subCategory;

      if (detectedSubCategory && !detectedCategory) {
        // 根据子分类查找所属的大类
        for (const [cat, subList] of Object.entries(SUB_CATEGORIES)) {
          if (subList.includes(detectedSubCategory)) {
            newCategory = cat as ProductCategory;
            break;
          }
        }
      }

      return {
        ...history,
        category: newCategory,
        subCategory: newSubCategory,
      };
    });

    // 保存修复后的数据
    localStorage.setItem("goldProducts", JSON.stringify(fixedProducts));
    localStorage.setItem("goldPriceHistory", JSON.stringify(fixedHistory));
    setProducts(fixedProducts);
    setPriceHistory(fixedHistory);

    // 统计修复后的数据
    const categoryCountsAfter: Record<string, number> = {};
    fixedProducts.forEach((p) => {
      categoryCountsAfter[p.category] = (categoryCountsAfter[p.category] || 0) + 1;
    });

    // 计算变化的产品数量
    let changedCount = 0;
    products.forEach((p, index) => {
      const fp = fixedProducts[index];
      if (p.category !== fp.category || p.subCategory !== fp.subCategory) {
        changedCount++;
      }
    });

    // 显示修复结果
    let message = "✅ 智能分类修复完成\n\n";
    message += `总计产品: ${products.length} 个\n`;
    message += `分类变化: ${changedCount} 个产品\n\n`;

    message += "修复前后分类对比:\n";
    PRODUCT_CATEGORIES.forEach((category) => {
      const beforeCount = categoryCountsBefore[category] || 0;
      const afterCount = categoryCountsAfter[category] || 0;
      const diff = afterCount - beforeCount;
      const diffText = diff > 0 ? ` (+${diff})` : diff < 0 ? ` (${diff})` : "";
      message += `  ${category}: ${beforeCount} → ${afterCount}${diffText}\n`;
    });

    message += "\n💡 提示：\n";
    message += "- 系统已根据产品名称智能识别分类\n";
    message += "- 如有识别错误，请手动调整产品分类\n";
    message += "- 点击顶部分类按钮查看各分类下的产品";

    alert(message);

    console.log("========== 智能分类修复结束 ==========");
  };

  // 显示原始数据（用于调试）
  const showRawData = () => {
    console.log("========== 开始显示原始数据 ==========");

    const rawProducts = localStorage.getItem("goldProducts");
    if (rawProducts) {
      try {
        const parsedProducts = JSON.parse(rawProducts);
        let message = "📄 原始产品数据（前10个）\n";
        message += "=".repeat(50) + "\n\n";

        parsedProducts.slice(0, 10).forEach((p: any, index: number) => {
          message += `${index + 1}. ${p.productCode}\n`;
          message += `   category: "${p.category}"\n`;
          message += `   subCategory: "${p.subCategory || '❌ 无'}"\n`;
          message += `   productName: "${p.productName}"\n\n`;
        });

        message += `\n总产品数: ${parsedProducts.length}\n`;
        message += `\n💡 提示：\n`;
        message += '- 如果 category 是"配件"、"宝石托"、"链条"，说明数据已经迁移过\n';
        message += "- 如果 subCategory 为空，说明子分类没有被正确设置\n";

        alert(message);
      } catch (e) {
        console.error("解析原始数据失败:", e);
        alert("解析原始数据失败: " + e);
      }
    } else {
      alert("localStorage 中没有产品数据");
    }

    console.log("========== 原始数据显示结束 ==========");
  };

  // 修复数据库表结构
  const fixDatabaseSchema = async () => {
    console.log("========== 开始修复数据库表结构 ==========");

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/fix-schema', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        let message = "✅ 数据库表结构修复成功\n\n";
        message += `修复内容：\n`;
        if (result.results.tablesFixed.length > 0) {
          result.results.tablesFixed.forEach((fix: string) => {
            message += `  • ${fix}\n`;
          });
        } else {
          message += `  • 表结构已是最新，无需修复\n`;
        }

        if (result.results.errors.length > 0) {
          message += `\n⚠️ 遇到错误：\n`;
          result.results.errors.forEach((error: string) => {
            message += `  • ${error}\n`;
          });
        }

        alert(message);
        console.log("修复结果:", result);
      } else {
        alert("❌ 修复失败: " + (result.error || "未知错误"));
        console.error("修复失败:", result);
      }
    } catch (error: any) {
      console.error("❌ 修复失败:", error);
      alert("❌ 修复失败: " + error.message);
    }

    console.log("========== 数据库表结构修复结束 ==========");
  };

  // 清空所有云端数据
  const cleanAllCloudData = async () => {
    console.log("========== 开始清空云端数据 ==========");

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/clean-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        let message = "✅ 云端数据清空成功\n\n";
        message += `清空内容：\n`;
        message += `  • 产品数据: ${result.results.productsDeleted} 条\n`;
        message += `  • 价格历史: ${result.results.historyDeleted} 条\n`;
        message += `  • 配置数据: ${result.results.configDeleted ? '已清空' : '失败'}\n`;

        if (result.results.errors.length > 0) {
          message += `\n⚠️ 遇到错误：\n`;
          result.results.errors.forEach((error: string) => {
            message += `  • ${error}\n`;
          });
        }

        message += "\n💡 提示：\n";
        message += "1. 云端数据已清空\n";
        message += "2. 可以重新从本地数据导入到云端\n";
        message += "3. 建议先点击\"修复表结构\"确保数据库支持长ID\n";

        alert(message);
        console.log("清空结果:", result);
      } else {
        alert("❌ 清空失败: " + (result.error || "未知错误"));
        console.error("清空失败:", result);
      }
    } catch (error: any) {
      console.error("❌ 清空失败:", error);
      alert("❌ 清空失败: " + error.message);
    }

    console.log("========== 云端数据清空结束 ==========");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-black">
              K金产品报价计算表
            </h1>
            {/* 同步状态显示 */}
            <div className="flex items-center gap-2">
              {syncStatus === "syncing" && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>同步中...</span>
                </div>
              )}
              {syncStatus === "success" && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <span>✓</span>
                  <span>{syncMessage || "同步成功"}</span>
                </div>
              )}
              {syncStatus === "error" && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  <span>✗</span>
                  <span>{syncMessage || "同步失败"}</span>
                </div>
              )}
              {syncStatus === "idle" && lastSyncTime && (
                <div className="text-xs text-gray-600">
                  上次同步: {lastSyncTime}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 同步按钮组 */}
            <div className="relative">
              <button
                onClick={() => setShowSyncMenu(!showSyncMenu)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                suppressHydrationWarning
              >
                ☁️ 云端同步
              </button>

              {showSyncMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-3">
                    <div className="px-4 pb-2 border-b border-gray-200">
                      <div className="text-sm font-semibold text-black">云端数据同步</div>
                      {cloudDataExists && (
                        <div className="text-xs text-green-600 mt-1">✓ 云端已有数据</div>
                      )}
                      {!cloudDataExists && (
                        <div className="text-xs text-gray-500 mt-1">暂无云端数据</div>
                      )}
                    </div>

                    <div className="px-4 py-2 space-y-2">
                      <button
                        onClick={async () => {
                          setShowSyncMenu(false);
                          await uploadToCloud();
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                        disabled={syncStatus === "syncing"}
                        suppressHydrationWarning
                      >
                        📤 上传到云端
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={async () => {
                            setShowSyncMenu(false);
                            await downloadFromCloud("merge");
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium"
                          disabled={syncStatus === "syncing"}
                          suppressHydrationWarning
                        >
                          📥 合并下载
                        </button>
                        <button
                          onClick={async () => {
                            setShowSyncMenu(false);
                            if (confirm("⚠️ 警告：替换模式会覆盖本地所有数据！\n\n确定要使用云端数据替换本地数据吗？")) {
                              await downloadFromCloud("replace");
                            }
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
                          disabled={syncStatus === "syncing"}
                          suppressHydrationWarning
                        >
                          🔄 替换下载
                        </button>
                      </div>

                      <button
                        onClick={async () => {
                          setShowSyncMenu(false);
                          const hasData = await checkCloudData();
                          alert(hasData ? "✅ 云端有数据可以下载" : "❌ 云端暂无数据");
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                        suppressHydrationWarning
                      >
                        🔍 检查云端数据
                      </button>
                    </div>

                    <div className="px-4 pt-2 border-t border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoSyncEnabled}
                          onChange={(e) => {
                            setAutoSyncEnabled(e.target.checked);
                            localStorage.setItem("autoSyncEnabled", String(e.target.checked));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">自动同步（数据变更时）</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHelpModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              ❓ 操作指引
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                  });

                  if (response.ok) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }
                } catch (error) {
                  console.error('Logout error:', error);
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              登出
            </button>
          </div>
        </div>

        {/* 数据状态显示 */}
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-blue-900">
                📊 当前数据状态：
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                products.length > 0
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {products.length > 0 ? `共有 ${products.length} 个产品` : "暂无数据"}
              </span>
              {products.length > 0 && (
                <span className="text-sm text-blue-700">
                  分布在 {[...new Set(products.map(p => p.category))].length} 个分类
                </span>
              )}
            </div>
            <button
              onClick={() => {
                console.log("当前 products state:", products);
                console.log("当前 priceHistory state:", priceHistory);
                console.log("LocalStorage products:", localStorage.getItem("goldProducts"));
                console.log("LocalStorage history:", localStorage.getItem("goldPriceHistory"));
                alert(`当前 products 长度: ${products.length}\n当前 priceHistory 长度: ${priceHistory.length}\n\n详细信息请查看控制台 (F12)`);
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              suppressHydrationWarning
            >
              调试状态
            </button>
          </div>
        </div>

        {/* 分类导航区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-black">产品分类</h2>

          {/* 显示没有分类的产品修复工具 */}
          {products.length > 0 && (() => {
            const emptyCategoryCount = products.filter(p => !p.category).length;
            if (emptyCategoryCount > 0) {
              return (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-semibold mb-2">⚠️ 发现 {emptyCategoryCount} 个产品没有分类！</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs text-red-700">批量设置为:</label>
                    <select
                      value={currentCategory}
                      onChange={(e) => setCurrentCategory(e.target.value as ProductCategory)}
                      className="px-2 py-1 text-xs border border-red-300 rounded"
                      suppressHydrationWarning
                    >
                      {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!confirm(`确定将这 ${emptyCategoryCount} 个没有分类的产品批量设置为 "${currentCategory}" 吗？`)) return;

                        const updatedProducts = products.map(p => {
                          if (!p.category) {
                            return { ...p, category: currentCategory };
                          }
                          return p;
                        });

                        const updatedHistory = priceHistory.map(h => {
                          if (!h.category) {
                            return { ...h, category: currentCategory };
                          }
                          return h;
                        });

                        setProducts(updatedProducts);
                        setPriceHistory(updatedHistory);
                        alert(`✅ 成功将 ${emptyCategoryCount} 个产品和对应的历史记录设置为 "${currentCategory}" 分类！`);
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      suppressHydrationWarning
                    >
                      批量修复分类
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* 显示没有下单口的产品修复工具 */}
          {products.length > 0 && (() => {
            const emptyOrderChannelCount = products.filter(p => !p.orderChannel).length;
            if (emptyOrderChannelCount > 0) {
              return (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-black font-semibold mb-2">⚠️ 发现 {emptyOrderChannelCount} 个产品没有下单口！</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs text-black">批量设置为:</label>
                    <select
                      id="batchOrderChannelSelect"
                      defaultValue="Van"
                      className="px-2 py-1 text-xs border border-yellow-300 rounded"
                      style={{ color: "black" }}
                      suppressHydrationWarning
                    >
                      {ORDER_CHANNELS.map(channel => (
                        <option key={channel.code} value={channel.code} style={{ color: "black" }}>{channel.code}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById("batchOrderChannelSelect") as HTMLSelectElement;
                        const channelCode = select?.value || "Van";

                        if (!confirm(`确定将这 ${emptyOrderChannelCount} 个没有下单口的产品批量设置为 "${channelCode}" 吗？`)) return;

                        const updatedProducts = products.map(p => {
                          if (!p.orderChannel) {
                            return { ...p, orderChannel: channelCode as OrderChannel };
                          }
                          return p;
                        });

                        const updatedHistory = priceHistory.map(h => {
                          if (!h.orderChannel) {
                            return { ...h, orderChannel: channelCode as OrderChannel };
                          }
                          return h;
                        });

                        setProducts(updatedProducts);
                        setPriceHistory(updatedHistory);
                        alert(`✅ 成功将 ${emptyOrderChannelCount} 个产品和对应的历史记录设置为 "${channelCode}" 下单口！`);
                      }}
                      className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                      suppressHydrationWarning
                    >
                      批量修复下单口
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="space-y-4">
            {PRODUCT_CATEGORIES.map((category) => {
              const count = products.filter(p => p.category === category).length;
              const hasData = count > 0;
              const isExpanded = expandedCategories.has(category);
              const subCategories = SUB_CATEGORIES[category];

              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 大分类按钮 */}
                  <button
                    onClick={() => {
                      setCurrentCategory(category);
                      setCurrentSubCategory(""); // 清除子分类选择
                      setCurrentProduct({ ...currentProduct, category });
                      // 展开/折叠子分类
                      setExpandedCategories(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(category)) {
                          newSet.delete(category);
                        } else {
                          newSet.add(category);
                        }
                        return newSet;
                      });
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                      currentCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    suppressHydrationWarning
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{category}</span>
                      {hasData && (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                            currentCategory === category
                              ? "bg-white text-blue-600"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 子分类列表 */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-white border-t border-gray-200" suppressHydrationWarning>
                      <div className="flex flex-wrap gap-2">
                        {subCategories.map((subCat) => {
                          const subCount = products.filter(p => p.category === category && p.subCategory === subCat).length;
                          return (
                            <button
                              key={subCat}
                              onClick={() => {
                                console.log(`点击子分类按钮: ${subCat}`);
                                console.log(`当前选中子分类: ${currentSubCategory}`);
                                const matchedProducts = products.filter(p => p.category === category && p.subCategory === subCat);
                                console.log(`匹配的产品数量: ${matchedProducts.length}`);
                                if (matchedProducts.length > 0) {
                                  console.log("前3个匹配产品:", matchedProducts.slice(0, 3).map(p => ({ code: p.productCode, subCategory: p.subCategory })));
                                }
                                setCurrentSubCategory(subCat);
                              }}
                              suppressHydrationWarning
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                currentSubCategory === subCat
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-gray-50 text-black border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {subCat}
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full ${
                                  currentSubCategory === subCat
                                    ? "bg-white text-blue-600"
                                    : subCount > 0
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-300 text-black"
                                }`}
                              >
                                {subCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {products.filter(p => p.category === currentCategory).length === 0 && products.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ 当前分类（{currentCategory}）暂无数据。
                共有 {products.length} 个产品，请点击上方有数字标记的分类查看。
              </p>
            </div>
          )}
        </div>

        {/* 数据管理区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-black">数据管理</h2>
          <div className="mb-4 flex gap-2" suppressHydrationWarning>
            <button
              onClick={() => {
                if (confirm("确定要导出所有数据备份吗？")) {
                  const backup = {
                    products: localStorage.getItem("goldProducts"),
                    history: localStorage.getItem("goldPriceHistory"),
                    goldPrice: localStorage.getItem("goldPrice"),
                    goldPriceTimestamp: localStorage.getItem("goldPriceTimestamp"),
                    coefficients: localStorage.getItem("priceCoefficients"),
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "K金报价系统数据备份_" + new Date().toLocaleDateString("zh-CN") + ".json";
                  link.click();
                }
              }}
              className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              suppressHydrationWarning
            >
              备份数据
            </button>
            {/* 更多工具下拉菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowMoreToolsMenu(!showMoreToolsMenu)}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                suppressHydrationWarning
              >
                更多工具 ▼
              </button>

              {showMoreToolsMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowMoreToolsMenu(false);
                        diagnoseData();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100"
                      suppressHydrationWarning
                    >
                      🔍 诊断数据
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreToolsMenu(false);
                        if (confirm("确定要修复子分类数据吗？这将根据产品的分类信息自动设置子分类。")) {
                          repairSubCategoryData();
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100"
                      suppressHydrationWarning
                    >
                      🔧 修复子分类
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreToolsMenu(false);
                        repairProductCategories();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100"
                      suppressHydrationWarning
                    >
                      🎯 智能修复分类
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowMoreToolsMenu(false);
                        if (confirm("⚠️ 警告：这将清除所有数据！\n\n确定要清除所有 localStorage 数据吗？\n建议在清除前先备份数据。")) {
                          localStorage.removeItem("goldProducts");
                          localStorage.removeItem("goldPriceHistory");
                          localStorage.removeItem("goldPrice");
                          localStorage.removeItem("goldPriceTimestamp");
                          localStorage.removeItem("priceCoefficients");
                          alert("所有数据已清除，请刷新页面");
                          location.reload();
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      suppressHydrationWarning
                    >
                      🗑️ 清除本地数据
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 操作区域 - 分为三个功能区 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6" suppressHydrationWarning>
            {/* 1. 金价设置区域 */}
            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                  💰
                </div>
                <h3 className="text-lg font-semibold text-amber-900">金价设置</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-amber-900">
                    市场金价（人民币/克）
                  </label>
                  <input
                    type="number"
                    value={goldPrice}
                    onChange={(e) => setGoldPrice(Number(e.target.value))}
                    className="w-full rounded-lg border-2 border-amber-300 px-4 py-2.5 focus:border-amber-500 focus:outline-none text-black font-medium"
                    step="0.01"
                    suppressHydrationWarning
                  />
                  <div className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                    <span>📅</span>
                    <span>更新时间: {formatDate(goldPriceTimestamp)}</span>
                  </div>
                </div>
                <div className="text-xs text-amber-600 bg-amber-100 rounded px-3 py-2">
                  💡 修改金价后，点击下方"更新价格"按钮应用到选中产品
                </div>
              </div>
            </div>

            {/* 2. 批量操作区域 */}
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                  ⚡
                </div>
                <h3 className="text-lg font-semibold text-blue-900">批量操作</h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={updatePrices}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  suppressHydrationWarning
                >
                  🔄 更新选中产品价格
                </button>
                <button
                  onClick={() => setShowBatchUpdateModal(true)}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-white font-medium hover:bg-purple-700 transition-colors shadow-sm"
                  suppressHydrationWarning
                >
                  🏷️ 批量更新供应商代码
                </button>
                <button
                  onClick={() => setShowBatchUpdateChannelModal(true)}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                  suppressHydrationWarning
                >
                  📦 批量修改下单口
                </button>
                <button
                  onClick={deleteSelectedProducts}
                  className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-white font-medium hover:bg-red-700 transition-colors shadow-sm"
                  suppressHydrationWarning
                >
                  🗑️ 批量删除选中产品
                </button>
                <button
                  onClick={() => setShowBatchModifyModal(true)}
                  className="w-full rounded-lg bg-pink-600 px-4 py-2.5 text-white font-medium hover:bg-pink-700 transition-colors shadow-sm"
                  suppressHydrationWarning
                >
                  ✏️ 批量修改价格系数
                </button>
              </div>
            </div>

            {/* 3. 选择与数据管理区域 */}
            <div className="rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center text-white">
                  ✅
                </div>
                <h3 className="text-lg font-semibold text-black">导出管理</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedProducts(new Set(products.filter(p => p.category === currentCategory).map(p => p.id)))}
                    className="rounded-lg bg-gray-600 px-3 py-2 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                    suppressHydrationWarning
                  >
                    全选（当前）
                  </button>
                  <button
                    onClick={() => setSelectedProducts(new Set(products.map(p => p.id)))}
                    className="rounded-lg bg-gray-600 px-3 py-2 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                    suppressHydrationWarning
                  >
                    全选（所有）
                  </button>
                </div>
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-black font-medium hover:bg-gray-100 transition-colors"
                  suppressHydrationWarning
                >
                  ❌ 取消全选
                </button>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-black mb-2">
                    <span>已选产品: <strong className="text-blue-600">{selectedProducts.size}</strong> 个</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportToExcel}
                      className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                      suppressHydrationWarning
                    >
                      📤 导出
                    </button>
                    <button
                      onClick={reloadFromLocalStorage}
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                      suppressHydrationWarning
                    >
                      🔄 刷新数据
                    </button>
                  </div>
                </div>

                {/* 导出数据备份 */}
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex items-center justify-between text-xs text-black mb-2">
                    <span>导出数据备份</span>
                  </div>

                  {/* 同步提示 */}
                  {products.length > 0 && (
                    <div className="mb-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                      <p className="text-yellow-800">
                        💡 提示：请按顺序操作<br />
                        1️⃣ 点击"✅ 验证数据"检查数据状态<br />
                        2️⃣ 点击"🔄 同步到数据库"同步数据到云端<br />
                        3️⃣ 点击"📦 导出备份"导出完整数据
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={async () => {
                        // 先验证完整性
                        await verifyDataIntegrity();
                        // 然后验证准确性
                        await validateExportAccuracy();
                      }}
                      disabled={isVerifying || isValidatingExport}
                      className="w-full rounded-lg bg-green-600 px-3 py-2 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      suppressHydrationWarning
                    >
                      {(isVerifying || isValidatingExport) ? '验证中...' : '✅ 验证数据'}
                    </button>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={syncToDatabase}
                      disabled={isSyncing}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      suppressHydrationWarning
                    >
                      {isSyncing ? '同步中...' : '🔄 同步到数据库'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={exportBackupFormat}
                      onChange={(e) => setExportBackupFormat(e.target.value as "excel" | "json")}
                      className="flex-1 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm font-medium text-black hover:border-gray-400 transition-colors"
                      suppressHydrationWarning
                    >
                      <option value="excel">Excel格式</option>
                      <option value="json">JSON格式</option>
                    </select>
                    <button
                      onClick={exportDataBackup}
                      disabled={isExporting}
                      className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      suppressHydrationWarning
                    >
                      {isExporting ? '导出中...' : '📦 导出备份'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 系数设置区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-black">价格系数设置</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" suppressHydrationWarning>
            {/* 金含量系数 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                10K金含量系数
              </label>
              <input
                type="number"
                value={coefficients.goldFactor10K}
                onChange={(e) => setCoefficients({...coefficients, goldFactor10K: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.001"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 0.417</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                14K金含量系数
              </label>
              <input
                type="number"
                value={coefficients.goldFactor14K}
                onChange={(e) => setCoefficients({...coefficients, goldFactor14K: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.001"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 0.586</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                18K金含量系数
              </label>
              <input
                type="number"
                value={coefficients.goldFactor18K}
                onChange={(e) => setCoefficients({...coefficients, goldFactor18K: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.001"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 0.755</div>
            </div>

            {/* 工费系数 */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-black">
                  零售价工费系数
                </label>
                <select
                  value={coefficients.laborFactorRetailMode}
                  onChange={(e) => setCoefficients({...coefficients, laborFactorRetailMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-black"
                  suppressHydrationWarning
                >
                  <option value="fixed">固定</option>
                  <option value="special">特殊</option>
                </select>
              </div>
              <input
                type="number"
                value={coefficients.laborFactorRetail}
                onChange={(e) => setCoefficients({...coefficients, laborFactorRetail: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.1"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 5 {coefficients.laborFactorRetailMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-black">
                  批发价工费系数
                </label>
                <select
                  value={coefficients.laborFactorWholesaleMode}
                  onChange={(e) => setCoefficients({...coefficients, laborFactorWholesaleMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-black"
                  suppressHydrationWarning
                >
                  <option value="fixed">固定</option>
                  <option value="special">特殊</option>
                </select>
              </div>
              <input
                type="number"
                value={coefficients.laborFactorWholesale}
                onChange={(e) => setCoefficients({...coefficients, laborFactorWholesale: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.1"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 3 {coefficients.laborFactorWholesaleMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>

            {/* 材料系数 */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-black">
                  材料损耗系数
                </label>
                <select
                  value={coefficients.materialLossMode}
                  onChange={(e) => setCoefficients({...coefficients, materialLossMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-black"
                  suppressHydrationWarning
                >
                  <option value="fixed">固定</option>
                  <option value="special">特殊</option>
                </select>
              </div>
              <input
                type="number"
                value={coefficients.materialLoss}
                onChange={(e) => setCoefficients({...coefficients, materialLoss: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 1.15 {coefficients.materialLossMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="mb-2 block text-sm font-medium text-black">
                  材料浮动系数
                </label>
                <select
                  value={coefficients.materialCostMode}
                  onChange={(e) => setCoefficients({...coefficients, materialCostMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-black"
                  suppressHydrationWarning
                >
                  <option value="fixed">固定</option>
                  <option value="special">特殊</option>
                </select>
              </div>
              <input
                type="number"
                value={coefficients.materialCost}
                onChange={(e) => setCoefficients({...coefficients, materialCost: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 1.1 {coefficients.materialCostMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>

            {/* 利润和汇率 */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="mb-2 block text-sm font-medium text-black">
                  国际运输及关税系数
                </label>
                <select
                  value={coefficients.profitMarginMode}
                  onChange={(e) => setCoefficients({...coefficients, profitMarginMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-black"
                  suppressHydrationWarning
                >
                  <option value="fixed">固定</option>
                  <option value="special">特殊</option>
                </select>
              </div>
              <input
                type="number"
                value={coefficients.profitMargin}
                onChange={(e) => setCoefficients({...coefficients, profitMargin: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 1.25 {coefficients.profitMarginMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                汇率（人民币/加币）
              </label>
              <input
                type="number"
                value={coefficients.exchangeRate}
                onChange={(e) => setCoefficients({...coefficients, exchangeRate: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-black">默认: 5</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 产品录入区域 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">
                产品信息录入
              </h2>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-black">批量导入：</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={importExcel}
                  className="block w-48 text-sm text-black file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:text-blue-700 hover:file:bg-blue-100"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* 导入选项 */}
            <div className="mb-4 rounded bg-gray-50 p-3">
              <p className="mb-2 text-sm font-medium text-black">导入选项：</p>
              <div className="mb-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={importWeight}
                    onChange={(e) => setImportWeight(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    suppressHydrationWarning
                  />
                  导入重量
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={importLaborCost}
                    onChange={(e) => setImportLaborCost(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    suppressHydrationWarning
                  />
                  导入人工成本
                </label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-black">默认材质：</label>
                  <select
                    value={defaultKarat}
                    onChange={(e) => setDefaultKarat(e.target.value as "10K" | "14K" | "18K")}
                    className="rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none text-black"
                    suppressHydrationWarning
                  >
                    <option value="10K">10K金</option>
                    <option value="14K">14K金</option>
                    <option value="18K">18K金</option>
                  </select>
                </div>
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
                  <label className="block text-sm font-semibold text-black mb-2">
                    🎯 选择产品小类（导入前必选）
                  </label>
                  <p className="text-xs text-black mb-2">
                    选择要导入的产品小类，系统将使用您选择的小类，不再进行自动识别
                  </p>
                  <select
                    value={importSubCategory}
                    onChange={(e) => setImportSubCategory(e.target.value)}
                    className="w-full rounded border-2 border-blue-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none text-black font-medium"
                    suppressHydrationWarning
                  >
                    <option value="">请选择产品小类...</option>
                    {Object.entries(SUB_CATEGORIES).map(([category, subCats]) => (
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

            <p className="mb-4 text-sm text-black">
              💡 <strong>快速更新模式</strong>：输入已存在的产品货号，自动填充信息并更新价格<br/>
              💡 <strong>新增产品模式</strong>：输入新货号，添加新产品
            </p>
            <div className="space-y-4" suppressHydrationWarning>
              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  当前分类
                </label>
                <input
                  type="text"
                  value={currentSubCategory ? `${currentCategory} / ${currentSubCategory}` : currentCategory}
                  readOnly
                  className="w-full rounded border border-gray-300 px-4 py-2 bg-gray-100 text-black cursor-not-allowed"
                  suppressHydrationWarning
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    产品货号 *
                  </label>
                  <input
                    type="text"
                    value={currentProduct.productCode}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        productCode: e.target.value,
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    产品名称 *
                  </label>
                  <input
                    type="text"
                    value={currentProduct.productName}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        productName: e.target.value,
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* 特殊系数设置（可选） */}
              <div className="rounded-lg border-2 border-gray-200 p-4">
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-black">
                    特殊系数设置（可选，留空则使用全局固定系数）
                  </label>
                  <p className="text-xs text-black">
                    为此产品单独设置不同的系数，覆盖全局固定系数
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">
                      特殊材料损耗系数
                    </label>
                    <input
                      type="number"
                      value={currentProduct.specialMaterialLoss ?? ""}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          specialMaterialLoss: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                      step="0.01"
                      placeholder={`默认: ${coefficients.materialLoss}`}
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">
                      特殊材料浮动系数
                    </label>
                    <input
                      type="number"
                      value={currentProduct.specialMaterialCost ?? ""}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          specialMaterialCost: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                      step="0.01"
                      placeholder={`默认: ${coefficients.materialCost}`}
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">
                      特殊关税系数
                    </label>
                    <input
                      type="number"
                      value={currentProduct.specialProfitMargin ?? ""}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          specialProfitMargin: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                      step="0.01"
                      placeholder={`默认: ${coefficients.profitMargin}`}
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">
                      特殊零售价工费系数
                    </label>
                    <input
                      type="number"
                      value={currentProduct.specialLaborFactorRetail ?? ""}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          specialLaborFactorRetail: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                      step="0.1"
                      placeholder={`默认: ${coefficients.laborFactorRetail}`}
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">
                      特殊批发价工费系数
                    </label>
                    <input
                      type="number"
                      value={currentProduct.specialLaborFactorWholesale ?? ""}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          specialLaborFactorWholesale: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                      step="0.1"
                      placeholder={`默认: ${coefficients.laborFactorWholesale}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  产品规格
                </label>
                <input
                  type="text"
                  value={currentProduct.specification}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      specification: e.target.value,
                    })
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                  suppressHydrationWarning
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    重量（克）
                  </label>
                  <input
                    type="number"
                    value={currentProduct.weight}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        weight: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    人工成本（人民币）
                  </label>
                  <input
                    type="number"
                    value={currentProduct.laborCost}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        laborCost: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* 新增成本字段 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    配件成本（人民币）
                  </label>
                  <input
                    type="number"
                    value={currentProduct.accessoryCost}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        accessoryCost: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    石头成本（人民币）
                  </label>
                  <input
                    type="number"
                    value={currentProduct.stoneCost}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        stoneCost: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    电镀成本（人民币）
                  </label>
                  <input
                    type="number"
                    value={currentProduct.platingCost}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        platingCost: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    模具成本（人民币）
                  </label>
                  <input
                    type="number"
                    value={currentProduct.moldCost}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        moldCost: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    佣金（%）
                  </label>
                  <input
                    type="number"
                    value={currentProduct.commission}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        commission: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    供应商代码
                  </label>
                  <input
                    type="text"
                    value={currentProduct.supplierCode}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        supplierCode: e.target.value,
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    下单口
                  </label>
                  <select
                    value={currentProduct.orderChannel || ""}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        orderChannel: e.target.value as OrderChannel | "",
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    suppressHydrationWarning
                  >
                    <option value="">请选择下单口</option>
                    {ORDER_CHANNELS.map((channel) => (
                      <option key={channel.code} value={channel.code}>
                        {channel.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    形状
                  </label>
                  <select
                    value={currentProduct.shape || ""}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        shape: e.target.value as ProductShape,
                      })
                    }
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                    suppressHydrationWarning
                  >
                    <option value="">请选择形状</option>
                    {PRODUCT_SHAPES.map((shape) => (
                      <option key={shape} value={shape}>
                        {shape}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  材质类型
                </label>
                <select
                  value={currentProduct.karat}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      karat: e.target.value as "10K" | "14K" | "18K",
                    })
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                  suppressHydrationWarning
                >
                  <option value="10K">10K金</option>
                  <option value="14K">14K金</option>
                  <option value="18K">18K金</option>
                </select>
                <div className="mt-1 text-xs text-black">
                  💡 货号中包含 /10K、/14K、/18K、/K10、/K14、/K18 等标识会自动识别
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  金子颜色
                </label>
                <select
                  value={currentProduct.goldColor}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      goldColor: e.target.value as "黄金" | "白金" | "玫瑰金",
                    })
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                  suppressHydrationWarning
                >
                  <option value="黄金">黄金</option>
                  <option value="白金">白金</option>
                  <option value="玫瑰金">玫瑰金</option>
                </select>
              </div>

              <button
                onClick={addProduct}
                className="w-full rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
                suppressHydrationWarning
              >
                添加产品
              </button>
            </div>
          </div>

          {/* 当前产品列表 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">
                当前产品列表-{currentCategory}{currentSubCategory ? `-${currentSubCategory}` : ''}
              </h2>
              {products.filter(p => p.category === currentCategory).length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-black font-medium">导出范围:</label>
                  <select
                    value={exportScope}
                    onChange={(e) => setExportScope(e.target.value as "current" | "all")}
                    className="px-3 py-2 border border-gray-300 rounded text-sm text-black"
                    suppressHydrationWarning
                  >
                    <option value="current">当前分类</option>
                    <option value="all">所有分类</option>
                  </select>
                  <button
                    onClick={() => exportToExcel()}
                    className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                    suppressHydrationWarning
                  >
                    导出Excel
                  </button>
                </div>
              )}
            </div>

            {/* 搜索框 */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入关键词搜索..."
                  className="flex-1 rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
                  suppressHydrationWarning
                />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as "name" | "specification" | "supplierCode" | "karat" | "shape" | "all")}
                  className="px-3 py-2 border border-gray-300 rounded text-sm text-black"
                  suppressHydrationWarning
                >
                  <option value="all">全部</option>
                  <option value="name">产品名称</option>
                  <option value="specification">规格</option>
                  <option value="supplierCode">供应商代码</option>
                  <option value="karat">K金含量</option>
                  <option value="shape">形状</option>
                </select>
                <select
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value as "current" | "all")}
                  className="px-3 py-2 border border-gray-300 rounded text-sm text-black"
                  suppressHydrationWarning
                >
                  <option value="current">当前分类</option>
                  <option value="all">全部分类</option>
                </select>
              </div>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchType("all");
                  }}
                  className="rounded bg-gray-200 px-4 py-2 text-black hover:bg-gray-300 text-sm"
                  suppressHydrationWarning
                >
                  清除搜索
                </button>
              )}
            </div>

            {/* 悬浮横向滚动条 */}
            <div 
              className="fixed bottom-4 right-4 z-50 bg-white shadow-xl rounded-lg border border-gray-300 p-3 hover:opacity-100 opacity-70 transition-all duration-200"
              style={{ maxWidth: '70%' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-black">↔️ 横向滚动</span>
                <button 
                  onClick={() => {
                    const scrollBar = scrollBarRef.current;
                    const tableContainer = tableContainerRef.current;
                    if (scrollBar && tableContainer) {
                      updateScrollBarWidth();
                      scrollBar.scrollLeft = tableContainer.scrollLeft;
                    }
                  }}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  suppressHydrationWarning
                >
                  🔄 同步
                </button>
              </div>
              <div
                ref={scrollBarRef}
                className="h-5 bg-gray-100 border border-gray-200 rounded cursor-grab active:cursor-grabbing"
                style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}
                onScroll={(e) => syncScroll(e.currentTarget, tableContainerRef.current!)}
              >
                <div id="scrollBarContent" style={{ width: '20000px', height: '20px' }}></div>
              </div>
              <div className="text-xs text-black mt-1">
                表格宽度: <span id="tableWidthInfo">--</span> px | 滚动条宽度: <span id="scrollBarWidthInfo">--</span> px
              </div>
            </div>

            <div
              ref={tableContainerRef}
              className="overflow-x-auto"
              style={{ maxHeight: '70vh' }}
              onScroll={handleTableScroll}
            >
              <table 
                className="border-collapse border border-gray-200 text-sm sticky-header-table"
                style={{ minWidth: '100%', tableLayout: 'auto' }}
              >
                <thead className="bg-gray-100 sticky top-0 z-10" style={{ position: 'sticky' }}>
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-center text-black w-12 bg-gray-100">
                      <input
                        type="checkbox"
                        checked={(() => {
                          const displayedProducts = products
                            .filter(p => searchScope === "current" ? p.category === currentCategory : true)
                            .filter(p => {
                              // 子分类筛选：如果选中了子分类，只显示匹配的子分类产品
                              if (currentSubCategory) {
                                return p.subCategory === currentSubCategory;
                              }
                              return true;
                            })
                            .filter(p => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              if (searchType === "name") {
                                return p.productName.toLowerCase().includes(query);
                              } else if (searchType === "specification") {
                                return p.specification.toLowerCase().includes(query);
                              } else if (searchType === "supplierCode") {
                                return p.supplierCode.toLowerCase().includes(query);
                              } else if (searchType === "karat") {
                                return p.karat.toLowerCase().includes(query);
                              } else if (searchType === "shape") {
                                return (p.shape || "").toLowerCase().includes(query);
                              } else {
                                return (
                                  p.productName.toLowerCase().includes(query) ||
                                  p.specification.toLowerCase().includes(query) ||
                                  p.productCode.toLowerCase().includes(query) ||
                                  p.supplierCode.toLowerCase().includes(query) ||
                                  p.karat.toLowerCase().includes(query) ||
                                  (p.shape || "").toLowerCase().includes(query)
                                );
                              }
                            });
                          const displayedIds = displayedProducts.map(p => p.id);
                          if (displayedIds.length === 0) return false;
                          return displayedIds.every(id => selectedProducts.has(id));
                        })()}
                        onChange={(e) => {
                          const displayedProducts = products
                            .filter(p => searchScope === "current" ? p.category === currentCategory : true)
                            .filter(p => {
                              // 子分类筛选：如果选中了子分类，只显示匹配的子分类产品
                              if (currentSubCategory) {
                                return p.subCategory === currentSubCategory;
                              }
                              return true;
                            })
                            .filter(p => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              if (searchType === "name") {
                                return p.productName.toLowerCase().includes(query);
                              } else if (searchType === "specification") {
                                return p.specification.toLowerCase().includes(query);
                              } else if (searchType === "supplierCode") {
                                return p.supplierCode.toLowerCase().includes(query);
                              } else if (searchType === "karat") {
                                return p.karat.toLowerCase().includes(query);
                              } else if (searchType === "shape") {
                                return (p.shape || "").toLowerCase().includes(query);
                              } else {
                                return (
                                  p.productName.toLowerCase().includes(query) ||
                                  p.specification.toLowerCase().includes(query) ||
                                  p.productCode.toLowerCase().includes(query) ||
                                  p.supplierCode.toLowerCase().includes(query) ||
                                  p.karat.toLowerCase().includes(query) ||
                                  (p.shape || "").toLowerCase().includes(query)
                                );
                              }
                            });
                          const displayedIds = displayedProducts.map(p => p.id);
                          const newSelected = new Set(selectedProducts);
                          if (e.target.checked) {
                            displayedIds.forEach(id => newSelected.add(id));
                          } else {
                            displayedIds.forEach(id => newSelected.delete(id));
                          }
                          setSelectedProducts(newSelected);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        suppressHydrationWarning
                      />
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">分类</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">货号</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">名称</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">成色</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">颜色</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">规格</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">形状</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">重量</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">工费</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">配件</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">石头</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">电镀</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">模具</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">佣金</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">供应商</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-black bg-gray-100">下单口</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">金价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">零售价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-black bg-gray-100">批发价</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-black bg-gray-100">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => searchScope === "current" ? p.category === currentCategory : true)
                    .filter(p => {
                      // 子分类筛选：如果选中了子分类，只显示匹配的子分类产品
                      if (currentSubCategory) {
                        return p.subCategory === currentSubCategory;
                      }
                      return true;
                    })
                    .filter(p => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      if (searchType === "name") {
                        return p.productName.toLowerCase().includes(query);
                      } else if (searchType === "specification") {
                        return p.specification.toLowerCase().includes(query);
                      } else if (searchType === "supplierCode") {
                        return p.supplierCode.toLowerCase().includes(query);
                      } else if (searchType === "karat") {
                        return p.karat.toLowerCase().includes(query);
                      } else if (searchType === "shape") {
                        return (p.shape || "").toLowerCase().includes(query);
                      } else {
                        return (
                          p.productName.toLowerCase().includes(query) ||
                          p.specification.toLowerCase().includes(query) ||
                          p.productCode.toLowerCase().includes(query) ||
                          p.supplierCode.toLowerCase().includes(query) ||
                          p.karat.toLowerCase().includes(query) ||
                          (p.shape || "").toLowerCase().includes(query)
                        );
                      }
                    })
                    .map((product) => (
                    <tr 
                      key={product.id}
                      className={selectedProducts.has(product.id) ? "bg-blue-50" : product.id === currentProduct.id ? "bg-yellow-50" : ""}
                    >
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedProducts);
                            if (e.target.checked) {
                              newSelected.add(product.id);
                            } else {
                              newSelected.delete(product.id);
                            }
                            setSelectedProducts(newSelected);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          suppressHydrationWarning
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-black">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          {product.category || "-"}{product.subCategory ? `-${product.subCategory}` : ""}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 font-semibold text-black">{product.productCode}</td>
                      <td className="border border-gray-200 px-3 py-2 font-medium text-black">{product.productName}</td>
                      <td className="border border-gray-200 px-3 py-2 text-black">{product.karat}</td>
                      <td className="border border-gray-200 px-3 py-2 text-black">{product.goldColor}</td>
                      <td className="border border-gray-200 px-3 py-2 text-black text-xs">{product.specification}</td>
                      <td className="border border-gray-200 px-3 py-2 text-black">{product.shape || "-"}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right text-black">{product.weight}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-black">¥{product.laborCost.toFixed(2)}</div>
                        <div className="text-xs text-black">{formatDate(product.laborCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-black">¥{product.accessoryCost.toFixed(2)}</div>
                        <div className="text-xs text-black">{formatDate(product.accessoryCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-black">¥{product.stoneCost.toFixed(2)}</div>
                        <div className="text-xs text-black">{formatDate(product.stoneCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-black">¥{product.platingCost.toFixed(2)}</div>
                        <div className="text-xs text-black">{formatDate(product.platingCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-black">¥{product.moldCost.toFixed(2)}</div>
                        <div className="text-xs text-black">{formatDate(product.moldCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-black">{product.commission}%</div>
                        <div className="text-xs text-black">{formatDate(product.commissionDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-left font-medium text-black">{product.supplierCode || "-"}</td>
                      <td className="border border-gray-200 px-3 py-2 text-left font-medium text-black">
                        {product.orderChannel ? (
                          (() => {
                            const channel = ORDER_CHANNELS.find(d => d.code === product.orderChannel);
                            return channel ? channel.code : product.orderChannel;
                          })()
                        ) : "-"}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-semibold text-black">
                          {product.goldPrice ? `¥${product.goldPrice.toFixed(2)}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-black">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className={`font-bold ${isProductModified(product.id) ? 'text-red-700' : 'text-green-700'}`}>
                          {isProductModified(product.id) && <span className="mr-1">★</span>}
                          CAD${product.retailPrice.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-black">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className={`font-bold ${isProductModified(product.id) ? 'text-red-700' : 'text-blue-700'}`}>
                          {isProductModified(product.id) && <span className="mr-1">★</span>}
                          CAD${product.wholesalePrice.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-black">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-500 hover:text-red-700"
                          suppressHydrationWarning
                        >
                          删除
                        </button>
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
        </div>

        {/* 历史记录 */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-black">
              价格历史记录 - {currentCategory}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">时间</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">分类</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">货号</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">名称</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">成色</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">颜色</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">形状</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-black">重量</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-black">市场金价（人民币/克）</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-black">零售价</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-black">批发价</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-black">下单口</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.filter(h => h.category === currentCategory).map((history) => (
                  <tr key={history.id}>
                    <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-black">
                      {formatDate(history.timestamp)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-black">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        {history.category || "-"}{history.subCategory ? `-${history.subCategory}` : ""}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-black">{history.productCode}</td>
                    <td className="border border-gray-200 px-3 py-2 text-black">{history.productName}</td>
                    <td className="border border-gray-200 px-3 py-2 text-black">{history.karat}</td>
                    <td className="border border-gray-200 px-3 py-2 text-black">{history.goldColor}</td>
                    <td className="border border-gray-200 px-3 py-2 text-black">{history.shape || "-"}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-black">{history.weight}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-black">
                      ¥{history.goldPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-green-600">
                      CAD${history.retailPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-blue-600">
                      CAD${history.wholesalePrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-left text-black">
                      {history.orderChannel ? (
                        (() => {
                          const channel = ORDER_CHANNELS.find(d => d.code === history.orderChannel);
                          return channel ? channel.code : history.orderChannel;
                        })()
                      ) : "-"}
                    </td>
                  </tr>
                ))}
                {priceHistory.filter(h => h.category === currentCategory).length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="border border-gray-200 px-3 py-4 text-center text-black"
                    >
                      暂无{currentCategory}历史记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 批量更新供应商代码对话框 */}
      {showBatchUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-black mb-4">批量更新供应商代码</h2>
            <p className="text-sm text-black mb-4">
              为当前分类（{currentCategory}）的产品批量设置供应商代码。按照货号范围进行更新。
            </p>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-black bg-gray-100 p-2 rounded">
                <div className="col-span-8">货号列表（用逗号分隔）</div>
                <div className="col-span-3">供应商代码</div>
                <div className="col-span-1">操作</div>
              </div>

              {batchUpdateRules.map((rule, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8">
                    <textarea
                      value={rule.productCodes}
                      onChange={(e) => {
                        const newRules = [...batchUpdateRules];
                        newRules[index].productCodes = e.target.value;
                        setBatchUpdateRules(newRules);
                      }}
                      className="w-full min-w-[200px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-black resize-none"
                      placeholder="KEW001,KEW002,KEW003"
                      rows={2}
                      suppressHydrationWarning
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={rule.supplierCode}
                      onChange={(e) => {
                        const newRules = [...batchUpdateRules];
                        newRules[index].supplierCode = e.target.value;
                        setBatchUpdateRules(newRules);
                      }}
                      className="w-full min-w-[80px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-black"
                      placeholder="J5"
                      suppressHydrationWarning
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => {
                        const newRules = batchUpdateRules.filter((_, i) => i !== index);
                        setBatchUpdateRules(newRules);
                      }}
                      className="w-full rounded bg-gray-400 px-3 py-2 text-white hover:bg-gray-500 text-xs"
                      suppressHydrationWarning
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setBatchUpdateRules([...batchUpdateRules, { productCodes: "", supplierCode: "" }])}
                className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 text-sm"
                suppressHydrationWarning
              >
                + 添加规则
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowBatchUpdateModal(false)}
                className="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
                suppressHydrationWarning
              >
                取消
              </button>
              <button
                onClick={batchUpdateSupplierCode}
                className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
                suppressHydrationWarning
              >
                确认批量更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量修改下单口对话框 */}
      {showBatchUpdateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-black mb-4">批量修改下单口</h2>
            <p className="text-sm text-black mb-4">
              为当前分类（{currentCategory}）的产品批量设置下单口。按照货号范围进行更新。
            </p>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-black bg-gray-100 p-2 rounded">
                <div className="col-span-8">货号列表（用逗号分隔）</div>
                <div className="col-span-3">下单口</div>
                <div className="col-span-1">操作</div>
              </div>

              {batchUpdateChannelRules.map((rule, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8">
                    <textarea
                      value={rule.productCodes}
                      onChange={(e) => {
                        const newRules = [...batchUpdateChannelRules];
                        newRules[index].productCodes = e.target.value;
                        setBatchUpdateChannelRules(newRules);
                      }}
                      className="w-full min-w-[200px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-black resize-none"
                      placeholder="KEW001,KEW002,KEW003"
                      rows={2}
                      suppressHydrationWarning
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={rule.orderChannel}
                      onChange={(e) => {
                        const newRules = [...batchUpdateChannelRules];
                        newRules[index].orderChannel = e.target.value as OrderChannel | "";
                        setBatchUpdateChannelRules(newRules);
                      }}
                      className="w-full min-w-[80px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-black"
                      suppressHydrationWarning
                    >
                      <option value="">请选择</option>
                      {ORDER_CHANNELS.map(channel => (
                        <option key={channel.code} value={channel.code}>{channel.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => {
                        const newRules = batchUpdateChannelRules.filter((_, i) => i !== index);
                        setBatchUpdateChannelRules(newRules);
                      }}
                      className="w-full rounded bg-gray-400 px-3 py-2 text-white hover:bg-gray-500 text-xs"
                      suppressHydrationWarning
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setBatchUpdateChannelRules([...batchUpdateChannelRules, { productCodes: "", orderChannel: "" }])}
                className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 text-sm"
                suppressHydrationWarning
              >
                + 添加规则
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowBatchUpdateChannelModal(false)}
                className="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
                suppressHydrationWarning
              >
                取消
              </button>
              <button
                onClick={batchUpdateOrderChannel}
                className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
                suppressHydrationWarning
              >
                确认批量更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量修改价格系数对话框 */}
      {showBatchModifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-black mb-4">批量修改价格系数</h2>
            <p className="text-sm text-black mb-4">
              批量修改符合条件的产品的价格系数和成本。修改后将自动重新计算价格。
            </p>

            {/* 修改范围 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">修改范围</label>
              <div className="flex gap-4">
                <label className="flex items-center text-black">
                  <input
                    type="radio"
                    name="scope"
                    checked={batchModifyConfig.scope === "current"}
                    onChange={() => setBatchModifyConfig({...batchModifyConfig, scope: "current"})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  当前分类（{currentCategory}）
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="radio"
                    name="scope"
                    checked={batchModifyConfig.scope === "all"}
                    onChange={() => setBatchModifyConfig({...batchModifyConfig, scope: "all"})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  全部分类
                </label>
              </div>
            </div>

            {/* 选择要修改的字段 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">选择要修改的字段</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.laborCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, laborCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  工费
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.accessoryCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, accessoryCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  配件成本
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.stoneCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, stoneCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  石头成本
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.platingCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, platingCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  电镀成本
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.moldCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, moldCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  模具成本
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.commission}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, commission: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  佣金率
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.weight}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, weight: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  重量
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.goldPrice}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, goldPrice: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  市场金价
                </label>
              </div>
            </div>

            {/* 新值输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">输入新值（人民币）</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {batchModifyConfig.fields.laborCost && (
                  <div>
                    <label className="block text-xs text-black mb-1">工费</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.laborCost}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, laborCost: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
                {batchModifyConfig.fields.accessoryCost && (
                  <div>
                    <label className="block text-xs text-black mb-1">配件成本</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.accessoryCost}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, accessoryCost: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
                {batchModifyConfig.fields.stoneCost && (
                  <div>
                    <label className="block text-xs text-black mb-1">石头成本</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.stoneCost}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, stoneCost: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
                {batchModifyConfig.fields.platingCost && (
                  <div>
                    <label className="block text-xs text-black mb-1">电镀成本</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.platingCost}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, platingCost: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
                {batchModifyConfig.fields.moldCost && (
                  <div>
                    <label className="block text-xs text-black mb-1">模具成本</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.moldCost}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, moldCost: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
                {batchModifyConfig.fields.commission && (
                  <div>
                    <label className="block text-xs text-black mb-1">佣金率（%）</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.commission}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, commission: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
                {batchModifyConfig.fields.weight && (
                  <div>
                    <label className="block text-xs text-black mb-1">重量（克）</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.weight}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, weight: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
                {batchModifyConfig.fields.goldPrice && (
                  <div>
                    <label className="block text-xs text-black mb-1">市场金价（元/克）</label>
                    <input
                      type="number"
                      value={batchModifyConfig.newValues.goldPrice}
                      onChange={(e) => setBatchModifyConfig({...batchModifyConfig, newValues: {...batchModifyConfig.newValues, goldPrice: Number(e.target.value)}})}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      step="0.01"
                      suppressHydrationWarning
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 筛选条件 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">筛选条件（留空表示不筛选）</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-black mb-1">产品名称</label>
                  <input
                    type="text"
                    value={batchModifyConfig.filters.productName}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, filters: {...batchModifyConfig.filters, productName: e.target.value}})}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="产品名称关键词"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">货号</label>
                  <input
                    type="text"
                    value={batchModifyConfig.filters.productCode}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, filters: {...batchModifyConfig.filters, productCode: e.target.value}})}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="货号关键词"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">供应商代码</label>
                  <input
                    type="text"
                    value={batchModifyConfig.filters.supplierCode}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, filters: {...batchModifyConfig.filters, supplierCode: e.target.value}})}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="供应商代码"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">形状</label>
                  <select
                    value={batchModifyConfig.filters.shape}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, filters: {...batchModifyConfig.filters, shape: e.target.value}})}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    suppressHydrationWarning
                  >
                    <option value="">不限</option>
                    {PRODUCT_SHAPES.map((shape) => (
                      <option key={shape} value={shape}>{shape}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">K金含量</label>
                  <select
                    value={batchModifyConfig.filters.karat}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, filters: {...batchModifyConfig.filters, karat: e.target.value}})}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    suppressHydrationWarning
                  >
                    <option value="">不限</option>
                    <option value="10K">10K金</option>
                    <option value="14K">14K金</option>
                    <option value="18K">18K金</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowBatchModifyModal(false)}
                className="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
                suppressHydrationWarning
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 实现批量修改逻辑
                  handleBatchModify();
                }}
                className="rounded bg-pink-600 px-6 py-2 text-white hover:bg-pink-700"
                suppressHydrationWarning
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 操作指引模态框 */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">📚 操作指引</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-white hover:text-gray-200 text-3xl"
              >
                ×
              </button>
            </div>

            {/* 搜索栏 */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 搜索功能或问题...（例如：导出、批量操作、计算价格）"
                  value={helpSearchQuery}
                  onChange={(e) => setHelpSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute left-3 top-3 text-gray-400">🔍</span>
              </div>
            </div>

            {/* 内容区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-8">
                {/* 快速入门 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                    快速入门
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <p className="text-black">
                      <strong>第一步：</strong> 输入或导入产品数据（货号、名称、重量等）
                    </p>
                    <p className="text-black">
                      <strong>第二步：</strong> 设置当前金价和价格系数
                    </p>
                    <p className="text-black">
                      <strong>第三步：</strong> 系统自动计算批发价和零售价
                    </p>
                    <p className="text-black">
                      <strong>第四步：</strong> 导出报价单或备份数据
                    </p>
                  </div>
                </section>

                {/* 产品管理 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    产品管理
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">添加单个产品</h4>
                      <p className="text-sm text-black mb-2">在"产品信息录入"区域填写信息，点击"添加产品"按钮</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-xs text-black rounded">货号（必填）</span>
                        <span className="px-2 py-1 bg-gray-100 text-xs text-black rounded">名称（必填）</span>
                        <span className="px-2 py-1 bg-gray-100 text-xs text-black rounded">重量</span>
                        <span className="px-2 py-1 bg-gray-100 text-xs text-black rounded">工费</span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">批量导入产品</h4>
                      <p className="text-sm text-black mb-2">点击"批量导入"选择Excel文件，支持 .xlsx、.xls、.csv 格式</p>
                      <div className="text-xs text-black bg-gray-50 p-2 rounded">
                        Excel 必须包含：货号、名称列，可选包含：规格、重量、工费等
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">编辑/删除产品</h4>
                      <p className="text-sm text-black">在产品列表中，每行右侧有"编辑"、"查看历史"、"删除"按钮</p>
                    </div>
                  </div>
                </section>

                {/* 价格计算 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
                    价格计算
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">修改金价</h4>
                      <p className="text-sm text-black mb-2">在"金价设置"区域输入新的市场金价（人民币/克）</p>
                      <p className="text-xs text-black bg-amber-50 p-2 rounded">
                        ⚠️ <strong>重要提示：</strong>修改金价后，<strong>不会自动影响已导入的产品价格</strong>。已导入产品的价格保持不变，新导入的产品会使用新金价计算。如果需要根据新金价更新现有产品价格，请使用"批量操作"区域的"🔄 更新选中产品价格"按钮。
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">更新产品价格</h4>
                      <p className="text-sm text-black mb-2">
                        1. 在产品列表勾选需要更新的产品<br />
                        2. 点击"批量操作"区域的"🔄 更新选中产品价格"按钮
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">调整价格系数</h4>
                      <p className="text-sm text-black mb-2">在"价格系数设置"区域修改各种系数</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 text-black rounded">金含量系数</span>
                        <span className="px-2 py-1 bg-gray-100 text-black rounded">工费系数</span>
                        <span className="px-2 py-1 bg-gray-100 text-black rounded">材料损耗系数</span>
                        <span className="px-2 py-1 bg-gray-100 text-black rounded">汇率</span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">为特定产品设置特殊系数</h4>
                      <p className="text-sm text-black mb-2">在编辑产品时，可以设置该产品的特殊系数，优先使用特殊系数而不是全局系数</p>
                    </div>
                  </div>
                </section>

                {/* 批量操作 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
                    批量操作
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🔄 更新选中产品价格</h4>
                      <p className="text-sm text-black">根据当前金价和系数，重新计算选中产品的价格</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🏷️ 批量更新供应商代码</h4>
                      <p className="text-sm text-black">根据货号列表批量设置供应商代码</p>
                      <p className="text-xs text-black bg-purple-50 p-2 rounded mt-2">
                        适用场景：新供应商接手一批产品，需要批量更换供应商代码
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">📦 批量修改下单口</h4>
                      <p className="text-sm text-black">根据货号列表批量修改下单口</p>
                      <p className="text-xs text-black bg-purple-50 p-2 rounded mt-2">
                        适用场景：某个产品改由不同的办公室下单
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">✏️ 批量修改价格系数</h4>
                      <p className="text-sm text-black">批量修改产品的工费、配件、石头等成本</p>
                      <p className="text-xs text-black bg-purple-50 p-2 rounded mt-2">
                        适用场景：供应商调整了工费，需要批量更新
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🗑️ 批量删除选中产品</h4>
                      <p className="text-sm text-black">删除选中的产品及其所有历史记录</p>
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                        ⚠️ 此操作不可恢复，请谨慎操作
                      </p>
                    </div>
                  </div>
                </section>

                {/* 数据导出与备份 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">5</span>
                    数据导出与备份
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">📤 导出产品列表</h4>
                      <p className="text-sm text-black mb-2">导出当前显示的产品列表到Excel文件</p>
                      <p className="text-xs text-black bg-emerald-50 p-2 rounded">
                        适用场景：分享给客户、打印报价单、进一步编辑
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">📦 导出数据备份</h4>
                      <p className="text-sm text-black mb-2">导出完整数据（产品、历史、配置）到Excel或JSON文件</p>
                      <p className="text-xs text-black bg-emerald-50 p-2 rounded">
                        适用场景：数据迁移、定期备份、跨设备同步
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">恢复数据</h4>
                      <p className="text-sm text-black mb-2">从备份文件恢复数据到系统</p>
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                        ⚠️ 会覆盖当前所有数据，请先备份
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">✅ 验证数据</h4>
                      <p className="text-sm text-black mb-2">检查数据完整性和准确性，确保导出前数据无误</p>
                      <p className="text-xs text-black bg-blue-50 p-2 rounded mt-2">
                        建议：导出前先验证数据
                      </p>
                    </div>
                  </div>
                </section>

                {/* 云端数据同步 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm">6</span>
                    云端数据同步
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-black mb-2">☁️ 什么是云端同步？</h4>
                      <p className="text-sm text-black">
                        云端同步可以将您的产品数据、价格系数、金价设置等自动保存到云端数据库，支持多设备访问和数据备份。
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">📤 上传到云端</h4>
                      <p className="text-sm text-black mb-2">将本地所有数据上传到云端数据库</p>
                      <div className="text-xs text-black bg-blue-50 p-2 rounded mt-2">
                        包含：所有产品、价格历史、金价设置、价格系数
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">📥 合并下载（推荐）</h4>
                      <p className="text-sm text-black mb-2">将云端数据与本地数据合并，云端数据优先</p>
                      <div className="text-xs text-black bg-green-50 p-2 rounded mt-2">
                        适用场景：在不同设备上操作过，想保留所有数据
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🔄 替换下载</h4>
                      <p className="text-sm text-black mb-2">完全使用云端数据替换本地数据</p>
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                        ⚠️ 会清空本地所有数据！请确保云端数据完整
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🔍 检查云端数据</h4>
                      <p className="text-sm text-black mb-2">快速检查云端是否有数据可以下载</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">✅ 自动同步</h4>
                      <p className="text-sm text-black mb-2">数据变更时自动上传到云端（默认开启）</p>
                      <div className="text-xs text-black bg-cyan-50 p-2 rounded mt-2">
                        包含：产品数据、历史记录、金价、系数（延迟3秒同步，避免频繁上传）
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">💡 使用建议</h4>
                      <ul className="text-sm text-black space-y-1 list-disc list-inside">
                        <li>首次使用时，建议先开启"自动同步"功能</li>
                        <li>在多设备间同步时，优先使用"合并下载"</li>
                        <li>换新设备时，使用"替换下载"导入云端数据</li>
                        <li>替换下载前，建议先通过"备份数据"按钮备份本地数据</li>
                        <li>可以关闭"自动同步"手动控制同步时机</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 高级工具 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm">7</span>
                    高级工具（更多工具菜单）
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🔍 诊断数据</h4>
                      <p className="text-sm text-black">检查数据中的异常和问题，提供修复建议</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🔧 修复子分类</h4>
                      <p className="text-sm text-black">自动修复缺少子分类的产品</p>
                      <p className="text-xs text-black bg-blue-50 p-2 rounded mt-2">
                        适用场景：数据迁移或导入后，部分产品缺少子分类信息
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-black mb-2">🗑️ 清除本地数据</h4>
                      <p className="text-sm text-black">清除所有本地存储的数据（产品、历史、配置）</p>
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                        ⚠️ 危险操作，清除后需要重新导入数据。云端数据库数据不受影响
                      </p>
                    </div>
                  </div>
                </section>

                {/* 常见问题 */}
                <section>
                  <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">?</span>
                    常见问题
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 修改金价后，已导入的产品价格会自动更新吗？</h4>
                      <p className="text-sm text-black">
                        A: <strong>不会自动更新</strong>。已导入产品的价格是在导入时根据当时的金价计算的，保持不变。如果需要根据新金价更新现有产品价格，请在产品列表中勾选需要更新的产品，然后点击"批量操作"区域的"🔄 更新选中产品价格"按钮。新导入的产品会自动使用当前金价计算。
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 价格计算公式是什么？</h4>
                      <p className="text-sm text-black">
                        A: 总价 = (材料价 + 工费 + 其它成本) × (1 + 佣金率) × 国际运输和关税系数
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 什么是副号？</h4>
                      <p className="text-sm text-black">
                        A: 副号是在原货号基础上生成的变体货号，用于区分不同规格或系数的产品
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 数据存储在哪里？</h4>
                      <p className="text-sm text-black">
                        A: 数据同时存储在浏览器本地存储（localStorage）和云端数据库，支持多设备同步。本地数据可以离线使用，云端数据支持跨设备访问和备份。
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 如何批量修改产品成本？</h4>
                      <p className="text-sm text-black">
                        A: 使用"批量操作" → "✏️ 批量修改价格系数"功能
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 合并下载和替换下载有什么区别？</h4>
                      <p className="text-sm text-black">
                        A: <strong>合并下载</strong>：将云端和本地数据融合，云端数据优先，适合在不同设备上操作后同步。<br/>
                        <strong>替换下载</strong>：完全丢弃本地数据，使用云端数据，适合换新设备或本地数据损坏时恢复。⚠️ 替换前请确保云端数据完整。
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 自动同步会影响性能吗？</h4>
                      <p className="text-sm text-black">
                        A: 不会。自动同步使用3秒防抖机制，避免频繁上传。只有数据变更停止3秒后才会触发同步，同步在后台进行，不影响操作。
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 没有网络时可以使用系统吗？</h4>
                      <p className="text-sm text-black">
                        A: 可以。数据同时保存在本地浏览器，可以离线使用。但无法进行云端同步操作，网络恢复后会自动继续同步（如果开启自动同步）。
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-black mb-2">Q: 如何在多台电脑间同步数据？</h4>
                      <p className="text-sm text-black">
                        A: 1. 在电脑A上开启自动同步，确保数据已上传到云端<br/>
                        2. 在电脑B登录账号，首次登录时会提示是否下载云端数据<br/>
                        3. 选择"合并下载"保留两台电脑的数据<br/>
                        4. 之后所有操作都会自动同步，保持两台电脑数据一致
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* 底部 */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-black">
                💡 需要更多帮助？请联系技术支持
              </p>
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 验证结果模态框 */}
      {showVerificationModal && verificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">数据完整性验证结果</h2>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-black hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-black mb-6">
              <p className="mb-2">
                <strong>验证时间：</strong> {new Date(verificationResult.timestamp).toLocaleString('zh-CN')}
              </p>
              <p className={`mb-4 ${verificationResult.success ? 'text-green-600' : 'text-orange-600'}`}>
                <strong>{verificationResult.overallStatus}</strong>
              </p>

              {/* 产品数据 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-black mb-2">📦 产品数据</h3>
                <div className="space-y-1">
                  <p>- 本地: {verificationResult.details.products.localCount} 个</p>
                  <p>- 数据库: {verificationResult.details.products.databaseCount} 个</p>
                  <p>- 状态: <span className={`font-medium ${
                    verificationResult.details.products.match ? 'text-green-600' : 'text-red-600'
                  }`}>{verificationResult.details.products.status}</span></p>
                  {verificationResult.details.products.message && (
                    <p className="text-gray-600 text-sm">{verificationResult.details.products.message}</p>
                  )}
                  {verificationResult.details.products.mismatchedIds && verificationResult.details.products.mismatchedIds.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                      <p className="font-medium text-red-700 mb-1">
                        ⚠️ 不匹配的ID ({verificationResult.details.products.mismatchedIds.length} 个):
                      </p>
                      <div className="max-h-32 overflow-y-auto text-xs font-mono bg-white p-2 rounded">
                        {verificationResult.details.products.mismatchedIds.map((id: string, idx: number) => (
                          <div key={idx}>{id}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 价格历史 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-black mb-2">📈 价格历史</h3>
                <div className="space-y-1">
                  <p>- 本地: {verificationResult.details.history.localCount} 条</p>
                  <p>- 数据库: {verificationResult.details.history.databaseCount} 条</p>
                  <p>- 状态: <span className={`font-medium ${
                    verificationResult.details.history.match ? 'text-green-600' : 'text-red-600'
                  }`}>{verificationResult.details.history.status}</span></p>
                  {verificationResult.details.history.message && (
                    <p className="text-gray-600 text-sm">{verificationResult.details.history.message}</p>
                  )}
                  {verificationResult.details.history.mismatchedIds && verificationResult.details.history.mismatchedIds.length > 0 && (
                    <>
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                        <p className="font-medium text-red-700 mb-1">
                          ⚠️ 不匹配的ID ({verificationResult.details.history.mismatchedIds.length} 条):
                        </p>
                        <div className="max-h-32 overflow-y-auto text-xs font-mono bg-white p-2 rounded">
                          {verificationResult.details.history.mismatchedIds.map((id: string, idx: number) => (
                            <div key={idx}>{id} (长度: {id.length})</div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-yellow-50 rounded">
                        <p className="font-medium text-yellow-700 mb-2 text-sm">
                          💡 提示：点击下方按钮分析这些ID为何未同步
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={async () => {
                              try {
                                const localProducts = localStorage.getItem('goldProducts');
                                const localHistory = localStorage.getItem('goldPriceHistory');
                                const products = localProducts ? JSON.parse(localProducts) : [];
                                const history = localHistory ? JSON.parse(localHistory) : [];

                                const localProductIds = products.map((p: any) => p.id).filter(Boolean);
                                const localHistoryIds = history.map((h: any) => h.id).filter(Boolean);

                                const token = localStorage.getItem('auth_token');
                                const response = await fetch('/api/analyze-missing', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ localProductIds, localHistoryIds }),
                                });

                                if (!response.ok) {
                                  throw new Error('分析失败');
                                }

                                const result = await response.json();
                                console.log('分析结果:', result);

                                let message = '📊 未同步记录分析\n\n';
                                message += `历史记录:\n`;
                                message += `  - 本地数量: ${result.analysis.history.localCount}\n`;
                                message += `  - 数据库数量: ${result.analysis.history.dbCount}\n`;
                                message += `  - 未同步数量: ${result.analysis.history.missingCount}\n\n`;

                                const lengthStats = result.analysis.history.lengthStats;
                                message += `ID长度分布:\n`;
                                Object.entries(lengthStats).sort((a: any, b: any) => b[0] - a[0]).forEach(([len, count]: any) => {
                                  message += `  - ${len}字符: ${count}条\n`;
                                });
                                message += '\n';

                                const sampleTruncated = result.analysis.history.sampleTruncated;
                                if (sampleTruncated.length > 0) {
                                  message += `⚠️ 可能的截断问题 (${sampleTruncated.length}条):\n`;
                                  sampleTruncated.slice(0, 5).forEach((item: any) => {
                                    message += `  - ${item.id} (截断版本: ${item.truncatedId})\n`;
                                  });
                                  message += '\n';
                                }

                                alert(message);
                              } catch (error: any) {
                                alert('分析失败: ' + error.message);
                              }
                            }}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                          >
                            🔍 分析未同步记录
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const localProducts = localStorage.getItem('goldProducts');
                                const localHistory = localStorage.getItem('goldPriceHistory');
                                const history = localHistory ? JSON.parse(localHistory) : [];

                                const missingIds = verificationResult.details.history.mismatchedIds as string[];

                                const token = localStorage.getItem('auth_token');
                                const response = await fetch('/api/diagnose-failed', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ missingIds, localHistory: history }),
                                });

                                if (!response.ok) {
                                  throw new Error('诊断失败');
                                }

                                const result = await response.json();
                                console.log('诊断结果:', result);

                                let message = '🔍 失败记录详细诊断\n\n';

                                if (result.summary.missingProduct > 0) {
                                  message += `⚠️ productId不存在 (${result.summary.missingProduct}条):\n`;
                                  result.issues.missingProduct.slice(0, 5).forEach((item: any) => {
                                    message += `  - ${item.id} (productId: ${item.productId})\n`;
                                  });
                                  message += '\n';
                                }

                                if (result.summary.shortIdExists > 0) {
                                  message += `⚠️ 存在截断版本 (${result.summary.shortIdExists}条):\n`;
                                  result.issues.shortIdExists.slice(0, 5).forEach((item: any) => {
                                    message += `  - ${item.id} (截断: ${item.truncatedId})\n`;
                                  });
                                  message += '\n';
                                }

                                if (result.summary.duplicateId > 0) {
                                  message += `⚠️ 本地重复ID (${result.summary.duplicateId}条):\n`;
                                  result.issues.duplicateId.slice(0, 5).forEach((item: any) => {
                                    message += `  - ${item.id} (重复: ${item.duplicateCount}次)\n`;
                                  });
                                  message += '\n';
                                }

                                if (result.summary.missingProduct === 0 &&
                                    result.summary.shortIdExists === 0 &&
                                    result.summary.duplicateId === 0) {
                                  message += '✅ 未发现明显问题，可能是其他原因导致同步失败。\n\n';
                                  message += '建议查看浏览器控制台(F12)的详细同步日志。';
                                }

                                alert(message);
                              } catch (error: any) {
                                alert('诊断失败: ' + error.message);
                              }
                            }}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                          >
                            🔬 诊断失败原因
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                // 找到最长的ID
                                const ids = verificationResult.details.history.mismatchedIds as string[];
                                const longestId = ids.reduce((max, id) => id.length > max.length ? id : max, '');

                                console.log('测试最长的ID:', longestId, '长度:', longestId.length);

                                const token = localStorage.getItem('auth_token');
                                const response = await fetch('/api/test-long-id', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ testId: longestId }),
                                });

                                if (!response.ok) {
                                  throw new Error('测试失败');
                                }

                                const result = await response.json();
                                console.log('测试结果:', result);

                                if (result.success) {
                                  alert(`✅ 测试成功！\n\n最长的ID可以正常插入：\n  - ID长度: ${result.idLength} 字符\n  - 数据库字段限制: ${result.idMaxLength} 字符\n\n说明数据库表结构已修复，应该可以同步所有数据。`);
                                } else {
                                  alert(`❌ 测试失败！\n\n错误信息: ${result.error}\n错误代码: ${result.code}\n错误详情: ${result.detail}\n\n请查看控制台获取更多详情。`);
                                }
                              } catch (error: any) {
                                alert('测试失败: ' + error.message);
                              }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            🧪 测试最长ID
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 系统配置 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-black mb-2">⚙️ 系统配置</h3>
                <div className="space-y-1">
                  <p>- 金价: <span className={`font-medium ${
                    verificationResult.details.configs.goldPrice.match ? 'text-green-600' : 'text-red-600'
                  }`}>{verificationResult.details.configs.goldPrice.status}</span></p>
                  <p>- 价格系数: <span className={`font-medium ${
                    verificationResult.details.configs.coefficients.match ? 'text-green-600' : 'text-red-600'
                  }`}>{verificationResult.details.configs.coefficients.status}</span></p>
                  <p>- 数据版本: <span className={`font-medium ${
                    verificationResult.details.configs.dataVersion.match ? 'text-green-600' : 'text-red-600'
                  }`}>{verificationResult.details.configs.dataVersion.status}</span></p>
                </div>
              </div>

              {/* 数据质量 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-black mb-2">📋 数据质量</h3>
                <div className="space-y-1">
                  <p>- 产品数据: <span className={`font-medium ${
                    verificationResult.details.dataQuality.products.status ? 'text-green-600' : 'text-red-600'
                  }`}>{verificationResult.details.dataQuality.products.status}</span></p>
                  <p>- 历史记录: <span className={`font-medium ${
                    verificationResult.details.dataQuality.history.status ? 'text-green-600' : 'text-red-600'
                  }`}>{verificationResult.details.dataQuality.history.status}</span></p>
                  {verificationResult.details.dataQuality.products.issues && verificationResult.details.dataQuality.products.issues.length > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 rounded text-sm">
                      <p className="font-medium text-orange-700 mb-1">
                        ⚠️ 产品数据问题 ({verificationResult.details.dataQuality.products.issues.length} 个):
                      </p>
                      <div className="max-h-32 overflow-y-auto text-xs">
                        {verificationResult.details.dataQuality.products.issues.map((issue: any, idx: number) => (
                          <div key={idx} className="p-1">
                            <span className="font-medium">{issue.productCode}:</span> {issue.issues.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 操作建议 */}
              {verificationResult.recommendations && verificationResult.recommendations.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">💡 操作建议</h3>
                  <div className="space-y-1 text-sm">
                    {verificationResult.recommendations.map((rec: string, idx: number) => (
                      <p key={idx}>{rec}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              {/* 彻底清除所有数据按钮 - 始终显示 */}
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
              >
                💥 彻底清除所有数据
              </button>

              {verificationResult.details.products.mismatchedIds &&
               verificationResult.details.products.mismatchedIds.length > 0 && (
                <>
                  <button
                    onClick={async () => {
                      if (confirm('确定要清理本地数据吗？\n\n这将删除所有localStorage中的数据，然后你可以从数据库重新加载或导入新数据。\n\n⚠️ 警告：此操作不可撤销！')) {
                        // 清理本地数据
                        localStorage.removeItem('goldProducts');
                        localStorage.removeItem('goldPriceHistory');
                        localStorage.removeItem('goldPrice');
                        localStorage.removeItem('goldPriceTimestamp');
                        localStorage.removeItem('priceCoefficients');
                        localStorage.removeItem('dataVersion');
                        localStorage.removeItem('appSettings');

                        // 重新加载页面
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ 清理本地数据
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('确定要将本地数据同步到数据库吗？这将添加本地数据到数据库。\n\n⚠️ 警告：如果数据库中有不同的数据，将会产生重复！')) {
                        setShowVerificationModal(false);
                        await syncToDatabase();
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    🔄 同步到数据库
                  </button>
                </>
              )}
              <button
                onClick={() => setShowVerificationModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 用 AuthProtection 包装主组件
export default function ProtectedQuotePage() {
  return (
    <AuthProtection>
      <QuotePage />
    </AuthProtection>
  );
}

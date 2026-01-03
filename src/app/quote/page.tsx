"use client";

import React, { useState, useEffect } from "react";
import XLSX from "xlsx-js-style";

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

export default function QuotePage() {
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

  // 导出Excel范围选择
  const [exportScope, setExportScope] = useState<"current" | "all">("current");

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

    // 1. 优先检查 /10k, /14k, /18k 格式（不区分大小写）
    const slashKaratMatch = code.match(/\/(10K|14K|18K)(?=\/|$|[^A-Z])/i);
    if (slashKaratMatch) {
      const karatValue = slashKaratMatch[1].toUpperCase() as "10K" | "14K" | "18K";
      return { karat: karatValue, goldColor: "黄金" };
    }

    // 2. 检查以 10K, 14K, 18K 结尾
    const endKaratMatch = code.match(/(10K|14K|18K)$/i);
    if (endKaratMatch) {
      const karatValue = endKaratMatch[1].toUpperCase() as "10K" | "14K" | "18K";
      return { karat: karatValue, goldColor: "黄金" };
    }

    // 3. 检查 K14, K18, K10 前缀
    const kPrefixMatch = code.match(/^(K14|K18|K10)/i);
    if (kPrefixMatch) {
      const karatMap: Record<string, "14K" | "18K" | "10K"> = {
        "K14": "14K",
        "K18": "18K",
        "K10": "10K"
      };
      const karatValue = karatMap[kPrefixMatch[1].toUpperCase()];
      if (karatValue) {
        return { karat: karatValue, goldColor: "黄金" };
      }
    }

    // 4. 检查 /K14, /K18, /K10 格式
    const slashKPrefixMatch = code.match(/\/(K14|K18|K10)(?=\/|$|[^A-Z])/i);
    if (slashKPrefixMatch) {
      const karatMap: Record<string, "14K" | "18K" | "10K"> = {
        "K14": "14K",
        "K18": "18K",
        "K10": "10K"
      };
      const karatValue = karatMap[slashKPrefixMatch[1].toUpperCase()];
      if (karatValue) {
        return { karat: karatValue, goldColor: "黄金" };
      }
    }

    // 默认返回 14K
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
        });
      } else {
        // 没有找到现有产品，仅应用智能识别的材质
        setCurrentProduct({
          ...currentProduct,
          karat: detected.karat,
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

  // 更新滚动条宽度
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

  // 保存数据到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 只有当 products 有数据时才保存，避免覆盖已有的数据
    if (products.length > 0) {
      localStorage.setItem("goldProducts", JSON.stringify(products));
      console.log("已保存产品数据到 localStorage，数量:", products.length);
    }
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 只有当 priceHistory 有数据时才保存
    if (priceHistory.length > 0) {
      localStorage.setItem("goldPriceHistory", JSON.stringify(priceHistory));
      console.log("已保存历史记录到 localStorage，数量:", priceHistory.length);
    }
  }, [priceHistory]);

  // 保存金价到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("goldPrice", goldPrice.toString());
    setGoldPriceTimestamp(new Date().toLocaleString("zh-CN"));
    localStorage.setItem("goldPriceTimestamp", new Date().toLocaleString("zh-CN"));
  }, [goldPrice]);

  // 保存系数到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("priceCoefficients", JSON.stringify(coefficients));
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

    const newProduct: Product = {
      id: Date.now().toString(),
      category: currentCategory,
      subCategory: currentSubCategory, // 使用当前选中的子分类
      productCode: currentProduct.productCode!,
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

    // 判断是否为更新操作
    const existingRecords = products.filter((p) => p.productCode === currentProduct.productCode);
    const isUpdate = existingRecords.length > 0;

    // 删除该货号的所有旧记录，只保留新的
    const filteredProducts = products.filter((p) => p.productCode !== currentProduct.productCode);
    setProducts([...filteredProducts, newProduct]);

    // 添加到历史记录（保留所有历史）
    const historyRecord: PriceHistory = {
      id: Date.now().toString() + "_hist",
      productId: newProduct.id,
      category: currentCategory,
      subCategory: currentSubCategory,
      productCode: newProduct.productCode,
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
    if (isUpdate) {
      alert(`产品 ${currentProduct.productCode} 更新成功！`);
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

    console.log("开始读取文件...");
    alert("正在读取文件: " + file.name);

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
          h && String(h).includes("人工") || h && String(h).includes("工费")
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

          // 确定最终使用的成色：优先使用Excel中的成色，如果没有则从货号智能识别
          const finalKarat = validKarat || "14K";
          const detectedMaterial = detectMaterialFromCode(String(productCode));
          // 如果Excel中有成色内容（非空）就用Excel的，否则使用智能识别的结果
          const karat = (karatRaw && karatRaw.trim() !== "") ? finalKarat : detectedMaterial.karat;

          // 调试日志：输出成色识别结果
          console.log(`产品 ${productCode}: Excel成色="${karatRaw}", 识别成色="${detectedMaterial.karat}", 最终使用="${karat}"`);

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
            category: currentCategory,
            subCategory: currentSubCategory, // Excel导入时使用当前选中的子分类
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
            category: currentCategory,
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

        alert(`成功导入 ${newProducts.length} 个产品！`);

        // 清空文件输入
        e.target.value = "";
      } catch (error) {
        console.error("导入Excel失败:", error);
        alert("导入Excel失败，请检查文件格式！");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 数据诊断函数
  const diagnoseData = () => {
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
          message += `   建议点击\"重新加载数据\"按钮\n`;
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
    message += "💡 提示：\n";
    message += "1. 如果 React State 和 LocalStorage 不一致，请点击\"重新加载数据\"\n";
    message += "2. 诊断结果已同步到控制台 (F12)\n";
    message += "3. 可以使用\"查看备份文件\"功能检查备份文件内容\n";

    alert(message);

    console.log("========== 数据诊断结束 ==========");
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

  return (
    <div className="min-h-screen bg-gray-50 p-8" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          K金产品报价计算表
        </h1>

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
          <h2 className="mb-4 text-xl font-semibold text-gray-800">产品分类</h2>

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
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {subCat}
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full ${
                                  currentSubCategory === subCat
                                    ? "bg-white text-blue-600"
                                    : subCount > 0
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-300 text-gray-600"
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
          <h2 className="mb-4 text-xl font-semibold text-gray-800">数据管理</h2>
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
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const backup = JSON.parse(event.target?.result as string);
                      console.log("备份文件内容:", backup);

                      // 构建预览信息
                      let preview = "📋 备份文件预览\n";
                      preview += "=".repeat(40) + "\n\n";

                      // 产品数据预览
                      if (backup.products && backup.products !== "null") {
                        try {
                          const products = JSON.parse(backup.products);
                          preview += `✅ 产品数据: ${products.length} 条\n`;
                          if (products.length > 0) {
                            const categories = [...new Set(products.map((p: any) => p.category))];
                            preview += `   分类: ${categories.join(", ")}\n`;
                            preview += `   最新产品: ${products[0].productCode} - ${products[0].productName}\n`;
                          }
                        } catch (e) {
                          preview += `❌ 产品数据: 解析失败\n`;
                        }
                      } else {
                        preview += `⚠️ 产品数据: 无\n`;
                      }

                      preview += "\n";

                      // 历史记录预览
                      if (backup.history && backup.history !== "null") {
                        try {
                          const history = JSON.parse(backup.history);
                          preview += `✅ 历史记录: ${history.length} 条\n`;
                        } catch (e) {
                          preview += `❌ 历史记录: 解析失败\n`;
                        }
                      } else {
                        preview += `⚠️ 历史记录: 无\n`;
                      }

                      preview += "\n";

                      // 金价预览
                      if (backup.goldPrice && backup.goldPrice !== "null") {
                        preview += `✅ 金价: ¥${backup.goldPrice}/克\n`;
                      } else {
                        preview += `⚠️ 金价: 无\n`;
                      }

                      preview += "\n";

                      // 系数预览
                      if (backup.coefficients && backup.coefficients !== "null") {
                        preview += `✅ 价格系数: 已设置\n`;
                      } else {
                        preview += `⚠️ 价格系数: 无\n`;
                      }

                      preview += "\n";
                      preview += "⚠️ 警告：这将覆盖当前所有数据！\n";
                      preview += "确定要恢复吗？";

                      if (confirm(preview)) {
                        console.log("开始恢复数据...");

                        // 恢复产品数据
                        if (backup.products && backup.products !== "null") {
                          localStorage.setItem("goldProducts", backup.products);
                          console.log("✅ 产品数据已恢复");
                        }

                        // 恢复历史记录
                        if (backup.history && backup.history !== "null") {
                          localStorage.setItem("goldPriceHistory", backup.history);
                          console.log("✅ 历史记录已恢复");
                        }

                        // 恢复金价
                        if (backup.goldPrice && backup.goldPrice !== "null") {
                          localStorage.setItem("goldPrice", backup.goldPrice);
                          console.log("✅ 金价已恢复");
                        }

                        // 恢复金价时间戳
                        if (backup.goldPriceTimestamp && backup.goldPriceTimestamp !== "null") {
                          localStorage.setItem("goldPriceTimestamp", backup.goldPriceTimestamp);
                        }

                        // 恢复系数
                        if (backup.coefficients && backup.coefficients !== "null") {
                          localStorage.setItem("priceCoefficients", backup.coefficients);
                          console.log("✅ 系数已恢复");
                        }

                        console.log("数据恢复完成，准备重新加载数据...");

                        // 重新加载数据（不刷新页面）
                        setTimeout(() => {
                          console.log("开始重新加载数据...");
                          reloadFromLocalStorage();
                          alert("✅ 数据恢复成功！\n\n数据已重新加载到页面。");
                        }, 500);
                      }
                    } catch (err) {
                      console.error("恢复数据错误:", err);
                      alert("❌ 备份文件格式错误！\n\n错误信息: " + (err as Error).message);
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
              className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
              suppressHydrationWarning
            >
              恢复数据
            </button>
            <button
              onClick={() => {
                const productCount = JSON.parse(localStorage.getItem("goldProducts") || "[]").length;
                const historyCount = JSON.parse(localStorage.getItem("goldPriceHistory") || "[]").length;
                const products = JSON.parse(localStorage.getItem("goldProducts") || "[]");
                const categories = [...new Set(products.map((p: any) => p.category))];

                let message = `数据统计：\n\n`;
                message += `产品总数：${productCount}\n`;
                message += `历史记录数：${historyCount}\n\n`;
                message += `各分类产品数量：\n`;
                categories.forEach((cat: any) => {
                  const count = products.filter((p: any) => p.category === cat).length;
                  message += `- ${cat}: ${count}个\n`;
                });

                alert(message);
              }}
              className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
              suppressHydrationWarning
            >
              查看数据统计
            </button>
            <button
              onClick={diagnoseData}
              className="rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
              suppressHydrationWarning
            >
              诊断数据
            </button>
            <button
              onClick={() => {
                if (confirm("确定要修复子分类数据吗？这将根据产品的分类信息自动设置子分类。")) {
                  repairSubCategoryData();
                }
              }}
              className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              suppressHydrationWarning
            >
              修复子分类
            </button>
            <button
              onClick={showCategoryDetails}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              suppressHydrationWarning
            >
              查看分类详情
            </button>
            <button
              onClick={showRawData}
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              suppressHydrationWarning
            >
              查看原始数据
            </button>
            <button
              onClick={() => {
                if (confirm("确定要查看备份文件内容吗？")) {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const backup = JSON.parse(event.target?.result as string);
                        console.log("备份文件内容:", backup);

                        let message = "备份文件内容：\n\n";

                        // 产品数据
                        if (backup.products && backup.products !== "null") {
                          try {
                            const products = JSON.parse(backup.products);
                            message += `产品数量: ${products.length}\n`;
                            if (products.length > 0) {
                              message += `产品样例:\n`;
                              message += `  - ${products[0].category} | ${products[0].productCode} | ${products[0].productName}\n`;
                            }
                          } catch (e) {
                            message += `产品数据解析失败\n`;
                          }
                        } else {
                          message += `产品数据: 无\n`;
                        }

                        // 历史记录
                        if (backup.history && backup.history !== "null") {
                          try {
                            const history = JSON.parse(backup.history);
                            message += `历史记录数量: ${history.length}\n`;
                          } catch (e) {
                            message += `历史记录解析失败\n`;
                          }
                        } else {
                          message += `历史记录: 无\n`;
                        }

                        // 金价
                        if (backup.goldPrice && backup.goldPrice !== "null") {
                          message += `金价: ¥${backup.goldPrice}/克\n`;
                        } else {
                          message += `金价: 无\n`;
                        }

                        // 系数
                        if (backup.coefficients && backup.coefficients !== "null") {
                          try {
                            const coeff = JSON.parse(backup.coefficients);
                            message += `价格系数: 已设置\n`;
                          } catch (e) {
                            message += `价格系数解析失败\n`;
                          }
                        } else {
                          message += `价格系数: 无\n`;
                        }

                        alert(message);
                      } catch (err) {
                        alert("备份文件格式错误！\n" + (err as Error).message);
                      }
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }
              }}
              className="rounded bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700"
              suppressHydrationWarning
            >
              查看备份文件
            </button>
            <button
              onClick={() => {
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
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              suppressHydrationWarning
            >
              清除所有数据
            </button>
            <button
              onClick={reloadFromLocalStorage}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              suppressHydrationWarning
            >
              重新加载数据
            </button>
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
                    className="w-full rounded-lg border-2 border-amber-300 px-4 py-2.5 focus:border-amber-500 focus:outline-none text-gray-900 font-medium"
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
                <h3 className="text-lg font-semibold text-gray-900">导出管理</h3>
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
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  suppressHydrationWarning
                >
                  ❌ 取消全选
                </button>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
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
              </div>
            </div>
          </div>
        </div>

        {/* 系数设置区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">价格系数设置</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" suppressHydrationWarning>
            {/* 金含量系数 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                10K金含量系数
              </label>
              <input
                type="number"
                value={coefficients.goldFactor10K}
                onChange={(e) => setCoefficients({...coefficients, goldFactor10K: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.001"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 0.417</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                14K金含量系数
              </label>
              <input
                type="number"
                value={coefficients.goldFactor14K}
                onChange={(e) => setCoefficients({...coefficients, goldFactor14K: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.001"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 0.586</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                18K金含量系数
              </label>
              <input
                type="number"
                value={coefficients.goldFactor18K}
                onChange={(e) => setCoefficients({...coefficients, goldFactor18K: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.001"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 0.755</div>
            </div>

            {/* 工费系数 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                零售价工费系数
              </label>
              <input
                type="number"
                value={coefficients.laborFactorRetail}
                onChange={(e) => setCoefficients({...coefficients, laborFactorRetail: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.1"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 5</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                批发价工费系数
              </label>
              <input
                type="number"
                value={coefficients.laborFactorWholesale}
                onChange={(e) => setCoefficients({...coefficients, laborFactorWholesale: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.1"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 3</div>
            </div>

            {/* 材料系数 */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-900">
                  材料损耗系数
                </label>
                <select
                  value={coefficients.materialLossMode}
                  onChange={(e) => setCoefficients({...coefficients, materialLossMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
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
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 1.15 {coefficients.materialLossMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  材料浮动系数
                </label>
                <select
                  value={coefficients.materialCostMode}
                  onChange={(e) => setCoefficients({...coefficients, materialCostMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
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
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 1.1 {coefficients.materialCostMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>

            {/* 利润和汇率 */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  国际运输及关税系数
                </label>
                <select
                  value={coefficients.profitMarginMode}
                  onChange={(e) => setCoefficients({...coefficients, profitMarginMode: e.target.value as "fixed" | "special"})}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
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
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 1.25 {coefficients.profitMarginMode === "special" && "(可被产品特殊系数覆盖)"}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                汇率（人民币/加币）
              </label>
              <input
                type="number"
                value={coefficients.exchangeRate}
                onChange={(e) => setCoefficients({...coefficients, exchangeRate: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 5</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 产品录入区域 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                产品信息录入
              </h2>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-900">批量导入：</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={importExcel}
                  className="block w-48 text-sm text-gray-900 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:text-blue-700 hover:file:bg-blue-100"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* 导入选项 */}
            <div className="mb-4 rounded bg-gray-50 p-3">
              <p className="mb-2 text-sm font-medium text-gray-900">导入选项：</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={importWeight}
                    onChange={(e) => setImportWeight(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    suppressHydrationWarning
                  />
                  导入重量
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={importLaborCost}
                    onChange={(e) => setImportLaborCost(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    suppressHydrationWarning
                  />
                  导入人工成本
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">默认材质：</span>
                  <select
                    value={defaultKarat}
                    onChange={(e) => setDefaultKarat(e.target.value as "10K" | "14K" | "18K")}
                    className="rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none text-gray-900"
                    suppressHydrationWarning
                  >
                    <option value="10K">10K金</option>
                    <option value="14K">14K金</option>
                    <option value="18K">18K金</option>
                  </select>
                </div>
              </div>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              💡 <strong>快速更新模式</strong>：输入已存在的产品货号，自动填充信息并更新价格<br/>
              💡 <strong>新增产品模式</strong>：输入新货号，添加新产品
            </p>
            <div className="space-y-4" suppressHydrationWarning>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  当前分类
                </label>
                <input
                  type="text"
                  value={currentSubCategory ? `${currentCategory} / ${currentSubCategory}` : currentCategory}
                  readOnly
                  className="w-full rounded border border-gray-300 px-4 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                  suppressHydrationWarning
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* 特殊系数设置（可选） */}
              <div className="rounded-lg border-2 border-gray-200 p-4">
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    特殊系数设置（可选，留空则使用全局固定系数）
                  </label>
                  <p className="text-xs text-gray-600">
                    为此产品单独设置不同的系数，覆盖全局固定系数
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
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
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                      step="0.01"
                      placeholder={`默认: ${coefficients.materialLoss}`}
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
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
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                      step="0.01"
                      placeholder={`默认: ${coefficients.materialCost}`}
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
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
                      className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                      step="0.01"
                      placeholder={`默认: ${coefficients.profitMargin}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
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
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  suppressHydrationWarning
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* 新增成本字段 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    step="0.01"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
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
                  <label className="mb-2 block text-sm font-medium text-gray-900">
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
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
                <label className="mb-2 block text-sm font-medium text-gray-900">
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
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  suppressHydrationWarning
                >
                  <option value="10K">10K金</option>
                  <option value="14K">14K金</option>
                  <option value="18K">18K金</option>
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  💡 货号中包含 /10K、/14K、/18K、/K10、/K14、/K18 等标识会自动识别
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
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
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
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
              <h2 className="text-xl font-semibold text-gray-800">
                当前产品列表 - {currentCategory}{currentSubCategory ? ` / ${currentSubCategory}` : ''}
              </h2>
              {products.filter(p => p.category === currentCategory).length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-900 font-medium">导出范围:</label>
                  <select
                    value={exportScope}
                    onChange={(e) => setExportScope(e.target.value as "current" | "all")}
                    className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
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
                  className="flex-1 rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  suppressHydrationWarning
                />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as "name" | "specification" | "supplierCode" | "karat" | "shape" | "all")}
                  className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
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
                  className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
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
                  className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 text-sm"
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
                <span className="text-xs font-medium text-gray-700">↔️ 横向滚动</span>
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
              <div className="text-xs text-gray-500 mt-1">
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
                    <th className="border border-gray-200 px-3 py-2 text-center text-gray-900 w-12 bg-gray-100">
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
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">货号</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">名称</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">成色</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">颜色</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">规格</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">形状</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">重量</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">工费</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">配件</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">石头</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">电镀</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">模具</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">佣金</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">供应商</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900 bg-gray-100">下单口</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">金价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">零售价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900 bg-gray-100">批发价</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-gray-900 bg-gray-100">操作</th>
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
                      <td className="border border-gray-200 px-3 py-2 text-gray-900">{product.productCode}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-900">{product.productName}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-900">{product.karat}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-900">{product.goldColor}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-900 text-xs">{product.specification}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-900">{product.shape || "-"}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right text-gray-900">{product.weight}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">¥{product.laborCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{formatDate(product.laborCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">¥{product.accessoryCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{formatDate(product.accessoryCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">¥{product.stoneCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{formatDate(product.stoneCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">¥{product.platingCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{formatDate(product.platingCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">¥{product.moldCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{formatDate(product.moldCostDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">{product.commission}%</div>
                        <div className="text-xs text-gray-500">{formatDate(product.commissionDate)}</div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-left text-gray-900">{product.supplierCode || "-"}</td>
                      <td className="border border-gray-200 px-3 py-2 text-left text-gray-900">
                        {product.orderChannel ? (
                          (() => {
                            const channel = ORDER_CHANNELS.find(d => d.code === product.orderChannel);
                            return channel ? channel.code : product.orderChannel;
                          })()
                        ) : "-"}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">
                          {product.goldPrice ? `¥${product.goldPrice.toFixed(2)}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-gray-900">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className={`font-medium ${isProductModified(product.id) ? 'text-red-600' : 'text-green-600'}`}>
                          {isProductModified(product.id) && <span className="mr-1">★</span>}
                          CAD${product.retailPrice.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-gray-900">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className={`font-medium ${isProductModified(product.id) ? 'text-red-600' : 'text-blue-600'}`}>
                          {isProductModified(product.id) && <span className="mr-1">★</span>}
                          CAD${product.wholesalePrice.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-gray-900">
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
                      <td colSpan={20} className="border border-gray-200 px-3 py-4 text-center text-gray-500">
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
            <h2 className="text-xl font-semibold text-gray-800">
              价格历史记录 - {currentCategory}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">时间</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">货号</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">名称</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">成色</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">颜色</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">形状</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">重量</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">市场金价（人民币/克）</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">零售价</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">批发价</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">下单口</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.filter(h => h.category === currentCategory).map((history) => (
                  <tr key={history.id}>
                    <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-gray-900">
                      {formatDate(history.timestamp)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-900">{history.productCode}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-900">{history.productName}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-900">{history.karat}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-900">{history.goldColor}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-900">{history.shape || "-"}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-gray-900">{history.weight}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-gray-900">
                      ¥{history.goldPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-green-600">
                      CAD${history.retailPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-blue-600">
                      CAD${history.wholesalePrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-left text-gray-900">
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
                      colSpan={10}
                      className="border border-gray-200 px-3 py-4 text-center text-gray-500"
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">批量更新供应商代码</h2>
            <p className="text-sm text-gray-600 mb-4">
              为当前分类（{currentCategory}）的产品批量设置供应商代码。按照货号范围进行更新。
            </p>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-900 bg-gray-100 p-2 rounded">
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
                      className="w-full min-w-[200px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-900 resize-none"
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
                      className="w-full min-w-[80px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-900"
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">批量修改下单口</h2>
            <p className="text-sm text-gray-600 mb-4">
              为当前分类（{currentCategory}）的产品批量设置下单口。按照货号范围进行更新。
            </p>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-900 bg-gray-100 p-2 rounded">
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
                      className="w-full min-w-[200px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-900 resize-none"
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
                      className="w-full min-w-[80px] rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-900"
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">批量修改价格系数</h2>
            <p className="text-sm text-gray-600 mb-4">
              批量修改符合条件的产品的价格系数和成本。修改后将自动重新计算价格。
            </p>

            {/* 修改范围 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">修改范围</label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-900">
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
                <label className="flex items-center text-gray-900">
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
              <label className="block text-sm font-medium text-gray-900 mb-2">选择要修改的字段</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.laborCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, laborCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  工费
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.accessoryCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, accessoryCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  配件成本
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.stoneCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, stoneCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  石头成本
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.platingCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, platingCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  电镀成本
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.moldCost}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, moldCost: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  模具成本
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.commission}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, commission: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  佣金率
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={batchModifyConfig.fields.weight}
                    onChange={(e) => setBatchModifyConfig({...batchModifyConfig, fields: {...batchModifyConfig.fields, weight: e.target.checked}})}
                    className="mr-2"
                    suppressHydrationWarning
                  />
                  重量
                </label>
                <label className="flex items-center text-gray-900">
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
              <label className="block text-sm font-medium text-gray-900 mb-2">输入新值（人民币）</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {batchModifyConfig.fields.laborCost && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">工费</label>
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
                    <label className="block text-xs text-gray-600 mb-1">配件成本</label>
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
                    <label className="block text-xs text-gray-600 mb-1">石头成本</label>
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
                    <label className="block text-xs text-gray-600 mb-1">电镀成本</label>
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
                    <label className="block text-xs text-gray-600 mb-1">模具成本</label>
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
                    <label className="block text-xs text-gray-600 mb-1">佣金率（%）</label>
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
                    <label className="block text-xs text-gray-600 mb-1">重量（克）</label>
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
                    <label className="block text-xs text-gray-600 mb-1">市场金价（元/克）</label>
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
              <label className="block text-sm font-medium text-gray-900 mb-2">筛选条件（留空表示不筛选）</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">产品名称</label>
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
                  <label className="block text-xs text-gray-600 mb-1">货号</label>
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
                  <label className="block text-xs text-gray-600 mb-1">供应商代码</label>
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
                  <label className="block text-xs text-gray-600 mb-1">形状</label>
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
                  <label className="block text-xs text-gray-600 mb-1">K金含量</label>
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
    </div>
  );
}

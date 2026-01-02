"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

// 产品分类列表
export const PRODUCT_CATEGORIES = [
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
  "吊坠夹",
  "镶嵌配件",
  "珍珠配件",
  "金线",
  "金链",
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// 产品信息类型
interface Product {
  id: string;
  category: ProductCategory | "";  // 允许空字符串（兼容旧数据）
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

  // 同步滚动
  const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
    if (target) {
      target.scrollLeft = source.scrollLeft;
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
  const [currentCategory, setCurrentCategory] = useState<ProductCategory>("耳环/耳逼");

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"name" | "specification" | "supplierCode" | "all">("all");
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    category: "耳环/耳逼",
    productCode: "",
    productName: "",
    specification: "",
    weight: 0,
    laborCost: 0,
    karat: "18K",
    goldColor: "黄金",
    accessoryCost: 0,
    stoneCost: 0,
    platingCost: 0,
    moldCost: 0,
    commission: 0,
    supplierCode: "",
  });

  // 导入Excel相关状态
  const [importWeight, setImportWeight] = useState<boolean>(true);
  const [importLaborCost, setImportLaborCost] = useState<boolean>(true);
  const [defaultKarat, setDefaultKarat] = useState<"10K" | "14K" | "18K">("18K");

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

  // 价格系数配置
  const [coefficients, setCoefficients] = useState<{
    goldFactor10K: number;
    goldFactor14K: number;
    goldFactor18K: number;
    laborFactorRetail: number;
    laborFactorWholesale: number;
    materialLoss: number;
    materialCost: number;
    profitMargin: number;
    exchangeRate: number;
  }>(() => {
    if (typeof window === 'undefined') {
      return {
        goldFactor10K: 0.417,
        goldFactor14K: 0.586,
        goldFactor18K: 0.755,
        laborFactorRetail: 5,
        laborFactorWholesale: 3,
        materialLoss: 1.15,
        materialCost: 1.1,
        profitMargin: 1.25,
        exchangeRate: 5,
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
        materialLoss: parsed.materialLoss ?? 1.15,
        materialCost: parsed.materialCost ?? 1.1,
        profitMargin: parsed.profitMargin ?? 1.25,
        exchangeRate: parsed.exchangeRate ?? 5,
      };
    }
    return {
      goldFactor10K: 0.417,
      goldFactor14K: 0.586,
      goldFactor18K: 0.755,
      laborFactorRetail: 5,
      laborFactorWholesale: 3,
      materialLoss: 1.15,
      materialCost: 1.1,
      profitMargin: 1.25,
      exchangeRate: 5,
    };
  });

  // 格式化日期为年月日
  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString("zh-CN");
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

    // 默认返回 18K
    return { karat: "18K", goldColor: "黄金" };
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

        // 数据迁移：将"水滴扣"改为"扣子"，并添加新字段的默认值（兼容旧数据）
        const migratedProducts = parsedProducts.map((p: Product) => ({
          ...p,
          category: (p.category as any) === "水滴扣" ? "扣子" : p.category,
          // 确保新字段有默认值（兼容旧数据）
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
        }));

        console.log("设置 products state，数量:", migratedProducts.length);
        setProducts(migratedProducts);
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

        // 数据迁移：将"水滴扣"改为"扣子"，并添加新字段的默认值（兼容旧数据）
        const migratedHistory = parsedHistory.map((h: PriceHistory) => ({
          ...h,
          category: (h.category as any) === "水滴扣" ? "扣子" : h.category,
          // 确保新字段有默认值（兼容旧数据）
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
        }));

        console.log("设置 priceHistory state，数量:", migratedHistory.length);
        setPriceHistory(migratedHistory);
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
        };
        console.log("设置系数:", completeCoeff);
        setCoefficients(completeCoeff);
      } catch (e) {
        console.error("解析系数失败:", e);
      }
    }

    console.log("========== 数据加载完成 ==========");
  }, []);

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
        const migratedProducts = parsedProducts.map((p: Product) => ({
          ...p,
          category: (p.category as any) === "水滴扣" ? "扣子" : p.category,
          // 确保新字段有默认值（兼容旧数据）
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
        }));

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

        const migratedHistory = parsedHistory.map((h: PriceHistory) => ({
          ...h,
          category: (h.category as any) === "水滴扣" ? "扣子" : h.category,
          // 确保新字段有默认值（兼容旧数据）
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
        }));

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
    commission: number = 0
  ): number => {
    let goldFactor: number;
    if (karat === "10K") {
      goldFactor = coefficients.goldFactor10K;
    } else if (karat === "14K") {
      goldFactor = coefficients.goldFactor14K;
    } else {
      goldFactor = coefficients.goldFactor18K;
    }

    const laborFactor = isRetail ? coefficients.laborFactorRetail : coefficients.laborFactorWholesale;

    // 材料价 = 市场金价 x 金含量 x 重量 x 材料损耗 x 材料浮动系数 / 汇率
    const materialPrice =
      marketGoldPrice * goldFactor * weight * coefficients.materialLoss * coefficients.materialCost / coefficients.exchangeRate;

    // 工费 = 人工成本 x 系数 / 汇率
    const laborPrice = laborCost * laborFactor / coefficients.exchangeRate;

    // 其它成本 = (配件 + 石头 + 电镀) x 工费系数 / 汇率
    const otherCosts = (accessoryCost + stoneCost + platingCost) * laborFactor / coefficients.exchangeRate;

    // 总价 = (材料价 + 工费 + 其它成本) x (1 + 佣金率/100) x 国际运输和关税系数
    const basePrice = materialPrice + laborPrice + otherCosts;
    const totalPrice = basePrice * (1 + commission / 100) * coefficients.profitMargin;

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
      currentProduct.karat || "18K",
      false,
      currentProduct.accessoryCost || 0,
      currentProduct.stoneCost || 0,
      currentProduct.platingCost || 0,
      currentProduct.moldCost || 0,
      currentProduct.commission || 0
    );

    const retailPrice = calculatePrice(
      goldPrice,
      currentProduct.weight || 0,
      currentProduct.laborCost || 0,
      currentProduct.karat || "18K",
      true,
      currentProduct.accessoryCost || 0,
      currentProduct.stoneCost || 0,
      currentProduct.platingCost || 0,
      currentProduct.moldCost || 0,
      currentProduct.commission || 0
    );

    const newProduct: Product = {
      id: Date.now().toString(),
      category: currentCategory,
      productCode: currentProduct.productCode!,
      productName: currentProduct.productName!,
      specification: currentProduct.specification || "",
      weight: currentProduct.weight || 0,
      laborCost: currentProduct.laborCost || 0,
      karat: currentProduct.karat || "18K",
      goldColor: currentProduct.goldColor || "黄金",
      wholesalePrice,
      retailPrice,
      goldPrice,
      accessoryCost: currentProduct.accessoryCost || 0,
      stoneCost: currentProduct.stoneCost || 0,
      platingCost: currentProduct.platingCost || 0,
      moldCost: currentProduct.moldCost || 0,
      commission: currentProduct.commission || 0,
      supplierCode: currentProduct.supplierCode || "",
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
      supplierCode: currentProduct.supplierCode || "",
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
      karat: "18K",
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
        product.commission || 0
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
        product.commission || 0
      );

      // 创建新的产品记录
      const newProduct: Product = {
        id: Date.now().toString() + "_" + productId,
        category: product.category,
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

  // 导出 Excel（CSV 格式）- 横向展开，一个货号一行，包含所有历史记录
  const exportToExcel = () => {
    // 根据选择的范围过滤历史记录
    const filteredHistory = exportScope === "current"
      ? priceHistory.filter(h => h.category === currentCategory)
      : priceHistory;

    // 按货号分组
    const productGroups: { [key: string]: PriceHistory[] } = {};
    filteredHistory.forEach((history) => {
      if (!productGroups[history.productCode]) {
        productGroups[history.productCode] = [];
      }
      productGroups[history.productCode].push(history);
    });

    // 为每个货号构建一行数据（按时间正序）
    const rows: any[] = [];
    Object.keys(productGroups).forEach((productCode) => {
      const records = productGroups[productCode].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // 基础信息
      const row: any = {
        货号: productCode,
        分类: records[0].category,
        名称: records[0].productName,
        成色: records[0].karat,
        金子颜色: records[0].goldColor || "黄金",
        规格: records[0].specification || "",
        供应商代码: records[0].supplierCode || "",
      };

      // 动态添加每次修改的数据
      records.forEach((record, index) => {
        const suffix = index + 1;
        row[`第${suffix}次时间`] = formatDate(record.timestamp);
        row[`第${suffix}次重量`] = record.weight;
        row[`第${suffix}次金价`] = record.goldPrice ? `¥${record.goldPrice.toFixed(2)}` : "";
        row[`第${suffix}次工费`] = `¥${record.laborCost.toFixed(2)}`;
        row[`第${suffix}次配件成本`] = `¥${(record.accessoryCost || 0).toFixed(2)}`;
        row[`第${suffix}次配件时间`] = formatDate(record.accessoryCostDate || record.timestamp);
        row[`第${suffix}次石头成本`] = `¥${(record.stoneCost || 0).toFixed(2)}`;
        row[`第${suffix}次石头时间`] = formatDate(record.stoneCostDate || record.timestamp);
        row[`第${suffix}次电镀成本`] = `¥${(record.platingCost || 0).toFixed(2)}`;
        row[`第${suffix}次电镀时间`] = formatDate(record.platingCostDate || record.timestamp);
        row[`第${suffix}次模具成本`] = `¥${(record.moldCost || 0).toFixed(2)}`;
        row[`第${suffix}次模具时间`] = formatDate(record.moldCostDate || record.timestamp);
        row[`第${suffix}次佣金率`] = `${(record.commission || 0).toFixed(2)}%`;
        row[`第${suffix}次佣金时间`] = formatDate(record.commissionDate || record.timestamp);
        row[`第${suffix}次零售价`] = `CAD$${record.retailPrice.toFixed(2)}`;
        row[`第${suffix}次批发价`] = `CAD$${record.wholesalePrice.toFixed(2)}`;
      });

      rows.push(row);
    });

    // 生成表头和行
    const allColumns = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((key) => allColumns.add(key)));

    const headers = Array.from(allColumns).join(",");
    const dataRows = rows.map((row) =>
      Array.from(allColumns).map((col) => row[col] || "").join(",")
    );
    const csv = [headers, ...dataRows].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // 根据导出范围设置文件名
    const fileName = exportScope === "current"
      ? `${currentCategory}_产品报价单_` + new Date().toLocaleDateString("zh-CN") + ".csv"
      : `全部分类_产品报价单_` + new Date().toLocaleDateString("zh-CN") + ".csv";
    link.download = fileName;
    link.click();
  };

  // 删除产品（同时删除相关的历史记录）
  const deleteProduct = (id: string) => {
    // 从产品列表中删除
    setProducts(products.filter((p) => p.id !== id));

    // 从历史记录中删除该产品的所有记录
    setPriceHistory(priceHistory.filter((h) => h.productId !== id));
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
          h && h.includes("货号")
        );
        const productNameIndex = headers.findIndex(h =>
          h && h.includes("名称")
        );
        const specificationIndex = headers.findIndex(h =>
          h && h.includes("规格")
        );
        const weightIndex = headers.findIndex(h =>
          h && h.includes("重量")
        );
        const laborCostIndex = headers.findIndex(h =>
          h && h.includes("人工") || h && h.includes("工费")
        );

        // 新增的成本列
        const accessoryCostIndex = headers.findIndex(h =>
          h && h.includes("配件") && h.includes("成本")
        );
        const stoneCostIndex = headers.findIndex(h =>
          h && h.includes("石头") && h.includes("成本")
        );
        const platingCostIndex = headers.findIndex(h =>
          h && h.includes("电镀") && h.includes("成本")
        );
        const moldCostIndex = headers.findIndex(h =>
          h && h.includes("模具") && h.includes("成本")
        );
        const commissionIndex = headers.findIndex(h =>
          h && h.includes("佣金")
        );
        const supplierCodeIndex = headers.findIndex(h =>
          h && h.includes("供应商")
        );

        console.log("列索引:", {
          productCodeIndex,
          productNameIndex,
          specificationIndex,
          weightIndex,
          laborCostIndex,
          accessoryCostIndex,
          stoneCostIndex,
          platingCostIndex,
          moldCostIndex,
          commissionIndex,
          supplierCodeIndex
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
          const supplierCode = supplierCodeIndex !== -1 ? String(row[supplierCodeIndex]) || "" : "";

          if (!productCode || !productName) return;

          // 从货号智能识别材质类型
          const detectedMaterial = detectMaterialFromCode(String(productCode));
          const detectedKarat = detectedMaterial.karat;

          const wholesalePrice = calculatePrice(
            goldPrice,
            weight,
            laborCost,
            detectedKarat,
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
            detectedKarat,
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
            productCode: String(productCode),
            productName: String(productName),
            specification: String(specification || ""),
            weight,
            laborCost,
            karat: detectedKarat,
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
            const emptyCategoryCount = products.filter(p => !p.category || p.category === "").length;
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
                          if (!p.category || p.category === "") {
                            return { ...p, category: currentCategory };
                          }
                          return p;
                        });

                        const updatedHistory = priceHistory.map(h => {
                          if (!h.category || h.category === "") {
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

          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((category) => {
              const count = products.filter(p => p.category === category).length;
              const hasData = count > 0;
              return (
                <button
                  key={category}
                  onClick={() => {
                    setCurrentCategory(category);
                    setCurrentProduct({ ...currentProduct, category });
                  }}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentCategory === category
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  suppressHydrationWarning
                >
                  {category}
                  {hasData && (
                    <span
                      className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                        currentCategory === category
                          ? "bg-white text-blue-600"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
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

        {/* 金价设置区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">金价设置</h2>
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
          <div className="flex flex-wrap gap-4" suppressHydrationWarning>
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-900">
                市场金价（人民币/克）
              </label>
              <input
                type="number"
                value={goldPrice}
                onChange={(e) => setGoldPrice(Number(e.target.value))}
                className="w-48 rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">
                更新时间: {formatDate(goldPriceTimestamp)}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={updatePrices}
                className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                suppressHydrationWarning
              >
                更新选中产品价格
              </button>
              <button
                onClick={() => setShowBatchUpdateModal(true)}
                className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
                suppressHydrationWarning
              >
                批量更新供应商代码
              </button>
              <button
                onClick={() => setSelectedProducts(new Set(products.filter(p => p.category === currentCategory).map(p => p.id)))}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                suppressHydrationWarning
              >
                全选（当前分类）
              </button>
              <button
                onClick={() => setSelectedProducts(new Set(products.map(p => p.id)))}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                suppressHydrationWarning
              >
                全选（所有分类）
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                suppressHydrationWarning
              >
                取消全选
              </button>
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
              <label className="mb-2 block text-sm font-medium text-gray-900">
                材料损耗系数
              </label>
              <input
                type="number"
                value={coefficients.materialLoss}
                onChange={(e) => setCoefficients({...coefficients, materialLoss: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 1.15</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                材料浮动系数
              </label>
              <input
                type="number"
                value={coefficients.materialCost}
                onChange={(e) => setCoefficients({...coefficients, materialCost: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 1.1</div>
            </div>

            {/* 利润和汇率 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                国际运输及关税系数
              </label>
              <input
                type="number"
                value={coefficients.profitMargin}
                onChange={(e) => setCoefficients({...coefficients, profitMargin: Number(e.target.value)})}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
                suppressHydrationWarning
              />
              <div className="mt-1 text-xs text-gray-500">默认: 1.25</div>
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
                  value={currentCategory}
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
                当前产品列表 - {currentCategory}
              </h2>
              {products.filter(p => p.category === currentCategory).length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">导出范围:</label>
                  <select
                    value={exportScope}
                    onChange={(e) => setExportScope(e.target.value as "current" | "all")}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
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
                  onChange={(e) => setSearchType(e.target.value as "name" | "specification" | "all")}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                  suppressHydrationWarning
                >
                  <option value="all">全部</option>
                  <option value="name">产品名称</option>
                  <option value="specification">规格</option>
                  <option value="supplierCode">供应商代码</option>
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

            {/* 独立的横向滚动条 */}
            <div className="mb-2 bg-gray-50 border border-gray-200 rounded p-1">
              <div className="text-xs text-gray-500 mb-1">↔️ 横向滚动条</div>
              <div
                ref={scrollBarRef}
                className="h-8 bg-white border border-gray-300 rounded"
                style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}
                onScroll={(e) => syncScroll(e.currentTarget, tableContainerRef.current!)}
              >
                <div style={{ width: '2000px', height: '32px' }}></div>
              </div>
            </div>

            <div
              ref={tableContainerRef}
              className="overflow-x-auto"
              onScroll={(e) => syncScroll(e.currentTarget, scrollBarRef.current!)}
            >
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-center text-gray-900 w-12">选择</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">货号</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">名称</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">成色</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">颜色</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">规格</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">重量</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">工费</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">配件</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">石头</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">电镀</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">模具</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">佣金</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">供应商</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">金价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">零售价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">批发价</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => p.category === currentCategory)
                    .filter(p => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      if (searchType === "name") {
                        return p.productName.toLowerCase().includes(query);
                      } else if (searchType === "specification") {
                        return p.specification.toLowerCase().includes(query);
                      } else if (searchType === "supplierCode") {
                        return p.supplierCode.toLowerCase().includes(query);
                      } else {
                        return (
                          p.productName.toLowerCase().includes(query) ||
                          p.specification.toLowerCase().includes(query) ||
                          p.productCode.toLowerCase().includes(query) ||
                          p.supplierCode.toLowerCase().includes(query)
                        );
                      }
                    })
                    .map((product) => (
                    <tr key={product.id}>
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
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">
                          {product.goldPrice ? `¥${product.goldPrice.toFixed(2)}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-green-600">
                          CAD${product.retailPrice.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="font-medium text-blue-600">
                          CAD${product.wholesalePrice.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
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
                      <td colSpan={19} className="border border-gray-200 px-3 py-4 text-center text-gray-500">
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
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">重量</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">市场金价（人民币/克）</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">零售价</th>
                  <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">批发价</th>
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
                  </tr>
                ))}
                {priceHistory.filter(h => h.category === currentCategory).length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
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
                      className="w-full rounded bg-red-500 px-3 py-2 text-white hover:bg-red-600 text-xs"
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
    </div>
  );
}

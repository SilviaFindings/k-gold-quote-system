"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

// 产品分类列表
export const PRODUCT_CATEGORIES = [
  "耳环/耳逼",
  "水滴扣",
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
  category: ProductCategory;
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  karat: "14K" | "18K";
  goldPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  timestamp: string;
}

// 历史记录类型
interface PriceHistory {
  id: string;
  productId: string;
  category: ProductCategory;
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  karat: "14K" | "18K";
  goldPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  timestamp: string;
}

export default function QuotePage() {
  const [goldPrice, setGoldPrice] = useState<number>(() => {
    if (typeof window === 'undefined') return 500;
    const savedGoldPrice = localStorage.getItem("goldPrice");
    return savedGoldPrice ? Number(savedGoldPrice) : 500;
  });
  const [goldPriceTimestamp, setGoldPriceTimestamp] = useState<string>(() => {
    if (typeof window === 'undefined') return new Date().toLocaleString("zh-CN");
    const savedGoldPriceTimestamp = localStorage.getItem("goldPriceTimestamp");
    return savedGoldPriceTimestamp || new Date().toLocaleString("zh-CN");
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [currentCategory, setCurrentCategory] = useState<ProductCategory>("耳环/耳逼");
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    category: "耳环/耳逼",
    productCode: "",
    productName: "",
    specification: "",
    weight: 0,
    laborCost: 0,
    karat: "18K",
  });

  // 导入Excel相关状态
  const [importWeight, setImportWeight] = useState<boolean>(true);
  const [importLaborCost, setImportLaborCost] = useState<boolean>(true);
  const [defaultKarat, setDefaultKarat] = useState<"14K" | "18K">("18K");

  // 价格系数配置
  const [coefficients, setCoefficients] = useState<{
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
      return JSON.parse(savedCoefficients);
    }
    return {
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

  // 根据货号查找产品（获取当前分类的最新记录）
  const findLatestProductByCode = (code: string): Product | undefined => {
    const codeProducts = products.filter((p) => p.productCode === code && p.category === currentCategory);
    if (codeProducts.length === 0) return undefined;
    // 返回最新的记录
    return codeProducts[codeProducts.length - 1];
  };

  // 当货号改变时，自动填充已存在产品的信息
  useEffect(() => {
    if (currentProduct.productCode) {
      const existingProduct = findLatestProductByCode(currentProduct.productCode);
      if (existingProduct) {
        // 自动填充已存在产品的信息
        setCurrentProduct({
          ...currentProduct,
          productName: existingProduct.productName,
          specification: existingProduct.specification,
          weight: existingProduct.weight,
          laborCost: existingProduct.laborCost,
          karat: existingProduct.karat,
        });
      }
    }
  }, [currentProduct.productCode]);

  // 从 localStorage 加载数据
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedProducts = localStorage.getItem("goldProducts");
    const savedHistory = localStorage.getItem("goldPriceHistory");
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedHistory) setPriceHistory(JSON.parse(savedHistory));
  }, []);

  // 保存数据到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (products.length > 0) {
      localStorage.setItem("goldProducts", JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (priceHistory.length > 0) {
      localStorage.setItem("goldPriceHistory", JSON.stringify(priceHistory));
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
    karat: "14K" | "18K",
    isRetail: boolean
  ): number => {
    const goldFactor = karat === "14K" ? coefficients.goldFactor14K : coefficients.goldFactor18K;
    const laborFactor = isRetail ? coefficients.laborFactorRetail : coefficients.laborFactorWholesale;

    // 材料价 = 市场金价 x 金含量 x 重量 x 材料损耗 x 材料成本 / 汇率
    const materialPrice =
      marketGoldPrice * goldFactor * weight * coefficients.materialLoss * coefficients.materialCost / coefficients.exchangeRate;

    // 工费 = 人工成本 x 系数 / 汇率
    const laborPrice = laborCost * laborFactor / coefficients.exchangeRate;

    // 总价 = (材料价 + 工费) x 利润率
    const totalPrice = (materialPrice + laborPrice) * coefficients.profitMargin;

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
      false
    );

    const retailPrice = calculatePrice(
      goldPrice,
      currentProduct.weight || 0,
      currentProduct.laborCost || 0,
      currentProduct.karat || "18K",
      true
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
      wholesalePrice,
      retailPrice,
      goldPrice,
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
      goldPrice,
      wholesalePrice,
      retailPrice,
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
        false
      );

      const newRetailPrice = calculatePrice(
        goldPrice,
        product.weight,
        product.laborCost,
        product.karat,
        true
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
        goldPrice,
        wholesalePrice: newWholesalePrice,
        retailPrice: newRetailPrice,
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
        goldPrice,
        wholesalePrice: newWholesalePrice,
        retailPrice: newRetailPrice,
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

  // 导出 Excel（CSV 格式）- 横向展开，一个货号一行，包含所有历史记录
  const exportToExcel = () => {
    // 按货号分组（从历史记录中获取，只包含当前分类）
    const productGroups: { [key: string]: PriceHistory[] } = {};
    priceHistory.filter(h => h.category === currentCategory).forEach((history) => {
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
        规格: records[0].specification || "",
      };

      // 动态添加每次修改的数据
      records.forEach((record, index) => {
        const suffix = index + 1;
        row[`第${suffix}次时间`] = formatDate(record.timestamp);
        row[`第${suffix}次重量`] = record.weight;
        row[`第${suffix}次金价`] = record.goldPrice ? `¥${record.goldPrice.toFixed(2)}` : "";
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
    link.download = `${currentCategory}_产品报价单_` + new Date().toLocaleDateString("zh-CN") + ".csv";
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

        console.log("列索引:", {
          productCodeIndex,
          productNameIndex,
          specificationIndex,
          weightIndex,
          laborCostIndex
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

          if (!productCode || !productName) return;

          const wholesalePrice = calculatePrice(
            goldPrice,
            weight,
            laborCost,
            defaultKarat,
            false
          );

          const retailPrice = calculatePrice(
            goldPrice,
            weight,
            laborCost,
            defaultKarat,
            true
          );

          const newProduct: Product = {
            id: Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9),
            category: currentCategory,
            productCode: String(productCode),
            productName: String(productName),
            specification: String(specification || ""),
            weight,
            laborCost,
            karat: defaultKarat,
            wholesalePrice,
            retailPrice,
            goldPrice,
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
            goldPrice,
            wholesalePrice,
            retailPrice,
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

  return (
    <div className="min-h-screen bg-gray-50 p-8" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          K金产品报价计算表
        </h1>

        {/* 分类导航区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">产品分类</h2>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setCurrentCategory(category);
                  setCurrentProduct({ ...currentProduct, category });
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentCategory === category
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                suppressHydrationWarning
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 金价设置区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">金价设置</h2>
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
                onClick={() => setSelectedProducts(new Set(products.map(p => p.id)))}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                suppressHydrationWarning
              >
                全选
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
                  <span className="text-gray-900">默认成色：</span>
                  <select
                    value={defaultKarat}
                    onChange={(e) => setDefaultKarat(e.target.value as "14K" | "18K")}
                    className="rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none text-gray-900"
                    suppressHydrationWarning
                  >
                    <option value="18K">18K</option>
                    <option value="14K">14K</option>
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

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  金成色
                </label>
                <select
                  value={currentProduct.karat}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      karat: e.target.value as "14K" | "18K",
                    })
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  suppressHydrationWarning
                >
                  <option value="14K">14K金</option>
                  <option value="18K">18K金</option>
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
                <button
                  onClick={() => exportToExcel()}
                  className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                  suppressHydrationWarning
                >
                  导出Excel
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-center text-gray-900 w-12">选择</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">货号</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">名称</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-900">成色</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">重量</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">金价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">零售价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-gray-900">批发价</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => p.category === currentCategory).map((product) => (
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
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        <div className="text-gray-900">{product.weight}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(product.timestamp)}
                        </div>
                      </td>
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
                      <td colSpan={9} className="border border-gray-200 px-3 py-4 text-center text-gray-500">
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
                      colSpan={8}
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
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

// 产品信息类型
interface Product {
  id: string;
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
  const [goldPrice, setGoldPrice] = useState<number>(500); // 市场金价（元/克）
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    productCode: "",
    productName: "",
    specification: "",
    weight: 0,
    laborCost: 0,
    karat: "18K",
  });

  // 格式化日期为年月日
  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString("zh-CN");
  };

  // 根据货号查找产品（获取最新的记录）
  const findLatestProductByCode = (code: string): Product | undefined => {
    const codeProducts = products.filter((p) => p.productCode === code);
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
    const savedProducts = localStorage.getItem("goldProducts");
    const savedHistory = localStorage.getItem("goldPriceHistory");
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedHistory) setPriceHistory(JSON.parse(savedHistory));
  }, []);

  // 保存数据到 localStorage
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem("goldProducts", JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (priceHistory.length > 0) {
      localStorage.setItem("goldPriceHistory", JSON.stringify(priceHistory));
    }
  }, [priceHistory]);

  // 计算价格函数
  const calculatePrice = (
    marketGoldPrice: number,
    weight: number,
    laborCost: number,
    karat: "14K" | "18K",
    isRetail: boolean
  ): number => {
    const goldFactor = karat === "14K" ? 0.586 : 0.755; // 14K金含金量约为58.6%，18K金为75.5%
    const laborFactor = isRetail ? 5 : 3; // 零售价用5/5工费，批发价用3/5工费

    // 材料价 = 市场金价 x 金含量 x 重量 x 1.15 x 1.1 / 5
    const materialPrice =
      marketGoldPrice * goldFactor * weight * 1.15 * 1.1 / 5;

    // 工费 = 人工成本 x 系数 / 5
    const laborPrice = laborCost * laborFactor / 5;

    // 总价 = (材料价 + 工费) x 1.25
    const totalPrice = (materialPrice + laborPrice) * 1.25;

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
    // 按货号分组（从历史记录中获取）
    const productGroups: { [key: string]: PriceHistory[] } = {};
    priceHistory.forEach((history) => {
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
    link.download = "产品报价单_" + new Date().toLocaleDateString("zh-CN") + ".csv";
    link.click();
  };

  // 删除产品（同时删除相关的历史记录）
  const deleteProduct = (id: string) => {
    // 从产品列表中删除
    setProducts(products.filter((p) => p.id !== id));

    // 从历史记录中删除该产品的所有记录
    setPriceHistory(priceHistory.filter((h) => h.productId !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          K金产品报价计算表
        </h1>

        {/* 金价设置区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">金价设置</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-700">
                市场金价（人民币/克）
              </label>
              <input
                type="number"
                value={goldPrice}
                onChange={(e) => setGoldPrice(Number(e.target.value))}
                className="w-48 rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                step="0.01"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={updatePrices}
                className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                更新选中产品价格
              </button>
              <button
                onClick={() => setSelectedProducts(new Set(products.map(p => p.id)))}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                全选
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                取消全选
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 产品录入区域 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              产品信息录入
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              💡 <strong>快速更新模式</strong>：输入已存在的产品货号，自动填充信息并更新价格<br/>
              💡 <strong>新增产品模式</strong>：输入新货号，添加新产品
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text料-700">
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
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                >
                  <option value="14K">14K金</option>
                  <option value="18K">18K金</option>
                </select>
              </div>

              <button
                onClick={addProduct}
                className="w-full rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
              >
                添加产品
              </button>
            </div>
          </div>

          {/* 当前产品列表 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">当前产品列表</h2>
              {products.length > 0 && (
                <button
                  onClick={() => exportToExcel()}
                  className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
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
                  {products.map((product) => (
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
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={9} className="border border-gray-200 px-3 py-4 text-center text-gray-500">
                        暂无产品数据
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
            <h2 className="text-xl font-semibold text-gray-800">价格历史记录</h2>
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
                {priceHistory.map((history) => (
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
                {priceHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="border border-gray-200 px-3 py-4 text-center text-gray-500"
                    >
                      暂无历史记录
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

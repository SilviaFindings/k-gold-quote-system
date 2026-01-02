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
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    productCode: "",
    productName: "",
    specification: "",
    weight: 0,
    laborCost: 0,
    karat: "18K",
  });

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

    // 材料价 = 市场金价 x 金含量 x 1.15 x 1.1 / 5
    const materialPrice =
      marketGoldPrice * goldFactor * 1.15 * 1.1 / 5;

    // 工费 = 人工成本 x 系数 / 5
    const laborPrice = laborCost * laborFactor / 5;

    // 总价 = (材料价 + 工费) x 1.25
    const totalPrice = (materialPrice + laborPrice) * 1.25;

    return Math.round(totalPrice * 100) / 100; // 保留两位小数
  };

  // 添加产品
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
      timestamp: new Date().toLocaleString("zh-CN"),
    };

    // 添加到产品列表
    setProducts([...products, newProduct]);

    // 添加到历史记录
    const historyRecord: PriceHistory = {
      id: Date.now().toString() + "_hist",
      productId: newProduct.id,
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
  };

  // 更新产品价格（当金价变化时）
  const updatePrices = () => {
    const updatedProducts = products.map((product) => {
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

      // 添加到历史记录
      const historyRecord: PriceHistory = {
        id: Date.now().toString() + "_update",
        productId: product.id,
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
      setPriceHistory((prev) => [...prev, historyRecord]);

      return {
        ...product,
        wholesalePrice: newWholesalePrice,
        retailPrice: newRetailPrice,
        timestamp: new Date().toLocaleString("zh-CN"),
      };
    });

    setProducts(updatedProducts);
    alert("价格已更新！");
  };

  // 导出 Excel（CSV 格式）
  const exportToExcel = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((item) => Object.values(item).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // 删除产品
  const deleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          18K金产品报价计算单
        </h1>

        {/* 金价设置区域 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">金价设置</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-700">
                市场金价（加币/克）
              </label>
              <input
                type="number"
                value={goldPrice}
                onChange={(e) => setGoldPrice(Number(e.target.value))}
                className="w-48 rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="0.01"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={updatePrices}
                className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                更新所有产品价格
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 产品录入区域 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              产品信息录入
            </h2>
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    人工成本（加币）
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
                    className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
                  onClick={() =>
                    exportToExcel(products, `当前报价单_${new Date().toLocaleDateString("zh-CN")}.csv`)
                  }
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
                    <th className="border border-gray-200 px-3 py-2 text-left">货号</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">名称</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">成色</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">重量</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">批发价</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">零售价</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="border border-gray-200 px-3 py-2">{product.productCode}</td>
                      <td className="border border-gray-200 px-3 py-2">{product.productName}</td>
                      <td className="border border-gray-200 px-3 py-2">{product.karat}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right">{product.weight}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right font-medium text-green-600">
                        CAD${product.wholesalePrice.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right font-medium text-red-600">
                        CAD${product.retailPrice.toFixed(2)}
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
                      <td colSpan={7} className="border border-gray-200 px-3 py-4 text-center text-gray-500">
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">价格历史记录</h2>
            {priceHistory.length > 0 && (
              <button
                onClick={() =>
                  exportToExcel(priceHistory, `价格历史记录_${new Date().toLocaleDateString("zh-CN")}.csv`)
                }
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                导出历史
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-3 py-2 text-left">时间</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">货号</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">名称</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">成色</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">重量</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">市场金价</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">批发价</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">零售价</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.slice().reverse().map((history) => (
                  <tr key={history.id}>
                    <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">
                      {history.timestamp}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">{history.productCode}</td>
                    <td className="border border-gray-200 px-3 py-2">{history.productName}</td>
                    <td className="border border-gray-200 px-3 py-2">{history.karat}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{history.weight}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">
                      CAD${history.goldPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-green-600">
                      CAD${history.wholesalePrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-red-600">
                      CAD${history.retailPrice.toFixed(2)}
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

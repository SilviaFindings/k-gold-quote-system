// 检查本地数据的完整性
// 打开浏览器控制台，复制这段代码并执行来检查数据

(function() {
  console.log('🔍 开始检查本地数据...\n');

  // 检查产品数据
  const products = JSON.parse(localStorage.getItem('goldProducts') || '[]');
  console.log('📦 产品数据检查:');
  console.log(`  总数: ${products.length}`);

  let productIssues = 0;
  products.forEach((p, idx) => {
    const issues = [];
    if (!p.id) issues.push('缺少 id');
    if (!p.productCode) issues.push('缺少 productCode');
    if (!p.productName) issues.push('缺少 productName');
    if (!p.category) issues.push('缺少 category');
    if (!p.karat) issues.push('缺少 karat');
    if (!p.goldColor) issues.push('缺少 goldColor');
    if (p.weight === undefined || p.weight === null) issues.push('缺少 weight');
    if (p.laborCost === undefined || p.laborCost === null) issues.push('缺少 laborCost');
    if (p.goldPrice === undefined || p.goldPrice === null) issues.push('缺少 goldPrice');

    if (issues.length > 0) {
      productIssues++;
      console.log(`  ⚠️ 产品 ${idx} (${p.productCode || '未命名'}):`, issues.join(', '));
    }
  });

  console.log(`  ✅ 正常: ${products.length - productIssues} 个`);
  console.log(`  ⚠️ 有问题: ${productIssues} 个\n`);

  // 检查价格历史数据
  const history = JSON.parse(localStorage.getItem('goldPriceHistory') || '[]');
  console.log('📈 价格历史检查:');
  console.log(`  总数: ${history.length}`);

  let historyIssues = 0;
  let missingProductIdCount = 0;
  history.forEach((h, idx) => {
    const issues = [];
    if (!h.id) issues.push('缺少 id');
    if (!h.productId) {
      issues.push('缺少 productId');
      missingProductIdCount++;
    }
    if (!h.productCode) issues.push('缺少 productCode');
    if (!h.goldPrice) issues.push('缺少 goldPrice');
    if (!h.retailPrice) issues.push('缺少 retailPrice');
    if (!h.wholesalePrice) issues.push('缺少 wholesalePrice');

    if (issues.length > 0) {
      historyIssues++;
      console.log(`  ⚠️ 历史 ${idx} (${h.productCode || h.id}):`, issues.join(', '));
    }
  });

  console.log(`  ✅ 正常: ${history.length - historyIssues} 条`);
  console.log(`  ⚠️ 有问题: ${historyIssues} 条`);
  console.log(`  ⚠️ 缺少productId: ${missingProductIdCount} 条\n`);

  // 总结
  console.log('📋 总结:');
  if (productIssues === 0 && historyIssues === 0) {
    console.log('✅ 所有数据完整，可以正常同步');
  } else {
    console.log('⚠️ 发现数据完整性问题，可能需要修复后才能正常同步');
  }

  // 返回检查结果，方便复制
  return {
    products: { total: products.length, issues: productIssues },
    history: { total: history.length, issues: historyIssues, missingProductId: missingProductIdCount }
  };
})();

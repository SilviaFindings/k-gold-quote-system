-- 增加价格历史表的ID字段长度限制
-- 从36个字符增加到100个字符，以支持更长的ID格式

-- 注意：执行此脚本前请备份数据库！
-- 这个脚本会增加 price_history 和 products 表的 ID 字段长度

-- 修改 price_history 表的 ID 字段
ALTER TABLE price_history ALTER COLUMN id TYPE varchar(100);

-- 修改 products 表的 ID 字段（为了保持一致性）
ALTER TABLE products ALTER COLUMN id TYPE varchar(100);

-- 修改 price_history 表的 productId 字段（为了保持一致性）
ALTER TABLE price_history ALTER COLUMN product_id TYPE varchar(100);

-- 显示修改结果
SELECT
    'price_history.id' as field_name,
    character_maximum_length as max_length
FROM information_schema.columns
WHERE table_name = 'price_history' AND column_name = 'id'
UNION ALL
SELECT
    'products.id' as field_name,
    character_maximum_length as max_length
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'id'
UNION ALL
SELECT
    'price_history.product_id' as field_name,
    character_maximum_length as max_length
FROM information_schema.columns
WHERE table_name = 'price_history' AND column_name = 'product_id';

-- 添加 work_items 字段到 work_orders 表
-- 用于保存工种和安装内容的层次关系数据

ALTER TABLE work_orders 
ADD COLUMN work_items TEXT DEFAULT NULL;
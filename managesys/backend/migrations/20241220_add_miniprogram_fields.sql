-- 添加小程序相关字段到工单表
-- 执行时间: 2024-12-20

-- 添加工种类型字段 (JSON)
ALTER TABLE work_orders ADD COLUMN work_types TEXT;

-- 添加安装内容字段 (JSON)
ALTER TABLE work_orders ADD COLUMN install_contents TEXT;

-- 添加语音转文字内容字段
ALTER TABLE work_orders ADD COLUMN voice_text TEXT;

-- 添加位置信息字段 (JSON)
ALTER TABLE work_orders ADD COLUMN location_info TEXT;

-- 添加注释说明
PRAGMA table_info(work_orders);
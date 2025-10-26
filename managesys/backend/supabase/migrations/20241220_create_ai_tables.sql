-- AI识别记录表
CREATE TABLE ai_recognition_records (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'equipment', 'fault', 'progress'
  image_url TEXT,
  result JSONB NOT NULL,
  confidence DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI预测记录表
CREATE TABLE ai_prediction_records (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'completion_time', 'resource_demand', 'fault_trend'
  input_data JSONB NOT NULL,
  prediction_result JSONB NOT NULL,
  accuracy DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI推荐记录表
CREATE TABLE ai_recommendation_records (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'solution', 'assignment', 'priority'
  input_data JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  adopted BOOLEAN DEFAULT FALSE,
  feedback_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI模型配置表
CREATE TABLE ai_model_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'prediction', 'recognition'
  version VARCHAR(20) NOT NULL,
  config JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'training'
  accuracy DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI训练数据集表
CREATE TABLE ai_training_datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  file_path TEXT,
  file_size BIGINT,
  record_count INTEGER,
  status VARCHAR(20) DEFAULT 'ready', -- 'ready', 'processing', 'completed', 'error'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI训练日志表
CREATE TABLE ai_training_logs (
  id SERIAL PRIMARY KEY,
  model_id INTEGER REFERENCES ai_model_configs(id),
  dataset_id INTEGER REFERENCES ai_training_datasets(id),
  status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
  progress INTEGER DEFAULT 0,
  metrics JSONB,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- AI系统配置表
CREATE TABLE ai_system_configs (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- 插入默认AI系统配置
INSERT INTO ai_system_configs (category, key, value, description) VALUES
('ai_service', 'tensorflow_enabled', 'true', '启用TensorFlow.js服务'),
('ai_service', 'opencv_enabled', 'true', '启用OpenCV.js服务'),
('ai_service', 'max_image_size', '10485760', '最大图片大小(字节)'),
('ai_service', 'supported_formats', 'jpg,jpeg,png,bmp', '支持的图片格式'),
('image_processing', 'auto_resize', 'true', '自动调整图片尺寸'),
('image_processing', 'max_width', '1920', '最大图片宽度'),
('image_processing', 'max_height', '1080', '最大图片高度'),
('image_processing', 'quality', '85', '图片压缩质量'),
('performance', 'batch_size', '32', '批处理大小'),
('performance', 'max_concurrent', '5', '最大并发处理数'),
('performance', 'cache_enabled', 'true', '启用结果缓存'),
('performance', 'cache_ttl', '3600', '缓存过期时间(秒)');

-- 插入默认AI模型配置
INSERT INTO ai_model_configs (name, type, version, config, accuracy) VALUES
('设备分类模型', 'recognition', '1.0.0', '{"input_size": [224, 224], "classes": ["交换机", "路由器", "服务器", "防火墙"], "threshold": 0.8}', 92.5),
('故障检测模型', 'recognition', '1.0.0', '{"input_size": [224, 224], "classes": ["正常", "过热", "连接异常", "硬件故障"], "threshold": 0.85}', 89.3),
('施工进度模型', 'recognition', '1.0.0', '{"input_size": [224, 224], "stages": ["准备阶段", "施工中", "验收阶段", "完成"], "threshold": 0.75}', 87.8),
('完成时间预测模型', 'prediction', '1.0.0', '{"features": ["priority", "complexity", "resource_count", "historical_avg"], "algorithm": "linear_regression"}', 85.2),
('资源需求预测模型', 'prediction', '1.0.0', '{"features": ["task_type", "complexity", "deadline", "team_size"], "algorithm": "random_forest"}', 83.7);

-- 启用行级安全策略
ALTER TABLE ai_recognition_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prediction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_system_configs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 允许认证用户访问所有记录
CREATE POLICY "Allow authenticated users to access ai_recognition_records" ON ai_recognition_records
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access ai_prediction_records" ON ai_prediction_records
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access ai_recommendation_records" ON ai_recommendation_records
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access ai_model_configs" ON ai_model_configs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access ai_training_datasets" ON ai_training_datasets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access ai_training_logs" ON ai_training_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access ai_system_configs" ON ai_system_configs
  FOR ALL USING (auth.role() = 'authenticated');

-- 授予anon和authenticated角色访问权限
GRANT SELECT ON ai_recognition_records TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ai_recognition_records TO authenticated;

GRANT SELECT ON ai_prediction_records TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ai_prediction_records TO authenticated;

GRANT SELECT ON ai_recommendation_records TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ai_recommendation_records TO authenticated;

GRANT SELECT ON ai_model_configs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ai_model_configs TO authenticated;

GRANT SELECT ON ai_training_datasets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ai_training_datasets TO authenticated;

GRANT SELECT ON ai_training_logs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ai_training_logs TO authenticated;

GRANT SELECT ON ai_system_configs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ai_system_configs TO authenticated;

-- 授予序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
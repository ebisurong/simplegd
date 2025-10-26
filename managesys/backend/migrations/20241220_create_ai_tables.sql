-- AI功能相关数据表创建脚本
-- 创建时间: 2024-12-20

-- 1. AI识别记录表
CREATE TABLE IF NOT EXISTS ai_recognition_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_order_id INT,
    recognition_type ENUM('equipment', 'fault', 'progress') NOT NULL COMMENT '识别类型',
    image_path VARCHAR(500) COMMENT '图片路径',
    image_size INT COMMENT '图片大小(字节)',
    recognition_result JSON COMMENT '识别结果(JSON格式)',
    confidence DECIMAL(5,4) COMMENT '置信度',
    processing_time INT COMMENT '处理时间(毫秒)',
    status ENUM('success', 'failed', 'processing') DEFAULT 'processing' COMMENT '处理状态',
    error_message TEXT COMMENT '错误信息',
    created_by INT COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_recognition_type (recognition_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI识别记录表';

-- 2. AI预测记录表
CREATE TABLE IF NOT EXISTS ai_prediction_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_order_id INT,
    prediction_type ENUM('completion_time', 'resource_demand', 'fault_trend') NOT NULL COMMENT '预测类型',
    input_data JSON COMMENT '输入数据(JSON格式)',
    prediction_result JSON COMMENT '预测结果(JSON格式)',
    confidence DECIMAL(5,4) COMMENT '置信度',
    processing_time INT COMMENT '处理时间(毫秒)',
    actual_result JSON COMMENT '实际结果(用于模型训练)',
    accuracy DECIMAL(5,4) COMMENT '预测准确率',
    status ENUM('success', 'failed', 'processing') DEFAULT 'processing' COMMENT '处理状态',
    error_message TEXT COMMENT '错误信息',
    created_by INT COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_prediction_type (prediction_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI预测记录表';

-- 3. AI推荐记录表
CREATE TABLE IF NOT EXISTS ai_recommendation_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_order_id INT,
    recommendation_type ENUM('solution', 'assignment', 'priority') NOT NULL COMMENT '推荐类型',
    input_data JSON COMMENT '输入数据(JSON格式)',
    recommendation_result JSON COMMENT '推荐结果(JSON格式)',
    confidence DECIMAL(5,4) COMMENT '置信度',
    processing_time INT COMMENT '处理时间(毫秒)',
    is_adopted BOOLEAN DEFAULT FALSE COMMENT '是否被采纳',
    adoption_feedback JSON COMMENT '采纳反馈',
    effectiveness_score DECIMAL(3,2) COMMENT '效果评分(1-5)',
    status ENUM('success', 'failed', 'processing') DEFAULT 'processing' COMMENT '处理状态',
    error_message TEXT COMMENT '错误信息',
    created_by INT COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_recommendation_type (recommendation_type),
    INDEX idx_is_adopted (is_adopted),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI推荐记录表';

-- 4. AI模型配置表
CREATE TABLE IF NOT EXISTS ai_model_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(100) NOT NULL COMMENT '模型名称',
    model_type ENUM('recognition', 'prediction', 'recommendation') NOT NULL COMMENT '模型类型',
    model_version VARCHAR(50) COMMENT '模型版本',
    model_path VARCHAR(500) COMMENT '模型文件路径',
    config_data JSON COMMENT '模型配置(JSON格式)',
    performance_metrics JSON COMMENT '性能指标(JSON格式)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    training_data_path VARCHAR(500) COMMENT '训练数据路径',
    last_trained_at TIMESTAMP NULL COMMENT '最后训练时间',
    created_by INT COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_model_name_version (model_name, model_version),
    INDEX idx_model_type (model_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI模型配置表';

-- 5. AI训练数据集表
CREATE TABLE IF NOT EXISTS ai_training_datasets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_name VARCHAR(100) NOT NULL COMMENT '数据集名称',
    dataset_type ENUM('image', 'text', 'structured') NOT NULL COMMENT '数据集类型',
    model_type ENUM('recognition', 'prediction', 'recommendation') NOT NULL COMMENT '适用模型类型',
    file_path VARCHAR(500) COMMENT '数据文件路径',
    file_size BIGINT COMMENT '文件大小(字节)',
    record_count INT COMMENT '记录数量',
    description TEXT COMMENT '数据集描述',
    labels JSON COMMENT '标签信息(JSON格式)',
    metadata JSON COMMENT '元数据(JSON格式)',
    quality_score DECIMAL(3,2) COMMENT '数据质量评分(1-5)',
    is_validated BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
    validation_result JSON COMMENT '验证结果',
    created_by INT COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dataset_type (dataset_type),
    INDEX idx_model_type (model_type),
    INDEX idx_is_validated (is_validated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI训练数据集表';

-- 6. AI训练日志表
CREATE TABLE IF NOT EXISTS ai_training_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_config_id INT NOT NULL COMMENT '模型配置ID',
    dataset_id INT COMMENT '数据集ID',
    training_type ENUM('initial', 'retrain', 'fine_tune') NOT NULL COMMENT '训练类型',
    training_params JSON COMMENT '训练参数(JSON格式)',
    training_status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '训练状态',
    progress DECIMAL(5,2) DEFAULT 0 COMMENT '训练进度(百分比)',
    current_epoch INT DEFAULT 0 COMMENT '当前轮次',
    total_epochs INT COMMENT '总轮次',
    loss_value DECIMAL(10,6) COMMENT '损失值',
    accuracy DECIMAL(5,4) COMMENT '准确率',
    validation_accuracy DECIMAL(5,4) COMMENT '验证准确率',
    training_time INT COMMENT '训练时间(秒)',
    log_content LONGTEXT COMMENT '训练日志内容',
    error_message TEXT COMMENT '错误信息',
    result_metrics JSON COMMENT '结果指标(JSON格式)',
    created_by INT COMMENT '创建用户ID',
    started_at TIMESTAMP NULL COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_model_config_id (model_config_id),
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_training_status (training_status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (model_config_id) REFERENCES ai_model_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI训练日志表';

-- 7. AI系统配置表
CREATE TABLE IF NOT EXISTS ai_system_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
    category ENUM('service', 'model', 'image_processing', 'performance') NOT NULL COMMENT '配置分类',
    description TEXT COMMENT '配置描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_by INT COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_config_key (config_key),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI系统配置表';

-- 插入默认AI系统配置
INSERT INTO ai_system_configs (config_key, config_value, config_type, category, description) VALUES
('ai_service_enabled', 'true', 'boolean', 'service', 'AI服务是否启用'),
('max_image_size', '10485760', 'number', 'image_processing', '最大图片大小(字节)'),
('supported_image_formats', '["jpg", "jpeg", "png", "bmp", "gif"]', 'json', 'image_processing', '支持的图片格式'),
('image_resize_width', '224', 'number', 'image_processing', '图片缩放宽度'),
('image_resize_height', '224', 'number', 'image_processing', '图片缩放高度'),
('prediction_confidence_threshold', '0.7', 'number', 'model', '预测置信度阈值'),
('recognition_confidence_threshold', '0.6', 'number', 'model', '识别置信度阈值'),
('max_concurrent_requests', '10', 'number', 'performance', '最大并发请求数'),
('request_timeout', '30000', 'number', 'performance', '请求超时时间(毫秒)'),
('model_cache_size', '5', 'number', 'performance', '模型缓存数量'),
('enable_gpu_acceleration', 'false', 'boolean', 'performance', '是否启用GPU加速'),
('log_level', 'info', 'string', 'service', '日志级别'),
('auto_retrain_enabled', 'false', 'boolean', 'model', '是否启用自动重训练'),
('retrain_threshold_accuracy', '0.8', 'number', 'model', '重训练触发准确率阈值');

-- 插入默认AI模型配置
INSERT INTO ai_model_configs (model_name, model_type, model_version, config_data, is_active) VALUES
('equipment_classifier', 'recognition', '1.0.0', '{"input_shape": [224, 224, 3], "num_classes": 5, "architecture": "CNN"}', true),
('fault_detector', 'recognition', '1.0.0', '{"input_shape": [224, 224, 3], "threshold": 0.5, "architecture": "CNN"}', true),
('progress_recognizer', 'recognition', '1.0.0', '{"input_shape": [224, 224, 3], "num_stages": 5, "architecture": "CNN"}', true),
('completion_predictor', 'prediction', '1.0.0', '{"input_features": 5, "hidden_layers": [64, 32], "architecture": "MLP"}', true),
('resource_predictor', 'prediction', '1.0.0', '{"input_features": 8, "hidden_layers": [128, 64, 32], "architecture": "MLP"}', true),
('solution_recommender', 'recommendation', '1.0.0', '{"embedding_dim": 128, "num_solutions": 10, "architecture": "Collaborative Filtering"}', true);

COMMIT;
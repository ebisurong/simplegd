const { sequelize, AIModel } = require('../models');

async function initAIDatabase() {
  try {
    // 同步数据库表结构
    await sequelize.sync({ force: false });
    console.log('AI数据库表结构同步完成');

    // 检查是否已有AI模型数据
    const existingModels = await AIModel.count();
    if (existingModels > 0) {
      console.log('AI模型数据已存在，跳过初始化');
      return;
    }

    // 初始化AI模型数据
    const initialModels = [
      {
        model_name: 'completion_time_predictor',
        model_type: 'prediction',
        version: '1.0',
        parameters: JSON.stringify({
          algorithm: 'random_forest',
          features: ['priority', 'stage', 'complexity'],
          max_depth: 10,
          n_estimators: 100
        }),
        accuracy: 0.85,
        status: 'active',
        trained_at: new Date()
      },
      {
        model_name: 'equipment_classifier',
        model_type: 'recognition',
        version: '1.0',
        parameters: JSON.stringify({
          architecture: 'cnn',
          input_size: [224, 224, 3],
          num_classes: 20,
          learning_rate: 0.001
        }),
        accuracy: 0.92,
        status: 'active',
        trained_at: new Date()
      },
      {
        model_name: 'solution_recommender',
        model_type: 'recommendation',
        version: '1.0',
        parameters: JSON.stringify({
          algorithm: 'collaborative_filtering',
          similarity_metric: 'cosine',
          k_neighbors: 5,
          min_similarity: 0.3
        }),
        accuracy: 0.78,
        status: 'active',
        trained_at: new Date()
      },
      {
        model_name: 'resource_demand_predictor',
        model_type: 'prediction',
        version: '1.0',
        parameters: JSON.stringify({
          algorithm: 'linear_regression',
          features: ['historical_demand', 'seasonality', 'workload'],
          regularization: 'l2'
        }),
        accuracy: 0.82,
        status: 'active',
        trained_at: new Date()
      },
      {
        model_name: 'fault_detector',
        model_type: 'recognition',
        version: '1.0',
        parameters: JSON.stringify({
          architecture: 'resnet50',
          input_size: [224, 224, 3],
          num_classes: 15,
          pretrained: true
        }),
        accuracy: 0.89,
        status: 'active',
        trained_at: new Date()
      }
    ];

    await AIModel.bulkCreate(initialModels);
    console.log('AI模型初始数据创建完成');
    console.log(`已创建 ${initialModels.length} 个AI模型`);

  } catch (error) {
    console.error('AI数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initAIDatabase()
    .then(() => {
      console.log('AI数据库初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('初始化失败:', error);
      process.exit(1);
    });
}

module.exports = initAIDatabase;
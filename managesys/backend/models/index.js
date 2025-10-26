const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.db'),
  logging: false, // 设置为 console.log 可以看到SQL语句
});

// 导入模型
const User = require('./User')(sequelize, DataTypes);
const WorkOrder = require('./WorkOrder')(sequelize, DataTypes);
const WorkOrderPhoto = require('./WorkOrderPhoto')(sequelize, DataTypes);
const WorkOrderLog = require('./WorkOrderLog')(sequelize, DataTypes);
const SystemConfig = require('./SystemConfig')(sequelize, DataTypes);

// 导入AI相关模型
const AIPrediction = require('./AIPrediction')(sequelize, DataTypes);
const ImageRecognition = require('./ImageRecognition')(sequelize, DataTypes);
const AIRecommendation = require('./AIRecommendation')(sequelize, DataTypes);
const AIModel = require('./AIModel')(sequelize, DataTypes);
const ModelTrainingLog = require('./ModelTrainingLog')(sequelize, DataTypes);

// 建立模型关联
// 用户与工单的关联
User.hasMany(WorkOrder, { foreignKey: 'submitter_id', as: 'submittedWorkOrders' });
User.hasMany(WorkOrder, { foreignKey: 'assignee_id', as: 'assignedWorkOrders' });
WorkOrder.belongsTo(User, { foreignKey: 'submitter_id', as: 'submitter' });
WorkOrder.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });

// 工单与照片的关联
WorkOrder.hasMany(WorkOrderPhoto, { foreignKey: 'work_order_id', as: 'photos' });
WorkOrderPhoto.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

// 工单与日志的关联
WorkOrder.hasMany(WorkOrderLog, { foreignKey: 'work_order_id', as: 'logs' });
WorkOrderLog.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

// 用户与日志的关联
User.hasMany(WorkOrderLog, { foreignKey: 'user_id', as: 'logs' });
WorkOrderLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// AI相关模型关联
// 工单与AI预测的关联
WorkOrder.hasMany(AIPrediction, { foreignKey: 'work_order_id', as: 'aiPredictions' });
AIPrediction.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

// 工单与图像识别的关联
WorkOrder.hasMany(ImageRecognition, { foreignKey: 'work_order_id', as: 'imageRecognitions' });
ImageRecognition.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

// 工单与AI推荐的关联
WorkOrder.hasMany(AIRecommendation, { foreignKey: 'work_order_id', as: 'aiRecommendations' });
AIRecommendation.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

// AI模型与训练日志的关联
AIModel.hasMany(ModelTrainingLog, { foreignKey: 'model_id', as: 'trainingLogs' });
ModelTrainingLog.belongsTo(AIModel, { foreignKey: 'model_id', as: 'aiModel' });

module.exports = {
  sequelize,
  User,
  WorkOrder,
  WorkOrderPhoto,
  WorkOrderLog,
  SystemConfig,
  // AI相关模型
  AIPrediction,
  ImageRecognition,
  AIRecommendation,
  AIModel,
  ModelTrainingLog,
};
module.exports = (sequelize, DataTypes) => {
  const ModelTrainingLog = sequelize.define('ModelTrainingLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'AIModels',
        key: 'id'
      }
    },
    training_data_size: {
      type: DataTypes.INTEGER,
      comment: '训练数据集大小'
    },
    validation_accuracy: {
      type: DataTypes.REAL,
      comment: '验证准确率'
    },
    training_loss: {
      type: DataTypes.REAL,
      comment: '训练损失'
    },
    validation_loss: {
      type: DataTypes.REAL,
      comment: '验证损失'
    },
    training_time: {
      type: DataTypes.INTEGER,
      comment: '训练时间(秒)'
    },
    hyperparameters: {
      type: DataTypes.TEXT,
      comment: 'JSON格式存储超参数'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '训练开始时间'
    },
    completed_at: {
      type: DataTypes.DATE,
      comment: '训练完成时间'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'running',
      comment: '状态：running, completed, failed'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'model_training_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['model_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['started_at']
      }
    ]
  });

  return ModelTrainingLog;
};
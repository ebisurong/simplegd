module.exports = (sequelize, DataTypes) => {
  const AIModel = sequelize.define('AIModel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    model_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '模型名称'
    },
    model_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '模型类型：prediction, recognition, recommendation'
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '模型版本'
    },
    parameters: {
      type: DataTypes.TEXT,
      comment: 'JSON格式存储模型参数'
    },
    accuracy: {
      type: DataTypes.REAL,
      comment: '模型准确率(0-1)'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: '状态：active, training, deprecated'
    },
    trained_at: {
      type: DataTypes.DATE,
      comment: '训练完成时间'
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
    tableName: 'ai_models',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['model_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return AIModel;
};
module.exports = (sequelize, DataTypes) => {
  const AIPrediction = sequelize.define('AIPrediction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    work_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'WorkOrders',
        key: 'id'
      }
    },
    prediction_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '预测类型：completion_time, resource_demand, failure_trend'
    },
    predicted_value: {
      type: DataTypes.REAL,
      allowNull: false,
      comment: '预测值'
    },
    confidence: {
      type: DataTypes.REAL,
      allowNull: false,
      comment: '预测置信度(0-1)'
    },
    factors: {
      type: DataTypes.TEXT,
      comment: 'JSON格式存储影响因素'
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
    tableName: 'ai_predictions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['work_order_id']
      },
      {
        fields: ['prediction_type']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return AIPrediction;
};
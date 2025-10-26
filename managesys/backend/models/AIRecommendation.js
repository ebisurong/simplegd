module.exports = (sequelize, DataTypes) => {
  const AIRecommendation = sequelize.define('AIRecommendation', {
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
    recommendation_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '推荐类型：solution, personnel, priority'
    },
    recommendation_data: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON格式存储推荐内容'
    },
    similarity_score: {
      type: DataTypes.REAL,
      comment: '相似度评分(0-1)'
    },
    success_rate: {
      type: DataTypes.REAL,
      comment: '历史成功率(0-1)'
    },
    is_adopted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否被采纳'
    },
    adopted_at: {
      type: DataTypes.DATE,
      comment: '采纳时间'
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
    tableName: 'ai_recommendations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['work_order_id']
      },
      {
        fields: ['recommendation_type']
      },
      {
        fields: ['is_adopted']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return AIRecommendation;
};
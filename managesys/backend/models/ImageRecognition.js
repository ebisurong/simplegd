module.exports = (sequelize, DataTypes) => {
  const ImageRecognition = sequelize.define('ImageRecognition', {
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
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '图片URL路径'
    },
    recognized_type: {
      type: DataTypes.STRING(100),
      comment: '识别的类型：equipment, fault, progress'
    },
    confidence: {
      type: DataTypes.REAL,
      allowNull: false,
      comment: '识别置信度(0-1)'
    },
    bounding_box: {
      type: DataTypes.TEXT,
      comment: 'JSON格式存储边界框坐标'
    },
    attributes: {
      type: DataTypes.TEXT,
      comment: 'JSON格式存储识别属性'
    },
    processing_time: {
      type: DataTypes.INTEGER,
      comment: '处理时间(毫秒)'
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
    tableName: 'image_recognitions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['work_order_id']
      },
      {
        fields: ['recognized_type']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return ImageRecognition;
};
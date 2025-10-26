module.exports = (sequelize, DataTypes) => {
  const WorkOrderPhoto = sequelize.define('WorkOrderPhoto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    work_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'work_orders',
        key: 'id',
      },
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    photo_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '图片在服务器上的完整路径',
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '原始文件名',
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小（字节）',
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '文件MIME类型',
    },
    has_watermark: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'work_order_photos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['work_order_id'],
      },
    ],
  });

  return WorkOrderPhoto;
};
module.exports = (sequelize, DataTypes) => {
  const WorkOrderItem = sequelize.define('WorkOrderItem', {
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
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    work_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '工种类型，如：桥架、基础、穿线、手井等',
    },
    install_content: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '安装内容，如：监控、门禁、设备基础、管道基础等',
    },
  }, {
    tableName: 'work_order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['work_order_id'],
      },
      {
        fields: ['work_type'],
      },
      {
        fields: ['install_content'],
      },
      {
        fields: ['work_order_id', 'work_type'],
      },
    ],
  });

  WorkOrderItem.associate = function(models) {
    // 建立与WorkOrder的多对一关系
    WorkOrderItem.belongsTo(models.WorkOrder, {
      foreignKey: 'work_order_id',
      as: 'workOrder',
    });
  };

  return WorkOrderItem;
};
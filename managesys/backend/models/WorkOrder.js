module.exports = (sequelize, DataTypes) => {
  const WorkOrder = sequelize.define('WorkOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    construction_stage: {
      type: DataTypes.ENUM('preparation', 'foundation', 'structure', 'decoration', 'equipment', 'completion'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'closed'),
      defaultValue: 'pending',
    },
    contact_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    project_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    gps_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    gps_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    submitter_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    // 小程序相关字段
    work_types: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '工种类型数组，来自小程序',
    },
    install_contents: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '安装内容数组，来自小程序',
    },
    work_items: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '工种和安装内容的层次关系数据，格式：[{work_type: "桥架", install_contents: ["监控", "门禁"]}]',
    },
    voice_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '语音转文字内容，来自小程序',
    },
    location_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '位置信息，来自小程序GPS定位',
    },
  }, {
    tableName: 'work_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['construction_stage'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['assignee_id'],
      },
    ],
  });

  WorkOrder.associate = function(models) {
    // 建立与WorkOrderItem的一对多关系
    WorkOrder.hasMany(models.WorkOrderItem, {
      foreignKey: 'work_order_id',
      as: 'workOrderItems',
    });

    // 建立与User的关系
    WorkOrder.belongsTo(models.User, {
      foreignKey: 'submitter_id',
      as: 'submitter',
    });

    WorkOrder.belongsTo(models.User, {
      foreignKey: 'assignee_id',
      as: 'assignee',
    });

    // 建立与WorkOrderPhoto的一对多关系
    WorkOrder.hasMany(models.WorkOrderPhoto, {
      foreignKey: 'work_order_id',
      as: 'photos',
    });

    // 建立与WorkOrderLog的一对多关系
    WorkOrder.hasMany(models.WorkOrderLog, {
      foreignKey: 'work_order_id',
      as: 'logs',
    });
  };

  return WorkOrder;
};
module.exports = (sequelize, DataTypes) => {
  const SystemConfig = sequelize.define('SystemConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    config_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  }, {
    tableName: 'system_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['config_key'],
      },
    ],
  });

  return SystemConfig;
};
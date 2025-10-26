const express = require('express');
const { Op } = require('sequelize');
const { SystemConfig } = require('../models');
const router = express.Router();

// 获取所有系统配置
router.get('/', async (req, res) => {
  try {

    const configs = await SystemConfig.findAll({
      order: [['config_key', 'ASC']],
    });

    res.json({ configs });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取单个配置项
router.get('/:key', async (req, res) => {
  try {
    const config = await SystemConfig.findOne({
      where: { config_key: req.params.key },
    });

    if (!config) {
      return res.status(404).json({ message: '配置项不存在' });
    }

    res.json({ config });
  } catch (error) {
    console.error('获取配置项错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新系统配置
router.put('/:key', async (req, res) => {
  try {

    const { config_value, description } = req.body;
    const config_key = req.params.key;

    const [config, created] = await SystemConfig.findOrCreate({
      where: { config_key },
      defaults: {
        config_key,
        config_value,
        description,
      },
    });

    if (!created) {
      await config.update({
        config_value,
        description: description || config.description,
      });
    }

    res.json({
      message: created ? '配置项创建成功' : '配置项更新成功',
      config,
    });
  } catch (error) {
    console.error('创建/更新配置项错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 删除配置项
router.delete('/:key', async (req, res) => {
  try {

    const config = await SystemConfig.findOne({
      where: { config_key: req.params.key },
    });

    if (!config) {
      return res.status(404).json({ message: '配置项不存在' });
    }

    await config.destroy();

    res.json({ message: '配置项删除成功' });
  } catch (error) {
    console.error('删除配置项错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 批量更新配置
router.post('/batch', async (req, res) => {
  try {

    const { configs } = req.body;

    if (!Array.isArray(configs)) {
      return res.status(400).json({ message: '配置数据格式错误' });
    }

    const updatePromises = configs.map(async ({ config_key, config_value, description }) => {
      const [config, created] = await SystemConfig.findOrCreate({
        where: { config_key },
        defaults: {
          config_key,
          config_value,
          description,
        },
      });

      if (!created) {
        await config.update({
          config_value,
          description: description || config.description,
        });
      }

      return config;
    });

    const updatedConfigs = await Promise.all(updatePromises);

    res.json({
      message: '批量更新配置成功',
      configs: updatedConfigs,
    });
  } catch (error) {
    console.error('批量更新配置错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取公开配置（不需要认证）
router.get('/public/all', async (req, res) => {
  try {
    // 只返回公开的配置项（以 'public_' 开头的配置）
    const publicConfigs = await SystemConfig.findAll({
      where: {
        config_key: {
          [Op.like]: 'public_%',
        },
      },
      attributes: ['config_key', 'config_value'],
    });

    const configMap = {};
    publicConfigs.forEach(config => {
      configMap[config.config_key] = config.config_value;
    });

    res.json({ configs: configMap });
  } catch (error) {
    console.error('获取公开配置错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
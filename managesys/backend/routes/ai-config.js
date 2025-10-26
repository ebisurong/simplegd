const express = require('express');
const { AIModel, ModelTrainingLog } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 获取所有AI模型配置
router.get('/models', async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (type) {
      whereClause.model_type = type;
    }

    const models = await AIModel.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      include: [{
        model: ModelTrainingLog,
        as: 'training_logs',
        limit: 5,
        order: [['created_at', 'DESC']]
      }]
    });

    res.json({
      success: true,
      models: models.map(model => ({
        id: model.id,
        name: model.model_name,
        type: model.model_type,
        version: model.version,
        parameters: JSON.parse(model.parameters),
        accuracy: model.accuracy,
        status: model.status,
        trained_at: model.trained_at,
        created_at: model.created_at,
        updated_at: model.updated_at,
        recent_training_logs: model.training_logs?.map(log => ({
          id: log.id,
          training_data_size: log.training_data_size,
          validation_accuracy: log.validation_accuracy,
          status: log.status,
          completed_at: log.completed_at
        })) || []
      }))
    });

  } catch (error) {
    console.error('获取AI模型配置失败:', error);
    res.status(500).json({ error: '获取配置失败，请稍后重试' });
  }
});

// 获取单个模型详细配置
router.get('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = await AIModel.findByPk(modelId, {
      include: [{
        model: ModelTrainingLog,
        as: 'training_logs',
        order: [['created_at', 'DESC']]
      }]
    });

    if (!model) {
      return res.status(404).json({ error: '模型不存在' });
    }

    res.json({
      success: true,
      model: {
        id: model.id,
        name: model.model_name,
        type: model.model_type,
        version: model.version,
        parameters: JSON.parse(model.parameters),
        accuracy: model.accuracy,
        status: model.status,
        trained_at: model.trained_at,
        created_at: model.created_at,
        updated_at: model.updated_at,
        training_logs: model.training_logs?.map(log => ({
          id: log.id,
          training_data_size: log.training_data_size,
          validation_accuracy: log.validation_accuracy,
          training_loss: log.training_loss,
          validation_loss: log.validation_loss,
          training_time: log.training_time,
          hyperparameters: JSON.parse(log.hyperparameters || '{}'),
          started_at: log.started_at,
          completed_at: log.completed_at,
          status: log.status
        })) || []
      }
    });

  } catch (error) {
    console.error('获取模型详情失败:', error);
    res.status(500).json({ error: '获取模型详情失败' });
  }
});

// 更新模型配置
router.put('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { parameters, status, version } = req.body;

    const model = await AIModel.findByPk(modelId);
    if (!model) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 验证参数格式
    if (parameters && typeof parameters !== 'object') {
      return res.status(400).json({ error: '参数格式不正确' });
    }

    // 更新模型配置
    const updateData = {};
    if (parameters) {
      updateData.parameters = JSON.stringify(parameters);
    }
    if (status) {
      updateData.status = status;
    }
    if (version) {
      updateData.version = version;
    }

    await model.update(updateData);

    res.json({
      success: true,
      message: '模型配置更新成功',
      model: {
        id: model.id,
        name: model.model_name,
        type: model.model_type,
        version: model.version,
        parameters: JSON.parse(model.parameters),
        status: model.status,
        updated_at: model.updated_at
      }
    });

  } catch (error) {
    console.error('更新模型配置失败:', error);
    res.status(500).json({ error: '更新配置失败，请稍后重试' });
  }
});

// 创建新的AI模型
router.post('/models', async (req, res) => {
  try {
    const { name, type, version, parameters, accuracy } = req.body;

    // 验证必填字段
    if (!name || !type) {
      return res.status(400).json({ error: '模型名称和类型不能为空' });
    }

    // 检查模型名称是否已存在
    const existingModel = await AIModel.findOne({
      where: { model_name: name }
    });

    if (existingModel) {
      return res.status(400).json({ error: '模型名称已存在' });
    }

    // 创建新模型
    const model = await AIModel.create({
      model_name: name,
      model_type: type,
      version: version || '1.0',
      parameters: JSON.stringify(parameters || {}),
      accuracy: accuracy || 0.0,
      status: 'inactive',
      trained_at: null
    });

    res.json({
      success: true,
      message: '模型创建成功',
      model: {
        id: model.id,
        name: model.model_name,
        type: model.model_type,
        version: model.version,
        parameters: JSON.parse(model.parameters),
        accuracy: model.accuracy,
        status: model.status,
        created_at: model.created_at
      }
    });

  } catch (error) {
    console.error('创建模型失败:', error);
    res.status(500).json({ error: '创建模型失败，请稍后重试' });
  }
});

// 删除AI模型
router.delete('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = await AIModel.findByPk(modelId);
    if (!model) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 检查模型是否正在使用
    if (model.status === 'active') {
      return res.status(400).json({ error: '无法删除正在使用的模型，请先停用' });
    }

    await model.destroy();

    res.json({
      success: true,
      message: '模型删除成功'
    });

  } catch (error) {
    console.error('删除模型失败:', error);
    res.status(500).json({ error: '删除模型失败，请稍后重试' });
  }
});

// 开始模型训练
router.post('/models/:modelId/train', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { trainingDataSize, hyperparameters } = req.body;

    const model = await AIModel.findByPk(modelId);
    if (!model) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 创建训练日志记录
    const trainingLog = await ModelTrainingLog.create({
      model_id: modelId,
      training_data_size: trainingDataSize || 1000,
      hyperparameters: JSON.stringify(hyperparameters || {}),
      started_at: new Date(),
      status: 'running'
    });

    // 模拟训练过程（实际应用中这里会调用真实的训练服务）
    setTimeout(async () => {
      try {
        // 模拟训练结果
        const trainingTime = Math.floor(Math.random() * 3600) + 600; // 10分钟到1小时
        const validationAccuracy = Math.random() * 0.3 + 0.7; // 70%-100%
        const trainingLoss = Math.random() * 0.5 + 0.1; // 0.1-0.6
        const validationLoss = trainingLoss + Math.random() * 0.1; // 略高于训练损失

        // 更新训练日志
        await trainingLog.update({
          validation_accuracy: validationAccuracy,
          training_loss: trainingLoss,
          validation_loss: validationLoss,
          training_time: trainingTime,
          completed_at: new Date(),
          status: 'completed'
        });

        // 如果训练效果好，更新模型精度
        if (validationAccuracy > model.accuracy) {
          await model.update({
            accuracy: validationAccuracy,
            trained_at: new Date()
          });
        }

      } catch (error) {
        console.error('训练过程出错:', error);
        await trainingLog.update({
          status: 'failed',
          completed_at: new Date()
        });
      }
    }, 5000); // 5秒后完成模拟训练

    res.json({
      success: true,
      message: '模型训练已开始',
      training_log: {
        id: trainingLog.id,
        model_id: modelId,
        training_data_size: trainingLog.training_data_size,
        status: trainingLog.status,
        started_at: trainingLog.started_at
      }
    });

  } catch (error) {
    console.error('开始训练失败:', error);
    res.status(500).json({ error: '开始训练失败，请稍后重试' });
  }
});

// 获取训练日志
router.get('/training-logs', async (req, res) => {
  try {
    const { modelId, status, limit = 50 } = req.query;

    const whereClause = {};
    if (modelId) {
      whereClause.model_id = modelId;
    }
    if (status) {
      whereClause.status = status;
    }

    const logs = await ModelTrainingLog.findAll({
      where: whereClause,
      include: [{
        model: AIModel,
        as: 'model',
        attributes: ['id', 'model_name', 'model_type']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        model: {
          id: log.model.id,
          name: log.model.model_name,
          type: log.model.model_type
        },
        training_data_size: log.training_data_size,
        validation_accuracy: log.validation_accuracy,
        training_loss: log.training_loss,
        validation_loss: log.validation_loss,
        training_time: log.training_time,
        hyperparameters: JSON.parse(log.hyperparameters || '{}'),
        started_at: log.started_at,
        completed_at: log.completed_at,
        status: log.status
      }))
    });

  } catch (error) {
    console.error('获取训练日志失败:', error);
    res.status(500).json({ error: '获取训练日志失败' });
  }
});

// 获取系统性能统计
router.get('/performance', async (req, res) => {
  try {
    // 获取模型统计
    const modelStats = await AIModel.findAll({
      attributes: [
        'model_type',
        [AIModel.sequelize.fn('COUNT', '*'), 'count'],
        [AIModel.sequelize.fn('AVG', AIModel.sequelize.col('accuracy')), 'avg_accuracy']
      ],
      group: ['model_type']
    });

    // 获取训练统计
    const trainingStats = await ModelTrainingLog.findAll({
      attributes: [
        'status',
        [ModelTrainingLog.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    // 获取最近的训练活动
    const recentTraining = await ModelTrainingLog.findAll({
      include: [{
        model: AIModel,
        as: 'model',
        attributes: ['model_name', 'model_type']
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // 计算系统整体性能指标
    const totalModels = await AIModel.count();
    const activeModels = await AIModel.count({ where: { status: 'active' } });
    const avgAccuracy = await AIModel.findOne({
      attributes: [[AIModel.sequelize.fn('AVG', AIModel.sequelize.col('accuracy')), 'avg']]
    });

    res.json({
      success: true,
      performance: {
        overview: {
          total_models: totalModels,
          active_models: activeModels,
          average_accuracy: parseFloat(avgAccuracy.dataValues.avg || 0).toFixed(3),
          model_utilization: totalModels > 0 ? (activeModels / totalModels * 100).toFixed(1) + '%' : '0%'
        },
        model_stats: modelStats.map(stat => ({
          type: stat.model_type,
          count: parseInt(stat.dataValues.count),
          avg_accuracy: parseFloat(stat.dataValues.avg_accuracy || 0).toFixed(3)
        })),
        training_stats: trainingStats.map(stat => ({
          status: stat.status,
          count: parseInt(stat.dataValues.count)
        })),
        recent_training: recentTraining.map(log => ({
          id: log.id,
          model_name: log.model.model_name,
          model_type: log.model.model_type,
          validation_accuracy: log.validation_accuracy,
          status: log.status,
          completed_at: log.completed_at,
          training_time: log.training_time
        }))
      }
    });

  } catch (error) {
    console.error('获取性能统计失败:', error);
    res.status(500).json({ error: '获取性能统计失败' });
  }
});

// 导出模型配置
router.get('/models/:modelId/export', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = await AIModel.findByPk(modelId, {
      include: [{
        model: ModelTrainingLog,
        as: 'training_logs',
        order: [['created_at', 'DESC']],
        limit: 1
      }]
    });

    if (!model) {
      return res.status(404).json({ error: '模型不存在' });
    }

    const exportData = {
      model: {
        name: model.model_name,
        type: model.model_type,
        version: model.version,
        parameters: JSON.parse(model.parameters),
        accuracy: model.accuracy,
        status: model.status,
        trained_at: model.trained_at
      },
      latest_training: model.training_logs?.[0] ? {
        training_data_size: model.training_logs[0].training_data_size,
        validation_accuracy: model.training_logs[0].validation_accuracy,
        hyperparameters: JSON.parse(model.training_logs[0].hyperparameters || '{}'),
        completed_at: model.training_logs[0].completed_at
      } : null,
      export_time: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="model_${model.model_name}_${Date.now()}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('导出模型配置失败:', error);
    res.status(500).json({ error: '导出失败，请稍后重试' });
  }
});

module.exports = router;
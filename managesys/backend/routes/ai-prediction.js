const express = require('express');
const { AIPrediction, WorkOrder, AIModel } = require('../models');
const router = express.Router();

// 获取工单完成时间预测
router.post('/completion-time', async (req, res) => {
  try {
    const { workOrderId, priority, stage, complexity } = req.body;

    // 验证输入参数
    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 获取预测模型
    const model = await AIModel.findOne({
      where: { model_name: 'completion_time_predictor', status: 'active' }
    });

    if (!model) {
      return res.status(404).json({ error: '预测模型未找到' });
    }

    // 简化的预测算法（实际应用中应使用训练好的机器学习模型）
    const baseDays = {
      '低': 1,
      '中': 3,
      '高': 7,
      '紧急': 0.5
    };

    const stageMultiplier = {
      '待分配': 1.2,
      '进行中': 1.0,
      '待验收': 0.3,
      '已完成': 0
    };

    const complexityMultiplier = {
      '简单': 0.8,
      '中等': 1.0,
      '复杂': 1.5,
      '非常复杂': 2.0
    };

    const baseTime = baseDays[priority] || 3;
    const stageMulti = stageMultiplier[stage] || 1.0;
    const complexMulti = complexityMultiplier[complexity] || 1.0;
    
    const predictedDays = Math.max(0.1, baseTime * stageMulti * complexMulti);
    const confidence = Math.min(0.95, 0.7 + Math.random() * 0.2); // 模拟置信度

    // 保存预测结果
    const prediction = await AIPrediction.create({
      work_order_id: workOrderId,
      prediction_type: 'completion_time',
      predicted_value: JSON.stringify({
        days: predictedDays,
        hours: predictedDays * 24,
        estimated_completion: new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000)
      }),
      confidence: confidence,
      factors: JSON.stringify({
        priority,
        stage,
        complexity,
        base_time: baseTime,
        stage_multiplier: stageMulti,
        complexity_multiplier: complexMulti
      })
    });

    res.json({
      success: true,
      prediction: {
        id: prediction.id,
        predicted_days: predictedDays,
        predicted_hours: predictedDays * 24,
        estimated_completion: new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000),
        confidence: confidence,
        factors: {
          priority,
          stage,
          complexity
        }
      }
    });

  } catch (error) {
    console.error('完成时间预测失败:', error);
    res.status(500).json({ error: '预测失败，请稍后重试' });
  }
});

// 获取资源需求预测
router.post('/resource-demand', async (req, res) => {
  try {
    const { workOrderId, workType, location, seasonality } = req.body;

    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 获取预测模型
    const model = await AIModel.findOne({
      where: { model_name: 'resource_demand_predictor', status: 'active' }
    });

    if (!model) {
      return res.status(404).json({ error: '资源需求预测模型未找到' });
    }

    // 简化的资源需求预测
    const baseResources = {
      '安装': { personnel: 2, equipment: 3, materials: 5 },
      '维修': { personnel: 1, equipment: 2, materials: 3 },
      '检查': { personnel: 1, equipment: 1, materials: 1 },
      '升级': { personnel: 3, equipment: 4, materials: 8 }
    };

    const locationMultiplier = {
      '市区': 1.0,
      '郊区': 1.2,
      '偏远地区': 1.5
    };

    const seasonalityMultiplier = {
      '春季': 1.0,
      '夏季': 1.1,
      '秋季': 1.0,
      '冬季': 1.3
    };

    const base = baseResources[workType] || baseResources['维修'];
    const locMulti = locationMultiplier[location] || 1.0;
    const seasMulti = seasonalityMultiplier[seasonality] || 1.0;

    const predictedResources = {
      personnel: Math.ceil(base.personnel * locMulti * seasMulti),
      equipment: Math.ceil(base.equipment * locMulti * seasMulti),
      materials: Math.ceil(base.materials * locMulti * seasMulti)
    };

    const confidence = Math.min(0.9, 0.65 + Math.random() * 0.2);

    // 保存预测结果
    const prediction = await AIPrediction.create({
      work_order_id: workOrderId,
      prediction_type: 'resource_demand',
      predicted_value: JSON.stringify(predictedResources),
      confidence: confidence,
      factors: JSON.stringify({
        work_type: workType,
        location,
        seasonality,
        base_resources: base,
        location_multiplier: locMulti,
        seasonality_multiplier: seasMulti
      })
    });

    res.json({
      success: true,
      prediction: {
        id: prediction.id,
        resources: predictedResources,
        confidence: confidence,
        factors: {
          work_type: workType,
          location,
          seasonality
        }
      }
    });

  } catch (error) {
    console.error('资源需求预测失败:', error);
    res.status(500).json({ error: '预测失败，请稍后重试' });
  }
});

// 获取故障趋势分析
router.post('/fault-trend', async (req, res) => {
  try {
    const { timeRange, equipmentType, location } = req.body;

    // 模拟故障趋势数据
    const trendData = [];
    const now = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const faultCount = Math.floor(Math.random() * 10) + 1;
      const severity = Math.random();
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        fault_count: faultCount,
        severity_avg: severity,
        equipment_type: equipmentType,
        location: location
      });
    }

    // 计算趋势指标
    const totalFaults = trendData.reduce((sum, item) => sum + item.fault_count, 0);
    const avgSeverity = trendData.reduce((sum, item) => sum + item.severity_avg, 0) / trendData.length;
    const trend = trendData.length > 1 ? 
      (trendData[trendData.length - 1].fault_count - trendData[0].fault_count) / trendData.length : 0;

    const confidence = Math.min(0.85, 0.6 + Math.random() * 0.2);

    res.json({
      success: true,
      analysis: {
        trend_data: trendData,
        summary: {
          total_faults: totalFaults,
          average_severity: avgSeverity,
          trend_direction: trend > 0 ? '上升' : trend < 0 ? '下降' : '稳定',
          trend_value: trend,
          confidence: confidence
        },
        predictions: {
          next_week_faults: Math.max(0, Math.floor(totalFaults / days * 7 + trend * 7)),
          risk_level: avgSeverity > 0.7 ? '高' : avgSeverity > 0.4 ? '中' : '低'
        }
      }
    });

  } catch (error) {
    console.error('故障趋势分析失败:', error);
    res.status(500).json({ error: '分析失败，请稍后重试' });
  }
});

// 获取工单的历史预测记录
router.get('/history/:workOrderId', async (req, res) => {
  try {
    const { workOrderId } = req.params;
    const { type } = req.query;

    const whereClause = { work_order_id: workOrderId };
    if (type) {
      whereClause.prediction_type = type;
    }

    const predictions = await AIPrediction.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      predictions: predictions.map(p => ({
        id: p.id,
        type: p.prediction_type,
        predicted_value: JSON.parse(p.predicted_value),
        confidence: p.confidence,
        factors: JSON.parse(p.factors),
        created_at: p.created_at
      }))
    });

  } catch (error) {
    console.error('获取预测历史失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

module.exports = router;
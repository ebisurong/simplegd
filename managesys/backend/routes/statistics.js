const express = require('express');
const { WorkOrder, User, WorkOrderLog } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 获取仪表盘统计数据
router.get('/dashboard', async (req, res) => {
  try {
    // 工单总数统计
    const totalWorkOrders = await WorkOrder.count();
    const pendingWorkOrders = await WorkOrder.count({ where: { status: 'pending' } });
    const processingWorkOrders = await WorkOrder.count({ where: { status: 'processing' } });
    const completedWorkOrders = await WorkOrder.count({ where: { status: 'completed' } });
    const closedWorkOrders = await WorkOrder.count({ where: { status: 'closed' } });

    // 优先级统计
    const urgentWorkOrders = await WorkOrder.count({ where: { priority: 'urgent' } });
    const highWorkOrders = await WorkOrder.count({ where: { priority: 'high' } });
    const mediumWorkOrders = await WorkOrder.count({ where: { priority: 'medium' } });
    const lowWorkOrders = await WorkOrder.count({ where: { priority: 'low' } });

    // 施工阶段统计
    const stageStats = await WorkOrder.findAll({
      attributes: [
        'construction_stage',
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
      ],
      group: ['construction_stage'],
      raw: true,
    });

    // 用户统计
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });

    // 最近7天的工单创建趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentWorkOrders = await WorkOrder.findAll({
      where: {
        created_at: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      attributes: [
        [WorkOrder.sequelize.fn('DATE', WorkOrder.sequelize.col('created_at')), 'date'],
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
      ],
      group: [WorkOrder.sequelize.fn('DATE', WorkOrder.sequelize.col('created_at'))],
      order: [[WorkOrder.sequelize.fn('DATE', WorkOrder.sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    res.json({
      workOrderStats: {
        total: totalWorkOrders,
        pending: pendingWorkOrders,
        processing: processingWorkOrders,
        completed: completedWorkOrders,
        closed: closedWorkOrders,
      },
      priorityStats: {
        urgent: urgentWorkOrders,
        high: highWorkOrders,
        medium: mediumWorkOrders,
        low: lowWorkOrders,
      },
      stageStats,
      userStats: {
        total: totalUsers,
        active: activeUsers,
      },
      recentTrend: recentWorkOrders,
    });
  } catch (error) {
    console.error('获取仪表盘统计数据错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取工单状态统计
router.get('/workorder-status', async (req, res) => {
  try {
    const statusStats = await WorkOrder.findAll({
      attributes: [
        'status',
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true,
    });

    res.json({ statusStats });
  } catch (error) {
    console.error('获取工单状态分布错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取工单优先级分布
router.get('/workorder-priority', async (req, res) => {
  try {
    const priorityStats = await WorkOrder.findAll({
      attributes: [
        'priority',
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true,
    });

    res.json({ priorityStats });
  } catch (error) {
    console.error('获取工单优先级分布错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取施工阶段分布
router.get('/construction-stage', async (req, res) => {
  try {
    const stageStats = await WorkOrder.findAll({
      attributes: [
        'construction_stage',
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
      ],
      group: ['construction_stage'],
      raw: true,
    });

    res.json({ stageStats });
  } catch (error) {
    console.error('获取施工阶段分布错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取工单创建趋势（按日期）
router.get('/workorder-trend', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trendData = await WorkOrder.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        [WorkOrder.sequelize.fn('DATE', WorkOrder.sequelize.col('created_at')), 'date'],
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
      ],
      group: [WorkOrder.sequelize.fn('DATE', WorkOrder.sequelize.col('created_at'))],
      order: [[WorkOrder.sequelize.fn('DATE', WorkOrder.sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    res.json({ trendData });
  } catch (error) {
    console.error('获取工单创建趋势错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取用户工单统计
router.get('/user-workorders', async (req, res) => {
  try {
    const userStats = await WorkOrder.findAll({
      attributes: [
        'assignee_id',
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('WorkOrder.id')), 'count']
      ],
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['username', 'real_name'],
        },
      ],
      where: {
        assignee_id: {
          [Op.not]: null,
        },
      },
      group: ['assignee_id', 'assignee.id'],
      order: [[WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('WorkOrder.id')), 'DESC']],
    });

    res.json({ userStats });
  } catch (error) {
    console.error('获取用户工单统计错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取月度统计报告
router.get('/monthly-report', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 当月工单统计
    const monthlyWorkOrders = await WorkOrder.count({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // 当月完成的工单
    const monthlyCompleted = await WorkOrder.count({
      where: {
        status: 'completed',
        updated_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // 当月各状态工单数量
    const monthlyStatusStats = await WorkOrder.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        'status',
        [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true,
    });

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      totalCreated: monthlyWorkOrders,
      totalCompleted: monthlyCompleted,
      statusBreakdown: monthlyStatusStats,
    });
  } catch (error) {
    console.error('获取月度统计报告错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
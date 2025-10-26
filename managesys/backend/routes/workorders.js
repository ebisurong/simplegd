const express = require('express');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const { WorkOrder, WorkOrderPhoto, WorkOrderLog, User } = require('../models');
const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  },
});

// 获取工单列表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      construction_stage,
      search,
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (construction_stage) where.construction_stage = construction_stage;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { project_name: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: WorkOrderPhoto,
          as: 'photos',
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      workorders: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('获取工单列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取单个工单详情
router.get('/:id', async (req, res) => {
  try {
    const workorder = await WorkOrder.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: WorkOrderPhoto,
          as: 'photos',
        },
        {
          model: WorkOrderLog,
          as: 'logs',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'real_name'],
            },
          ],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!workorder) {
      return res.status(404).json({ message: '工单不存在' });
    }

    res.json({ workorder });
  } catch (error) {
    console.error('获取工单详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 创建工单
router.post('/', upload.array('photos', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      construction_stage,
      contact_name,
      contact_phone,
      project_name,
      location_name,
      gps_latitude,
      gps_longitude,
    } = req.body;

    if (!title || !description || !construction_stage) {
      return res.status(400).json({ message: '标题、描述和施工阶段不能为空' });
    }

    const workorder = await WorkOrder.create({
      title,
      description,
      priority,
      construction_stage,
      contact_name,
      contact_phone,
      project_name,
      location_name,
      gps_latitude: gps_latitude ? parseFloat(gps_latitude) : null,
      gps_longitude: gps_longitude ? parseFloat(gps_longitude) : null,
    });

    // 处理上传的照片
    if (req.files && req.files.length > 0) {
      const photoPromises = req.files.map(file => 
        WorkOrderPhoto.create({
          work_order_id: workorder.id,
          photo_url: `/uploads/${file.filename}`,
        })
      );
      await Promise.all(photoPromises);
    }

    res.status(201).json({
      message: '工单创建成功',
      workorder,
    });
  } catch (error) {
    console.error('创建工单错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新工单状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const workorder = await WorkOrder.findByPk(req.params.id);

    if (!workorder) {
      return res.status(404).json({ message: '工单不存在' });
    }

    const oldStatus = workorder.status;
    await workorder.update({ status });

    // 记录日志
    await WorkOrderLog.create({
      work_order_id: workorder.id,
      user_id: 1, // 默认用户ID
      action: 'status_change',
      content: `状态从 ${oldStatus} 更改为 ${status}`,
    });

    res.json({ message: '工单状态更新成功', workorder });
  } catch (error) {
    console.error('更新工单状态错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取工单日志
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await WorkOrderLog.findAll({
      where: { work_order_id: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({ data: logs });
  } catch (error) {
    console.error('获取工单日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取工单评论（暂时返回空数组，可以后续扩展）
router.get('/:id/comments', async (req, res) => {
  try {
    // 暂时返回空数组，可以后续添加评论功能
    res.json({ data: [] });
  } catch (error) {
    console.error('获取工单评论错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新工单信息
router.put('/:id', async (req, res) => {
  try {
    const workorder = await WorkOrder.findByPk(req.params.id);

    if (!workorder) {
      return res.status(404).json({ message: '工单不存在' });
    }

    await workorder.update(req.body);

    // 记录日志
    await WorkOrderLog.create({
      work_order_id: workorder.id,
      user_id: 1, // 默认用户ID
      action: 'update',
      content: '工单信息已更新',
    });

    res.json({ message: '工单更新成功', workorder });
  } catch (error) {
    console.error('更新工单错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
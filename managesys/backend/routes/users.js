const express = require('express');
const { Op } = require('sequelize');
const { User } = require('../models');
const router = express.Router();

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { real_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'email', 'real_name', 'role', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      users: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取单个用户详情
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'email', 'real_name', 'role', 'status', 'created_at', 'updated_at'],
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 创建用户
router.post('/', async (req, res) => {
  try {

    const { username, password, email, real_name, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const user = await User.create({
      username,
      password: password, // 直接存储明文密码
      email,
      real_name,
      role,
    });

    res.status(201).json({
      message: '用户创建成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        real_name: user.real_name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const { email, real_name, role, status, password } = req.body;
    const updateData = {};

    if (email !== undefined) updateData.email = email;
    if (real_name !== undefined) updateData.real_name = real_name;
    
    // 允许修改角色和状态
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // 如果要更新密码
    if (password) {
      updateData.password = password; // 直接存储明文密码
    }

    await user.update(updateData);

    res.json({
      message: '用户信息更新成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        real_name: user.real_name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    await user.destroy();

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 重置用户密码
router.post('/:id/reset-password', async (req, res) => {
  try {

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: '新密码不能为空' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    await user.update({ password: password }); // 直接存储明文密码

    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
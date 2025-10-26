const express = require('express');
const { User } = require('../models');
const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    console.log('=== 登录请求开始 ===');
    console.log('请求体:', req.body);
    const { username, password } = req.body;
    console.log('解析的用户名:', username);
    console.log('解析的密码:', password);

    if (!username || !password) {
      console.log('用户名或密码为空');
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    console.log('开始查询用户:', username);
    const user = await User.findOne({ where: { username } });
    console.log('数据库查询结果:', user ? {
      id: user.id,
      username: user.username,
      password: user.password,
      status: user.status,
      role: user.role
    } : null);
    
    if (!user) {
      console.log('用户不存在');
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    console.log('密码比较: 输入密码=', password, ', 数据库密码=', user.password);
    if (password !== user.password) {
      console.log('密码不匹配');
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    console.log('用户状态检查:', user.status);
    if (user.status !== 'active') {
      console.log('账户未激活');
      return res.status(401).json({ message: '账户已被禁用' });
    }

    const responseData = {
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        real_name: user.real_name,
        role: user.role,
      },
    };
    console.log('登录成功，返回数据:', responseData);
    console.log('=== 登录请求结束 ===');
    res.json(responseData);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 注册（仅管理员可用）
router.post('/register', async (req, res) => {
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
      password,
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
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取当前用户信息（无认证版本）
router.get('/me', async (req, res) => {
  try {
    // 返回默认用户信息，无需认证
    const user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      real_name: '管理员',
      role: 'admin',
      status: 'active'
    };

    res.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 登出
router.post('/logout', (req, res) => {
  // 由于使用JWT，登出主要在前端处理（删除token）
  // 这里只需要返回成功响应
  res.json({ message: '登出成功' });
});

module.exports = router;
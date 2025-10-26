const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.0.102:3000', 'http://192.168.0.104:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由配置
app.use('/api/auth', require('./routes/auth'));
app.use('/api/work-orders', require('./routes/workorders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/configs', require('./routes/config'));

// 文件上传路由
app.use('/api/upload', require('./routes/upload'));

// AI相关路由
// app.use('/api/ai', require('./routes/ai'));

// 小程序相关路由
console.log('🔍 [DEBUG] 正在注册小程序路由: /api/miniprogram');
app.use('/api/miniprogram', require('./routes/miniprogram'));

// 根路径路由
app.get('/', (req, res) => {
  res.json({
    name: '工单管理系统 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      workOrders: '/api/work-orders',
      users: '/api/users',
      statistics: '/api/statistics',
      configs: '/api/configs',
      health: '/health'
    },
    message: 'API服务运行正常'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '工单管理系统后端服务运行正常' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 404处理 - 移除通配符路由以避免路径解析错误

// 启动服务器
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
    console.log(`局域网访问地址: http://192.168.0.102:${PORT}`);
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
});

module.exports = app;
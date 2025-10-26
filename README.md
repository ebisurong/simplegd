# 工单管理系统

一个基于 Vue3 + Express + SQLite 的全栈工单管理系统，适用于建筑施工、设备维护等场景的工单管理。

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 pnpm

### 一键启动

```bash
# 克隆项目后，在项目根目录执行
npm run install-deps  # 安装所有依赖
npm start            # 启动整个系统
```

启动后访问：
- 前端：http://localhost:3000
- 后端：http://localhost:5000

### 默认账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 全部权限 |
| 项目经理 | manager | manager123 | 工单管理 |
| 普通用户 | testuser | user123 | 基础权限 |

## 📁 项目结构

```
workorder-management-system/
├── frontend/                 # Vue3 前端项目
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── views/          # 页面
│   │   ├── router/         # 路由
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── api/            # API 接口
│   │   └── utils/          # 工具函数
│   ├── public/             # 静态资源
│   └── package.json
├── backend/                  # Express 后端项目
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── scripts/            # 脚本
│   ├── uploads/            # 文件上传目录
│   ├── app.js              # 应用入口
│   └── package.json
├── start.js                  # 一键启动脚本
├── package.json             # 根项目配置
└── README.md
```

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Element Plus** - UI 组件库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化
- **Vite** - 构建工具

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 框架
- **Sequelize** - ORM 框架
- **SQLite** - 轻量级数据库
- **JWT** - 身份认证
- **Multer** - 文件上传
- **bcryptjs** - 密码加密

## 🎯 功能特性

### 核心功能
- ✅ 用户认证与权限管理
- ✅ 工单创建、查看、编辑
- ✅ 工单状态流转管理
- ✅ 施工阶段分类管理
- ✅ 文件上传与管理
- ✅ 数据统计与可视化
- ✅ 系统配置管理

### 工单管理
- 多种优先级设置（低、中、高、紧急）
- 施工阶段分类（准备、基础、结构、装修、设备、完工）
- 工单状态跟踪（待处理、处理中、已完成、已关闭）
- 工单分配与责任人管理
- 操作日志记录

### 数据统计
- 工单状态分布统计
- 优先级分布分析
- 施工阶段进度统计
- 用户工单统计
- 时间趋势分析

## 🔧 开发指南

### 分别启动服务

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（新终端）
cd frontend
npm run dev
```

### 数据库管理

```bash
# 初始化数据库
npm run init-db

# 重置数据库（清空所有数据）
cd backend
npm run init-db
```

### 构建部署

```bash
# 构建前端
npm run build

# 前端构建产物在 frontend/dist 目录
```

## 📊 数据库设计

### 主要数据表

- **users** - 用户表
- **work_orders** - 工单表
- **work_order_photos** - 工单照片表
- **work_order_logs** - 工单日志表
- **system_configs** - 系统配置表

### 关系设计

- 用户与工单：一对多（创建者、处理人）
- 工单与照片：一对多
- 工单与日志：一对多
- 用户与日志：一对多

## 🚀 部署说明

### 开发环境
1. 确保 Node.js >= 16
2. 运行 `npm run install-deps` 安装依赖
3. 运行 `npm start` 启动系统

### 生产环境
1. 构建前端：`npm run build`
2. 配置 Express 静态文件服务
3. 配置环境变量（JWT_SECRET 等）
4. 使用 PM2 等工具管理进程

## 📝 API 文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 工单接口
- `GET /api/workorders` - 获取工单列表
- `POST /api/workorders` - 创建工单
- `GET /api/workorders/:id` - 获取工单详情
- `PATCH /api/workorders/:id/status` - 更新工单状态
- `PATCH /api/workorders/:id/assign` - 分配工单

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户

### 统计接口
- `GET /api/statistics/dashboard` - 仪表盘数据
- `GET /api/statistics/workorder-trend` - 工单趋势
- `GET /api/statistics/monthly-report` - 月度报告

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🆘 问题反馈

如遇到问题，请检查：
1. Node.js 版本是否 >= 16
2. 依赖是否正确安装
3. 端口 3000 和 5000 是否被占用
4. 数据库是否正确初始化

---

**工单管理系统** - 让工单管理更简单高效！
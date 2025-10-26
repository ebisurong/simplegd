import api from './index'

// 用户认证相关接口
export const authAPI = {
  // 登录
  login: (data: { username: string; password: string }) => {
    console.log('=== API登录请求开始 ===');
    console.log('请求URL: /auth/login');
    console.log('请求数据:', data);
    const request = api.post('/auth/login', data);
    console.log('登录请求已发送');
    return request;
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return api.get('/auth/me')
  },
  
  // 登出
  logout: () => {
    return api.post('/auth/logout')
  }
}

// 工单相关接口
export const workOrderAPI = {
  // 获取工单列表
  getWorkOrders: (params?: any) => {
    return api.get('/work-orders', { params })
  },
  
  // 获取工单详情
  getWorkOrder: (id: string) => {
    return api.get(`/work-orders/${id}`)
  },
  
  // 获取工单详情（别名方法）
  getWorkOrderById: (id: string) => {
    return api.get(`/work-orders/${id}`)
  },
  
  // 获取工单进度记录
  getWorkOrderProgress: (id: string) => {
    return api.get(`/work-orders/${id}/logs`)
  },
  
  // 获取工单评论
  getWorkOrderComments: (id: string) => {
    return api.get(`/work-orders/${id}/comments`)
  },
  
  // 更新工单状态
  updateWorkOrderStatus: (id: string, status: string) => {
    return api.patch(`/work-orders/${id}/status`, { status })
  },
  
  // 更新工单信息
  updateWorkOrder: (id: string, data: any) => {
    return api.put(`/work-orders/${id}`, data)
  },
  
  // 添加工单备注
  addWorkOrderNote: (id: string, note: string) => {
    return api.post(`/work-orders/${id}/notes`, { note })
  }
}

// 用户管理相关接口
export const userAPI = {
  // 获取用户列表
  getUsers: (params?: any) => {
    return api.get('/users', { params })
  },
  
  // 创建用户
  createUser: (data: any) => {
    return api.post('/users', data)
  },
  
  // 更新用户
  updateUser: (id: string, data: any) => {
    return api.put(`/users/${id}`, data)
  },
  
  // 删除用户
  deleteUser: (id: string) => {
    return api.delete(`/users/${id}`)
  }
}

// 统计数据相关接口
export const statisticsAPI = {
  // 获取仪表盘统计数据
  getDashboardStats: () => {
    return api.get('/statistics/dashboard')
  },
  
  // 获取工单统计数据
  getWorkOrderStats: (params?: any) => {
    return api.get('/statistics/work-orders', { params })
  },
  
  // 获取用户活跃度统计
  getUserActivityStats: (params?: any) => {
    return api.get('/statistics/user-activity', { params })
  },
  
  // 获取施工阶段统计数据
  getStageStats: () => {
    return api.get('/statistics/construction-stage')
  }
}

// 系统设置相关接口
export const settingsAPI = {
  // 获取系统配置
  getSettings: () => {
    return api.get('/settings')
  },
  
  // 更新系统配置
  updateSettings: (data: any) => {
    return api.put('/settings', data)
  }
}
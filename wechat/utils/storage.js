/**
 * 本地存储管理工具
 */

const { generateId, formatTime } = require('./util.js')

// 存储键名常量
const STORAGE_KEYS = {
  ORDERS: 'work_orders',
  SETTINGS: 'app_settings',
  USER_INFO: 'user_info'
}

/**
 * 获取所有工单
 * @returns {Array} 工单列表
 */
function getOrders() {
  try {
    const orders = wx.getStorageSync(STORAGE_KEYS.ORDERS)
    return Array.isArray(orders) ? orders : []
  } catch (error) {
    console.error('获取工单数据失败:', error)
    return []
  }
}

/**
 * 保存工单
 * @param {Object} order 工单数据
 * @returns {boolean} 保存是否成功
 */
function saveOrder(order) {
  try {
    const orders = getOrders()
    
    // 生成工单ID和时间戳
    if (!order.id) {
      order.id = generateId('WO')
    }
    if (!order.createTime) {
      order.createTime = formatTime(new Date())
    }
    if (!order.updateTime) {
      order.updateTime = order.createTime
    }
    if (!order.status) {
      order.status = 'pending'
    }
    
    // 添加处理记录
    if (!order.timeline) {
      order.timeline = []
    }
    
    // 添加创建记录
    if (order.timeline.length === 0) {
      order.timeline.push({
        id: generateId('TL'),
        action: 'created',
        description: '工单已创建',
        time: order.createTime,
        operator: order.contact || '系统'
      })
    }
    
    orders.unshift(order) // 新工单放在最前面
    wx.setStorageSync(STORAGE_KEYS.ORDERS, orders)
    return true
  } catch (error) {
    console.error('保存工单失败:', error)
    return false
  }
}

/**
 * 更新工单
 * @param {string} orderId 工单ID
 * @param {Object} updateData 更新数据
 * @returns {boolean} 更新是否成功
 */
function updateOrder(orderId, updateData) {
  try {
    const orders = getOrders()
    const orderIndex = orders.findIndex(order => order.id === orderId)
    
    if (orderIndex === -1) {
      console.error('工单不存在:', orderId)
      return false
    }
    
    const order = orders[orderIndex]
    
    // 更新数据
    Object.assign(order, updateData)
    order.updateTime = formatTime(new Date())
    
    // 如果状态发生变化，添加时间线记录
    if (updateData.status && updateData.status !== order.status) {
      const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      
      order.timeline.push({
        id: generateId('TL'),
        action: 'status_changed',
        description: `状态变更为：${statusMap[updateData.status] || updateData.status}`,
        time: order.updateTime,
        operator: updateData.operator || '系统'
      })
    }
    
    orders[orderIndex] = order
    wx.setStorageSync(STORAGE_KEYS.ORDERS, orders)
    return true
  } catch (error) {
    console.error('更新工单失败:', error)
    return false
  }
}

/**
 * 根据ID获取工单
 * @param {string} orderId 工单ID
 * @returns {Object|null} 工单数据
 */
function getOrderById(orderId) {
  try {
    const orders = getOrders()
    return orders.find(order => order.id === orderId) || null
  } catch (error) {
    console.error('获取工单失败:', error)
    return null
  }
}

/**
 * 删除工单
 * @param {string} orderId 工单ID
 * @returns {boolean} 删除是否成功
 */
function deleteOrder(orderId) {
  try {
    const orders = getOrders()
    const filteredOrders = orders.filter(order => order.id !== orderId)
    
    if (filteredOrders.length === orders.length) {
      console.error('工单不存在:', orderId)
      return false
    }
    
    wx.setStorageSync(STORAGE_KEYS.ORDERS, filteredOrders)
    return true
  } catch (error) {
    console.error('删除工单失败:', error)
    return false
  }
}

/**
 * 搜索工单
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 关键词
 * @param {string} params.status 状态
 * @param {string} params.priority 优先级
 * @param {string} params.startDate 开始日期
 * @param {string} params.endDate 结束日期
 * @returns {Array} 搜索结果
 */
function searchOrders(params = {}) {
  try {
    let orders = getOrders()
    
    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      orders = orders.filter(order => {
        return (
          order.title?.toLowerCase().includes(keyword) ||
          order.description?.toLowerCase().includes(keyword) ||
          order.contact?.toLowerCase().includes(keyword) ||
          order.phone?.includes(keyword) ||
          order.projectName?.toLowerCase().includes(keyword) ||
          order.locationName?.toLowerCase().includes(keyword)
        )
      })
    }
    
    // 状态筛选
    if (params.status && params.status !== 'all') {
      orders = orders.filter(order => order.status === params.status)
    }
    
    // 优先级筛选
    if (params.priority && params.priority !== 'all') {
      orders = orders.filter(order => order.priority === params.priority)
    }
    
    // 日期范围筛选
    if (params.startDate) {
      orders = orders.filter(order => {
        const orderDate = new Date(order.createTime)
        const startDate = new Date(params.startDate)
        return orderDate >= startDate
      })
    }
    
    if (params.endDate) {
      orders = orders.filter(order => {
        const orderDate = new Date(order.createTime)
        const endDate = new Date(params.endDate + ' 23:59:59')
        return orderDate <= endDate
      })
    }
    
    return orders
  } catch (error) {
    console.error('搜索工单失败:', error)
    return []
  }
}

/**
 * 获取工单统计信息
 * @returns {Object} 统计信息
 */
function getOrderStats() {
  try {
    const orders = getOrders()
    const stats = {
      total: orders.length,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    }
    
    const now = new Date()
    const today = formatTime(now, 'YYYY-MM-DD')
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    orders.forEach(order => {
      // 状态统计
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status]++
      }
      
      // 时间统计
      const orderDate = new Date(order.createTime)
      const orderDateStr = formatTime(orderDate, 'YYYY-MM-DD')
      
      if (orderDateStr === today) {
        stats.today++
      }
      
      if (orderDate >= weekStart) {
        stats.thisWeek++
      }
      
      if (orderDate >= monthStart) {
        stats.thisMonth++
      }
    })
    
    return stats
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    }
  }
}

/**
 * 获取应用设置
 * @returns {Object} 设置信息
 */
function getSettings() {
  try {
    const settings = wx.getStorageSync(STORAGE_KEYS.SETTINGS)
    return settings || {
      projectName: '默认项目',
      locationName: '默认地点',
      autoLocation: true,
      watermarkEnabled: true,
      notificationEnabled: true
    }
  } catch (error) {
    console.error('获取设置失败:', error)
    return {
      projectName: '默认项目',
      locationName: '默认地点',
      autoLocation: true,
      watermarkEnabled: true,
      notificationEnabled: true
    }
  }
}

/**
 * 保存应用设置
 * @param {Object} settings 设置信息
 * @returns {boolean} 保存是否成功
 */
function saveSettings(settings) {
  try {
    wx.setStorageSync(STORAGE_KEYS.SETTINGS, settings)
    return true
  } catch (error) {
    console.error('保存设置失败:', error)
    return false
  }
}

/**
 * 获取用户信息
 * @returns {Object} 用户信息
 */
function getUserInfo() {
  try {
    const userInfo = wx.getStorageSync(STORAGE_KEYS.USER_INFO)
    return userInfo || {}
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {}
  }
}

/**
 * 保存用户信息
 * @param {Object} userInfo 用户信息
 * @returns {boolean} 保存是否成功
 */
function saveUserInfo(userInfo) {
  try {
    wx.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
    return true
  } catch (error) {
    console.error('保存用户信息失败:', error)
    return false
  }
}

/**
 * 清除所有数据
 * @returns {boolean} 清除是否成功
 */
function clearAllData() {
  try {
    wx.removeStorageSync(STORAGE_KEYS.ORDERS)
    wx.removeStorageSync(STORAGE_KEYS.SETTINGS)
    wx.removeStorageSync(STORAGE_KEYS.USER_INFO)
    return true
  } catch (error) {
    console.error('清除数据失败:', error)
    return false
  }
}

/**
 * 导出数据
 * @returns {Object} 导出的数据
 */
function exportData() {
  try {
    return {
      orders: getOrders(),
      settings: getSettings(),
      userInfo: getUserInfo(),
      exportTime: formatTime(new Date())
    }
  } catch (error) {
    console.error('导出数据失败:', error)
    return null
  }
}

/**
 * 导入数据
 * @param {Object} data 要导入的数据
 * @returns {boolean} 导入是否成功
 */
function importData(data) {
  try {
    if (data.orders && Array.isArray(data.orders)) {
      wx.setStorageSync(STORAGE_KEYS.ORDERS, data.orders)
    }
    if (data.settings) {
      wx.setStorageSync(STORAGE_KEYS.SETTINGS, data.settings)
    }
    if (data.userInfo) {
      wx.setStorageSync(STORAGE_KEYS.USER_INFO, data.userInfo)
    }
    return true
  } catch (error) {
    console.error('导入数据失败:', error)
    return false
  }
}

module.exports = {
  getOrders,
  saveOrder,
  updateOrder,
  getOrderById,
  deleteOrder,
  searchOrders,
  getOrderStats,
  getSettings,
  saveSettings,
  getUserInfo,
  saveUserInfo,
  clearAllData,
  exportData,
  importData
}
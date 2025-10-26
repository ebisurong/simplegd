// pages/index/index.js
const app = getApp()
const { getOrderStats, getOrders } = require('../../utils/storage.js')
const { formatTime, getRelativeTime } = require('../../utils/util.js')

Page({
  data: {
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    recentOrders: [],
    showSettingsModal: false,
    projectName: '',
    locationName: ''
  },

  onLoad() {
    this.loadUserInfo()
    this.loadSettings()
    this.loadStatistics()
  },

  onShow() {
    this.loadStatistics()
  },

  // 加载用户信息
  loadUserInfo() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    } else {
      // 获取用户信息
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo
          })
        }
      })
    }
  },

  // 加载设置信息
  loadSettings() {
    const projectName = wx.getStorageSync('projectName') || app.globalData.projectName
    const locationName = wx.getStorageSync('locationName') || app.globalData.locationName
    
    this.setData({
      projectName,
      locationName
    })
    
    app.globalData.projectName = projectName
    app.globalData.locationName = locationName
  },

  // 加载统计数据
  loadStatistics() {
    console.log('📊 [首页] 开始加载统计数据');
    
    // 显示加载状态
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 调用后台API获取统计数据
    wx.request({
      url: `${app.getApiBaseUrl()}/miniprogram/statistics`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('📊 [首页] API响应:', res);
        
        if (res.statusCode === 200 && res.data.success) {
          const { totalOrders, todayOrders, pendingOrders, recentOrders } = res.data.data;
          
          this.setData({
            totalOrders,
            todayOrders,
            pendingOrders,
            recentOrders
          });
          
          console.log('📊 [首页] 统计数据更新成功:', {
            totalOrders,
            todayOrders,
            pendingOrders,
            recentOrdersCount: recentOrders.length
          });
        } else {
          console.error('📊 [首页] API返回错误:', res.data);
          this.showErrorAndFallback('获取统计数据失败');
        }
      },
      fail: (error) => {
        console.error('📊 [首页] API请求失败:', error);
        this.showErrorAndFallback('网络请求失败，使用本地数据');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  // 显示错误并使用本地数据作为备用方案
  showErrorAndFallback(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
    
    // 使用本地数据作为备用方案
    this.loadLocalStatistics();
  },
  
  // 加载本地统计数据（备用方案）
  loadLocalStatistics() {
    console.log('📊 [首页] 使用本地数据作为备用方案');
    
    const orders = app.getWorkOrders()
    const today = new Date()
    const todayStr = app.formatDateTime(today).split(' ')[0]
    
    // 计算今日工单数
    const todayOrders = orders.filter(order => {
      const orderDate = order.createTime.split(' ')[0]
      return orderDate === todayStr
    }).length
    
    // 计算待处理工单数
    const pendingOrders = orders.filter(order => order.status === 'pending').length
    
    // 获取最近5条工单
    const recentOrders = orders.slice(0, 5).map(order => ({
      ...order,
      statusText: this.getStatusText(order.status)
    }))
    
    this.setData({
      totalOrders: orders.length,
      todayOrders,
      pendingOrders,
      recentOrders
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'rejected': '已拒绝'
    }
    return statusMap[status] || '未知'
  },

  // 跳转到工单上报页面
  goToReport() {
    wx.switchTab({
      url: '/pages/report/report'
    })
  },

  // 跳转到历史查询页面
  goToHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    })
  },

  // 显示设置弹窗
  showSettings() {
    this.setData({
      showSettingsModal: true
    })
  },

  // 隐藏设置弹窗
  hideSettings() {
    this.setData({
      showSettingsModal: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止点击模态框内容时关闭弹窗
  },

  // 项目名称输入
  onProjectNameInput(e) {
    this.setData({
      projectName: e.detail.value
    })
  },

  // 地点名称输入
  onLocationNameInput(e) {
    this.setData({
      locationName: e.detail.value
    })
  },

  // 保存设置
  saveSettings() {
    const { projectName, locationName } = this.data
    
    if (!projectName.trim()) {
      wx.showToast({
        title: '请输入项目名称',
        icon: 'none'
      })
      return
    }
    
    if (!locationName.trim()) {
      wx.showToast({
        title: '请输入地点名称',
        icon: 'none'
      })
      return
    }
    
    try {
      wx.setStorageSync('projectName', projectName.trim())
      wx.setStorageSync('locationName', locationName.trim())
      
      app.globalData.projectName = projectName.trim()
      app.globalData.locationName = locationName.trim()
      
      wx.showToast({
        title: '设置保存成功',
        icon: 'success'
      })
      
      this.hideSettings()
    } catch (error) {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    }
  },

  // 查看工单详情
  viewOrderDetail(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${order.id}`
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '工单管理系统',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '工单管理系统 - 高效便捷的工单管理平台',
      imageUrl: '/images/share.png'
    }
  }
})
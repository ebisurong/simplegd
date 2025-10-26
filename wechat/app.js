// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
      }
    })
  },

  onLoad() {
    // 小程序加载完成
    console.log('小程序加载完成')
  },
  
  globalData: {
    userInfo: null,
    projectName: '工程项目A', // 默认项目名称，可在设置中修改
    locationName: '施工现场', // 默认地点名称，可在设置中修改
    workOrders: [], // 存储工单数据
    
    // 服务器配置 - 统一管理IP地址，便于部署时修改
    config: {
      serverHost: '192.168.0.102', // 服务器IP地址
      serverPort: '8000', // 服务器端口
      apiPath: '/api', // API路径前缀
      uploadPath: '/uploads' // 上传文件路径前缀
    }
  },
  
  // 获取API基础URL
  getApiBaseUrl() {
    const { serverHost, serverPort, apiPath } = this.globalData.config
    return `http://${serverHost}:${serverPort}${apiPath}`
  },
  
  // 获取文件基础URL（用于图片等静态资源）
  getFileBaseUrl() {
    const { serverHost, serverPort, uploadPath } = this.globalData.config
    return `http://${serverHost}:${serverPort}${uploadPath}`
  },
  
  // 获取上传文件的URL（用于文件上传）
  getUploadUrl() {
    const { serverHost, serverPort } = this.globalData.config
    return `http://${serverHost}:${serverPort}/api/upload/miniprogram`
  },
  
  // 获取完整的图片URL
  getImageUrl(imagePath) {
    console.log('[getImageUrl] 输入参数:', imagePath)
    
    if (!imagePath) return ''
    
    // 如果已经是完整URL，直接返回
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('[getImageUrl] 已是完整URL，直接返回:', imagePath)
      return imagePath
    }
    
    // 如果路径以/开头，去掉开头的/
    let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath
    console.log('[getImageUrl] 去掉开头/后的路径:', cleanPath)
    
    // 如果路径以uploads/开头，去掉这个前缀（避免重复）
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.substring(8) // 去掉 'uploads/' (8个字符)
      console.log('[getImageUrl] 去掉uploads/前缀后的路径:', cleanPath)
    }
    
    const baseUrl = this.getFileBaseUrl()
    const finalUrl = `${baseUrl}/${cleanPath}`
    console.log('[getImageUrl] 基础URL:', baseUrl)
    console.log('[getImageUrl] 最终URL:', finalUrl)
    
    return finalUrl
  },
  
  // 格式化日期时间
  formatDateTime(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  },
  
  // 生成工单ID
  generateOrderId() {
    const now = new Date()
    const timestamp = now.getTime()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `WO${timestamp}${random}`
  },
  
  // 保存工单数据
  saveWorkOrder(orderData) {
    try {
      const orders = wx.getStorageSync('workOrders') || []
      orders.unshift(orderData)
      wx.setStorageSync('workOrders', orders)
      this.globalData.workOrders = orders
      return true
    } catch (error) {
      console.error('保存工单失败:', error)
      return false
    }
  },
  
  // 获取工单列表
  getWorkOrders() {
    try {
      const orders = wx.getStorageSync('workOrders') || []
      this.globalData.workOrders = orders
      return orders
    } catch (error) {
      console.error('获取工单失败:', error)
      return []
    }
  }
})
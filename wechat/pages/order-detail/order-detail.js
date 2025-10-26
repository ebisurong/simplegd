// pages/order-detail/order-detail.js
const app = getApp()
const { getOrderById, updateOrder } = require('../../utils/storage.js')
const { formatTime, getRelativeTime, getOrderStatusText, getPriorityText, showSuccess, showError } = require('../../utils/util.js')

Page({
  data: {
    orderData: {},
    statusEmoji: '📋',
    priorityText: '',
    canEdit: false,
    showShareModal: false,
    timeline: [],
    showImageModal: false,
    modalImages: [],
    currentImageIndex: 0
  },

  onLoad(options) {
    const orderId = options.id
    if (orderId) {
      this.loadOrderDetail(orderId)
    } else {
      wx.showToast({
        title: '工单ID不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载工单详情
  loadOrderDetail(orderId) {
    console.log('=== 工单详情API调试信息 ===')
    console.log('工单ID:', orderId)
    console.log('工单ID类型:', typeof orderId)
    
    // 检查全局配置
    const app = getApp()
    console.log('全局应用对象:', app)
    console.log('全局数据:', app.globalData)
    
    // 从API获取工单详情 - 使用统一的API基础URL方法
    const apiBaseUrl = app.getApiBaseUrl();
    const apiUrl = `${apiBaseUrl}/miniprogram/workorders/${orderId}`;
    
    console.log('完整API请求地址:', apiUrl)
    
    // // 检查网络状态
    // wx.getNetworkType({
    //   success: (networkRes) => {
    //     console.log('网络类型:', networkRes.networkType)
    //     console.log('网络是否可用:', networkRes.networkType !== 'none')
    //   }
    // })
    
    console.log('开始发送API请求...')
    // return
    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('=== API请求成功响应 ===')
        console.log('响应状态码:', res.statusCode)
        console.log('响应头:', res.header)
        console.log('响应数据:', res.data)
        console.log('响应数据类型:', typeof res.data)
        
        if (res.statusCode === 200) {
          console.log('HTTP状态码正常')
          
          if (res.data && res.data.success && res.data.workOrder) {
            const orderData = res.data.workOrder
            console.log('=== 解析成功的工单数据 ===')
            console.log('工单数据:', orderData)
            console.log('工单数据字段:', Object.keys(orderData))
            this.processOrderData(orderData)
          } else {
            console.error('=== API响应数据格式错误 ===')
            console.error('响应结构检查:')
            console.error('- res.data存在:', !!res.data)
            console.error('- res.data.success:', res.data?.success)
            console.error('- res.data.data存在:', !!res.data?.data)
            console.error('- 完整响应:', res.data)
            
            wx.showToast({
              title: res.data?.message || '获取工单详情失败',
              icon: 'none'
            })
            // setTimeout(() => {
            //   wx.navigateBack()
            // }, 1500)
          }
        } else {
          console.error('=== HTTP状态码异常 ===')
          console.error('状态码:', res.statusCode)
          console.error('响应数据:', res.data)
          
          wx.showToast({
            title: `服务器错误 (${res.statusCode})`,
            icon: 'none'
          })
          // setTimeout(() => {
          //   wx.navigateBack()
          // }, 1500)
        }
      },
      fail: (error) => {
        console.error('=== API请求完全失败 ===')
        console.error('错误对象:', error)
        console.error('错误类型:', typeof error)
        console.error('错误信息:', error.errMsg || error.message)
        
        // 尝试获取更多错误信息
        if (error.errMsg) {
          console.error('微信错误码:', error.errMsg)
          
          // 分析常见错误
          if (error.errMsg.includes('timeout')) {
            console.error('错误类型: 请求超时')
          } else if (error.errMsg.includes('fail')) {
            console.error('错误类型: 请求失败')
          } else if (error.errMsg.includes('abort')) {
            console.error('错误类型: 请求被中止')
          }
        }
        
        wx.showToast({
          title: '网络连接失败，请检查网络',
          icon: 'none'
        })
        // setTimeout(() => {
        //   wx.navigateBack()
        // }, 1500)
      }
    })
  },

  // 处理工单数据
  processOrderData(orderData) {
    console.log('=== 工单详情图片处理开始 ===')
    console.log('原始工单数据:', orderData)
    console.log('原始照片数据:', orderData.photos)
    
    // 处理照片数据
    if (orderData.photos && orderData.photos.length > 0) {
      console.log(`📸 [图片调试] 开始处理${orderData.photos.length}张图片`)
      
      orderData.photos = orderData.photos.map((photo, index) => {
        console.log(`📸 [图片调试] 处理第${index + 1}张图片:`, photo)
        
        // 检查app.getImageUrl函数是否存在
        if (!app.getImageUrl) {
          console.error('❌ [图片调试] app.getImageUrl函数不存在!');
          return {
            ...photo,
            path: photo.path || photo.url,
            url: photo.path || photo.url
          };
        }
        
        let processedPhoto;
        
        if (typeof photo === 'string') {
          // 如果photo是字符串，转换为对象格式
          console.log(`📸 [图片调试] 处理字符串类型图片:`, photo);
          const imageUrl = app.getImageUrl(photo);
          console.log(`📸 [图片调试] app.getImageUrl输入:`, photo);
          console.log(`📸 [图片调试] app.getImageUrl输出:`, imageUrl);
          
          processedPhoto = {
            path: imageUrl,
            url: imageUrl,
            originalPath: photo
          };
        } else if (photo && photo.path) {
          // 如果photo是对象，处理其path属性
          console.log(`📸 [图片调试] 处理对象类型图片(path):`, photo.path);
          const imageUrl = app.getImageUrl(photo.path);
          console.log(`📸 [图片调试] app.getImageUrl输入:`, photo.path);
          console.log(`📸 [图片调试] app.getImageUrl输出:`, imageUrl);
          
          processedPhoto = {
            ...photo,
            path: imageUrl,
            url: imageUrl,
            originalPath: photo.path
          };
        } else if (photo && photo.url) {
          // 如果photo对象有url属性，也处理一下
          console.log(`📸 [图片调试] 处理对象类型图片(url):`, photo.url);
          const imageUrl = app.getImageUrl(photo.url);
          console.log(`📸 [图片调试] app.getImageUrl输入:`, photo.url);
          console.log(`📸 [图片调试] app.getImageUrl输出:`, imageUrl);
          
          processedPhoto = {
            ...photo,
            path: imageUrl,
            url: imageUrl,
            originalPath: photo.url
          };
        } else {
          console.warn('⚠️ [图片调试] 未识别的photo格式:', photo);
          processedPhoto = photo;
        }
        
        console.log(`📸 [图片调试] 第${index + 1}张图片处理结果:`, processedPhoto);
        return processedPhoto;
      });
      
      console.log('📸 [图片调试] 所有图片处理完成，最终结果:', orderData.photos);
      
      // 验证最终的图片URL是否有效
      orderData.photos.forEach((photo, index) => {
        if (photo && (photo.url || photo.path)) {
          const finalUrl = photo.url || photo.path;
          console.log(`✅ [图片验证] 第${index + 1}张图片最终URL:`, finalUrl);
          
          // 检查URL格式
          if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
            console.log(`✅ [图片验证] URL格式正确:`, finalUrl);
          } else {
            console.warn(`⚠️ [图片验证] URL格式可能有问题:`, finalUrl);
          }
        } else {
          console.error(`❌ [图片验证] 第${index + 1}张图片没有有效的URL:`, photo);
        }
      });
    } else {
      console.log('📸 [图片调试] 该工单没有图片或图片数组为空');
    }
    
    // 处理状态文本
    const statusTexts = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'rejected': '已拒绝'
    }
    orderData.statusText = statusTexts[orderData.status] || '未知'
    
    // 处理时间格式
    if (orderData.created_at) {
      orderData.createTime = formatTime(new Date(orderData.created_at))
    }
    
    // 处理提交人信息
    if (orderData.submitter) {
      orderData.submitterName = orderData.submitter.real_name || orderData.submitter.username
    }
    
    // 设置状态表情
    const statusEmojis = {
      'pending': '⏳',
      'processing': '🔄',
      'completed': '✅',
      'rejected': '❌'
    }
    
    // 设置优先级文本
    const priorityTexts = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'urgent': '紧急'
    }
    
    // 判断是否可以编辑（只有待处理状态可以编辑）
    const canEdit = orderData.status === 'pending'
    
    // 生成时间线
    const timeline = this.generateTimeline(orderData)
    
    this.setData({
      orderData,
      statusEmoji: statusEmojis[orderData.status] || '📋',
      priorityText: priorityTexts[orderData.priority] || '中',
      canEdit,
      timeline
    })
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: `工单详情`
    })
  },

  // 生成时间线
  generateTimeline(orderData) {
    const timeline = []
    
    // 创建记录
    timeline.push({
      id: 'create',
      type: 'create',
      title: '工单创建',
      description: `创建了工单"${orderData.title}"`,
      time: orderData.createTime
    })
    
    // 根据状态添加其他记录
    if (orderData.status === 'processing') {
      timeline.push({
        id: 'processing',
        type: 'update',
        title: '开始处理',
        description: '工单已被接收，正在处理中',
        time: this.getProcessingTime(orderData.createTime)
      })
    } else if (orderData.status === 'completed') {
      timeline.push({
        id: 'processing',
        type: 'update',
        title: '开始处理',
        description: '工单已被接收，正在处理中',
        time: this.getProcessingTime(orderData.createTime)
      })
      timeline.push({
        id: 'completed',
        type: 'complete',
        title: '处理完成',
        description: '工单已处理完成',
        time: this.getCompletedTime(orderData.createTime)
      })
    } else if (orderData.status === 'rejected') {
      timeline.push({
        id: 'rejected',
        type: 'update',
        title: '工单被拒绝',
        description: '工单不符合处理条件，已被拒绝',
        time: this.getRejectedTime(orderData.createTime)
      })
    }
    
    return timeline.reverse() // 最新的在上面
  },

  // 获取处理时间（模拟）
  getProcessingTime(createTime) {
    const createDate = new Date(createTime.replace(' ', 'T'))
    createDate.setHours(createDate.getHours() + 1)
    return app.formatDateTime(createDate)
  },

  // 获取完成时间（模拟）
  getCompletedTime(createTime) {
    const createDate = new Date(createTime.replace(' ', 'T'))
    createDate.setHours(createDate.getHours() + 2)
    return app.formatDateTime(createDate)
  },

  // 获取拒绝时间（模拟）
  getRejectedTime(createTime) {
    const createDate = new Date(createTime.replace(' ', 'T'))
    createDate.setMinutes(createDate.getMinutes() + 30)
    return app.formatDateTime(createDate)
  },

  // 拨打电话
  callPhone(e) {
    const phone = e.currentTarget.dataset.phone
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: (err) => {
        wx.showToast({
          title: '拨号失败',
          icon: 'none'
        })
      }
    })
  },

  // 打开地图
  openLocation() {
    const { location } = this.data.orderData
    if (location) {
      wx.openLocation({
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        name: this.data.orderData.locationName,
        address: `${this.data.orderData.projectName} - ${this.data.orderData.locationName}`,
        fail: (err) => {
          wx.showToast({
            title: '打开地图失败',
            icon: 'none'
          })
        }
      })
    }
  },

  // 预览照片
  previewPhoto(e) {
    const index = e.currentTarget.dataset.index
    const { photos } = this.data.orderData
    
    if (photos && photos.length > 0) {
      const urls = photos.map(photo => photo.path)
      
      this.setData({
        showImageModal: true,
        modalImages: urls,
        currentImageIndex: index || 0
      })
    }
  },

  // 关闭图片预览弹窗
  closeImageModal() {
    this.setData({
      showImageModal: false,
      modalImages: [],
      currentImageIndex: 0
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  // 切换图片
  onImageSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  // 复制图片路径
  copyImagePath(e) {
    const path = e.currentTarget.dataset.path
    if (path) {
      wx.setClipboardData({
        data: path,
        success: () => {
          wx.showToast({
            title: '路径已复制',
            icon: 'success',
            duration: 1500
          })
        },
        fail: () => {
          wx.showToast({
            title: '复制失败',
            icon: 'none',
            duration: 1500
          })
        }
      })
    }
  },

  // 点击小圆点切换图片
  switchToImage(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentImageIndex: index
    })
  },

  // 编辑工单
  editOrder() {
    wx.showModal({
      title: '编辑工单',
      content: '是否要编辑此工单？编辑后需要重新提交审核。',
      success: (res) => {
        if (res.confirm) {
          // 将工单数据传递到编辑页面
          wx.setStorageSync('editOrder', this.data.orderData)
          wx.navigateTo({
            url: '/pages/report/report?edit=true'
          })
        }
      }
    })
  },

  // 显示分享弹窗
  shareOrder() {
    this.setData({
      showShareModal: true
    })
  },

  // 隐藏分享弹窗
  hideShareModal() {
    this.setData({
      showShareModal: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止点击模态框内容时关闭弹窗
  },

  // 复制工单信息
  copyOrderInfo() {
    const { orderData } = this.data
    const info = `工单信息\n` +
                `工单号：${orderData.id}\n` +
                `标题：${orderData.title}\n` +
                `描述：${orderData.description}\n` +
                `状态：${orderData.statusText}\n` +
                `创建时间：${orderData.createTime}\n` +
                `项目：${orderData.projectName}\n` +
                `地点：${orderData.locationName}`
    
    wx.setClipboardData({
      data: info,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        })
        this.hideShareModal()
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  // 保存到相册
  saveToAlbum() {
    const { photos } = this.data.orderData
    
    if (!photos || photos.length === 0) {
      wx.showToast({
        title: '没有照片可保存',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '保存照片',
      content: `确定要保存${photos.length}张照片到相册吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doSavePhotos(photos)
        }
      }
    })
  },

  // 执行保存照片
  doSavePhotos(photos) {
    wx.showLoading({
      title: '保存中...'
    })
    
    let savedCount = 0
    let failCount = 0
    
    photos.forEach((photo, index) => {
      wx.saveImageToPhotosAlbum({
        filePath: photo.path,
        success: () => {
          savedCount++
          this.checkSaveComplete(savedCount, failCount, photos.length)
        },
        fail: () => {
          failCount++
          this.checkSaveComplete(savedCount, failCount, photos.length)
        }
      })
    })
  },

  // 检查保存完成
  checkSaveComplete(savedCount, failCount, totalCount) {
    if (savedCount + failCount === totalCount) {
      wx.hideLoading()
      
      if (savedCount > 0) {
        wx.showToast({
          title: `成功保存${savedCount}张照片`,
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
      
      this.hideShareModal()
    }
  },

  // 分享给好友
  onShareAppMessage() {
    const { orderData } = this.data
    return {
      title: `工单：${orderData.title}`,
      path: `/pages/order-detail/order-detail?id=${orderData.id}`,
      imageUrl: orderData.photos && orderData.photos.length > 0 ? orderData.photos[0].path : '/images/share.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { orderData } = this.data
    return {
      title: `工单管理 - ${orderData.title}`,
      imageUrl: orderData.photos && orderData.photos.length > 0 ? orderData.photos[0].path : '/images/share.png'
    }
  }
})
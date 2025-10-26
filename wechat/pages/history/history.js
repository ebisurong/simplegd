// pages/history/history.js
const app = getApp()
const { formatTime, getRelativeTime, getOrderStatusText, getPriorityText } = require('../../utils/util.js')

Page({
  data: {
    orders: [],
    filteredOrders: [],
    searchKeyword: '',
    statusFilterList: ['全部状态', '待处理', '处理中', '已完成', '已拒绝'],
    statusFilterIndex: 0,
    timeFilterList: ['全部时间', '今天', '本周', '本月'],
    timeFilterIndex: 0,
    loading: true,
    showStats: true,
    totalOrders: 0,
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    currentPage: 1,      // 当前页码
    pageSize: 3,         // 每页显示数量
    totalPages: 0,       // 总页数
    totalCount: 0,       // 总记录数
    hasNextPage: false,  // 是否有下一页
    hasPrevPage: false,  // 是否有上一页
    // 图片预览弹窗相关
    showImageModal: false,
    modalImages: [],
    currentImageIndex: 0
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  // 加载工单数据
  loadOrders(page = null) {
    this.setData({ loading: true })
    
    // 获取API基础URL
    const apiBaseUrl = app.getApiBaseUrl();
    
    // 构建查询参数 - 手动构建查询字符串（微信小程序不支持URLSearchParams）
    const { searchKeyword, statusFilterList, statusFilterIndex, timeFilterList, timeFilterIndex, currentPage, pageSize } = this.data;
    const queryParams = [];
    
    // 添加搜索关键词
    if (searchKeyword && searchKeyword.trim()) {
      queryParams.push(`search=${encodeURIComponent(searchKeyword.trim())}`);
    }
    
    // 添加状态筛选
    if (statusFilterIndex > 0) {
      queryParams.push(`status=${encodeURIComponent(statusFilterList[statusFilterIndex])}`);
    }
    
    // 添加时间筛选
    if (timeFilterIndex > 0) {
      queryParams.push(`timeFilter=${encodeURIComponent(timeFilterList[timeFilterIndex])}`);
    }
    
    // 分页参数
    const targetPage = page !== null ? page : currentPage;
    queryParams.push(`page=${targetPage}`);
    queryParams.push(`limit=${pageSize}`);
    
    const queryString = queryParams.join('&');
    const url = `${apiBaseUrl}/miniprogram/workorders${queryString ? '?' + queryString : ''}`;
    
    console.log('📋 [小程序] 请求工单列表:', url);
    
    // 调用后端API
    wx.request({
      url: url,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('📋 [小程序] API响应:', res);
        
        if (res.statusCode === 200 && res.data && res.data.success) {
          const { orders, stats } = res.data.data;
          
          console.log(`📋 [小程序] 获取到${orders.length}条工单数据`);
          
          // 处理图片路径，确保图片能正常显示
          const processedOrders = orders.map(order => {
            // 详细调试：输出原始订单数据
            console.log('🔍 [订单调试] 原始订单数据:', {
              id: order.id,
              photos: order.photos,
              photosType: typeof order.photos,
              photosLength: order.photos ? order.photos.length : 0
            });
            
            // 处理图片路径
            if (order.photos && order.photos.length > 0) {
              console.log('📸 [图片调试] 开始处理photos数组:', order.photos);
              console.log('📸 [图片调试] photos数组类型:', typeof order.photos);
              console.log('📸 [图片调试] photos数组长度:', order.photos.length);
              
              order.photos = order.photos.map((photo, index) => {
                console.log(`📸 [图片调试] 处理第${index + 1}张图片:`, photo);
                console.log(`📸 [图片调试] 图片类型:`, typeof photo);
                console.log(`📸 [图片调试] 图片详细结构:`, JSON.stringify(photo, null, 2));
                
                // 检查app.getImageUrl函数是否存在
                if (!app.getImageUrl) {
                  console.error('❌ [图片调试] app.getImageUrl函数不存在!');
                  return photo;
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
              
              console.log('📸 [图片调试] 所有图片处理完成，最终结果:', order.photos);
              
              // 验证最终的图片URL是否有效
              order.photos.forEach((photo, index) => {
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
              console.log('📸 [图片调试] 该订单没有图片或图片数组为空');
            }
            
            // 处理workTypes和installContents字段，确保它们是数组格式
            if (order.workTypes) {
              if (typeof order.workTypes === 'string') {
                try {
                  // 如果是JSON字符串，尝试解析
                  order.workTypes = JSON.parse(order.workTypes);
                } catch (e) {
                  // 如果解析失败，可能是普通字符串，转换为数组
                  order.workTypes = [order.workTypes];
                }
              }
              // 确保是数组格式
              if (!Array.isArray(order.workTypes)) {
                order.workTypes = [];
              }
            } else {
              order.workTypes = [];
            }
            
            if (order.installContents) {
              if (typeof order.installContents === 'string') {
                try {
                  // 如果是JSON字符串，尝试解析
                  order.installContents = JSON.parse(order.installContents);
                } catch (e) {
                  // 如果解析失败，可能是普通字符串，转换为数组
                  order.installContents = [order.installContents];
                }
              }
              // 确保是数组格式
              if (!Array.isArray(order.installContents)) {
                order.installContents = [];
              }
            } else {
              order.installContents = [];
            }
            
            // 🏗️ [施工阶段调试] 处理施工阶段数据
            console.log(`🏗️ [施工阶段调试] 工单${order.id} - 原始constructionStages数据:`, order.constructionStages);
            console.log(`🏗️ [施工阶段调试] 工单${order.id} - constructionStages类型:`, typeof order.constructionStages);
            console.log(`🏗️ [施工阶段调试] 工单${order.id} - selectedStagesCount:`, order.selectedStagesCount);
            
            // 确保constructionStages是数组格式
            if (order.constructionStages) {
              if (typeof order.constructionStages === 'string') {
                try {
                  // 如果是JSON字符串，尝试解析
                  order.constructionStages = JSON.parse(order.constructionStages);
                  console.log(`🏗️ [施工阶段调试] 工单${order.id} - JSON解析后的constructionStages:`, order.constructionStages);
                } catch (e) {
                  console.error(`🏗️ [施工阶段调试] 工单${order.id} - JSON解析失败:`, e);
                  order.constructionStages = [];
                }
              }
              // 确保是数组格式
              if (!Array.isArray(order.constructionStages)) {
                console.warn(`🏗️ [施工阶段调试] 工单${order.id} - constructionStages不是数组，重置为空数组`);
                order.constructionStages = [];
              }
            } else {
              console.warn(`🏗️ [施工阶段调试] 工单${order.id} - constructionStages为空，设置默认值`);
              order.constructionStages = [];
            }
            
            // 验证每个阶段的数据结构
            if (order.constructionStages && order.constructionStages.length > 0) {
              console.log(`🏗️ [施工阶段调试] 工单${order.id} - 施工阶段数量: ${order.constructionStages.length}`);
              order.constructionStages.forEach((stage, index) => {
                console.log(`🏗️ [施工阶段调试] 工单${order.id} - 第${index + 1}个阶段:`, {
                  value: stage.value,
                  label: stage.label,
                  checked: stage.checked
                });
                
                // 确保每个阶段都有必要的属性
                if (!stage.value || !stage.label) {
                  console.error(`🏗️ [施工阶段调试] 工单${order.id} - 第${index + 1}个阶段数据不完整:`, stage);
                }
              });
            } else {
              console.warn(`🏗️ [施工阶段调试] 工单${order.id} - 没有施工阶段数据`);
            }
            
            // 确保selectedStagesCount是数字
            if (typeof order.selectedStagesCount !== 'number') {
              order.selectedStagesCount = 0;
              console.warn(`🏗️ [施工阶段调试] 工单${order.id} - selectedStagesCount不是数字，重置为0`);
            }
            
            console.log(`🏗️ [施工阶段调试] 工单${order.id} - 最终处理结果:`, {
              constructionStages: order.constructionStages,
              selectedStagesCount: order.selectedStagesCount
            });
            
            return order;
          });
          
          // 计算分页信息
          const totalCount = res.data.data.totalCount || processedOrders.length;
          const totalPages = Math.ceil(totalCount / this.data.pageSize);
          const currentPage = targetPage;
          
          this.setData({
            orders: processedOrders,
            filteredOrders: processedOrders,
            totalOrders: stats.totalOrders,
            pendingCount: stats.pendingCount,
            completedCount: stats.completedCount,
            currentPage: currentPage,
            totalCount: totalCount,
            totalPages: totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
            loading: false
          });
          
          console.log('📋 [小程序] 工单数据加载成功');
        } else {
          console.error('📋 [小程序] API返回错误:', res.data);
          this.showErrorAndFallback('获取工单数据失败');
        }
      },
      fail: (error) => {
        console.error('📋 [小程序] API请求失败:', error);
        this.showErrorAndFallback('网络请求失败，请检查网络连接');
      }
    });
  },
  
  // 显示错误信息并使用备用数据
  showErrorAndFallback(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    });
    
    // 使用空数据作为备用
    this.setData({
      orders: [],
      filteredOrders: [],
      totalOrders: 0,
      pendingCount: 0,
      completedCount: 0,
      loading: false
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 执行搜索
  doSearch() {
    this.filterOrders()
  },

  // 状态筛选
  onStatusFilterChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      statusFilterIndex: index
    })
    this.filterOrders()
  },

  // 时间筛选
  onTimeFilterChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      timeFilterIndex: index
    })
    this.filterOrders()
  },

  // 筛选工单 - 现在重新加载数据而不是本地筛选
  filterOrders() {
    // 重置到第一页并重新加载数据
    this.setData({
      currentPage: 1
    });
    this.loadOrders(1);
  },
  
  // 本地筛选工单（备用方法，当API不支持某些筛选时使用）
  filterOrdersLocally() {
    let filtered = [...this.data.orders]
    const { searchKeyword, statusFilterIndex, timeFilterIndex } = this.data
    
    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase()
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(keyword) ||
        order.description.toLowerCase().includes(keyword) ||
        order.contact?.toLowerCase().includes(keyword) ||
        order.id.toLowerCase().includes(keyword)
      )
    }
    
    // 状态筛选
    if (statusFilterIndex > 0) {
      const statusMap = ['', 'pending', 'processing', 'completed', 'rejected']
      const targetStatus = statusMap[statusFilterIndex]
      filtered = filtered.filter(order => order.status === targetStatus)
    }
    
    // 时间筛选
    if (timeFilterIndex > 0) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createTime.replace(' ', 'T'))
        
        switch (timeFilterIndex) {
          case 1: // 今天
            return orderDate >= today
          case 2: // 本周
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return orderDate >= weekStart
          case 3: // 本月
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            return orderDate >= monthStart
          default:
            return true
        }
      })
    }
    
    this.setData({
      filteredOrders: filtered,
      loading: false
    })
  },

  // 查看工单详情
  viewOrderDetail(e) {
    const order = e.currentTarget.dataset.order
    
    // 将工单数据存储到临时存储中
    wx.setStorageSync('currentOrder', order)
    
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${order.id}`
    })
  },

  // 预览照片 - 使用弹窗模式
  previewPhotos(e) {
    const photos = e.currentTarget.dataset.photos
    const index = e.currentTarget.dataset.index
    
    if (photos && photos.length > 0) {
      const urls = photos.map(photo => photo.path || photo.url)
      
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

  // 跳转到工单上报
  goToReport() {
    wx.switchTab({
      url: '/pages/report/report'
    })
  },

  // 播放语音
  playVoice(e) {
    const { url } = e.currentTarget.dataset
    if (!url) {
      wx.showToast({
        title: '语音文件不存在',
        icon: 'none'
      })
      return
    }
    
    // 播放语音
    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.src = url
    innerAudioContext.play()
    
    innerAudioContext.onError((res) => {
      wx.showToast({
        title: '语音播放失败',
        icon: 'none'
      })
    })
  },

  // 查看照片
  viewPhotos(e) {
    const photos = e.currentTarget.dataset.photos
    if (!photos || photos.length === 0) return
    
    const urls = photos.map(photo => photo.path || photo.url)
    
    wx.previewImage({
      current: urls[0],
      urls: urls
    })
  },

  // 施工阶段复选框点击事件
  stageCheckbox: function (e) {
    const stageIndex = e.currentTarget.dataset.stageIndex;
    const orderIndex = e.currentTarget.dataset.orderIndex;
    console.log("checkbox-stageIndex",stageIndex)
    console.log("checkbox-orderIndex",orderIndex)
    
    // 参数有效性检查
    if (typeof stageIndex === 'undefined' || typeof orderIndex === 'undefined') {
      console.error('stageCheckbox: 缺少必要的参数', { stageIndex, orderIndex });
      wx.showToast({
        title: '参数错误，请重试',
        icon: 'none'
      });
      return;
    }
    
    // 获取当前的工单列表
    let filteredOrders = [...this.data.filteredOrders];
    let orders = [...this.data.orders];
    
    // 检查工单索引有效性
    if (!filteredOrders[orderIndex]) {
      console.error('stageCheckbox: 工单不存在', { orderIndex, filteredOrdersLength: filteredOrders.length });
      wx.showToast({
        title: '工单数据异常，请刷新重试',
        icon: 'none'
      });
      return;
    }
    
    // 检查施工阶段数组是否存在
    if (!filteredOrders[orderIndex].constructionStages || !Array.isArray(filteredOrders[orderIndex].constructionStages)) {
      console.error('stageCheckbox: 施工阶段数据不存在', { 
        orderIndex, 
        orderId: filteredOrders[orderIndex].id,
        constructionStages: filteredOrders[orderIndex].constructionStages 
      });
      wx.showToast({
        title: '施工阶段数据异常，请刷新重试',
        icon: 'none'
      });
      return;
    }
    
    // 检查阶段索引有效性
    const constructionStages = filteredOrders[orderIndex].constructionStages;
    if (stageIndex < 0 || stageIndex >= constructionStages.length) {
      console.error('stageCheckbox: 阶段索引超出范围', { 
        stageIndex, 
        stagesLength: constructionStages.length,
        orderIndex,
        orderId: filteredOrders[orderIndex].id
      });
      wx.showToast({
        title: '阶段索引错误，请刷新重试',
        icon: 'none'
      });
      return;
    }
    
    // 检查当前阶段数据是否存在
    const currentStage = constructionStages[stageIndex];
    if (!currentStage || typeof currentStage !== 'object') {
      console.error('stageCheckbox: 当前阶段数据不存在或格式错误', { 
        stageIndex, 
        orderIndex,
        orderId: filteredOrders[orderIndex].id,
        currentStage 
      });
      wx.showToast({
        title: '阶段数据异常，请刷新重试',
        icon: 'none'
      });
      return;
    }
    
    // 检查必要的阶段属性
    if (typeof currentStage.checked === 'undefined' || !currentStage.label) {
      console.error('stageCheckbox: 阶段数据缺少必要属性', { 
        stageIndex, 
        orderIndex,
        orderId: filteredOrders[orderIndex].id,
        currentStage 
      });
      wx.showToast({
        title: '阶段数据不完整，请刷新重试',
        icon: 'none'
      });
      return;
    }
    
    const orderId = filteredOrders[orderIndex].id;
    
    // 如果当前阶段未选中，需要弹出确认框
    if (!currentStage.checked) {
      wx.showModal({
        title: '设定施工阶段',
        content: `确认要将此工单设定为【${currentStage.label}】阶段吗？`,
        confirmText: '确定',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 确认后立即显示加载提示
            wx.showLoading({
              title: '正在更新中...',
              mask: true
            });
            // 用户点击确定，执行原有的更新逻辑
            this.executeStageUpdate(orderIndex, stageIndex, orderId, currentStage, filteredOrders, orders);
          }
          // 用户点击取消，不做任何操作
        }
      });
    } else {
      // 如果是取消选中（从选中变为未选中），直接执行，不需要确认
      this.executeStageUpdate(orderIndex, stageIndex, orderId, currentStage, filteredOrders, orders);
    }
  },

  // 执行施工阶段更新逻辑
  executeStageUpdate: function(orderIndex, stageIndex, orderId, currentStage, filteredOrders, orders) {
    const constructionStages = filteredOrders[orderIndex].constructionStages;
    // 记录更新前的已选阶段索引（用于失败回滚）
    const previousSelectedIndex = constructionStages.findIndex(s => s.checked);

    // 切换选中状态（单选：选中一个时取消其他；取消选中则全部不选）
    const newCheckedState = !currentStage.checked;
    if (newCheckedState) {
      constructionStages.forEach((s, idx) => { s.checked = (idx === stageIndex); });
    } else {
      constructionStages.forEach((s) => { s.checked = false; });
    }

    // 同步更新原始orders数组中的对应工单
    const originalOrderIndex = orders.findIndex(order => order.id === orderId);
    if (originalOrderIndex !== -1) {
      orders[originalOrderIndex].constructionStages.forEach((s, idx) => {
        s.checked = newCheckedState ? (idx === stageIndex) : false;
      });
    }

    // 更新当前工单选中的施工阶段列表与数量
    const selectedStages = constructionStages.filter(stage => stage.checked).map(stage => stage.label);
    const selectedCount = selectedStages.length;
    filteredOrders[orderIndex].selectedStagesCount = selectedCount;
    if (originalOrderIndex !== -1) {
      orders[originalOrderIndex].selectedStagesCount = selectedCount;
    }

    console.log(`工单 ${orderId} 施工阶段选择变化:`, selectedStages);

    // 更新页面数据
    this.setData({
      filteredOrders: filteredOrders,
      orders: orders
    });

    // 如果是选中状态，调用API更新施工阶段（传值用阶段代码value），并传入回滚所需的previousSelectedIndex
    if (newCheckedState) {
      this.updateConstructionStage(orderId, currentStage.value, currentStage.label, orderIndex, stageIndex, previousSelectedIndex);
    }
  },

  // 更新工单施工阶段（传入阶段代码与中文名，以及用于回滚的previousSelectedIndex）
  updateConstructionStage: function(orderId, stageValue, stageLabel, orderIndex, stageIndex, previousSelectedIndex) {
    // 额外日志，便于定位是否进入接口调用
    console.log('🔧 [前端] 调用 updateConstructionStage', { orderId, stageValue, stageLabel, orderIndex, stageIndex, previousSelectedIndex });
    // 显示加载提示
    wx.showLoading({
      title: '正在更新中...',
      mask: true
    });

    // 获取API基础URL
    const apiBaseUrl = app.getApiBaseUrl();

    // 调用后端API
    wx.request({
      url: apiBaseUrl + '/miniprogram/workorders/' + orderId + '/construction-stage',
      method: 'PATCH',
      header: {
        'content-type': 'application/json'
      },
      data: {
        construction_stage: stageValue
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.data && res.data.success) {
          // 更新成功
          wx.showToast({
            title: '施工阶段已更新',
            icon: 'success',
            duration: 2000
          });
          
          console.log(`✅ 工单 ${orderId} 施工阶段更新成功:`, { stageValue, stageLabel });
        } else {
          // 更新失败，恢复复选框状态到之前的选中项
          this.revertStageCheckbox(orderIndex, stageIndex, previousSelectedIndex);
          wx.showToast({
            title: res.data?.message || '更新失败',
            icon: 'error',
            duration: 2000
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('❌ 更新施工阶段失败:', error);
        
        // 恢复复选框状态到之前的选中项
        this.revertStageCheckbox(orderIndex, stageIndex, previousSelectedIndex);
        
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },

  // 恢复复选框状态：如果有previousSelectedIndex则恢复为该项选中，否则全部取消选中
  revertStageCheckbox: function(orderIndex, stageIndex, previousSelectedIndex) {
    let filteredOrders = [...this.data.filteredOrders];
    let orders = [...this.data.orders];
    
    if (filteredOrders[orderIndex] && filteredOrders[orderIndex].constructionStages) {
      const orderId = filteredOrders[orderIndex].id;
      const hasPrev = typeof previousSelectedIndex !== 'undefined' && previousSelectedIndex >= 0;
      
      // 恢复filteredOrders里的选中状态
      filteredOrders[orderIndex].constructionStages.forEach((s, idx) => {
        s.checked = hasPrev ? (idx === previousSelectedIndex) : false;
      });
      
      // 同步更新原始orders数组
      const originalOrderIndex = orders.findIndex(order => order.id === orderId);
      if (originalOrderIndex !== -1) {
        orders[originalOrderIndex].constructionStages.forEach((s, idx) => {
          s.checked = hasPrev ? (idx === previousSelectedIndex) : false;
        });
      }
      
      // 更新数量
      const selectedCount = filteredOrders[orderIndex].constructionStages.filter(s => s.checked).length;
      filteredOrders[orderIndex].selectedStagesCount = selectedCount;
      if (originalOrderIndex !== -1) {
        orders[originalOrderIndex].selectedStagesCount = selectedCount;
      }
      
      this.setData({
        filteredOrders: filteredOrders,
        orders: orders
      });
    }
  },

  // 施工阶段复选框组变化事件
  onStageChange: function (e) {
    const checkValue = e.detail.value;
    const orderIndex = e.currentTarget.dataset.orderIndex;
    console.log(`工单索引 ${orderIndex} 施工阶段复选框组变化:`, checkValue);
  },

  // 下拉刷新
  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新触发')
    // 重置分页到第一页
    this.setData({
      currentPage: 1
    })
    // 重新加载第一页数据
    this.loadOrders(1)
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },

  // 分页导航功能
  goToPrevPage() {
    const { currentPage, hasPrevPage } = this.data;
    if (hasPrevPage) {
      this.loadOrders(currentPage - 1);
    }
  },

  goToNextPage() {
    const { currentPage, hasNextPage } = this.data;
    if (hasNextPage) {
      this.loadOrders(currentPage + 1);
    }
  },

  // 上拉加载更多
  onReachBottom() {
    console.log('到达底部，尝试加载更多')
    const { currentPage, hasNextPage, loading } = this.data
    
    // 如果正在加载或没有更多数据，则不执行
    if (loading || !hasNextPage) {
      console.log('无法加载更多：', { loading, hasNextPage })
      return
    }
    
    // 加载下一页数据
    this.loadMoreData()
  },

  // 加载更多数据
  loadMoreData() {
    const { currentPage, hasNextPage, totalPages, totalCount, pageSize, filteredOrders } = this.data
    
    console.log('=== 加载更多数据调试信息 ===')
    console.log('当前页码:', currentPage)
    console.log('是否有下一页:', hasNextPage)
    console.log('总页数:', totalPages)
    console.log('总记录数:', totalCount)
    console.log('每页大小:', pageSize)
    console.log('当前已加载数据数量:', filteredOrders.length)
    
    if (!hasNextPage) {
      console.log('没有更多数据，停止加载')
      wx.showToast({
        title: '没有更多数据了',
        icon: 'none',
        duration: 1500
      })
      return
    }

    // 设置加载状态
    this.setData({
      loading: true
    })

    const nextPage = currentPage + 1
    console.log('准备加载第', nextPage, '页数据')

    // 构建API请求参数 - 与loadOrders函数保持一致
    const app = getApp()
    const apiBaseUrl = app.getApiBaseUrl()
    
    // 构建查询参数 - 手动构建查询字符串（微信小程序不支持URLSearchParams）
    const { searchKeyword, statusFilterList, statusFilterIndex, timeFilterList, timeFilterIndex } = this.data;
    const queryParams = [];
    
    // 添加搜索关键词
    if (searchKeyword && searchKeyword.trim()) {
      queryParams.push(`search=${encodeURIComponent(searchKeyword.trim())}`);
    }
    
    // 添加状态筛选
    if (statusFilterIndex > 0) {
      queryParams.push(`status=${encodeURIComponent(statusFilterList[statusFilterIndex])}`);
    }
    
    // 添加时间筛选
    if (timeFilterIndex > 0) {
      queryParams.push(`timeFilter=${encodeURIComponent(timeFilterList[timeFilterIndex])}`);
    }
    
    // 分页参数
    queryParams.push(`page=${nextPage}`);
    queryParams.push(`limit=${this.data.pageSize}`);
    
    const queryString = queryParams.join('&');
    const url = `${apiBaseUrl}/miniprogram/workorders${queryString ? '?' + queryString : ''}`;
    
    console.log('API请求URL:', url)
    console.log('请求参数:', queryParams)

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('=== API响应调试信息 ===')
        console.log('响应状态码:', res.statusCode)
        console.log('响应数据:', res.data)
        
        if (res.data && res.data.success && res.data.data) {
          const newOrders = res.data.data.orders || []
          const totalCount = res.data.data.totalCount || 0
          const totalPages = Math.ceil(totalCount / this.data.pageSize)
          const hasMoreData = nextPage < totalPages
          
          console.log('=== 分页计算调试信息 ===')
          console.log('新获取的订单数量:', newOrders.length)
          console.log('服务器返回的总记录数:', totalCount)
          console.log('计算的总页数:', totalPages)
          console.log('下一页页码:', nextPage)
          console.log('是否还有更多数据:', hasMoreData)
          console.log('计算逻辑: nextPage < totalPages =>', nextPage, '<', totalPages, '=', hasMoreData)
          
          // 将新数据追加到现有列表
          const updatedOrders = [...this.data.filteredOrders, ...newOrders]
          
          console.log('更新后的总数据量:', updatedOrders.length)
          
          this.setData({
            filteredOrders: updatedOrders,
            currentPage: nextPage,
            totalCount: totalCount,
            totalPages: totalPages,
            hasNextPage: hasMoreData,
            hasPrevPage: nextPage > 1,
            loading: false
          })
          
          console.log('=== 状态更新后 ===')
          console.log('新的当前页:', nextPage)
          console.log('新的hasNextPage:', hasMoreData)
          
          // 只有在确实没有更多页面时才显示提示
          if (!hasMoreData) {
            console.log('确认没有更多数据，显示提示')
            wx.showToast({
              title: '已加载全部数据',
              icon: 'none',
              duration: 1500
            })
          } else {
            console.log('还有更多数据可以加载')
          }
        } else {
          console.error('API响应格式错误:', res.data)
          this.setData({ loading: false })
          wx.showToast({
            title: '加载失败，请重试',
            icon: 'none',
            duration: 1500
          })
        }
      },
      fail: (error) => {
        console.error('=== API请求失败 ===')
        console.error('错误详情:', error)
        this.setData({ loading: false })
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none',
          duration: 1500
        })
      }
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '工单管理系统 - 历史工单',
      path: '/pages/history/history',
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
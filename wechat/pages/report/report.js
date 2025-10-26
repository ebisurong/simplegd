// pages/report/report.js
const app = getApp()
const { saveOrder, getSettings } = require('../../utils/storage.js')
const { formatTime, generateId, validatePhone, showSuccess, showError, showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    // 日期和黄历信息
    currentDate: '',
    calendarInfo: '加载中...',
    
    // 工种与安装内容的层级数据结构
    workTypeData: {
      bridge: {
        label: '桥架',
        contents: [
          { value: 'bridge_monitor', label: '监控', checked: false },
          { value: 'bridge_gate', label: '门禁', checked: false },
          { value: 'bridge_wireless', label: '无线AP', checked: false },
          { value: 'bridge_switch', label: '交换机', checked: false },
          { value: 'bridge_led', label: 'LED屏', checked: false },
          { value: 'bridge_air', label: '空调', checked: false },
          { value: 'bridge_patrol', label: '巡更', checked: false },
          { value: 'bridge_environment', label: '环控', checked: false }
        ]
      },
      pipe: {
        label: '管道',
        contents: [
          { value: 'pipe_cable', label: '光缆敷设', checked: false },
          { value: 'pipe_electric', label: '电缆敷设', checked: false },
          { value: 'pipe_clean', label: '管道清洁', checked: false },
          { value: 'pipe_detect', label: '管道检测', checked: false }
        ]
      },
      threading: {
        label: '穿线',
        contents: [
          { value: 'threading_network', label: '网线穿线', checked: false },
          { value: 'threading_fiber', label: '光纤穿线', checked: false },
          { value: 'threading_power', label: '电源线穿线', checked: false },
          { value: 'threading_signal', label: '信号线穿线', checked: false }
        ]
      },
      terminal: {
        label: '端接',
        contents: [
          { value: 'terminal_network', label: '网络端接', checked: false },
          { value: 'terminal_fiber', label: '光纤端接', checked: false },
          { value: 'terminal_power', label: '电源端接', checked: false },
          { value: 'terminal_signal', label: '信号端接', checked: false }
        ]
      },
      equipment: {
        label: '设备安装',
        contents: [
          { value: 'equipment_camera', label: '摄像头安装', checked: false },
          { value: 'equipment_switch', label: '交换机安装', checked: false },
          { value: 'equipment_server', label: '服务器安装', checked: false },
          { value: 'equipment_distribution', label: '配电箱安装', checked: false }
        ]
      },
      excavation: {
        label: '开挖',
        contents: [
          { value: 'excavation_trench', label: '管沟开挖', checked: false },
          { value: 'excavation_pit', label: '基坑开挖', checked: false },
          { value: 'excavation_road', label: '路面开挖', checked: false }
        ]
      },
      foundation: {
        label: '基础',
        contents: [
          { value: 'foundation_equipment', label: '设备基础', checked: false },
          { value: 'foundation_pipe', label: '管道基础', checked: false },
          { value: 'foundation_tower', label: '杆塔基础', checked: false }
        ]
      },
      manual: {
        label: '手井',
        contents: [
          { value: 'manual_communication', label: '通信手井', checked: false },
          { value: 'manual_power', label: '电力手井', checked: false },
          { value: 'manual_inspection', label: '检查井', checked: false }
        ]
      }
    },
    
    // 工种列表 (2行4列展示)
    workTypeList: [
      { key: 'bridge', label: '桥架' },
      { key: 'pipe', label: '管道' },
      { key: 'threading', label: '穿线' },
      { key: 'terminal', label: '端接' },
      { key: 'equipment', label: '设备安装' },
      { key: 'excavation', label: '开挖' },
      { key: 'foundation', label: '基础' },
      { key: 'manual', label: '手井' }
    ],
    
    // 当前选中的工种
    selectedWorkTypeKey: 'bridge', // 默认选中桥架
    currentWorkType: {
      label: '桥架',
      contents: [
        { value: 'bridge_monitor', label: '监控', checked: false },
        { value: 'bridge_gate', label: '门禁', checked: false },
        { value: 'bridge_wireless', label: '无线AP', checked: false },
        { value: 'bridge_switch', label: '交换机', checked: false },
        { value: 'bridge_led', label: 'LED屏', checked: false },
        { value: 'bridge_air', label: '空调', checked: false },
        { value: 'bridge_patrol', label: '巡更', checked: false },
        { value: 'bridge_environment', label: '环控', checked: false }
      ]
    },
    
    // 选中的安装内容汇总
    selectedSummary: {}, // 格式: { workTypeKey: [selectedContents] }
    selectedWorkTypeCount: 0, // 选中的工种数量
    selectedContentCount: 0, // 选中的安装内容总数
    
    // 保留原有字段用于兼容性
    selectedWorkTypes: [],
    selectedInstallContents: [],
    
    // 语音输入
    voiceText: '',
    isRecording: false,
    
    // 照片和位置
    photos: [],
    projectName: '',
    locationName: '',
    currentLocation: null,
    submitting: false,
    processing: false,
    loadingText: '处理中...'
  },

  onLoad() {
    this.loadSettings()
    this.getCurrentLocation()
    this.initDateAndCalendar()
    this.initVoiceRecognition()
    this.initCurrentWorkType()
  },

  // 初始化语音识别管理器
  initVoiceRecognition() {
    try {
      const plugin = requirePlugin('WechatSI')
      this.recordManager = plugin.getRecordRecognitionManager()
      
      // 设置监听器
      this.recordManager.onStart = (res) => {
        console.log('开始录音识别:', res)
        this.setData({ isRecording: true })
      }
      
      this.recordManager.onRecognize = (res) => {
        // 实时识别结果
        if (res.result) {
          this.setData({
            voiceText: this.data.voiceText + res.result
          })
        }
      }
      
      this.recordManager.onStop = (res) => {
        console.log('录音识别结束:', res)
        this.setData({ isRecording: false })
        if (res.result) {
          this.setData({
            voiceText: this.data.voiceText + res.result
          })
        }
      }
      
      this.recordManager.onError = (res) => {
        console.error('语音识别错误:', res)
        this.setData({ isRecording: false })
        this.handleVoiceError(res)
      }
    } catch (error) {
      console.error('初始化语音识别管理器失败:', error)
    }
  },

  // 处理语音识别错误
  handleVoiceError(res) {
    let errorMsg = '语音识别失败'
    
    switch (res.retcode) {
      case -30001:
        errorMsg = '录音失败，请检查麦克风权限'
        break
      case -30011:
        errorMsg = '请等待当前识别完成'
        return // 不显示toast，避免频繁提示
      case -30002:
        errorMsg = '录音被中断'
        break
      case -30003:
        errorMsg = '录音数据传输失败'
        break
      case -30004:
      case -30008:
        errorMsg = '网络连接失败，请检查网络'
        break
      case -30005:
        errorMsg = '语音识别服务异常'
        break
      case -30006:
        errorMsg = '识别超时，请重试'
        break
      case -30007:
        errorMsg = '录音参数错误'
        break
      case -40001:
        errorMsg = '调用频率过高，请稍后重试'
        break
      default:
        errorMsg = `语音识别失败 (${res.retcode})`
    }
    
    wx.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000
    })
  },

  // 初始化日期和黄历信息
  initDateAndCalendar() {
    const now = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
    
    this.setData({
      currentDate: dateStr
    })
    
    // 获取黄历信息
    this.getCalendarInfo()
  },

  // 获取黄历信息
  getCalendarInfo() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    wx.request({
      url: 'https://api.jisuapi.com/calendar/query',
      data: {
        appkey: 'your_api_key', // 需要替换为实际的API密钥
        date: dateStr
      },
      success: (res) => {
        if (res.data.status === 0 && res.data.result) {
          const result = res.data.result
          const avoid = result.avoid || '诸事不宜'
          this.setData({
            calendarInfo: `黄历：${avoid}`
          })
        } else {
          this.setData({
            calendarInfo: '黄历：宜出行 忌动土'
          })
        }
      },
      fail: () => {
        // API调用失败时显示默认信息
        this.setData({
          calendarInfo: '黄历：宜出行 忌动土'
        })
      }
    })
  },

  // 初始化当前工种
  initCurrentWorkType: function() {
    const currentWorkType = this.data.workTypeData[this.data.selectedWorkTypeKey];
    this.setData({
      currentWorkType: currentWorkType
    });
  },

  // 工种选择事件
  onWorkTypeSelect: function(e) {
    const workTypeKey = e.currentTarget.dataset.key;
    const currentWorkType = JSON.parse(JSON.stringify(this.data.workTypeData[workTypeKey]));
    
    console.log('🔧 [工种选择] 选择工种:', {
      workTypeKey,
      workTypeLabel: currentWorkType.label
    });
    
    this.setData({
      selectedWorkTypeKey: workTypeKey,
      currentWorkType: currentWorkType
    });
  },

  // 安装内容选择事件
  onContentSelect: function(e) {
    console.log('🔧 [安装内容选择] 点击安装内容:', e.currentTarget.dataset);
    const contentValue = e.currentTarget.dataset.content;
    const workTypeKey = this.data.selectedWorkTypeKey;
    
    if (!contentValue || !workTypeKey) {
      console.error('❌ [安装内容选择] 缺少必要参数:', { contentValue, workTypeKey });
      return;
    }
    
    const workTypeData = JSON.parse(JSON.stringify(this.data.workTypeData));
    const currentWorkType = JSON.parse(JSON.stringify(this.data.currentWorkType));
    
    // 找到对应的安装内容并切换选中状态
    const contentItem = workTypeData[workTypeKey].contents.find(item => item.value === contentValue);
    const currentContentItem = currentWorkType.contents.find(item => item.value === contentValue);
    
    if (contentItem && currentContentItem) {
      const newCheckedState = !contentItem.checked;
      contentItem.checked = newCheckedState;
      currentContentItem.checked = newCheckedState;
      
      console.log('✅ [安装内容选择] 更新选择状态:', {
        contentValue,
        contentLabel: contentItem.label,
        newCheckedState,
        workTypeKey,
        workTypeLabel: workTypeData[workTypeKey].label
      });
      
      this.setData({
        workTypeData: workTypeData,
        currentWorkType: currentWorkType
      }, () => {
        // 更新汇总
        console.log('🔄 [安装内容选择] 调用updateSelectedSummary更新汇总');
        this.updateSelectedSummary();
      });
    } else {
      console.error('❌ [安装内容选择] 未找到对应的安装内容:', { contentValue, workTypeKey });
    }
  },

  // 更新选中汇总
  updateSelectedSummary: function() {
    const workTypeData = this.data.workTypeData;
    const selectedSummary = {};
    const selectedWorkTypes = [];
    const selectedInstallContents = [];
    let selectedWorkTypeCount = 0;
    let selectedContentCount = 0;
    
    // 遍历所有工种
    Object.keys(workTypeData).forEach(workTypeKey => {
      const workType = workTypeData[workTypeKey];
      const selectedContents = [];
      
      // 收集该工种下选中的安装内容
      workType.contents.forEach(content => {
        if (content.checked) {
          selectedContents.push({
            value: content.value,
            label: content.label
          });
          selectedInstallContents.push(content.label);
          selectedContentCount++; // 统计安装内容总数
        }
      });
      
      // 如果该工种有选中的内容，添加到汇总中
      if (selectedContents.length > 0) {
        selectedSummary[workTypeKey] = {
          label: workType.label,
          contents: selectedContents
        };
        selectedWorkTypes.push(workType.label);
        selectedWorkTypeCount++;
      }
    });
    
    console.log('📊 [数据汇总] 选择汇总更新:', selectedSummary);
    console.log('📊 [数据汇总] 选中工种数量:', selectedWorkTypeCount);
    console.log('📊 [数据汇总] 选中内容数量:', selectedContentCount);
    console.log('📊 [数据汇总] selectedWorkTypes数组:', selectedWorkTypes);
    console.log('📊 [数据汇总] selectedInstallContents数组:', selectedInstallContents);
    
    this.setData({
      selectedSummary: selectedSummary,
      selectedWorkTypes: selectedWorkTypes,
      selectedInstallContents: selectedInstallContents,
      selectedWorkTypeCount: selectedWorkTypeCount,
      selectedContentCount: selectedContentCount
    });
  },

  // 从汇总区域取消选择
  onSummaryContentRemove: function(e) {
    const { worktype, contentvalue } = e.currentTarget.dataset;
    const workTypeData = JSON.parse(JSON.stringify(this.data.workTypeData));
    let currentWorkType = JSON.parse(JSON.stringify(this.data.currentWorkType));
    
    console.log('从汇总区域取消选择:', { worktype, contentvalue });
    
    // 找到对应的内容并取消选中
    const contents = workTypeData[worktype].contents;
    const contentIndex = contents.findIndex(item => item.value === contentvalue);
    
    if (contentIndex !== -1) {
      contents[contentIndex].checked = false;
      
      // 如果取消的是当前工种的内容，也要更新currentWorkType
      if (worktype === this.data.selectedWorkTypeKey) {
        const currentContentIndex = currentWorkType.contents.findIndex(item => item.value === contentvalue);
        if (currentContentIndex !== -1) {
          currentWorkType.contents[currentContentIndex].checked = false;
        }
      }
      
      this.setData({
        workTypeData: workTypeData,
        currentWorkType: currentWorkType
      }, () => {
        // 重新计算汇总，包括工种数量
        this.updateSelectedSummary();
      });
    }
  },

  // 保留原有函数用于兼容性（已废弃，但保留以防其他地方调用）
  workTypeCheckbox: function (e) {
    console.warn('workTypeCheckbox函数已废弃，请使用新的选择逻辑');
  },

  workTypeCheckboxChange: function (e) {
    console.warn('workTypeCheckboxChange函数已废弃，请使用新的选择逻辑');
  },

  installContentCheckbox: function (e) {
    console.warn('installContentCheckbox函数已废弃，请使用新的选择逻辑');
  },

  installContentCheckboxChange: function (e) {
    console.warn('installContentCheckboxChange函数已废弃，请使用新的选择逻辑');
  },

  // 语音文本输入
  onVoiceTextInput(e) {
    this.setData({
      voiceText: e.detail.value
    })
  },

  // 开始录音
  startRecord() {
    // 检查是否正在录音
    if (this.data.isRecording) {
      console.log('正在录音中，忽略重复调用')
      return
    }
    
    // 检查管理器是否已初始化
    if (!this.recordManager) {
      wx.showToast({
        title: '语音功能初始化中，请稍后重试',
        icon: 'none'
      })
      return
    }
    
    // 检查录音权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this.doStartRecord()
            },
            fail: () => {
              wx.showModal({
                title: '需要录音权限',
                content: '语音输入需要录音权限，请在设置中开启',
                showCancel: false
              })
            }
          })
        } else {
          this.doStartRecord()
        }
      }
    })
  },

  // 执行录音
  doStartRecord() {
    try {
      // 设置识别参数
      this.recordManager.start({
        duration: 30000, // 最长录音时长30秒
        lang: 'zh_CN' // 中文识别
      })
    } catch (error) {
      console.error('启动录音失败:', error)
      this.setData({ isRecording: false })
      wx.showToast({
        title: '启动录音失败',
        icon: 'none'
      })
    }
  },

  // 停止录音
  stopRecord() {
    if (this.recordManager && this.data.isRecording) {
      try {
        this.recordManager.stop()
      } catch (error) {
        console.error('停止录音失败:', error)
        this.setData({ isRecording: false })
      }
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
  },



  // 获取当前位置
  getCurrentLocation() {
    wx.showLoading({
      title: '获取位置中...'
    })
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        // 先设置坐标信息
        this.setData({
          currentLocation: {
            latitude: res.latitude.toFixed(6),
            longitude: res.longitude.toFixed(6)
          }
        })
        
        // 获取地点名称
        this.getLocationName(res.latitude, res.longitude)
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showModal({
          title: '位置获取失败',
          content: '请检查是否已授权位置权限，或稍后重试',
          showCancel: false
        })
      }
    })
  },

  // 获取地点名称
  getLocationName(latitude, longitude) {
    wx.request({
      url: `https://apis.map.qq.com/ws/geocoder/v1/`,
      data: {
        location: `${latitude},${longitude}`,
        key: 'OQRBZ-KBHKX-XEF4E-KMKQG-QHSO2-HQFQF', // 腾讯地图API密钥，需要替换为实际的密钥
        get_poi: 1
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.status === 0) {
          const result = res.data.result
          const address = result.address || ''
          const formattedAddress = result.formatted_addresses?.recommend || address
          
          this.setData({
            locationName: formattedAddress || '位置信息获取中...'
          })
          
          wx.showToast({
            title: '位置获取成功',
            icon: 'success'
          })
        } else {
          // 如果地理编码失败，仍然显示成功，但地点名称为空
          this.setData({
            locationName: '详细地址获取失败'
          })
          wx.showToast({
            title: '位置获取成功',
            icon: 'success'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        // 如果请求失败，仍然显示坐标获取成功
        this.setData({
          locationName: '详细地址获取失败'
        })
        wx.showToast({
          title: '位置获取成功',
          icon: 'success'
        })
      }
    })
  },

  // 直接拍照
  choosePhoto() {
    console.log('🔍 [图片选择] 开始拍照选择图片...')
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        console.log('📸 [图片选择] 拍照成功，获取到图片信息:', {
          tempFiles: res.tempFiles,
          tempFilePath: res.tempFiles[0].tempFilePath,
          size: res.tempFiles[0].size,
          duration: res.tempFiles[0].duration,
          height: res.tempFiles[0].height,
          width: res.tempFiles[0].width,
          thumbTempFilePath: res.tempFiles[0].thumbTempFilePath
        })
        const tempFilePath = res.tempFiles[0].tempFilePath
        console.log('📸 [图片选择] 准备处理图片路径:', tempFilePath)
        this.processPhoto(tempFilePath)
      },
      fail: (err) => {
        console.error('❌ [图片选择] 拍照失败:', err)
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    })
  },

  // 处理照片（添加水印并上传）
  processPhoto(tempFilePath) {
    console.log('🔄 [图片处理] 开始处理图片:', {
      originalPath: tempFilePath,
      timestamp: Date.now(),
      currentPhotosCount: this.data.photos.length
    })
    
    this.setData({
      processing: true,
      loadingText: '正在添加水印...'
    })

    // 创建canvas上下文来添加水印
    const query = wx.createSelectorQuery()
    
    // 获取图片信息
    wx.getImageInfo({
      src: tempFilePath,
      success: (imageInfo) => {
        console.log('📊 [图片处理] 获取图片信息成功:', {
          path: imageInfo.path,
          width: imageInfo.width,
          height: imageInfo.height,
          orientation: imageInfo.orientation,
          type: imageInfo.type
        })
        this.addWatermark(tempFilePath, imageInfo)
      },
      fail: (err) => {
        console.error('❌ [图片处理] 获取图片信息失败:', err)
        this.setData({ processing: false })
        wx.showToast({
          title: '图片处理失败',
          icon: 'none'
        })
      }
    })
  },

  // 添加水印
  addWatermark(imagePath, imageInfo) {
    console.log('🎨 [水印添加] 开始添加水印:', {
      imagePath,
      imageInfo,
      projectName: this.data.projectName,
      locationName: this.data.locationName,
      currentTime: app.formatDateTime(new Date())
    })
    
    const ctx = wx.createCanvasContext('watermarkCanvas', this)
    const canvasWidth = 400
    const canvasHeight = 300
    
    // 计算图片缩放比例
    const scale = Math.min(canvasWidth / imageInfo.width, canvasHeight / imageInfo.height)
    const scaledWidth = imageInfo.width * scale
    const scaledHeight = imageInfo.height * scale
    
    // 居中绘制图片
    const x = (canvasWidth - scaledWidth) / 2
    const y = (canvasHeight - scaledHeight) / 2
    
    // 绘制图片
    ctx.drawImage(imagePath, x, y, scaledWidth, scaledHeight)
    
    // 设置水印样式
    ctx.setFillStyle('rgba(255, 255, 255, 0.8)')
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    
    // 水印信息
    const watermarkInfo = [
      `项目: ${this.data.projectName || '未设置'}`,
      `位置: ${this.data.locationName || '未设置'}`,
      `时间: ${app.formatDateTime(new Date())}`,
      `工种: ${this.data.selectedWorkTypes.join(', ') || '未选择'}`,
      `内容: ${this.data.selectedInstallContents.join(', ') || '未选择'}`
    ]
    
    // 绘制水印背景
    const watermarkHeight = watermarkInfo.length * 20 + 20
    ctx.setFillStyle('rgba(0, 0, 0, 0.6)')
    ctx.fillRect(10, canvasHeight - watermarkHeight - 10, canvasWidth - 20, watermarkHeight)
    
    // 绘制水印文字
    ctx.setFillStyle('#ffffff')
    watermarkInfo.forEach((text, index) => {
      ctx.fillText(text, 20, canvasHeight - watermarkHeight + (index + 1) * 20)
    })
    
    console.log('🎨 [水印添加] 水印信息:', watermarkInfo)
    
    // 绘制完成后导出图片
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'watermarkCanvas',
          success: (res) => {
            console.log('✅ [水印添加] 水印添加成功，临时文件路径:', res.tempFilePath)
            // 上传带水印的图片
            this.uploadPhoto(res.tempFilePath)
          },
          fail: (err) => {
            console.error('❌ [水印添加] 导出图片失败:', err)
            this.setData({ processing: false })
            wx.showToast({
              title: '水印添加失败',
              icon: 'none'
            })
          }
        }, this)
      }, 500)
    })
  },

  // 上传图片到服务器
  uploadPhoto(tempFilePath) {
    console.log('📤 [图片上传] 开始上传图片到服务器:', {
      tempFilePath,
      timestamp: Date.now()
    })
    
    this.setData({
      loadingText: '正在上传图片...'
    })
    
    wx.uploadFile({
      url: app.getUploadUrl(),
      filePath: tempFilePath,
      name: 'file',
      header: {
        'Content-Type': 'multipart/form-data'
      },
      success: (res) => {
        console.log('📤 [图片上传] 上传响应:', {
          statusCode: res.statusCode,
          data: res.data
        })
        
        try {
          const result = JSON.parse(res.data)
          console.log('📤 [图片上传] 解析后的响应:', result)
          
          if (result.success) {
            console.log('✅ [图片上传] 上传成功，图片URL:', result.data.url)
            
            // 添加到照片列表
            const newPhoto = {
              url: result.data.url,
              path: tempFilePath, // 修改为path字段，与WXML中的显示保持一致
              uploadTime: new Date().toISOString(),
              filename: result.data.filename,
              size: result.data.size
            };
            const photos = [...this.data.photos, newPhoto];
            
            this.setData({
              photos: photos,
              processing: false
            })
            
            console.log('📸 [图片上传] 图片上传成功:', result.data.url);
            console.log('📸 [图片上传] 新增图片信息:', newPhoto);
            console.log('📸 [图片上传] 当前photos数组长度:', photos.length);
            console.log('📸 [图片上传] 更新后的照片列表:', photos)
            
            wx.showToast({
              title: '图片上传成功',
              icon: 'success',
              duration: 1500,
              mask: true
            })
          } else {
            console.error('❌ [图片上传] 服务器返回错误:', result.message)
            this.setData({ processing: false })
            wx.showToast({
              title: result.message || '上传失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('❌ [图片上传] 解析响应数据失败:', error)
          this.setData({ processing: false })
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('❌ [图片上传] 上传失败:', err)
        this.setData({ processing: false })
        wx.showToast({
          title: '网络错误，上传失败',
          icon: 'none'
        })
      }
    })
  },

  // 预览照片
  previewPhoto(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.photos.map(photo => photo.path)
    
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  // 删除照片
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          const photos = [...this.data.photos]
          photos.splice(index, 1)
          this.setData({ photos })
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 表单验证
  validateForm() {
    if (this.data.selectedWorkTypes.length === 0) {
      wx.showToast({
        title: '请选择安装工种',
        icon: 'none'
      })
      return false
    }
    
    if (this.data.selectedInstallContents.length === 0) {
      wx.showToast({
        title: '请选择安装内容',
        icon: 'none'
      })
      return false
    }
    
    if (this.data.photos.length === 0) {
      wx.showModal({
        title: '提示',
        content: '建议上传现场照片，是否继续提交？',
        success: (res) => {
          if (res.confirm) {
            this.doSubmit()
          }
        }
      })
      return false
    }
    
    return true
  },

  // 提交工单
  submitOrder() {
    if (!this.validateForm()) {
      return
    }
    
    this.doSubmit()
  },

  // 执行提交
  doSubmit() {
    console.log('🚀 [工单提交] 开始提交工单数据...')
    console.log('📋 [工单提交] 当前页面数据状态:', {
      selectedWorkTypes: this.data.selectedWorkTypes,
      selectedInstallContents: this.data.selectedInstallContents,
      voiceText: this.data.voiceText,
      photos: this.data.photos,
      projectName: this.data.projectName,
      locationName: this.data.locationName,
      currentLocation: this.data.currentLocation,
      selectedSummary: this.data.selectedSummary,
      workTypeData: this.data.workTypeData
    })
    
    // 检查关键数据是否为空
    console.log('🔍 [数据检查] 关键参数检查:')
    console.log('  - selectedWorkTypes长度:', this.data.selectedWorkTypes.length)
    console.log('  - selectedInstallContents长度:', this.data.selectedInstallContents.length)
    console.log('  - photos长度:', this.data.photos.length)
    console.log('  - selectedSummary是否为空:', Object.keys(this.data.selectedSummary).length === 0)

    this.setData({ submitting: true })
      
    // 根据selectedSummary重新组织工种和安装内容的层次关系
    const workItems = [];
    const selectedSummary = this.data.selectedSummary;
    
    Object.keys(selectedSummary).forEach(workTypeKey => {
      const workTypeInfo = selectedSummary[workTypeKey];
      workItems.push({
        work_type: workTypeInfo.label,
        install_contents: workTypeInfo.contents.map(content => content.label)
      });
    });
    
    console.log('🏗️ [工单提交] 重新组织的层次数据结构:', workItems);
    
    // 准备提交到后台的数据
    const submitData = {
      // 新的层次结构数据
      work_items: workItems,
      // 保留原有字段用于兼容性
      work_types: this.data.selectedWorkTypes,
      install_contents: this.data.selectedInstallContents,
      voice_text: this.data.voiceText,
      photos: this.data.photos.map(photo => ({
        url: photo.url,
        filename: photo.filename,
        size: photo.size,
        uploadTime: photo.uploadTime
      })),
      project_name: this.data.projectName,
      location_name: this.data.locationName,
      gps_latitude: this.data.currentLocation ? this.data.currentLocation.latitude : null,
      gps_longitude: this.data.currentLocation ? this.data.currentLocation.longitude : null,
      contact_name: wx.getStorageSync('userName') || '未知用户',
      created_at: new Date().toISOString()
    }
    
    console.log('📤 [工单提交] 完整提交数据:', submitData)
    console.log('📸 [工单提交] 图片详细信息:', {
      photosCount: submitData.photos.length,
      photoUrls: submitData.photos.map(p => p.url),
      isRealImageData: submitData.photos.every(p => p.url && p.url.startsWith('http')),
      photoDetails: submitData.photos
    })
    console.log('🏗️ [工单提交] 工种信息:', {
      workTypesCount: submitData.work_types.length,
      workTypes: submitData.work_types
    })
    console.log('🔧 [工单提交] 安装内容信息:', {
      installContentsCount: submitData.install_contents.length,
      installContents: submitData.install_contents
    })
    console.log('📍 [工单提交] 位置信息:', {
      projectName: submitData.project_name,
      locationName: submitData.location_name,
      hasGPS: !!(submitData.gps_latitude && submitData.gps_longitude),
      gpsCoords: {
        latitude: submitData.gps_latitude,
        longitude: submitData.gps_longitude
      }
    })
    console.log('🎤 [工单提交] 语音转文字内容:', {
      hasVoiceText: !!submitData.voice_text,
      voiceTextLength: submitData.voice_text ? submitData.voice_text.length : 0,
      voiceText: submitData.voice_text
    })
    console.log("工单",submitData)
    // 获取API基础URL
    const apiBaseUrl = app.getApiBaseUrl();

    // 提交到后台
    wx.request({
      
      url: apiBaseUrl + '/miniprogram/workorders',
      method: 'POST',
      data: submitData,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('✅ [工单提交] 提交成功:', res.data)
        this.setData({ submitting: false })
        
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        })
        
        // 工单提交成功后跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500) // 延迟1.5秒，让用户看到成功提示
      },
      fail: (err) => {
        console.error('❌ [工单提交] 提交失败:', err)
        this.setData({ submitting: false })
        
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
      }
    })
  },

    // 生成工单标题
    generateWorkOrderTitle() {
      if (this.data.selectedWorkTypes.length > 0) {
        return `${this.data.selectedWorkTypes.join('、')} - 工单申请`
      }
      return '工单申请'
    },

    // 生成工单描述
    generateWorkOrderDescription() {
      let description = ''
      
      if (this.data.selectedInstallContents.length > 0) {
        description += `安装内容：${this.data.selectedInstallContents.join('、')}\n`
      }
      
      if (this.data.voiceText && this.data.voiceText.trim()) {
        description += `语音说明：${this.data.voiceText.trim()}\n`
      }
      
      if (this.data.currentLocation) {
        description += `位置信息：${this.data.currentLocation.address || '未知地址'}`
      }
      
      return description || '无详细描述'
    },

    // 重置表单
    resetForm() {
      this.setData({
        selectedWorkTypes: [],
        selectedInstallContents: [],
        voiceText: '',
        photos: [],
        currentLocation: null
      })
    }
  })

  // ... existing code ...
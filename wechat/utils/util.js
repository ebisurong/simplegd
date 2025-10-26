/**
 * 通用工具函数
 */

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @param {string} format 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) {
    date = new Date()
  }
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  }
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  
  const formatNumber = (n) => {
    n = n.toString()
    return n[1] ? n : '0' + n
  }
  
  return format
    .replace('YYYY', year)
    .replace('MM', formatNumber(month))
    .replace('DD', formatNumber(day))
    .replace('HH', formatNumber(hour))
    .replace('mm', formatNumber(minute))
    .replace('ss', formatNumber(second))
}

/**
 * 生成唯一ID
 * @param {string} prefix 前缀
 * @returns {string} 唯一ID
 */
function generateId(prefix = 'WO') {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${timestamp}${random}`
}

/**
 * 验证手机号
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
  const phoneReg = /^1[3-9]\d{9}$/
  return phoneReg.test(phone)
}

/**
 * 验证邮箱
 * @param {string} email 邮箱
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailReg.test(email)
}

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 * @returns {string} 扩展名
 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间间隔
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 获取工单状态文本
 * @param {string} status 状态值
 * @returns {string} 状态文本
 */
function getOrderStatusText(status) {
  const statusMap = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知状态'
}

/**
 * 获取优先级文本
 * @param {string} priority 优先级值
 * @returns {string} 优先级文本
 */
function getPriorityText(priority) {
  const priorityMap = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'urgent': '紧急'
  }
  return priorityMap[priority] || '普通'
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} date1 日期1
 * @param {Date|string} date2 日期2
 * @returns {number} 天数差
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000
  const firstDate = new Date(date1)
  const secondDate = new Date(date2)
  return Math.round(Math.abs((firstDate - secondDate) / oneDay))
}

/**
 * 获取相对时间描述
 * @param {Date|string} date 日期
 * @returns {string} 相对时间描述
 */
function getRelativeTime(date) {
  const now = new Date()
  const targetDate = new Date(date)
  const diffMs = now - targetDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return formatTime(targetDate, 'MM-DD')
  }
}

/**
 * 显示成功提示
 * @param {string} title 提示标题
 * @param {number} duration 显示时长
 */
function showSuccess(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'success',
    duration
  })
}

/**
 * 显示错误提示
 * @param {string} title 提示标题
 * @param {number} duration 显示时长
 */
function showError(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'error',
    duration
  })
}

/**
 * 显示加载提示
 * @param {string} title 提示标题
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示确认对话框
 * @param {string} content 对话框内容
 * @param {string} title 对话框标题
 * @returns {Promise<boolean>} 用户选择结果
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success(res) {
        resolve(res.confirm)
      },
      fail() {
        resolve(false)
      }
    })
  })
}

module.exports = {
  formatTime,
  generateId,
  validatePhone,
  validateEmail,
  getFileExtension,
  formatFileSize,
  debounce,
  throttle,
  deepClone,
  getOrderStatusText,
  getPriorityText,
  daysBetween,
  getRelativeTime,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  showConfirm
}
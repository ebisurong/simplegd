/**
 * 图像处理工具类
 * 提供图像上传、预处理、格式转换等功能
 */
class ImageUtils {
  /**
   * 将文件转换为图像元素
   * @param {File} file 图像文件
   * @returns {Promise<HTMLImageElement>}
   */
  static fileToImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('请选择有效的图像文件'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('图像加载失败'))
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * 将图像元素转换为Canvas
   * @param {HTMLImageElement} image 图像元素
   * @param {Object} options 选项
   * @returns {HTMLCanvasElement}
   */
  static imageToCanvas(image, options = {}) {
    const {
      width = image.width,
      height = image.height,
      quality = 1.0
    } = options

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = width
    canvas.height = height
    
    // 设置图像质量
    ctx.imageSmoothingEnabled = quality > 0.8
    ctx.imageSmoothingQuality = quality > 0.8 ? 'high' : 'medium'
    
    ctx.drawImage(image, 0, 0, width, height)
    return canvas
  }

  /**
   * 压缩图像
   * @param {File} file 原始图像文件
   * @param {Object} options 压缩选项
   * @returns {Promise<Blob>}
   */
  static async compressImage(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/jpeg'
    } = options

    try {
      const image = await this.fileToImage(file)
      
      // 计算新尺寸
      let { width, height } = image
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = this.imageToCanvas(image, { width, height, quality })
      
      return new Promise((resolve) => {
        canvas.toBlob(resolve, format, quality)
      })
    } catch (error) {
      console.error('图像压缩失败:', error)
      throw error
    }
  }

  /**
   * 获取图像基本信息
   * @param {File} file 图像文件
   * @returns {Promise<Object>}
   */
  static async getImageInfo(file) {
    try {
      const image = await this.fileToImage(file)
      
      return {
        width: image.width,
        height: image.height,
        size: file.size,
        type: file.type,
        name: file.name,
        lastModified: file.lastModified,
        aspectRatio: (image.width / image.height).toFixed(2)
      }
    } catch (error) {
      console.error('获取图像信息失败:', error)
      throw error
    }
  }

  /**
   * 创建图像缩略图
   * @param {File} file 图像文件
   * @param {number} size 缩略图尺寸
   * @returns {Promise<string>}
   */
  static async createThumbnail(file, size = 150) {
    try {
      const image = await this.fileToImage(file)
      const canvas = this.imageToCanvas(image, { 
        width: size, 
        height: size,
        quality: 0.7
      })
      
      return canvas.toDataURL('image/jpeg', 0.7)
    } catch (error) {
      console.error('创建缩略图失败:', error)
      throw error
    }
  }

  /**
   * 验证图像文件
   * @param {File} file 图像文件
   * @param {Object} constraints 约束条件
   * @returns {Promise<Object>}
   */
  static async validateImage(file, constraints = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      minWidth = 100,
      minHeight = 100,
      maxWidth = 4096,
      maxHeight = 4096,
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    } = constraints

    const errors = []

    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      errors.push(`不支持的文件类型: ${file.type}`)
    }

    // 检查文件大小
    if (file.size > maxSize) {
      errors.push(`文件大小超出限制: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${(maxSize / 1024 / 1024).toFixed(2)}MB`)
    }

    try {
      const info = await this.getImageInfo(file)
      
      // 检查图像尺寸
      if (info.width < minWidth || info.height < minHeight) {
        errors.push(`图像尺寸过小: ${info.width}x${info.height} < ${minWidth}x${minHeight}`)
      }
      
      if (info.width > maxWidth || info.height > maxHeight) {
        errors.push(`图像尺寸过大: ${info.width}x${info.height} > ${maxWidth}x${maxHeight}`)
      }

      return {
        valid: errors.length === 0,
        errors,
        info
      }
    } catch (error) {
      errors.push('图像文件损坏或无法读取')
      return {
        valid: false,
        errors,
        info: null
      }
    }
  }

  /**
   * 批量处理图像
   * @param {FileList} files 图像文件列表
   * @param {Function} processor 处理函数
   * @param {Object} options 选项
   * @returns {Promise<Array>}
   */
  static async batchProcess(files, processor, options = {}) {
    const {
      concurrency = 3,
      onProgress = () => {}
    } = options

    const results = []
    const fileArray = Array.from(files)
    let completed = 0

    // 分批处理
    for (let i = 0; i < fileArray.length; i += concurrency) {
      const batch = fileArray.slice(i, i + concurrency)
      const batchPromises = batch.map(async (file, index) => {
        try {
          const result = await processor(file, i + index)
          completed++
          onProgress(completed, fileArray.length)
          return { success: true, result, file }
        } catch (error) {
          completed++
          onProgress(completed, fileArray.length)
          return { success: false, error, file }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  /**
   * 绘制识别结果到图像上
   * @param {HTMLImageElement} image 原始图像
   * @param {Object} results 识别结果
   * @returns {HTMLCanvasElement}
   */
  static drawRecognitionResults(image, results) {
    const canvas = this.imageToCanvas(image)
    const ctx = canvas.getContext('2d')

    // 设置绘制样式
    ctx.strokeStyle = '#ff4444'
    ctx.fillStyle = '#ff4444'
    ctx.lineWidth = 2
    ctx.font = '14px Arial'

    if (results.boundingBox) {
      const { x, y, width, height } = results.boundingBox
      
      // 绘制边界框
      ctx.strokeRect(x, y, width, height)
      
      // 绘制标签
      const label = `${results.type || '未知'} (${(results.confidence * 100).toFixed(1)}%)`
      const textWidth = ctx.measureText(label).width
      
      ctx.fillStyle = '#ff4444'
      ctx.fillRect(x, y - 20, textWidth + 10, 20)
      
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, x + 5, y - 5)
    }

    if (results.location && results.location.radius) {
      const { x, y, radius } = results.location
      
      // 绘制故障位置圆圈
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.stroke()
      
      // 绘制故障类型标签
      if (results.faultType) {
        ctx.fillStyle = '#ff4444'
        ctx.fillText(results.faultType, x + radius + 5, y)
      }
    }

    return canvas
  }

  /**
   * 将Canvas转换为Blob
   * @param {HTMLCanvasElement} canvas Canvas元素
   * @param {string} format 格式
   * @param {number} quality 质量
   * @returns {Promise<Blob>}
   */
  static canvasToBlob(canvas, format = 'image/jpeg', quality = 0.8) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, format, quality)
    })
  }

  /**
   * 下载图像
   * @param {string|HTMLCanvasElement} source 图像源
   * @param {string} filename 文件名
   */
  static downloadImage(source, filename = 'image.jpg') {
    let url
    
    if (typeof source === 'string') {
      url = source
    } else if (source instanceof HTMLCanvasElement) {
      url = source.toDataURL('image/jpeg', 0.9)
    } else {
      throw new Error('不支持的图像源类型')
    }

    const link = document.createElement('a')
    link.download = filename
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 如果是从Canvas生成的URL，需要释放
    if (source instanceof HTMLCanvasElement) {
      URL.revokeObjectURL(url)
    }
  }
}

export default ImageUtils
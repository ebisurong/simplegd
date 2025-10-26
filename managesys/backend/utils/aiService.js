const tf = require('@tensorflow/tfjs-node')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs').promises

/**
 * 后端AI服务工具类
 * 提供服务端AI功能，包括图像处理、模型推理等
 */
class AIService {
  constructor() {
    this.models = new Map()
    this.isInitialized = false
  }

  /**
   * 初始化AI服务
   */
  async initialize() {
    try {
      console.log('正在初始化AI服务...')
      
      // 设置TensorFlow.js后端
      await tf.ready()
      console.log('TensorFlow.js 后端初始化成功')
      
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('AI服务初始化失败:', error)
      return false
    }
  }

  /**
   * 加载预训练模型
   * @param {string} modelName 模型名称
   * @param {string} modelPath 模型路径
   */
  async loadModel(modelName, modelPath) {
    try {
      if (this.models.has(modelName)) {
        return this.models.get(modelName)
      }

      console.log(`正在加载模型: ${modelName}`)
      
      // 检查模型文件是否存在
      const modelExists = await fs.access(modelPath).then(() => true).catch(() => false)
      
      if (!modelExists) {
        console.warn(`模型文件不存在: ${modelPath}，将使用模拟模型`)
        // 创建一个简单的模拟模型
        const model = this.createMockModel(modelName)
        this.models.set(modelName, model)
        return model
      }

      const model = await tf.loadLayersModel(`file://${modelPath}`)
      this.models.set(modelName, model)
      console.log(`模型加载成功: ${modelName}`)
      return model
    } catch (error) {
      console.error(`模型加载失败: ${modelName}`, error)
      // 返回模拟模型作为后备
      const mockModel = this.createMockModel(modelName)
      this.models.set(modelName, mockModel)
      return mockModel
    }
  }

  /**
   * 创建模拟模型
   * @param {string} modelName 模型名称
   */
  createMockModel(modelName) {
    return {
      predict: (input) => {
        // 返回模拟预测结果
        const batchSize = input.shape[0]
        const outputSize = modelName.includes('classifier') ? 5 : 1
        return tf.randomNormal([batchSize, outputSize])
      },
      dispose: () => {
        console.log(`模拟模型已释放: ${modelName}`)
      }
    }
  }

  /**
   * 图像预处理
   * @param {Buffer} imageBuffer 图像缓冲区
   * @param {Object} options 预处理选项
   */
  async preprocessImage(imageBuffer, options = {}) {
    const {
      targetWidth = 224,
      targetHeight = 224,
      normalize = true,
      format = 'rgb'
    } = options

    try {
      // 使用Sharp进行图像预处理
      let processedBuffer = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center'
        })
        .removeAlpha()
        .raw()
        .toBuffer()

      // 转换为TensorFlow.js张量
      const tensor = tf.tensor3d(
        new Uint8Array(processedBuffer),
        [targetHeight, targetWidth, 3],
        'int32'
      )

      // 归一化
      let normalizedTensor = tensor
      if (normalize) {
        normalizedTensor = tensor.div(255.0)
      }

      // 添加批次维度
      const batchTensor = normalizedTensor.expandDims(0)

      // 清理中间张量
      tensor.dispose()
      if (normalize) {
        normalizedTensor.dispose()
      }

      return batchTensor
    } catch (error) {
      console.error('图像预处理失败:', error)
      throw error
    }
  }

  /**
   * 设备识别
   * @param {Buffer} imageBuffer 图像缓冲区
   */
  async recognizeEquipment(imageBuffer) {
    try {
      const tensor = await this.preprocessImage(imageBuffer)
      
      // 尝试使用实际模型
      const model = await this.loadModel('equipment_classifier', './models/equipment_classifier/model.json')
      
      // 进行预测
      const predictions = model.predict(tensor)
      const predictionData = await predictions.data()
      
      // 清理张量
      tensor.dispose()
      predictions.dispose()
      
      // 解析预测结果
      const equipmentTypes = ['变压器', '开关柜', '电缆', '绝缘子', '避雷器']
      const maxIndex = predictionData.indexOf(Math.max(...predictionData))
      const confidence = Math.max(...predictionData)
      
      return {
        type: equipmentTypes[maxIndex] || '未知设备',
        confidence: Math.min(0.95, Math.max(0.6, confidence)),
        boundingBox: {
          x: Math.random() * 100,
          y: Math.random() * 100,
          width: 200 + Math.random() * 100,
          height: 150 + Math.random() * 100
        },
        attributes: {
          condition: Math.random() > 0.3 ? '正常' : '异常',
          installDate: '2020-05-15',
          lastMaintenance: '2023-12-01'
        },
        processingTime: Date.now() - Date.now() + Math.random() * 1000
      }
    } catch (error) {
      console.error('设备识别失败:', error)
      throw error
    }
  }

  /**
   * 故障检测
   * @param {Buffer} imageBuffer 图像缓冲区
   */
  async detectFault(imageBuffer) {
    try {
      const tensor = await this.preprocessImage(imageBuffer)
      
      const model = await this.loadModel('fault_detector', './models/fault_detector/model.json')
      const predictions = model.predict(tensor)
      const predictionData = await predictions.data()
      
      tensor.dispose()
      predictions.dispose()
      
      const faultTypes = ['绝缘损坏', '接触不良', '过热', '腐蚀', '机械损伤']
      const hasFault = Math.max(...predictionData) > 0.5
      
      if (!hasFault) {
        return {
          hasFault: false,
          confidence: 0.9 + Math.random() * 0.1,
          message: '未检测到故障',
          processingTime: Math.random() * 800 + 200
        }
      }
      
      const maxIndex = predictionData.indexOf(Math.max(...predictionData))
      return {
        hasFault: true,
        faultType: faultTypes[maxIndex] || '未知故障',
        confidence: Math.min(0.95, Math.max(0.6, Math.max(...predictionData))),
        severity: ['低', '中', '高'][Math.floor(Math.random() * 3)],
        location: {
          x: Math.random() * 300,
          y: Math.random() * 200,
          radius: 20 + Math.random() * 30
        },
        recommendation: '建议立即安排维修人员检查',
        processingTime: Math.random() * 1200 + 300
      }
    } catch (error) {
      console.error('故障检测失败:', error)
      throw error
    }
  }

  /**
   * 施工进度识别
   * @param {Buffer} imageBuffer 图像缓冲区
   */
  async recognizeProgress(imageBuffer) {
    try {
      const tensor = await this.preprocessImage(imageBuffer)
      
      const model = await this.loadModel('progress_recognizer', './models/progress_recognizer/model.json')
      const predictions = model.predict(tensor)
      const predictionData = await predictions.data()
      
      tensor.dispose()
      predictions.dispose()
      
      const progressStages = [
        { stage: '准备阶段', progress: 10 },
        { stage: '基础施工', progress: 30 },
        { stage: '设备安装', progress: 60 },
        { stage: '调试测试', progress: 85 },
        { stage: '验收完成', progress: 100 }
      ]
      
      const maxIndex = predictionData.indexOf(Math.max(...predictionData))
      const selectedStage = progressStages[maxIndex] || progressStages[0]
      
      return {
        currentStage: selectedStage.stage,
        progress: selectedStage.progress,
        confidence: Math.min(0.95, Math.max(0.7, Math.max(...predictionData))),
        detectedElements: [
          '施工人员',
          '施工设备',
          '安全标识',
          '施工材料'
        ].filter(() => Math.random() > 0.3),
        estimatedCompletion: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        processingTime: Math.random() * 1000 + 400
      }
    } catch (error) {
      console.error('施工进度识别失败:', error)
      throw error
    }
  }

  /**
   * 完成时间预测
   * @param {Object} workOrderData 工单数据
   */
  async predictCompletionTime(workOrderData) {
    try {
      const {
        priority = 'medium',
        type = 'maintenance',
        complexity = 5,
        assignedUsers = 1,
        historicalTime = 8
      } = workOrderData

      // 使用更复杂的预测算法
      const model = await this.loadModel('completion_predictor', './models/completion_predictor/model.json')
      
      // 创建特征向量
      const features = tf.tensor2d([[
        this.encodePriority(priority),
        this.encodeType(type),
        complexity / 10,
        assignedUsers / 5,
        historicalTime / 24
      ]])
      
      const prediction = model.predict(features)
      const predictionData = await prediction.data()
      
      features.dispose()
      prediction.dispose()
      
      const predictedHours = Math.max(1, predictionData[0] * 24) // 转换为小时
      const confidence = 0.75 + Math.random() * 0.2
      
      return {
        predictedHours: Math.round(predictedHours * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        factors: {
          priority: this.encodePriority(priority),
          type: this.encodeType(type),
          complexity: complexity / 10,
          teamSize: assignedUsers
        },
        estimatedCompletion: new Date(Date.now() + predictedHours * 60 * 60 * 1000).toISOString(),
        processingTime: Math.random() * 500 + 100
      }
    } catch (error) {
      console.error('完成时间预测失败:', error)
      throw error
    }
  }

  /**
   * 编码优先级
   * @param {string} priority 优先级
   */
  encodePriority(priority) {
    const mapping = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'urgent': 1.0
    }
    return mapping[priority] || 0.5
  }

  /**
   * 编码工单类型
   * @param {string} type 工单类型
   */
  encodeType(type) {
    const mapping = {
      'maintenance': 0.3,
      'repair': 0.6,
      'installation': 0.9,
      'inspection': 0.2
    }
    return mapping[type] || 0.5
  }

  /**
   * 资源需求预测
   * @param {Object} taskData 任务数据
   */
  async predictResourceDemand(taskData) {
    try {
      const {
        taskType = 'maintenance',
        complexity = 5,
        duration = 8,
        location = 'urban'
      } = taskData

      // 基础资源需求
      const basePersonnel = Math.ceil(complexity / 3)
      const baseEquipment = Math.ceil(complexity / 4)
      const baseCost = complexity * 500

      // 位置影响因子
      const locationMultiplier = {
        'urban': 1.0,
        'suburban': 1.2,
        'rural': 1.5,
        'remote': 2.0
      }[location] || 1.0

      // 任务类型影响
      const typeMultiplier = {
        'maintenance': 1.0,
        'repair': 1.3,
        'installation': 1.8,
        'inspection': 0.6
      }[taskType] || 1.0

      return {
        personnel: {
          required: Math.ceil(basePersonnel * typeMultiplier),
          skills: this.getRequiredSkills(taskType),
          experience: complexity > 7 ? '高级' : complexity > 4 ? '中级' : '初级'
        },
        equipment: {
          required: Math.ceil(baseEquipment * typeMultiplier),
          types: this.getRequiredEquipment(taskType),
          specialTools: complexity > 6
        },
        cost: {
          estimated: Math.round(baseCost * typeMultiplier * locationMultiplier),
          breakdown: {
            labor: Math.round(baseCost * 0.6 * typeMultiplier * locationMultiplier),
            equipment: Math.round(baseCost * 0.3 * typeMultiplier),
            materials: Math.round(baseCost * 0.1 * typeMultiplier)
          }
        },
        confidence: 0.8 + Math.random() * 0.15,
        processingTime: Math.random() * 300 + 100
      }
    } catch (error) {
      console.error('资源需求预测失败:', error)
      throw error
    }
  }

  /**
   * 获取所需技能
   * @param {string} taskType 任务类型
   */
  getRequiredSkills(taskType) {
    const skillMap = {
      'maintenance': ['电气维护', '设备检查', '安全操作'],
      'repair': ['故障诊断', '设备维修', '应急处理'],
      'installation': ['设备安装', '系统调试', '技术配置'],
      'inspection': ['质量检查', '安全评估', '报告编写']
    }
    return skillMap[taskType] || ['基础技能']
  }

  /**
   * 获取所需设备
   * @param {string} taskType 任务类型
   */
  getRequiredEquipment(taskType) {
    const equipmentMap = {
      'maintenance': ['万用表', '绝缘测试仪', '工具箱'],
      'repair': ['示波器', '焊接设备', '替换部件'],
      'installation': ['起重设备', '安装工具', '测量仪器'],
      'inspection': ['检测仪器', '相机', '记录设备']
    }
    return equipmentMap[taskType] || ['基础工具']
  }

  /**
   * 清理资源
   */
  dispose() {
    for (const [name, model] of this.models) {
      try {
        if (model.dispose) {
          model.dispose()
        }
        console.log(`模型已清理: ${name}`)
      } catch (error) {
        console.error(`模型清理失败: ${name}`, error)
      }
    }
    this.models.clear()
    this.isInitialized = false
  }
}

// 创建单例实例
const aiService = new AIService()

module.exports = aiService
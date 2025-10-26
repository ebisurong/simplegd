const express = require('express')
const multer = require('multer')
const aiService = require('../utils/aiService')
const router = express.Router()

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件'), false)
    }
  }
})

// 初始化AI服务
aiService.initialize().then(success => {
  if (success) {
    console.log('AI服务初始化成功')
  } else {
    console.error('AI服务初始化失败')
  }
})

/**
 * 设备识别接口
 * POST /api/ai/recognize/equipment
 */
router.post('/recognize/equipment', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件'
      })
    }

    console.log('开始设备识别，文件大小:', req.file.size)
    
    const result = await aiService.recognizeEquipment(req.file.buffer)
    
    res.json({
      success: true,
      data: result,
      message: '设备识别完成'
    })
  } catch (error) {
    console.error('设备识别失败:', error)
    res.status(500).json({
      success: false,
      message: '设备识别失败: ' + error.message
    })
  }
})

/**
 * 故障检测接口
 * POST /api/ai/detect/fault
 */
router.post('/detect/fault', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件'
      })
    }

    console.log('开始故障检测，文件大小:', req.file.size)
    
    const result = await aiService.detectFault(req.file.buffer)
    
    res.json({
      success: true,
      data: result,
      message: '故障检测完成'
    })
  } catch (error) {
    console.error('故障检测失败:', error)
    res.status(500).json({
      success: false,
      message: '故障检测失败: ' + error.message
    })
  }
})

/**
 * 施工进度识别接口
 * POST /api/ai/recognize/progress
 */
router.post('/recognize/progress', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件'
      })
    }

    console.log('开始施工进度识别，文件大小:', req.file.size)
    
    const result = await aiService.recognizeProgress(req.file.buffer)
    
    res.json({
      success: true,
      data: result,
      message: '施工进度识别完成'
    })
  } catch (error) {
    console.error('施工进度识别失败:', error)
    res.status(500).json({
      success: false,
      message: '施工进度识别失败: ' + error.message
    })
  }
})

/**
 * 完成时间预测接口
 * POST /api/ai/predict/completion-time
 */
router.post('/predict/completion-time', async (req, res) => {
  try {
    const workOrderData = req.body
    
    console.log('开始完成时间预测:', workOrderData)
    
    const result = await aiService.predictCompletionTime(workOrderData)
    
    res.json({
      success: true,
      data: result,
      message: '完成时间预测完成'
    })
  } catch (error) {
    console.error('完成时间预测失败:', error)
    res.status(500).json({
      success: false,
      message: '完成时间预测失败: ' + error.message
    })
  }
})

/**
 * 资源需求预测接口
 * POST /api/ai/predict/resource-demand
 */
router.post('/predict/resource-demand', async (req, res) => {
  try {
    const taskData = req.body
    
    console.log('开始资源需求预测:', taskData)
    
    const result = await aiService.predictResourceDemand(taskData)
    
    res.json({
      success: true,
      data: result,
      message: '资源需求预测完成'
    })
  } catch (error) {
    console.error('资源需求预测失败:', error)
    res.status(500).json({
      success: false,
      message: '资源需求预测失败: ' + error.message
    })
  }
})

/**
 * 故障趋势分析接口
 * POST /api/ai/analyze/fault-trend
 */
router.post('/analyze/fault-trend', async (req, res) => {
  try {
    const { timeRange = '30d', equipmentType = 'all' } = req.body
    
    console.log('开始故障趋势分析:', { timeRange, equipmentType })
    
    // 模拟故障趋势分析
    const days = parseInt(timeRange) || 30
    const trendData = []
    const faultTypes = ['绝缘损坏', '接触不良', '过热', '腐蚀', '机械损伤']
    
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
      trendData.push({
        date: date.toISOString().split('T')[0],
        faultCount: Math.floor(Math.random() * 10),
        severity: {
          low: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 3),
          high: Math.floor(Math.random() * 2)
        }
      })
    }
    
    const faultDistribution = faultTypes.map(type => ({
      type,
      count: Math.floor(Math.random() * 50) + 10,
      percentage: Math.round((Math.random() * 30 + 10) * 100) / 100
    }))
    
    const result = {
      trendData,
      faultDistribution,
      prediction: {
        nextWeekFaults: Math.floor(Math.random() * 20) + 5,
        riskLevel: ['低', '中', '高'][Math.floor(Math.random() * 3)],
        confidence: 0.75 + Math.random() * 0.2
      },
      recommendations: [
        '加强设备巡检频率',
        '重点关注高风险设备',
        '提前准备维修资源',
        '优化维护计划'
      ],
      processingTime: Math.random() * 500 + 200
    }
    
    res.json({
      success: true,
      data: result,
      message: '故障趋势分析完成'
    })
  } catch (error) {
    console.error('故障趋势分析失败:', error)
    res.status(500).json({
      success: false,
      message: '故障趋势分析失败: ' + error.message
    })
  }
})

/**
 * 处理方案推荐接口
 * POST /api/ai/recommend/solution
 */
router.post('/recommend/solution', async (req, res) => {
  try {
    const workOrderData = req.body
    
    console.log('开始处理方案推荐:', workOrderData)
    
    // 模拟智能推荐算法
    const solutions = [
      {
        id: 1,
        title: '标准维修流程',
        confidence: 0.85 + Math.random() * 0.1,
        steps: [
          '安全检查和断电',
          '故障点定位',
          '更换损坏部件',
          '功能测试',
          '恢复供电'
        ],
        estimatedTime: Math.floor(Math.random() * 8) + 2,
        requiredSkills: ['电气维修', '安全操作'],
        resources: ['万用表', '替换部件', '安全工具'],
        cost: Math.floor(Math.random() * 5000) + 1000
      },
      {
        id: 2,
        title: '快速应急处理',
        confidence: 0.75 + Math.random() * 0.1,
        steps: [
          '紧急隔离',
          '临时修复',
          '功能验证',
          '后续跟进'
        ],
        estimatedTime: Math.floor(Math.random() * 4) + 1,
        requiredSkills: ['应急处理', '快速诊断'],
        resources: ['应急工具', '临时材料'],
        cost: Math.floor(Math.random() * 2000) + 500
      }
    ]
    
    // 根据工单优先级和类型调整推荐
    const recommendedSolution = workOrderData.priority === 'urgent' ? solutions[1] : solutions[0]
    
    const result = {
      recommendedSolution,
      alternativeSolutions: solutions.filter(s => s.id !== recommendedSolution.id),
      reasoning: {
        factors: [
          `优先级: ${workOrderData.priority || 'medium'}`,
          `工单类型: ${workOrderData.type || 'maintenance'}`,
          `复杂度: ${workOrderData.complexity || 5}/10`
        ],
        explanation: '基于历史数据和当前工单特征，推荐最适合的处理方案'
      },
      processingTime: Math.random() * 300 + 100
    }
    
    res.json({
      success: true,
      data: result,
      message: '处理方案推荐完成'
    })
  } catch (error) {
    console.error('处理方案推荐失败:', error)
    res.status(500).json({
      success: false,
      message: '处理方案推荐失败: ' + error.message
    })
  }
})

/**
 * 人员分配建议接口
 * POST /api/ai/recommend/assignment
 */
router.post('/recommend/assignment', async (req, res) => {
  try {
    const taskData = req.body
    
    console.log('开始人员分配建议:', taskData)
    
    // 模拟可用人员数据
    const availablePersonnel = [
      {
        id: 1,
        name: '张工程师',
        skills: ['电气维修', '设备安装', '故障诊断'],
        experience: 8,
        currentLoad: 0.6,
        location: '市区',
        availability: true,
        matchScore: 0.9
      },
      {
        id: 2,
        name: '李技师',
        skills: ['机械维修', '安全操作', '应急处理'],
        experience: 5,
        currentLoad: 0.4,
        location: '郊区',
        availability: true,
        matchScore: 0.75
      },
      {
        id: 3,
        name: '王师傅',
        skills: ['设备检查', '质量控制', '报告编写'],
        experience: 12,
        currentLoad: 0.8,
        location: '市区',
        availability: false,
        matchScore: 0.85
      }
    ]
    
    // 筛选可用人员并按匹配度排序
    const recommendations = availablePersonnel
      .filter(person => person.availability)
      .sort((a, b) => b.matchScore - a.matchScore)
      .map(person => ({
        ...person,
        recommendation: {
          role: person.matchScore > 0.8 ? '主要负责人' : '协助人员',
          reason: `技能匹配度${Math.round(person.matchScore * 100)}%，工作负荷${Math.round(person.currentLoad * 100)}%`,
          estimatedEfficiency: Math.round((person.matchScore * (1 - person.currentLoad) + 0.5) * 100)
        }
      }))
    
    const result = {
      recommendations,
      teamComposition: {
        recommended: recommendations.slice(0, 2),
        backup: recommendations.slice(2),
        totalEfficiency: Math.round(recommendations.slice(0, 2).reduce((sum, p) => sum + p.recommendation.estimatedEfficiency, 0) / 2)
      },
      workloadAnalysis: {
        beforeAssignment: availablePersonnel.map(p => ({ name: p.name, load: p.currentLoad })),
        afterAssignment: availablePersonnel.map(p => ({
          name: p.name,
          load: recommendations.slice(0, 2).some(r => r.id === p.id) ? Math.min(1, p.currentLoad + 0.3) : p.currentLoad
        }))
      },
      processingTime: Math.random() * 200 + 50
    }
    
    res.json({
      success: true,
      data: result,
      message: '人员分配建议完成'
    })
  } catch (error) {
    console.error('人员分配建议失败:', error)
    res.status(500).json({
      success: false,
      message: '人员分配建议失败: ' + error.message
    })
  }
})

/**
 * 优先级调整建议接口
 * POST /api/ai/recommend/priority
 */
router.post('/recommend/priority', async (req, res) => {
  try {
    const workOrders = req.body.workOrders || []
    
    console.log('开始优先级调整建议，工单数量:', workOrders.length)
    
    const adjustments = workOrders.map(order => {
      const currentPriority = order.priority || 'medium'
      const factors = {
        urgency: Math.random(),
        impact: Math.random(),
        resources: Math.random(),
        dependencies: Math.random()
      }
      
      // 计算建议优先级
      const score = (factors.urgency * 0.4 + factors.impact * 0.3 + factors.resources * 0.2 + factors.dependencies * 0.1)
      let suggestedPriority = 'medium'
      
      if (score > 0.8) suggestedPriority = 'urgent'
      else if (score > 0.6) suggestedPriority = 'high'
      else if (score < 0.3) suggestedPriority = 'low'
      
      const needsAdjustment = suggestedPriority !== currentPriority
      
      return {
        workOrderId: order.id,
        currentPriority,
        suggestedPriority,
        needsAdjustment,
        confidence: 0.7 + Math.random() * 0.25,
        factors,
        reasoning: needsAdjustment ? 
          `基于紧急程度(${Math.round(factors.urgency * 100)}%)和影响范围(${Math.round(factors.impact * 100)}%)，建议调整优先级` :
          '当前优先级设置合理',
        impactAnalysis: {
          resourceAllocation: needsAdjustment ? '需要重新分配资源' : '无需调整',
          timeline: needsAdjustment ? '可能影响整体进度' : '不影响现有计划',
          cost: needsAdjustment ? Math.floor(Math.random() * 1000) : 0
        }
      }
    })
    
    const result = {
      adjustments,
      summary: {
        totalWorkOrders: workOrders.length,
        needsAdjustment: adjustments.filter(a => a.needsAdjustment).length,
        averageConfidence: Math.round(adjustments.reduce((sum, a) => sum + a.confidence, 0) / adjustments.length * 100) / 100
      },
      recommendations: [
        '优先处理紧急工单',
        '合理分配人力资源',
        '关注工单依赖关系',
        '定期评估优先级设置'
      ],
      processingTime: Math.random() * 400 + 150
    }
    
    res.json({
      success: true,
      data: result,
      message: '优先级调整建议完成'
    })
  } catch (error) {
    console.error('优先级调整建议失败:', error)
    res.status(500).json({
      success: false,
      message: '优先级调整建议失败: ' + error.message
    })
  }
})

/**
 * AI仪表盘数据接口
 * GET /api/ai/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log('获取AI仪表盘数据')
    
    // 模拟仪表盘数据
    const result = {
      systemStatus: {
        aiServiceStatus: 'running',
        modelStatus: {
          equipmentRecognition: 'active',
          faultDetection: 'active',
          progressRecognition: 'active',
          completionPredictor: 'active'
        },
        performance: {
          avgResponseTime: Math.round(Math.random() * 500 + 200),
          successRate: 0.95 + Math.random() * 0.04,
          dailyRequests: Math.floor(Math.random() * 1000) + 500
        }
      },
      statistics: {
        todayRecognitions: Math.floor(Math.random() * 100) + 50,
        todayPredictions: Math.floor(Math.random() * 50) + 20,
        todayRecommendations: Math.floor(Math.random() * 30) + 10,
        accuracyRate: 0.88 + Math.random() * 0.1
      },
      trends: {
        predictionAccuracy: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          accuracy: 0.8 + Math.random() * 0.15
        })),
        processingEfficiency: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          efficiency: 0.7 + Math.random() * 0.25
        })),
        modelPerformance: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          performance: 0.75 + Math.random() * 0.2
        }))
      },
      alerts: [
        {
          id: 1,
          type: 'warning',
          message: '设备识别模型准确率略有下降',
          timestamp: new Date().toISOString(),
          severity: 'medium'
        },
        {
          id: 2,
          type: 'info',
          message: 'AI服务运行正常',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          severity: 'low'
        }
      ]
    }
    
    res.json({
      success: true,
      data: result,
      message: 'AI仪表盘数据获取成功'
    })
  } catch (error) {
    console.error('获取AI仪表盘数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取AI仪表盘数据失败: ' + error.message
    })
  }
})

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      })
    }
  }
  
  console.error('AI路由错误:', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误: ' + error.message
  })
})

module.exports = router
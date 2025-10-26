const express = require('express');
const multer = require('multer');
const { ImageRecognition, WorkOrder, AIModel } = require('../models');
const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'), false);
    }
  }
});

// 设备识别API
router.post('/equipment', upload.single('image'), async (req, res) => {
  try {
    const { workOrderId } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 获取设备识别模型
    const model = await AIModel.findOne({
      where: { model_name: 'equipment_classifier', status: 'active' }
    });

    if (!model) {
      return res.status(404).json({ error: '设备识别模型未找到' });
    }

    // 模拟图像识别处理时间
    const processingStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    const processingTime = Date.now() - processingStartTime;

    // 模拟设备识别结果
    const equipmentTypes = [
      { name: '空调设备', confidence: 0.92 },
      { name: '电梯设备', confidence: 0.88 },
      { name: '消防设备', confidence: 0.85 },
      { name: '照明设备', confidence: 0.90 },
      { name: '监控设备', confidence: 0.87 },
      { name: '网络设备', confidence: 0.83 },
      { name: '供水设备', confidence: 0.89 },
      { name: '供电设备', confidence: 0.91 }
    ];

    const recognizedEquipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    const confidence = Math.max(0.7, recognizedEquipment.confidence + (Math.random() - 0.5) * 0.1);

    // 模拟边界框坐标
    const boundingBox = {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
      width: Math.floor(Math.random() * 200) + 100,
      height: Math.floor(Math.random() * 200) + 100
    };

    // 模拟设备属性
    const attributes = {
      brand: ['海尔', '格力', '美的', '西门子', '施耐德'][Math.floor(Math.random() * 5)],
      model: 'Model-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      condition: ['良好', '一般', '需维护'][Math.floor(Math.random() * 3)],
      installation_year: 2015 + Math.floor(Math.random() * 8)
    };

    // 保存识别结果
    const recognition = await ImageRecognition.create({
      work_order_id: workOrderId,
      image_url: `/uploads/recognition_${Date.now()}_${imageFile.originalname}`,
      recognized_type: 'equipment',
      confidence: confidence,
      bounding_box: JSON.stringify(boundingBox),
      attributes: JSON.stringify({
        equipment_name: recognizedEquipment.name,
        ...attributes
      }),
      processing_time: processingTime
    });

    res.json({
      success: true,
      recognition: {
        id: recognition.id,
        equipment_type: recognizedEquipment.name,
        confidence: confidence,
        bounding_box: boundingBox,
        attributes: attributes,
        processing_time: processingTime,
        recommendations: [
          `建议检查${recognizedEquipment.name}的运行状态`,
          `确认${attributes.brand}设备的维护记录`,
          `检查设备安装年限是否需要更新`
        ]
      }
    });

  } catch (error) {
    console.error('设备识别失败:', error);
    res.status(500).json({ error: '识别失败，请稍后重试' });
  }
});

// 故障识别API
router.post('/fault', upload.single('image'), async (req, res) => {
  try {
    const { workOrderId } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 获取故障检测模型
    const model = await AIModel.findOne({
      where: { model_name: 'fault_detector', status: 'active' }
    });

    if (!model) {
      return res.status(404).json({ error: '故障检测模型未找到' });
    }

    // 模拟图像处理时间
    const processingStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));
    const processingTime = Date.now() - processingStartTime;

    // 模拟故障类型识别
    const faultTypes = [
      { name: '设备老化', severity: 'medium', confidence: 0.85 },
      { name: '线路故障', severity: 'high', confidence: 0.90 },
      { name: '部件损坏', severity: 'high', confidence: 0.88 },
      { name: '连接松动', severity: 'low', confidence: 0.82 },
      { name: '腐蚀锈蚀', severity: 'medium', confidence: 0.87 },
      { name: '过热现象', severity: 'high', confidence: 0.91 },
      { name: '漏水漏油', severity: 'medium', confidence: 0.86 },
      { name: '异常磨损', severity: 'medium', confidence: 0.84 }
    ];

    const detectedFault = faultTypes[Math.floor(Math.random() * faultTypes.length)];
    const confidence = Math.max(0.75, detectedFault.confidence + (Math.random() - 0.5) * 0.1);

    // 模拟故障区域定位
    const faultAreas = [];
    const numAreas = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numAreas; i++) {
      faultAreas.push({
        x: Math.floor(Math.random() * 300),
        y: Math.floor(Math.random() * 300),
        width: Math.floor(Math.random() * 100) + 50,
        height: Math.floor(Math.random() * 100) + 50,
        confidence: Math.random() * 0.3 + 0.7
      });
    }

    // 生成修复建议
    const repairSuggestions = {
      '设备老化': ['建议更换老化部件', '制定设备更新计划', '加强日常维护'],
      '线路故障': ['检查线路连接', '更换损坏线缆', '测试电气安全'],
      '部件损坏': ['更换损坏部件', '检查相关组件', '测试设备功能'],
      '连接松动': ['紧固松动连接', '检查固定件', '定期检查维护'],
      '腐蚀锈蚀': ['清理腐蚀部位', '涂抹防腐涂层', '改善环境条件'],
      '过热现象': ['检查散热系统', '清理散热通道', '监控温度变化'],
      '漏水漏油': ['更换密封件', '检查管路连接', '清理泄漏物'],
      '异常磨损': ['更换磨损部件', '调整运行参数', '加强润滑保养']
    };

    // 保存识别结果
    const recognition = await ImageRecognition.create({
      work_order_id: workOrderId,
      image_url: `/uploads/fault_${Date.now()}_${imageFile.originalname}`,
      recognized_type: 'fault',
      confidence: confidence,
      bounding_box: JSON.stringify(faultAreas),
      attributes: JSON.stringify({
        fault_type: detectedFault.name,
        severity: detectedFault.severity,
        fault_areas: faultAreas,
        repair_suggestions: repairSuggestions[detectedFault.name] || []
      }),
      processing_time: processingTime
    });

    res.json({
      success: true,
      recognition: {
        id: recognition.id,
        fault_type: detectedFault.name,
        severity: detectedFault.severity,
        confidence: confidence,
        fault_areas: faultAreas,
        processing_time: processingTime,
        repair_suggestions: repairSuggestions[detectedFault.name] || [],
        urgency_level: detectedFault.severity === 'high' ? '紧急' : 
                      detectedFault.severity === 'medium' ? '中等' : '一般'
      }
    });

  } catch (error) {
    console.error('故障识别失败:', error);
    res.status(500).json({ error: '识别失败，请稍后重试' });
  }
});

// 施工进度识别API
router.post('/progress', upload.single('image'), async (req, res) => {
  try {
    const { workOrderId, expectedStage } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 模拟图像处理时间
    const processingStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
    const processingTime = Date.now() - processingStartTime;

    // 模拟施工阶段识别
    const progressStages = [
      { name: '准备阶段', progress: 10, confidence: 0.88 },
      { name: '拆除阶段', progress: 25, confidence: 0.85 },
      { name: '安装阶段', progress: 50, confidence: 0.90 },
      { name: '调试阶段', progress: 75, confidence: 0.87 },
      { name: '验收阶段', progress: 90, confidence: 0.92 },
      { name: '完工阶段', progress: 100, confidence: 0.95 }
    ];

    const detectedStage = progressStages[Math.floor(Math.random() * progressStages.length)];
    const confidence = Math.max(0.8, detectedStage.confidence + (Math.random() - 0.5) * 0.1);

    // 计算进度偏差
    const expectedProgress = expectedStage ? 
      progressStages.find(s => s.name === expectedStage)?.progress || 50 : 50;
    const progressDeviation = detectedStage.progress - expectedProgress;

    // 生成进度分析
    const analysis = {
      current_stage: detectedStage.name,
      progress_percentage: detectedStage.progress,
      expected_percentage: expectedProgress,
      deviation: progressDeviation,
      status: progressDeviation > 10 ? '超前' : 
              progressDeviation < -10 ? '滞后' : '正常',
      quality_indicators: {
        工艺质量: Math.random() > 0.3 ? '良好' : '需改进',
        安全措施: Math.random() > 0.2 ? '到位' : '需加强',
        材料使用: Math.random() > 0.25 ? '规范' : '需检查'
      }
    };

    // 保存识别结果
    const recognition = await ImageRecognition.create({
      work_order_id: workOrderId,
      image_url: `/uploads/progress_${Date.now()}_${imageFile.originalname}`,
      recognized_type: 'progress',
      confidence: confidence,
      bounding_box: JSON.stringify({}),
      attributes: JSON.stringify(analysis),
      processing_time: processingTime
    });

    res.json({
      success: true,
      recognition: {
        id: recognition.id,
        ...analysis,
        confidence: confidence,
        processing_time: processingTime,
        recommendations: [
          progressDeviation > 10 ? '进度超前，注意质量控制' : 
          progressDeviation < -10 ? '进度滞后，建议加快施工' : '进度正常，继续保持',
          '定期更新施工进度照片',
          '确保安全措施落实到位'
        ]
      }
    });

  } catch (error) {
    console.error('进度识别失败:', error);
    res.status(500).json({ error: '识别失败，请稍后重试' });
  }
});

// 获取识别历史记录
router.get('/history/:workOrderId', async (req, res) => {
  try {
    const { workOrderId } = req.params;
    const { type } = req.query;

    const whereClause = { work_order_id: workOrderId };
    if (type) {
      whereClause.recognized_type = type;
    }

    const recognitions = await ImageRecognition.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      recognitions: recognitions.map(r => ({
        id: r.id,
        type: r.recognized_type,
        confidence: r.confidence,
        image_url: r.image_url,
        attributes: JSON.parse(r.attributes),
        processing_time: r.processing_time,
        created_at: r.created_at
      }))
    });

  } catch (error) {
    console.error('获取识别历史失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

module.exports = router;
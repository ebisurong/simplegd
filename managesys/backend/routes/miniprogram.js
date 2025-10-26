const express = require('express');
const { WorkOrder, WorkOrderPhoto, User } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 添加中间件来捕获所有请求（必须在路由定义之前）
router.use((req, res, next) => {
  console.log('🔍 [DEBUG] 小程序路由收到请求:', req.method, req.originalUrl);
  next();
});

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 数据转换函数：小程序数据 -> 后台数据
const convertMiniProgramData = (miniData) => {
  console.log('📥 [1] 收到小程序工单提交参数:', JSON.stringify(miniData, null, 2));
  console.log('🔍 [2] work_items字段检查 - 存在:', !!miniData.work_items, '类型:', typeof miniData.work_items, '值:', miniData.work_items);
  
  // 处理新的层次结构数据 work_items
  let workTypes = [];
  let installContents = [];
  
  if (miniData.work_items && Array.isArray(miniData.work_items)) {
    console.log('✅ [3] work_items处理 - 检测到层次结构数据，开始提取工种和安装内容');
    
    // 从层次结构中提取工种和安装内容
    miniData.work_items.forEach(item => {
      if (item.work_type) {
        workTypes.push(item.work_type);
      }
      if (item.install_contents && Array.isArray(item.install_contents)) {
        installContents.push(...item.install_contents);
      }
    });
    
    console.log('📋 [4] 提取结果 - 工种:', workTypes, '安装内容:', installContents);
  } else {
    console.log('❌ [3] work_items处理 - 未检测到有效数据，使用兼容模式');
    workTypes = miniData.work_types || [];
    installContents = miniData.install_contents || [];
  }
  
  // 生成工单标题
  const generateTitle = (workTypes) => {
    if (!workTypes || workTypes.length === 0) {
      return miniData.title || '工单申请';
    }
    return `${workTypes.join('、')} - 工单申请`;
  };

  // 生成工单描述
  const generateDescription = (installContents, voiceText, workItems) => {
    let description = miniData.description || '';
    
    // 如果有层次结构数据，优先使用层次结构生成描述
    if (workItems && Array.isArray(workItems) && workItems.length > 0) {
      description += '\n工作内容：';
      workItems.forEach((item, index) => {
        description += `\n${index + 1}. ${item.work_type}`;
        if (item.install_contents && item.install_contents.length > 0) {
          description += `：${item.install_contents.join('、')}`;
        }
      });
    } else if (installContents && installContents.length > 0) {
      description += `\n安装内容：${installContents.join('、')}`;
    }
    
    if (voiceText && voiceText.trim()) {
      description += `\n语音说明：${voiceText.trim()}`;
    }
    
    return description || '无详细描述';
  };

  const convertedData = {
    title: generateTitle(workTypes),
    description: generateDescription(installContents, miniData.voice_text, miniData.work_items),
    work_types: JSON.stringify(workTypes),
    install_contents: JSON.stringify(installContents),
    work_items: miniData.work_items ? JSON.stringify(miniData.work_items) : null,
    voice_text: miniData.voice_text || '',
    location_info: JSON.stringify(miniData.location_info || null),
    project_name: miniData.project_name || '',
    location_name: miniData.location_name || '',
    contact_name: miniData.contact_name || '',
    contact_phone: miniData.contact_phone || '',
    status: 'pending',
    priority: miniData.priority || 'medium',
    construction_stage: miniData.construction_stage || 'preparation',
    gps_latitude: miniData.gps_latitude || null,
    gps_longitude: miniData.gps_longitude || null,
    photos: miniData.photos || [], // 保留photos数组
  };
  
  console.log('📤 [5] 处理后的work_items最终值:', convertedData.work_items);
  return convertedData;
};

// 保存上传的图片文件
const saveUploadedFile = async (fileBuffer, originalName) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  // 确保uploads目录存在
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // 生成唯一文件名
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const filename = `miniprogram_${timestamp}${ext}`;
  const filepath = path.join(uploadsDir, filename);
  
  // 保存文件
  fs.writeFileSync(filepath, fileBuffer);
  
  return {
    filename,
    filepath,
    url: `/uploads/${filename}`
  };
};

// POST /api/miniprogram/workorders - 创建小程序工单
router.post('/workorders', upload.array('photos', 10), async (req, res) => {
  try {
    console.log('🚀 [接口] 工单提交接口收到请求');
    console.log('📥 [接口] req.body:', JSON.stringify(req.body, null, 2));
    
    // 解析请求数据
    let workOrderData;
    try {
      // 优先处理JSON字符串格式的data字段
      if (req.body.data && typeof req.body.data === 'string') {
        workOrderData = JSON.parse(req.body.data);
      } else {
        // 直接使用req.body作为工单数据
        workOrderData = { ...req.body };
      }
      
      // 处理photos字段
      if (req.body.photos && Array.isArray(req.body.photos)) {
        workOrderData.photos = req.body.photos;
      } else if (!workOrderData.photos || !Array.isArray(workOrderData.photos)) {
        workOrderData.photos = [];
      }
      
    } catch (parseError) {
      console.error('数据解析错误:', parseError);
      return res.status(400).json({
        success: false,
        message: '数据格式错误'
      });
    }

    // 转换小程序数据为后台数据格式
    const convertedData = convertMiniProgramData(workOrderData);
    
    // 创建工单
    const workOrder = await WorkOrder.create(convertedData);
    console.log('💾 [6] 工单创建成功，ID:', workOrder.id, '数据库中work_items字段:', workOrder.work_items);
    
    // 处理照片数据（简化日志）
    
    // 1. 处理通过multer上传的文件（直接上传）
    if (req.files && req.files.length > 0) {
      console.log('✅ [调试] 进入multer文件处理分支');
      const photoPromises = req.files.map(async (file) => {
        try {
          const savedFile = await saveUploadedFile(file.buffer, file.originalname);
          
          return WorkOrderPhoto.create({
            work_order_id: workOrder.id,
            photo_url: savedFile.url,
            photo_path: savedFile.filepath,
            original_name: file.originalname,
            file_size: file.size,
            mime_type: file.mimetype,
          });
        } catch (error) {
          console.error('保存照片失败:', error);
          return null;
        }
      });
      
      await Promise.all(photoPromises);
    }
    
    // 2. 处理小程序传递的已上传图片数组
    console.log('🔍 [调试] 检查小程序图片数组条件:');
    console.log('🔍 [调试] workOrderData.photos存在:', !!workOrderData.photos);
    console.log('🔍 [调试] workOrderData.photos是数组:', Array.isArray(workOrderData.photos));
    console.log('🔍 [调试] workOrderData.photos长度大于0:', workOrderData.photos && workOrderData.photos.length > 0);
    
    if (workOrderData.photos && Array.isArray(workOrderData.photos) && workOrderData.photos.length > 0) {
      console.log(`✅ [调试] 进入小程序图片处理分支，共 ${workOrderData.photos.length} 张图片:`);
      console.log('🔍 [调试] 图片数组详情:', JSON.stringify(workOrderData.photos, null, 2));
      
      const photoPromises = workOrderData.photos.map(async (photo, index) => {
        try {
          console.log(`处理第 ${index + 1} 张图片:`, JSON.stringify(photo, null, 2));
          
          // 从完整URL中提取相对路径，去掉域名和端口
          let photoUrl = photo.url;
          if (photoUrl) {
            if (photoUrl.includes('/uploads/')) {
              // 提取 /uploads/filename 部分
              const urlParts = photoUrl.split('/uploads/');
              if (urlParts.length > 1) {
                photoUrl = `/uploads/${urlParts[1]}`;
              }
            }
            console.log(`第 ${index + 1} 张图片URL处理: ${photo.url} -> ${photoUrl}`);
          } else {
            console.error(`第 ${index + 1} 张图片缺少URL字段:`, photo);
            return null;
          }
          
          // 推断MIME类型
          let mimeType = 'image/png'; // 默认类型
          if (photo.filename) {
            const ext = photo.filename.toLowerCase().split('.').pop();
            if (ext === 'jpg' || ext === 'jpeg') {
              mimeType = 'image/jpeg';
            } else if (ext === 'png') {
              mimeType = 'image/png';
            } else if (ext === 'gif') {
              mimeType = 'image/gif';
            } else if (ext === 'webp') {
              mimeType = 'image/webp';
            }
          }
          
          const photoData = {
            work_order_id: workOrder.id,
            photo_url: photoUrl,
            original_name: photo.filename || 'unknown',
            file_size: photo.size || 0,
            mime_type: mimeType,
            has_watermark: false,
          };
          
          console.log(`第 ${index + 1} 张图片准备保存到数据库:`, JSON.stringify(photoData, null, 2));
          
          const savedPhoto = await WorkOrderPhoto.create(photoData);
          console.log(`第 ${index + 1} 张图片保存成功，ID: ${savedPhoto.id}`);
          
          return savedPhoto;
        } catch (error) {
          console.error(`保存第 ${index + 1} 张图片记录失败:`, error);
          console.error('图片数据:', JSON.stringify(photo, null, 2));
          return null;
        }
      });
      
      const savedPhotos = await Promise.all(photoPromises);
      const successCount = savedPhotos.filter(p => p !== null).length;
      const failedCount = savedPhotos.filter(p => p === null).length;
      
      console.log(`图片保存结果: 成功 ${successCount} 张，失败 ${failedCount} 张，总计 ${workOrderData.photos.length} 张`);
      
      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 张图片保存失败，请检查上面的错误日志`);
      }
      
      // 记录成功保存的图片ID
      const savedPhotoIds = savedPhotos.filter(p => p !== null).map(p => p.id);
      console.log('成功保存的图片记录ID:', savedPhotoIds);
    } else {
      console.log('❌ [调试] 未进入小程序图片处理分支');
      console.log('🔍 [调试] 原因分析:');
      if (!workOrderData.photos) {
        console.log('   - workOrderData.photos 不存在');
      } else if (!Array.isArray(workOrderData.photos)) {
        console.log('   - workOrderData.photos 不是数组，类型:', typeof workOrderData.photos);
      } else if (workOrderData.photos.length === 0) {
        console.log('   - workOrderData.photos 是空数组');
      }
    }

    // 返回成功响应
    console.log(`工单创建成功，ID: ${workOrder.id}，标题: ${workOrder.title}`);
    
    res.json({
      success: true,
      message: '工单提交成功',
      workOrder: {
        id: workOrder.id,
        title: workOrder.title,
        status: workOrder.status,
        work_types: JSON.parse(workOrder.work_types || '[]'),
        install_contents: JSON.parse(workOrder.install_contents || '[]'),
        voice_text: workOrder.voice_text,
        location_info: JSON.parse(workOrder.location_info || 'null'),
        created_at: workOrder.created_at
      }
    });

  } catch (error) {
    console.error('创建工单失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// GET /api/miniprogram/workorders/:id - 获取工单详情
router.get('/workorders/:id', async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id, {
      include: [
        {
          model: WorkOrderPhoto,
          as: 'photos',
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }

    // 转换为小程序格式
    const miniProgramFormat = {
      id: workOrder.id,
      title: workOrder.title,
      description: workOrder.description,
      work_types: JSON.parse(workOrder.work_types || '[]'),
      install_contents: JSON.parse(workOrder.install_contents || '[]'),
      voice_text: workOrder.voice_text || '',
      location_info: JSON.parse(workOrder.location_info || 'null'),
      project_name: workOrder.project_name || '',
      location_name: workOrder.location_name || '',
      status: workOrder.status,
      statusText: getStatusText(workOrder.status),
      created_at: workOrder.created_at,
      photos: workOrder.photos?.map(photo => ({
        path: photo.photo_url,
        originalPath: photo.photo_url,
        hasWatermark: false,
        timestamp: new Date(photo.created_at).getTime()
      })) || []
    };

    res.json({
      success: true,
      workOrder: miniProgramFormat
    });

  } catch (error) {
    console.error('获取工单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 状态文本转换
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'in_progress': '处理中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

// 获取工单列表 - 小程序历史页面使用
router.get('/workorders', async (req, res) => {
  try {
    console.log('📋 [API] 获取工单列表请求');
    
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      timeFilter = '' 
    } = req.query;
    
    console.log('📋 [API] 查询参数:', { page, limit, search, status, timeFilter });
    
    // 构建查询条件
    const { Op } = require('sequelize');
    let where = {};
    
    // 搜索条件
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { project_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 状态筛选
    if (status && status !== '全部状态') {
      const statusMap = {
        '待处理': 'pending',
        '处理中': 'processing', 
        '已完成': 'completed',
        '已拒绝': 'rejected'
      };
      where.status = statusMap[status] || status;
    }
    
    // 时间筛选
    if (timeFilter && timeFilter !== '全部时间') {
      const now = new Date();
      let startDate;
      
      switch (timeFilter) {
        case '今天':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '本周':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '本月':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      if (startDate) {
        where.created_at = { [Op.gte]: startDate };
      }
    }
    
    // 查询工单数据
    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: WorkOrderPhoto,
          as: 'photos',
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    
    console.log(`📋 [API] 查询结果: 总数=${count}, 当前页=${rows.length}条`);
    
    // 数据格式转换 - 后端格式 -> 小程序格式
    const convertedOrders = rows.map(order => {
      // 创建施工阶段模板
      const getConstructionStages = (constructionStage, orderId) => {
        console.log(`🏗️ [施工阶段] 工单${orderId} - 输入参数: constructionStage="${constructionStage}"`);
        
        // 硬编码的6个固定施工阶段选项
        const stages = [
          { value: 'survey', label: '勘查调研', checked: false },
          { value: 'pipeline', label: '管道安装', checked: false },
          { value: 'cable', label: '线缆施工', checked: false },
          { value: 'equipment', label: '设备安装', checked: false },
          { value: 'debug', label: '设备调试', checked: false },
          { value: 'maintenance', label: '维保', checked: false }
        ];
        
        // 数据库施工阶段值与预定义选项的映射关系
        const stageMapping = {
          'preparation': 'survey',        // 勘查调研
          'survey': 'survey',             // 勘查调研
          'pipeline': 'pipeline',         // 管道安装
          'structure': 'pipeline',        // 管道安装 (结构施工归类为管道安装)
          'cable': 'cable',               // 线缆施工
          'equipment': 'equipment',       // 设备安装
          'debug': 'debug',               // 设备调试
          'completion': 'debug',          // 设备调试 (完工归类为设备调试)
          'maintenance': 'maintenance'    // 维保
        };
        
        console.log(`🏗️ [施工阶段] 工单${orderId} - 初始化6个固定阶段选项`);
        
        // 如果有施工阶段数据，通过映射关系设置对应选项为选中状态
        if (constructionStage) {
          const mappedStage = stageMapping[constructionStage];
          console.log(`🏗️ [施工阶段] 工单${orderId} - 数据库值"${constructionStage}"映射为"${mappedStage}"`);
          
          if (mappedStage) {
            const stageIndex = stages.findIndex(stage => stage.value === mappedStage);
            console.log(`🏗️ [施工阶段] 工单${orderId} - 查找映射阶段"${mappedStage}"的索引: ${stageIndex}`);
            
            if (stageIndex !== -1) {
              stages[stageIndex].checked = true;
              console.log(`🏗️ [施工阶段] 工单${orderId} - 设置阶段"${stages[stageIndex].label}"为选中状态`);
            }
          } else {
            console.warn(`⚠️ [施工阶段] 工单${orderId} - 数据库值"${constructionStage}"未找到对应的映射关系`);
          }
        } else {
          console.log(`🏗️ [施工阶段] 工单${orderId} - 无施工阶段数据，所有选项保持未选中状态`);
        }
        
        const checkedStages = stages.filter(stage => stage.checked);
        console.log(`🏗️ [施工阶段] 工单${orderId} - 最终结果: 已选中${checkedStages.length}个阶段`, checkedStages.map(s => s.label));
        
        return stages;
      };
      
      // 解析JSON字段
      let workTypes = [];
      let installContents = [];
      
      try {
        workTypes = order.work_types ? JSON.parse(order.work_types) : [];
      } catch (e) {
        console.warn('解析work_types失败:', e);
        workTypes = [];
      }
      
      try {
        installContents = order.install_contents ? JSON.parse(order.install_contents) : [];
      } catch (e) {
        console.warn('解析install_contents失败:', e);
        installContents = [];
      }
      
      // 状态文本映射
      const statusTextMap = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已完成',
        'rejected': '已拒绝'
      };
      
      // 记录工单原始施工阶段数据
      console.log(`📋 [工单转换] 工单${order.id} - 原始construction_stage: "${order.construction_stage}"`);
      
      // 处理施工阶段数据
      const constructionStages = getConstructionStages(order.construction_stage, order.id);
      // 修复selectedStagesCount计算逻辑：统计实际选中的阶段数量
      const selectedStagesCount = constructionStages.filter(stage => stage.checked).length;
      
      console.log(`📋 [工单转换] 工单${order.id} - 最终施工阶段数据:`, {
        constructionStages: constructionStages.map(stage => ({ 
          value: stage.value, 
          label: stage.label, 
          checked: stage.checked 
        })),
        selectedStagesCount: selectedStagesCount
      });

      return {
        id: order.id,
        title: order.title,
        description: order.description,
        submitter: order.submitter?.real_name || order.submitter?.username || '未知',
        workTypes: workTypes,
        installContents: installContents,
        projectName: order.project_name || order.title,
        remark: order.remark || '',
        voiceUrl: order.voice_url || '',
        createTime: order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '',
        status: order.status,
        statusText: statusTextMap[order.status] || order.status,
        contact: order.contact_person || order.submitter?.real_name || '未知',
        phone: order.contact_phone || '',
        locationName: order.location_name || '',
        photos: order.photos ? order.photos.map(photo => ({
          path: photo.photo_path || photo.file_path,
          url: photo.photo_url ? photo.photo_url.replace(/^\/uploads\//, '') : '',
          timestamp: new Date(photo.created_at).getTime()
        })) : [],
        constructionStages: constructionStages,
        selectedStagesCount: selectedStagesCount
      };
    });
    
    // 计算统计数据
    const allOrders = await WorkOrder.findAll({ attributes: ['status'] });
    const pendingCount = allOrders.filter(order => order.status === 'pending').length;
    const completedCount = allOrders.filter(order => order.status === 'completed').length;
    
    res.json({
      success: true,
      data: {
        orders: convertedOrders,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        },
        stats: {
          totalOrders: allOrders.length,
          pendingCount,
          completedCount
        }
      }
    });
    
  } catch (error) {
    console.error('获取工单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 更新工单施工阶段
router.patch('/workorders/:id/construction-stage', async (req, res) => {
  console.log('🔍 [DEBUG] PATCH /workorders/:id/construction-stage 路由被调用');
  console.log('🔍 [DEBUG] 请求方法:', req.method);
  console.log('🔍 [DEBUG] 请求路径:', req.path);
  console.log('🔍 [DEBUG] 完整URL:', req.originalUrl);
  console.log('🔍 [DEBUG] 请求参数:', req.params);
  console.log('🔍 [DEBUG] 请求体:', req.body);
  
  try {
    const { id } = req.params;
    const { construction_stage } = req.body;

    console.log(`📝 更新工单 ${id} 的施工阶段为: ${construction_stage}`);

    // 验证参数
    if (!construction_stage) {
      return res.status(400).json({
        success: false,
        message: '施工阶段不能为空'
      });
    }

    // 查找工单
    const workOrder = await WorkOrder.findByPk(id);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }

    // 更新施工阶段
    await workOrder.update({
      construction_stage: construction_stage
    });

    console.log(`✅ 工单 ${id} 施工阶段更新成功`);

    res.json({
      success: true,
      message: '施工阶段更新成功',
      data: {
        id: workOrder.id,
        construction_stage: workOrder.construction_stage
      }
    });

  } catch (error) {
    console.error('❌ 更新工单施工阶段失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

// 获取小程序首页统计数据
router.get('/statistics', async (req, res) => {
  try {
    console.log('📊 [API] 获取小程序首页统计数据请求');
    
    // 获取总工单数
    const totalOrders = await WorkOrder.count();
    
    // 获取今日上报工单数
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const todayOrders = await WorkOrder.count({
      where: {
        created_at: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    });
    
    // 获取待处理工单数
    const pendingOrders = await WorkOrder.count({
      where: {
        status: 'pending'
      }
    });
    
    // 获取最近5条工单
    const recentOrdersData = await WorkOrder.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'status', 'created_at', 'priority'],
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['username', 'real_name']
        }
      ]
    });
    
    // 格式化最近工单数据
    const recentOrders = recentOrdersData.map(order => ({
      id: order.id,
      title: order.title,
      status: order.status,
      statusText: getStatusText(order.status),
      createTime: formatDateTime(order.created_at),
      priority: order.priority,
      submitter: order.submitter ? (order.submitter.real_name || order.submitter.username) : '未知'
    }));
    
    const result = {
      success: true,
      data: {
        totalOrders,
        todayOrders,
        pendingOrders,
        recentOrders
      }
    };
    
    console.log('📊 [API] 统计数据:', result.data);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ 获取小程序首页统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 辅助函数：格式化日期时间
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

module.exports = router;
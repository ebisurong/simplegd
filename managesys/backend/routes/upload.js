const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${timestamp}_${randomNum}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  console.log('📁 [文件上传] 检查文件类型:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    console.log('✅ [文件上传] 文件类型验证通过');
    cb(null, true);
  } else {
    console.log('❌ [文件上传] 文件类型不支持:', { mimetype: file.mimetype, ext });
    cb(new Error('只支持 JPG、JPEG、PNG 格式的图片文件'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
    files: 10 // 最多10个文件
  }
});

// 单个文件上传接口
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 [单文件上传] 开始处理上传请求');
    console.log('📋 [单文件上传] 请求信息:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      } : null
    });

    if (!req.file) {
      console.log('❌ [单文件上传] 没有接收到文件');
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    // 生成访问URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('✅ [单文件上传] 文件上传成功:', {
      filename: req.file.filename,
      size: req.file.size,
      url: imageUrl
    });

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
        path: `/uploads/${req.file.filename}`
      }
    });

  } catch (error) {
    console.error('❌ [单文件上传] 上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 多文件上传接口
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    console.log('📤 [多文件上传] 开始处理上传请求');
    console.log('📋 [多文件上传] 请求信息:', {
      body: req.body,
      filesCount: req.files ? req.files.length : 0
    });

    if (!req.files || req.files.length === 0) {
      console.log('❌ [多文件上传] 没有接收到文件');
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedFiles = req.files.map(file => {
      const imageUrl = `${baseUrl}/uploads/${file.filename}`;
      console.log('📁 [多文件上传] 处理文件:', {
        originalname: file.originalname,
        filename: file.filename,
        size: file.size,
        url: imageUrl
      });
      
      return {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: imageUrl,
        path: `/uploads/${file.filename}`
      };
    });

    console.log('✅ [多文件上传] 所有文件上传成功:', {
      count: uploadedFiles.length,
      totalSize: req.files.reduce((sum, file) => sum + file.size, 0)
    });

    res.json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });

  } catch (error) {
    console.error('❌ [多文件上传] 上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 小程序专用上传接口
router.post('/miniprogram', upload.single('file'), async (req, res) => {
  try {
    console.log('📱 [小程序上传] 开始处理上传请求');
    console.log('📋 [小程序上传] 请求信息:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    });

    if (!req.file) {
      console.log('❌ [小程序上传] 没有接收到文件');
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    // 生成访问URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // 可选：压缩图片以节省存储空间
    try {
      const compressedPath = path.join(uploadsDir, `compressed_${req.file.filename}`);
      await sharp(req.file.path)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toFile(compressedPath);
      
      console.log('🗜️ [小程序上传] 图片压缩完成');
    } catch (compressError) {
      console.log('⚠️ [小程序上传] 图片压缩失败，使用原图:', compressError.message);
    }

    console.log('✅ [小程序上传] 文件上传成功:', {
      filename: req.file.filename,
      size: req.file.size,
      url: imageUrl
    });

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
        path: `/uploads/${req.file.filename}`,
        uploadTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [小程序上传] 上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败',
      error: error.message
    });
  }
});

// 删除文件接口
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    console.log('🗑️ [文件删除] 删除文件请求:', { filename, filePath });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ [文件删除] 文件删除成功:', filename);
      
      res.json({
        success: true,
        message: '文件删除成功'
      });
    } else {
      console.log('❌ [文件删除] 文件不存在:', filename);
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
  } catch (error) {
    console.error('❌ [文件删除] 删除失败:', error);
    res.status(500).json({
      success: false,
      message: '文件删除失败',
      error: error.message
    });
  }
});

// 获取文件信息接口
router.get('/info/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      res.json({
        success: true,
        data: {
          filename: filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `${baseUrl}/uploads/${filename}`,
          path: `/uploads/${filename}`
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
  } catch (error) {
    console.error('❌ [文件信息] 获取失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文件信息失败',
      error: error.message
    });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  console.error('❌ [上传错误]:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大5MB）'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制（最多10个）'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '意外的文件字段'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message || '文件上传失败'
  });
});

module.exports = router;
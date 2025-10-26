const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 创建测试图片文件
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test_image.jpg');
  
  // 创建一个简单的测试图片数据（Base64编码的1x1像素JPEG）
  const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

// 测试小程序工单提交API（带照片）
async function testMiniprogramPhotoAPI() {
  const baseURL = 'http://localhost:8000';
  
  console.log('开始测试小程序照片上传API接口...\n');
  
  // 创建测试图片
  const testImagePath = createTestImage();
  
  try {
    // 测试数据
    const testData = {
      title: '测试工单 - 带照片提交',
      description: '这是一个通过小程序API提交的带照片的测试工单',
      priority: 'high',
      construction_stage: 'maintenance',
      contact_name: '小程序用户',
      contact_phone: '13800138002',
      project_name: '测试项目（带照片）',
      location_name: '测试地点（带照片）',
      gps_latitude: 39.9042,
      gps_longitude: 116.4074,
      work_types: ['电工', '木工'],
      install_contents: ['电线安装', '木门安装'],
      voice_text: '这是带照片的语音转文字内容，现场已拍摄相关照片。',
      location_info: {
        address: '测试大楼B座2楼',
        floor: 2,
        room: '201'
      }
    };
    
    // 创建FormData
    const formData = new FormData();
    
    // 添加工单数据
    formData.append('data', JSON.stringify(testData));
    
    // 添加测试照片
    formData.append('photos', fs.createReadStream(testImagePath), {
      filename: 'test_photo_1.jpg',
      contentType: 'image/jpeg'
    });
    
    // 添加第二张测试照片（复制同一张）
    formData.append('photos', fs.createReadStream(testImagePath), {
      filename: 'test_photo_2.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('1. 测试创建带照片的工单...');
    
    const createResponse = await axios.post(`${baseURL}/api/miniprogram/workorders`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ 带照片的工单创建成功');
    console.log('工单ID:', createResponse.data.workOrder.id);
    console.log('工单标题:', createResponse.data.workOrder.title);
    console.log('工种类型:', createResponse.data.workOrder.work_types);
    console.log('安装内容:', createResponse.data.workOrder.install_contents);
    console.log('语音内容:', createResponse.data.workOrder.voice_text);
    console.log('位置信息:', createResponse.data.workOrder.location_info);
    
    const workOrderId = createResponse.data.workOrder.id;
    
    // 2. 测试获取工单详情（包含照片）
    console.log('\n2. 测试获取工单详情（包含照片）...');
    const detailResponse = await axios.get(`${baseURL}/api/miniprogram/workorders/${workOrderId}`);
    
    console.log('✅ 工单详情获取成功');
    console.log('工单详情:', {
      id: detailResponse.data.workOrder.id,
      title: detailResponse.data.workOrder.title,
      work_types: detailResponse.data.workOrder.work_types,
      install_contents: detailResponse.data.workOrder.install_contents,
      voice_text: detailResponse.data.workOrder.voice_text,
      location_info: detailResponse.data.workOrder.location_info,
      photos: detailResponse.data.workOrder.photos
    });
    
    console.log('\n📸 照片信息:');
    if (detailResponse.data.workOrder.photos && detailResponse.data.workOrder.photos.length > 0) {
      detailResponse.data.workOrder.photos.forEach((photo, index) => {
        console.log(`  照片 ${index + 1}:`, photo.path);
      });
    } else {
      console.log('  未找到照片');
    }
    
    console.log('\n🎉 所有测试通过！小程序照片上传API接口工作正常。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('提示：请确保后端服务器正在运行 (npm run dev)');
    }
  } finally {
    // 清理测试文件
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n🧹 测试文件已清理');
    }
  }
}

// 运行测试
testMiniprogramPhotoAPI();
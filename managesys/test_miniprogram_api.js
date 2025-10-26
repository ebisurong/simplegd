const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// 测试小程序工单提交API
async function testMiniprogramAPI() {
  const baseURL = 'http://localhost:8000';
  
  console.log('开始测试小程序API接口...\n');
  
  // 测试数据
  const testData = {
    title: '测试工单 - 小程序提交',
    description: '这是一个通过小程序API提交的测试工单',
    priority: 'high',
    construction_stage: 'maintenance',
    contact_name: '小程序用户',
    contact_phone: '13800138001',
    project_name: '测试项目',
    location_name: '测试地点',
    gps_latitude: 39.9042,
    gps_longitude: 116.4074,
    work_types: ['电工', '水工'],
    install_contents: ['开关插座', '水龙头'],
    voice_text: '这是语音转文字的测试内容，现场情况良好，可以开始施工。',
    location_info: {
      address: '测试大楼A座1楼',
      floor: 1,
      room: '101'
    }
  };
  
  try {
    // 1. 测试创建工单
    console.log('1. 测试创建工单...');
    const createResponse = await axios.post(`${baseURL}/api/miniprogram/workorders`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 工单创建成功');
    console.log('工单ID:', createResponse.data.workOrder.id);
    console.log('工单标题:', createResponse.data.workOrder.title);
    console.log('工种类型:', createResponse.data.workOrder.work_types);
    console.log('安装内容:', createResponse.data.workOrder.install_contents);
    console.log('语音内容:', createResponse.data.workOrder.voice_text);
    console.log('位置信息:', createResponse.data.workOrder.location_info);
    
    const workOrderId = createResponse.data.workOrder.id;
    
    // 2. 测试获取工单详情
    console.log('\n2. 测试获取工单详情...');
    const detailResponse = await axios.get(`${baseURL}/api/miniprogram/workorders/${workOrderId}`);
    
    console.log('✅ 工单详情获取成功');
    console.log('工单详情:', {
      id: detailResponse.data.workOrder.id,
      title: detailResponse.data.workOrder.title,
      work_types: detailResponse.data.workOrder.work_types,
      install_contents: detailResponse.data.workOrder.install_contents,
      voice_text: detailResponse.data.workOrder.voice_text,
      location_info: detailResponse.data.workOrder.location_info
    });
    
    console.log('\n🎉 所有测试通过！小程序API接口工作正常。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('提示：请确保后端服务器正在运行 (npm run dev)');
    }
  }
}

// 运行测试
testMiniprogramAPI();
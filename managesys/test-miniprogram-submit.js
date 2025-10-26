const axios = require('axios');
const { sequelize, WorkOrder, WorkOrderPhoto } = require('./backend/models');

// 测试小程序工单提交功能
async function testMiniprogramSubmit() {
  console.log('开始测试小程序工单提交功能...\n');

  // 测试数据
  const testData = {
    title: '测试工单 - 电工维修',
    description: '测试小程序提交工单功能',
    priority: 'medium',
    construction_stage: 'equipment',
    contact_name: '小程序测试用户',
    contact_phone: '13800138000',
    project_name: '测试项目',
    location_name: '测试地点',
    gps_latitude: 39.9042,
    gps_longitude: 116.4074,
    work_types: ['电工', '维修'],
    install_contents: ['电线检修', '开关更换'],
    voice_text: '这是语音转文字的测试内容，需要进行电工维修。',
    location_info: {
      address: '北京市朝阳区测试大厦',
      latitude: 39.9042,
      longitude: 116.4074
    }
  };

  try {
    // 1. 查询提交前的工单数量
    const beforeCount = await WorkOrder.count();
    console.log(`提交前数据库工单数量: ${beforeCount}`);

    // 2. 发送POST请求到小程序工单接口
    console.log('正在提交工单到后台API...');
    const response = await axios.post('http://localhost:3001/api/miniprogram/workorders', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));

    // 3. 验证响应格式
    if (response.data.success) {
      console.log('✅ 工单提交成功');
      console.log('工单ID:', response.data.workOrder.id);
      console.log('工单标题:', response.data.workOrder.title);
      console.log('工单状态:', response.data.workOrder.status);
    } else {
      console.log('❌ 工单提交失败:', response.data.message);
      return;
    }

    // 4. 查询提交后的工单数量
    const afterCount = await WorkOrder.count();
    console.log(`提交后数据库工单数量: ${afterCount}`);

    if (afterCount > beforeCount) {
      console.log('✅ 数据库工单数量增加，数据保存成功');
    } else {
      console.log('❌ 数据库工单数量未增加，数据保存失败');
    }

    // 5. 查询刚创建的工单详情
    const workOrderId = response.data.workOrder.id;
    const savedWorkOrder = await WorkOrder.findByPk(workOrderId, {
      include: [
        {
          model: WorkOrderPhoto,
          as: 'photos'
        }
      ]
    });

    if (savedWorkOrder) {
      console.log('\n✅ 数据库中的工单详情:');
      console.log('ID:', savedWorkOrder.id);
      console.log('标题:', savedWorkOrder.title);
      console.log('描述:', savedWorkOrder.description);
      console.log('优先级:', savedWorkOrder.priority);
      console.log('施工阶段:', savedWorkOrder.construction_stage);
      console.log('联系人:', savedWorkOrder.contact_name);
      console.log('联系电话:', savedWorkOrder.contact_phone);
      console.log('项目名称:', savedWorkOrder.project_name);
      console.log('位置名称:', savedWorkOrder.location_name);
      console.log('GPS纬度:', savedWorkOrder.gps_latitude);
      console.log('GPS经度:', savedWorkOrder.gps_longitude);
      console.log('工种类型:', savedWorkOrder.work_types);
      console.log('安装内容:', savedWorkOrder.install_contents);
      console.log('语音文字:', savedWorkOrder.voice_text);
      console.log('位置信息:', savedWorkOrder.location_info);
      console.log('状态:', savedWorkOrder.status);
      console.log('创建时间:', savedWorkOrder.created_at);
      console.log('照片数量:', savedWorkOrder.photos ? savedWorkOrder.photos.length : 0);
    } else {
      console.log('❌ 无法在数据库中找到刚创建的工单');
    }

    // 6. 测试获取工单详情接口
    console.log('\n测试获取工单详情接口...');
    const detailResponse = await axios.get(`http://localhost:3001/api/miniprogram/workorders/${workOrderId}`);
    
    if (detailResponse.data.success) {
      console.log('✅ 工单详情获取成功');
      console.log('详情数据:', JSON.stringify(detailResponse.data.workOrder, null, 2));
    } else {
      console.log('❌ 工单详情获取失败:', detailResponse.data.message);
    }

    console.log('\n🎉 端到端测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:');
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
      console.error('错误响应:', error.response.data);
    } else if (error.request) {
      console.error('网络请求失败:', error.message);
    } else {
      console.error('其他错误:', error.message);
    }
  }
}

// 运行测试
testMiniprogramSubmit().then(() => {
  console.log('测试脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});
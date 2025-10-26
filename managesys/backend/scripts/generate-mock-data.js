const { sequelize, WorkOrder, User } = require('../models');

// 工单标题模板
const titleTemplates = [
  // 设备故障类
  '电梯故障紧急维修',
  '空调系统异常处理',
  '消防设备检修',
  '供水管道漏水维修',
  '电力系统故障排查',
  '监控设备失效处理',
  '门禁系统故障维修',
  '照明设备更换',
  '通风系统清洁维护',
  '网络设备故障处理',
  
  // 维修保养类
  '外墙清洗保养',
  '屋顶防水检查',
  '地面瓷砖修补',
  '墙面粉刷翻新',
  '门窗密封条更换',
  '楼梯扶手维护',
  '停车场地坪修复',
  '绿化带修剪维护',
  '排水沟清理疏通',
  '玻璃幕墙清洁',
  
  // 安装调试类
  '新设备安装调试',
  '智能化系统升级',
  '安防监控扩容',
  '网络布线施工',
  'LED显示屏安装',
  '充电桩设备安装',
  '新风系统安装',
  '太阳能设备安装',
  '自动化控制系统调试',
  '弱电系统集成',
  
  // 质量问题类
  '混凝土裂缝处理',
  '钢结构焊接质量检查',
  '防水层渗漏处理',
  '保温材料脱落修复',
  '装饰面层质量整改',
  '管道接头渗漏处理',
  '电气线路安全检查',
  '结构变形监测',
  '材料质量复检',
  '施工工艺改进'
];

// 描述模板
const descriptionTemplates = [
  '设备运行异常，需要专业技术人员进行检查和维修，确保正常运行。',
  '根据维护计划，需要对相关设施进行定期保养和检查，预防潜在问题。',
  '施工过程中发现质量问题，需要立即整改处理，确保工程质量达标。',
  '用户反馈使用过程中出现问题，需要及时响应和处理，提升用户满意度。',
  '按照安全规范要求，需要对相关设备进行安全检查和维护。',
  '新设备需要进行安装调试，确保各项功能正常运行。',
  '系统升级改造项目，需要专业团队进行技术支持和实施。',
  '环境因素影响设备正常运行，需要采取相应的防护和维护措施。',
  '定期巡检发现的问题，需要及时处理以避免影响正常使用。',
  '根据用户需求进行功能优化和改进，提升使用体验。'
];

// 联系人姓名
const contactNames = [
  '张伟', '李娜', '王强', '刘敏', '陈杰', '杨静', '赵磊', '孙丽',
  '周涛', '吴艳', '徐鹏', '朱红', '胡斌', '郭芳', '林峰', '何玲',
  '高军', '梁雪', '宋亮', '唐美', '韩冰', '冯超', '于洋', '董娟',
  '袁刚', '蒋莉', '贾伟', '薛敏', '雷鸣', '方丽', '石磊', '龙飞',
  '叶青', '程浩', '卢静', '崔强', '潘红', '谢军', '傅雪', '沈亮'
];

// 手机号前缀
const phonePrefix = ['138', '139', '150', '151', '152', '155', '156', '157', '158', '159', '186', '187', '188', '189'];

// 项目名称
const projectNames = [
  // 住宅项目
  '绿城·桂花园住宅小区', '万科·翡翠公园', '保利·海德公馆', '碧桂园·凤凰城',
  '恒大·御景湾', '融创·壹号院', '龙湖·春江彼岸', '华润·橡树湾',
  
  // 商业项目
  '万达广场购物中心', '银泰城商业综合体', '华润万象城', '凯德MALL',
  '大悦城购物中心', '正大广场', '来福士广场', '环球港商业中心',
  
  // 办公项目
  '中信大厦写字楼', '平安国际金融中心', '招商局大厦', '腾讯滨海大厦',
  '阿里巴巴西溪园区', '百度科技园', '华为研发中心', '京东总部大楼',
  
  // 工业项目
  '富士康科技园区', '比亚迪生产基地', '中石化炼化一体化', '宝钢钢铁厂区',
  '三一重工产业园', '格力电器制造基地', '美的智能工厂', '海尔工业园',
  
  // 基础设施
  '地铁2号线工程', '高速公路扩建项目', '污水处理厂升级', '垃圾焚烧发电厂',
  '智慧城市数据中心', '5G基站建设项目', '新能源充电站', '城市综合管廊'
];

// 地点名称
const locationNames = [
  // 一线城市
  '北京市朝阳区CBD核心区', '上海市浦东新区陆家嘴', '广州市天河区珠江新城', '深圳市南山区科技园',
  '北京市海淀区中关村', '上海市徐汇区徐家汇', '广州市越秀区北京路', '深圳市福田区华强北',
  
  // 二线城市
  '杭州市西湖区文三路', '南京市鼓楼区新街口', '成都市锦江区春熙路', '武汉市江汉区汉口',
  '西安市雁塔区高新区', '重庆市渝中区解放碑', '天津市和平区南京路', '苏州市工业园区',
  
  // 三线城市
  '合肥市蜀山区政务区', '福州市鼓楼区五四路', '济南市历下区泉城路', '长沙市岳麓区梅溪湖',
  '郑州市金水区郑东新区', '昆明市五华区翠湖', '南昌市红谷滩新区', '石家庄市长安区',
  
  // 开发区/新区
  '上海自贸区临港新片区', '深圳前海合作区', '广州南沙新区', '天津滨海新区',
  '青岛西海岸新区', '大连金普新区', '厦门自贸区', '珠海横琴新区'
];

// GPS坐标范围（中国境内）
const gpsRanges = {
  // 北京
  beijing: { lat: [39.4, 40.4], lng: [115.7, 117.4] },
  // 上海
  shanghai: { lat: [30.7, 31.9], lng: [120.9, 122.1] },
  // 广州
  guangzhou: { lat: [22.5, 23.9], lng: [112.9, 114.5] },
  // 深圳
  shenzhen: { lat: [22.4, 22.8], lng: [113.7, 114.6] },
  // 杭州
  hangzhou: { lat: [29.8, 30.6], lng: [119.7, 120.9] },
  // 成都
  chengdu: { lat: [30.1, 31.4], lng: [103.4, 104.9] }
};

// 生成随机数据的辅助函数
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhoneNumber() {
  const prefix = getRandomElement(phonePrefix);
  const suffix = String(getRandomInt(10000000, 99999999));
  return prefix + suffix;
}

function generateGPS() {
  const cities = Object.keys(gpsRanges);
  const city = getRandomElement(cities);
  const range = gpsRanges[city];
  
  return {
    latitude: getRandomNumber(range.lat[0], range.lat[1]),
    longitude: getRandomNumber(range.lng[0], range.lng[1])
  };
}

function generateRandomDate() {
  // 最近3个月内的随机时间
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

function getPriorityByDistribution() {
  const rand = Math.random();
  if (rand < 0.1) return 'urgent';      // 10%
  if (rand < 0.3) return 'high';       // 20%
  if (rand < 0.8) return 'medium';     // 50%
  return 'low';                         // 20%
}

function getStatusByDistribution() {
  const rand = Math.random();
  if (rand < 0.3) return 'pending';     // 30%
  if (rand < 0.7) return 'processing';  // 40%
  if (rand < 0.95) return 'completed';  // 25%
  return 'closed';                       // 5%
}

// 生成工单数据
function generateWorkOrderData(userIds) {
  const gps = generateGPS();
  const createdAt = generateRandomDate();
  
  return {
    title: getRandomElement(titleTemplates),
    description: getRandomElement(descriptionTemplates),
    priority: getPriorityByDistribution(),
    construction_stage: getRandomElement(['preparation', 'foundation', 'structure', 'decoration', 'equipment', 'completion']),
    status: getStatusByDistribution(),
    contact_name: getRandomElement(contactNames),
    contact_phone: generatePhoneNumber(),
    project_name: getRandomElement(projectNames),
    location_name: getRandomElement(locationNames),
    gps_latitude: gps.latitude,
    gps_longitude: gps.longitude,
    submitter_id: getRandomElement(userIds),
    assignee_id: Math.random() > 0.3 ? getRandomElement(userIds) : null, // 70%的工单有分配人
    created_at: createdAt,
    updated_at: createdAt
  };
}

// 主函数
async function generateMockData() {
  try {
    console.log('开始生成200条工单模拟数据...');
    
    // 检查用户表中的数据
    const users = await User.findAll({ attributes: ['id'] });
    const userIds = users.map(user => user.id);
    
    if (userIds.length === 0) {
      console.log('⚠️  用户表中没有数据，将创建一些测试用户...');
      // 创建一些测试用户
      const testUsers = [];
      for (let i = 1; i <= 10; i++) {
        testUsers.push({
          username: `user${i}`,
          password: 'password123',
          email: `user${i}@example.com`,
          real_name: `测试用户${i}`,
          role: i <= 2 ? 'admin' : (i <= 5 ? 'manager' : 'user'),
          status: 'active'
        });
      }
      await User.bulkCreate(testUsers);
      console.log('✅ 已创建10个测试用户');
      
      // 重新获取用户ID
      const newUsers = await User.findAll({ attributes: ['id'] });
      userIds.push(...newUsers.map(user => user.id));
    }
    
    console.log(`📋 找到 ${userIds.length} 个用户，ID范围: ${Math.min(...userIds)} - ${Math.max(...userIds)}`);
    
    // 生成200条数据
    const workOrders = [];
    for (let i = 0; i < 200; i++) {
      workOrders.push(generateWorkOrderData(userIds));
    }
    
    // 批量插入数据库
    await WorkOrder.bulkCreate(workOrders);
    
    console.log('✅ 成功生成并插入200条工单数据');
    
    // 统计信息
    const stats = {
      total: workOrders.length,
      priority: {
        urgent: workOrders.filter(w => w.priority === 'urgent').length,
        high: workOrders.filter(w => w.priority === 'high').length,
        medium: workOrders.filter(w => w.priority === 'medium').length,
        low: workOrders.filter(w => w.priority === 'low').length
      },
      status: {
        pending: workOrders.filter(w => w.status === 'pending').length,
        processing: workOrders.filter(w => w.status === 'processing').length,
        completed: workOrders.filter(w => w.status === 'completed').length,
        closed: workOrders.filter(w => w.status === 'closed').length
      },
      construction_stage: {
        preparation: workOrders.filter(w => w.construction_stage === 'preparation').length,
        foundation: workOrders.filter(w => w.construction_stage === 'foundation').length,
        structure: workOrders.filter(w => w.construction_stage === 'structure').length,
        decoration: workOrders.filter(w => w.construction_stage === 'decoration').length,
        equipment: workOrders.filter(w => w.construction_stage === 'equipment').length,
        completion: workOrders.filter(w => w.construction_stage === 'completion').length
      }
    };
    
    console.log('\n📊 数据统计信息:');
    console.log(`总计: ${stats.total} 条`);
    console.log('\n优先级分布:');
    console.log(`  紧急: ${stats.priority.urgent} 条 (${(stats.priority.urgent/stats.total*100).toFixed(1)}%)`);
    console.log(`  高: ${stats.priority.high} 条 (${(stats.priority.high/stats.total*100).toFixed(1)}%)`);
    console.log(`  中: ${stats.priority.medium} 条 (${(stats.priority.medium/stats.total*100).toFixed(1)}%)`);
    console.log(`  低: ${stats.priority.low} 条 (${(stats.priority.low/stats.total*100).toFixed(1)}%)`);
    
    console.log('\n状态分布:');
    console.log(`  待处理: ${stats.status.pending} 条 (${(stats.status.pending/stats.total*100).toFixed(1)}%)`);
    console.log(`  处理中: ${stats.status.processing} 条 (${(stats.status.processing/stats.total*100).toFixed(1)}%)`);
    console.log(`  已完成: ${stats.status.completed} 条 (${(stats.status.completed/stats.total*100).toFixed(1)}%)`);
    console.log(`  已关闭: ${stats.status.closed} 条 (${(stats.status.closed/stats.total*100).toFixed(1)}%)`);
    
    console.log('\n施工阶段分布:');
    console.log(`  前期准备: ${stats.construction_stage.preparation} 条`);
    console.log(`  基础施工: ${stats.construction_stage.foundation} 条`);
    console.log(`  主体结构: ${stats.construction_stage.structure} 条`);
    console.log(`  装饰装修: ${stats.construction_stage.decoration} 条`);
    console.log(`  设备安装: ${stats.construction_stage.equipment} 条`);
    console.log(`  竣工验收: ${stats.construction_stage.completion} 条`);
    
  } catch (error) {
    console.error('❌ 生成数据时出错:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 运行脚本
if (require.main === module) {
  generateMockData();
}

module.exports = { generateMockData };
const { sequelize, User, WorkOrder, WorkOrderPhoto, WorkOrderLog, SystemConfig } = require('../models');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');

    // 同步数据库表结构
    await sequelize.sync({ force: true });
    console.log('数据库表结构同步完成');

    // 创建默认管理员用户
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      real_name: '系统管理员',
      role: 'admin',
      status: 'active',
    });
    console.log('默认管理员用户创建完成: admin/admin123');

    // 创建测试用户
    const testUser = await User.create({
      username: 'testuser',
      password: 'user123',
      email: 'user@example.com',
      real_name: '测试用户',
      role: 'user',
      status: 'active',
    });
    console.log('测试用户创建完成: testuser/user123');

    // 创建管理员用户
    const manager = await User.create({
      username: 'manager',
      password: 'manager123',
      email: 'manager@example.com',
      real_name: '项目经理',
      role: 'manager',
      status: 'active',
    });
    console.log('项目经理用户创建完成: manager/manager123');

    // 创建示例工单
    const sampleWorkOrders = [
      {
        title: '基础施工质量检查',
        description: '检查基础混凝土浇筑质量，确保符合设计要求和施工规范。',
        priority: 'high',
        construction_stage: 'foundation',
        status: 'pending',
        contact_name: '张工',
        contact_phone: '13800138001',
        project_name: '办公楼A栋',
        location_name: '北京市朝阳区建国路88号',
        submitter_id: testUser.id,
        assignee_id: manager.id,
      },
      {
        title: '钢结构安装进度检查',
        description: '检查钢结构安装进度和质量，确保按计划完成。',
        priority: 'medium',
        construction_stage: 'structure',
        status: 'processing',
        contact_name: '李工',
        contact_phone: '13800138002',
        project_name: '商业综合体B区',
        location_name: '上海市浦东新区陆家嘴金融区',
        submitter_id: testUser.id,
        assignee_id: manager.id,
      },
      {
        title: '装修材料验收',
        description: '对进场的装修材料进行质量验收，包括瓷砖、涂料、木材等。',
        priority: 'medium',
        construction_stage: 'decoration',
        status: 'completed',
        contact_name: '王工',
        contact_phone: '13800138003',
        project_name: '住宅小区C栋',
        location_name: '广州市天河区珠江新城',
        submitter_id: testUser.id,
        assignee_id: manager.id,
      },
      {
        title: '设备安装调试',
        description: '对新安装的空调设备进行调试，确保正常运行。',
        priority: 'urgent',
        construction_stage: 'equipment',
        status: 'pending',
        contact_name: '赵工',
        contact_phone: '13800138004',
        project_name: '医院综合楼',
        location_name: '深圳市南山区科技园',
        submitter_id: testUser.id,
      },
      {
        title: '施工准备工作检查',
        description: '检查施工现场准备工作，包括材料到位、人员配备、安全措施等。',
        priority: 'low',
        construction_stage: 'preparation',
        status: 'pending',
        contact_name: '孙工',
        contact_phone: '13800138005',
        project_name: '工厂厂房D区',
        location_name: '苏州市工业园区',
        submitter_id: testUser.id,
      },
    ];

    for (const workOrderData of sampleWorkOrders) {
      await WorkOrder.create(workOrderData);
    }
    console.log('示例工单创建完成');

    // 创建系统配置
    const systemConfigs = [
      {
        config_key: 'system_name',
        config_value: '工单管理系统',
        description: '系统名称',
      },
      {
        config_key: 'system_version',
        config_value: '1.0.0',
        description: '系统版本',
      },
      {
        config_key: 'max_file_size',
        config_value: '10485760',
        description: '最大文件上传大小（字节）',
      },
      {
        config_key: 'allowed_file_types',
        config_value: 'jpg,jpeg,png,gif,pdf,doc,docx',
        description: '允许上传的文件类型',
      },
      {
        config_key: 'public_system_name',
        config_value: '工单管理系统',
        description: '公开的系统名称',
      },
      {
        config_key: 'public_contact_email',
        config_value: 'support@example.com',
        description: '公开的联系邮箱',
      },
    ];

    for (const configData of systemConfigs) {
      await SystemConfig.create(configData);
    }
    console.log('系统配置创建完成');

    console.log('\n数据库初始化完成！');
    console.log('\n默认用户账号:');
    console.log('管理员: admin / admin123');
    console.log('项目经理: manager / manager123');
    console.log('普通用户: testuser / user123');
    console.log('\n可以使用这些账号登录系统进行测试。');

  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
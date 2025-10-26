// 测试前端API连接
const http = require('http');

// 创建HTTP请求函数
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '192.168.0.104',
      port: 8000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('=== 测试前端API连接 ===');
  
  try {
    console.log('1. 测试工单列表API...');
    const response = await makeRequest('/work-orders?page=1&limit=5');
    console.log('✅ 工单列表API成功');
    console.log('响应状态:', response.status);
    console.log('数据条数:', response.data.rows ? response.data.rows.length : 'unknown');
    console.log('总数:', response.data.count || response.data.total || 'unknown');
    
    if (response.data.rows && response.data.rows.length > 0) {
      console.log('第一条工单:', {
        id: response.data.rows[0].id,
        title: response.data.rows[0].title,
        status: response.data.rows[0].status
      });
    }
    
  } catch (error) {
    console.error('❌ 工单列表API失败');
    console.error('错误信息:', error.message);
  }
  
  try {
    console.log('\n2. 测试登录API...');
    const loginResponse = await makeRequest('/auth/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ 登录API成功');
    console.log('响应状态:', loginResponse.status);
    console.log('用户信息:', loginResponse.data.user);
    
  } catch (error) {
    console.error('❌ 登录API失败');
    console.error('错误信息:', error.message);
  }
}

testAPI();
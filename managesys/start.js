#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出函数
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查Node.js版本
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log('❌ 需要 Node.js 16 或更高版本', 'red');
    log(`当前版本: ${nodeVersion}`, 'yellow');
    process.exit(1);
  }
  
  log(`✅ Node.js 版本检查通过: ${nodeVersion}`, 'green');
}

// 检查依赖是否已安装
function checkDependencies() {
  const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  
  if (!fs.existsSync(frontendNodeModules)) {
    log('❌ 前端依赖未安装，请先运行: cd frontend && npm install', 'red');
    return false;
  }
  
  if (!fs.existsSync(backendNodeModules)) {
    log('❌ 后端依赖未安装，请先运行: cd backend && npm install', 'red');
    return false;
  }
  
  log('✅ 依赖检查通过', 'green');
  return true;
}

// 检查数据库是否已初始化
function checkDatabase() {
  const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
  return fs.existsSync(dbPath);
}

// 初始化数据库
function initDatabase() {
  return new Promise((resolve, reject) => {
    log('🔄 正在初始化数据库...', 'yellow');
    
    const initProcess = spawn('npm', ['run', 'init-db'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit'
    });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        log('✅ 数据库初始化完成', 'green');
        resolve();
      } else {
        log('❌ 数据库初始化失败', 'red');
        reject(new Error('数据库初始化失败'));
      }
    });
  });
}

// 启动后端服务
function startBackend() {
  log('🚀 启动后端服务...', 'blue');
  
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'pipe'
  });
  
  backendProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`[后端] ${message}`, 'blue');
    }
  });
  
  backendProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`[后端错误] ${message}`, 'red');
    }
  });
  
  return backendProcess;
}

// 启动前端服务
function startFrontend() {
  // 等待后端启动
  setTimeout(() => {
    log('🚀 启动前端服务...', 'cyan');
    
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe'
    });
    
    frontendProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[前端] ${message}`, 'cyan');
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[前端错误] ${message}`, 'red');
      }
    });
    
    return frontendProcess;
  }, 3000);
}

// 主函数
async function main() {
  log('🎯 工单管理系统启动器', 'magenta');
  log('================================', 'magenta');
  
  try {
    // 检查环境
    checkNodeVersion();
    
    if (!checkDependencies()) {
      process.exit(1);
    }
    
    // 检查并初始化数据库
    if (!checkDatabase()) {
      log('📦 数据库未初始化，开始初始化...', 'yellow');
      await initDatabase();
    } else {
      log('✅ 数据库已存在', 'green');
    }
    
    // 启动服务
    const backendProcess = startBackend();
    const frontendProcess = startFrontend();
    
    // 显示访问信息
    setTimeout(() => {
      log('\n🎉 系统启动完成！', 'green');
      log('================================', 'green');
      log('📱 前端地址: http://localhost:3000', 'cyan');
      log('🔧 后端地址: http://localhost:5000', 'blue');
      log('📊 API文档: http://localhost:5000/health', 'yellow');
      log('\n默认登录账号:', 'magenta');
      log('管理员: admin / admin123', 'magenta');
      log('项目经理: manager / manager123', 'magenta');
      log('普通用户: testuser / user123', 'magenta');
      log('\n按 Ctrl+C 停止服务', 'yellow');
      log('================================', 'green');
    }, 5000);
    
    // 处理退出信号
    process.on('SIGINT', () => {
      log('\n🛑 正在停止服务...', 'yellow');
      
      if (backendProcess) {
        backendProcess.kill('SIGTERM');
      }
      
      if (frontendProcess) {
        frontendProcess.kill('SIGTERM');
      }
      
      setTimeout(() => {
        log('👋 服务已停止', 'green');
        process.exit(0);
      }, 1000);
    });
    
  } catch (error) {
    log(`❌ 启动失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = main;
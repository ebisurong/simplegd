<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>工单管理系统</h2>
        <p>请登录您的账户</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>测试账户：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  console.log('=== 前端登录开始 ===');
  console.log('登录表单数据:', loginForm);
  
  if (!loginFormRef.value) {
    console.log('登录表单引用不存在');
    return;
  }
  
  try {
    console.log('开始表单验证');
    const valid = await loginFormRef.value.validate();
    console.log('表单验证结果:', valid);
    if (!valid) return;
    
    loading.value = true;
    console.log('开始调用登录API，发送数据:', loginForm);
    const result = await userStore.login(loginForm);
    console.log('登录API返回结果:', result);
    
    if (result.success) {
      console.log('登录成功，准备跳转到dashboard');
      ElMessage.success('登录成功');
      router.push('/dashboard');
    } else {
      console.log('登录失败，错误信息:', result.message);
      ElMessage.error(result.message || '登录失败');
    }
  } catch (error) {
    console.error('登录过程中发生异常:', error);
    ElMessage.error('登录失败，请检查网络连接');
  } finally {
    loading.value = false;
    console.log('=== 前端登录结束 ===');
  }
}

// 页面加载时清除可能存在的登录状态
onMounted(() => {
  userStore.logout()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 500px;
  min-width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-footer p {
  color: #999;
  font-size: 12px;
  margin: 0;
}

/* 平板设备 */
@media (max-width: 768px) {
  .login-box {
    max-width: 450px;
    padding: 35px 25px;
  }
}

/* 手机设备 */
@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }
  
  .login-box {
    max-width: 100%;
    padding: 30px 20px;
    margin: 0 10px;
  }
  
  .login-header h2 {
    font-size: 20px;
  }
  
  .login-button {
    height: 48px;
  }
}

/* 大屏幕设备 */
@media (min-width: 1200px) {
  .login-box {
    max-width: 550px;
    padding: 50px;
  }
  
  .login-header h2 {
    font-size: 28px;
  }
}
</style>
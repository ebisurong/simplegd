<template>
  <div class="settings">
    <div class="page-header">
      <h1>系统设置</h1>
      <p>管理系统配置和参数</p>
    </div>
    
    <div class="settings-container">
      <!-- 设置导航 -->
      <div class="settings-nav">
        <el-menu
          :default-active="activeTab"
          mode="vertical"
          @select="handleTabChange"
          class="nav-menu"
        >
          <el-menu-item index="basic">
            <el-icon><Setting /></el-icon>
            <span>基本设置</span>
          </el-menu-item>
          <el-menu-item index="notification">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          <el-menu-item index="security">
            <el-icon><Lock /></el-icon>
            <span>安全设置</span>
          </el-menu-item>
          <el-menu-item index="system">
            <el-icon><Monitor /></el-icon>
            <span>系统参数</span>
          </el-menu-item>
        </el-menu>
      </div>
      
      <!-- 设置内容 -->
      <div class="settings-content">
        <!-- 基本设置 -->
        <el-card v-show="activeTab === 'basic'" class="setting-card" shadow="never">
          <template #header>
            <span>基本设置</span>
          </template>
          
          <el-form
            :model="basicSettings"
            :rules="basicRules"
            ref="basicFormRef"
            label-width="120px"
          >
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="basicSettings.systemName" style="width: 300px" />
            </el-form-item>
            <el-form-item label="系统描述" prop="systemDescription">
              <el-input
                v-model="basicSettings.systemDescription"
                type="textarea"
                :rows="3"
                style="width: 400px"
              />
            </el-form-item>
            <el-form-item label="系统Logo" prop="systemLogo">
              <el-upload
                class="logo-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeLogoUpload"
                :http-request="handleLogoUpload"
              >
                <img v-if="basicSettings.systemLogo" :src="basicSettings.systemLogo" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="时区设置" prop="timezone">
              <el-select v-model="basicSettings.timezone" style="width: 300px">
                <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
                <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
              </el-select>
            </el-form-item>
            <el-form-item label="语言设置" prop="language">
              <el-select v-model="basicSettings.language" style="width: 300px">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
                <el-option label="日本語" value="ja-JP" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
              <el-button @click="resetBasicSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 通知设置 -->
        <el-card v-show="activeTab === 'notification'" class="setting-card" shadow="never">
          <template #header>
            <span>通知设置</span>
          </template>
          
          <el-form
            :model="notificationSettings"
            :rules="notificationRules"
            ref="notificationFormRef"
            label-width="120px"
          >
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationSettings.emailEnabled" />
              <span class="setting-desc">启用邮件通知功能</span>
            </el-form-item>
            
            <div v-if="notificationSettings.emailEnabled" class="sub-settings">
              <el-form-item label="SMTP服务器" prop="smtpHost">
                <el-input v-model="notificationSettings.smtpHost" style="width: 300px" />
              </el-form-item>
              <el-form-item label="SMTP端口" prop="smtpPort">
                <el-input-number v-model="notificationSettings.smtpPort" :min="1" :max="65535" />
              </el-form-item>
              <el-form-item label="发件人邮箱" prop="senderEmail">
                <el-input v-model="notificationSettings.senderEmail" style="width: 300px" />
              </el-form-item>
              <el-form-item label="邮箱密码" prop="senderPassword">
                <el-input v-model="notificationSettings.senderPassword" type="password" show-password style="width: 300px" />
              </el-form-item>
            </div>
            
            <el-form-item label="短信通知">
              <el-switch v-model="notificationSettings.smsEnabled" />
              <span class="setting-desc">启用短信通知功能</span>
            </el-form-item>
            
            <div v-if="notificationSettings.smsEnabled" class="sub-settings">
              <el-form-item label="短信服务商" prop="smsProvider">
                <el-select v-model="notificationSettings.smsProvider" style="width: 300px">
                  <el-option label="阿里云" value="aliyun" />
                  <el-option label="腾讯云" value="tencent" />
                  <el-option label="华为云" value="huawei" />
                </el-select>
              </el-form-item>
              <el-form-item label="AccessKey" prop="smsAccessKey">
                <el-input v-model="notificationSettings.smsAccessKey" style="width: 300px" />
              </el-form-item>
              <el-form-item label="SecretKey" prop="smsSecretKey">
                <el-input v-model="notificationSettings.smsSecretKey" type="password" show-password style="width: 300px" />
              </el-form-item>
            </div>
            
            <el-form-item label="通知场景">
              <el-checkbox-group v-model="notificationSettings.scenarios">
                <el-checkbox label="workorder_created">工单创建</el-checkbox>
                <el-checkbox label="workorder_assigned">工单分配</el-checkbox>
                <el-checkbox label="workorder_completed">工单完成</el-checkbox>
                <el-checkbox label="user_login">用户登录</el-checkbox>
                <el-checkbox label="system_error">系统错误</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
              <el-button @click="resetNotificationSettings">重置</el-button>
              <el-button @click="testNotification">测试通知</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 安全设置 -->
        <el-card v-show="activeTab === 'security'" class="setting-card" shadow="never">
          <template #header>
            <span>安全设置</span>
          </template>
          
          <el-form
            :model="securitySettings"
            :rules="securityRules"
            ref="securityFormRef"
            label-width="120px"
          >
            <el-form-item label="密码策略">
              <el-switch v-model="securitySettings.passwordPolicyEnabled" />
              <span class="setting-desc">启用密码复杂度要求</span>
            </el-form-item>
            
            <div v-if="securitySettings.passwordPolicyEnabled" class="sub-settings">
              <el-form-item label="最小长度" prop="minPasswordLength">
                <el-input-number v-model="securitySettings.minPasswordLength" :min="6" :max="20" />
              </el-form-item>
              <el-form-item label="密码要求">
                <el-checkbox-group v-model="securitySettings.passwordRequirements">
                  <el-checkbox label="uppercase">包含大写字母</el-checkbox>
                  <el-checkbox label="lowercase">包含小写字母</el-checkbox>
                  <el-checkbox label="number">包含数字</el-checkbox>
                  <el-checkbox label="special">包含特殊字符</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </div>
            
            <el-form-item label="登录限制">
              <el-switch v-model="securitySettings.loginLimitEnabled" />
              <span class="setting-desc">启用登录失败次数限制</span>
            </el-form-item>
            
            <div v-if="securitySettings.loginLimitEnabled" class="sub-settings">
              <el-form-item label="最大失败次数" prop="maxLoginAttempts">
                <el-input-number v-model="securitySettings.maxLoginAttempts" :min="3" :max="10" />
              </el-form-item>
              <el-form-item label="锁定时间(分钟)" prop="lockoutDuration">
                <el-input-number v-model="securitySettings.lockoutDuration" :min="5" :max="60" />
              </el-form-item>
            </div>
            
            <el-form-item label="会话超时">
              <el-switch v-model="securitySettings.sessionTimeoutEnabled" />
              <span class="setting-desc">启用会话超时自动登出</span>
            </el-form-item>
            
            <div v-if="securitySettings.sessionTimeoutEnabled" class="sub-settings">
              <el-form-item label="超时时间(分钟)" prop="sessionTimeout">
                <el-input-number v-model="securitySettings.sessionTimeout" :min="15" :max="480" />
              </el-form-item>
            </div>
            
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
              <el-button @click="resetSecuritySettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 系统参数 -->
        <el-card v-show="activeTab === 'system'" class="setting-card" shadow="never">
          <template #header>
            <span>系统参数</span>
          </template>
          
          <el-form
            :model="systemSettings"
            :rules="systemRules"
            ref="systemFormRef"
            label-width="120px"
          >
            <el-form-item label="文件上传">
              <el-form-item label="最大文件大小" prop="maxFileSize">
                <el-input-number v-model="systemSettings.maxFileSize" :min="1" :max="100" />
                <span class="unit">MB</span>
              </el-form-item>
              <el-form-item label="允许的文件类型" prop="allowedFileTypes">
                <el-input v-model="systemSettings.allowedFileTypes" style="width: 400px" placeholder="如：jpg,png,pdf,doc" />
              </el-form-item>
            </el-form-item>
            
            <el-form-item label="数据备份">
              <el-switch v-model="systemSettings.autoBackupEnabled" />
              <span class="setting-desc">启用自动数据备份</span>
            </el-form-item>
            
            <div v-if="systemSettings.autoBackupEnabled" class="sub-settings">
              <el-form-item label="备份频率" prop="backupFrequency">
                <el-select v-model="systemSettings.backupFrequency" style="width: 200px">
                  <el-option label="每天" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </el-form-item>
              <el-form-item label="备份时间" prop="backupTime">
                <el-time-picker v-model="systemSettings.backupTime" format="HH:mm" />
              </el-form-item>
              <el-form-item label="保留天数" prop="backupRetentionDays">
                <el-input-number v-model="systemSettings.backupRetentionDays" :min="7" :max="365" />
              </el-form-item>
            </div>
            
            <el-form-item label="系统维护">
              <el-switch v-model="systemSettings.maintenanceModeEnabled" />
              <span class="setting-desc">启用维护模式</span>
            </el-form-item>
            
            <div v-if="systemSettings.maintenanceModeEnabled" class="sub-settings">
              <el-form-item label="维护提示" prop="maintenanceMessage">
                <el-input
                  v-model="systemSettings.maintenanceMessage"
                  type="textarea"
                  :rows="3"
                  style="width: 400px"
                />
              </el-form-item>
            </div>
            
            <el-form-item>
              <el-button type="primary" @click="saveSystemSettings">保存设置</el-button>
              <el-button @click="resetSystemSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Bell, Lock, Monitor, Plus } from '@element-plus/icons-vue'
import { settingsAPI } from '../api/services'

const activeTab = ref('basic')

// 表单引用
const basicFormRef = ref()
const notificationFormRef = ref()
const securityFormRef = ref()
const systemFormRef = ref()

// 基本设置
const basicSettings = reactive({
  systemName: '工单管理系统',
  systemDescription: '专业的工单管理和跟踪系统',
  systemLogo: '',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN'
})

const basicRules = {
  systemName: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  systemDescription: [{ required: true, message: '请输入系统描述', trigger: 'blur' }],
  timezone: [{ required: true, message: '请选择时区', trigger: 'change' }],
  language: [{ required: true, message: '请选择语言', trigger: 'change' }]
}

// 通知设置
const notificationSettings = reactive({
  emailEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  senderEmail: '',
  senderPassword: '',
  smsEnabled: false,
  smsProvider: 'aliyun',
  smsAccessKey: '',
  smsSecretKey: '',
  scenarios: ['workorder_created', 'workorder_assigned']
})

const notificationRules = {
  smtpHost: [{ required: true, message: '请输入SMTP服务器', trigger: 'blur' }],
  smtpPort: [{ required: true, message: '请输入SMTP端口', trigger: 'blur' }],
  senderEmail: [
    { required: true, message: '请输入发件人邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  senderPassword: [{ required: true, message: '请输入邮箱密码', trigger: 'blur' }],
  smsProvider: [{ required: true, message: '请选择短信服务商', trigger: 'change' }],
  smsAccessKey: [{ required: true, message: '请输入AccessKey', trigger: 'blur' }],
  smsSecretKey: [{ required: true, message: '请输入SecretKey', trigger: 'blur' }]
}

// 安全设置
const securitySettings = reactive({
  passwordPolicyEnabled: true,
  minPasswordLength: 8,
  passwordRequirements: ['lowercase', 'number'],
  loginLimitEnabled: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  sessionTimeoutEnabled: true,
  sessionTimeout: 120
})

const securityRules = {
  minPasswordLength: [{ required: true, message: '请设置最小密码长度', trigger: 'blur' }],
  maxLoginAttempts: [{ required: true, message: '请设置最大失败次数', trigger: 'blur' }],
  lockoutDuration: [{ required: true, message: '请设置锁定时间', trigger: 'blur' }],
  sessionTimeout: [{ required: true, message: '请设置会话超时时间', trigger: 'blur' }]
}

// 系统参数
const systemSettings = reactive({
  maxFileSize: 10,
  allowedFileTypes: 'jpg,png,gif,pdf,doc,docx,xls,xlsx',
  autoBackupEnabled: true,
  backupFrequency: 'daily',
  backupTime: new Date(),
  backupRetentionDays: 30,
  maintenanceModeEnabled: false,
  maintenanceMessage: '系统正在维护中，请稍后再试。'
})

const systemRules = {
  maxFileSize: [{ required: true, message: '请设置最大文件大小', trigger: 'blur' }],
  allowedFileTypes: [{ required: true, message: '请设置允许的文件类型', trigger: 'blur' }],
  backupFrequency: [{ required: true, message: '请选择备份频率', trigger: 'change' }],
  backupRetentionDays: [{ required: true, message: '请设置保留天数', trigger: 'blur' }],
  maintenanceMessage: [{ required: true, message: '请输入维护提示', trigger: 'blur' }]
}

// 切换标签
const handleTabChange = (key: string) => {
  activeTab.value = key
}

// Logo上传前检查
const beforeLogoUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理Logo上传
const handleLogoUpload = (options: any) => {
  const file = options.file
  const reader = new FileReader()
  reader.onload = (e) => {
    basicSettings.systemLogo = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 保存基本设置
const saveBasicSettings = async () => {
  if (!basicFormRef.value) return
  
  try {
    await basicFormRef.value.validate()
    await settingsAPI.updateSettings('basic', basicSettings)
    ElMessage.success('基本设置保存成功')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('基本设置保存失败')
    }
  }
}

// 重置基本设置
const resetBasicSettings = () => {
  Object.assign(basicSettings, {
    systemName: '工单管理系统',
    systemDescription: '专业的工单管理和跟踪系统',
    systemLogo: '',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN'
  })
}

// 保存通知设置
const saveNotificationSettings = async () => {
  if (!notificationFormRef.value) return
  
  try {
    await notificationFormRef.value.validate()
    await settingsAPI.updateSettings('notification', notificationSettings)
    ElMessage.success('通知设置保存成功')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('通知设置保存失败')
    }
  }
}

// 重置通知设置
const resetNotificationSettings = () => {
  Object.assign(notificationSettings, {
    emailEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    senderEmail: '',
    senderPassword: '',
    smsEnabled: false,
    smsProvider: 'aliyun',
    smsAccessKey: '',
    smsSecretKey: '',
    scenarios: ['workorder_created', 'workorder_assigned']
  })
}

// 测试通知
const testNotification = async () => {
  try {
    await settingsAPI.testNotification()
    ElMessage.success('测试通知发送成功')
  } catch (error) {
    ElMessage.error('测试通知发送失败')
  }
}

// 保存安全设置
const saveSecuritySettings = async () => {
  if (!securityFormRef.value) return
  
  try {
    await securityFormRef.value.validate()
    await settingsAPI.updateSettings('security', securitySettings)
    ElMessage.success('安全设置保存成功')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('安全设置保存失败')
    }
  }
}

// 重置安全设置
const resetSecuritySettings = () => {
  Object.assign(securitySettings, {
    passwordPolicyEnabled: true,
    minPasswordLength: 8,
    passwordRequirements: ['lowercase', 'number'],
    loginLimitEnabled: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    sessionTimeoutEnabled: true,
    sessionTimeout: 120
  })
}

// 保存系统设置
const saveSystemSettings = async () => {
  if (!systemFormRef.value) return
  
  try {
    await systemFormRef.value.validate()
    await settingsAPI.updateSettings('system', systemSettings)
    ElMessage.success('系统参数保存成功')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('系统参数保存失败')
    }
  }
}

// 重置系统设置
const resetSystemSettings = () => {
  Object.assign(systemSettings, {
    maxFileSize: 10,
    allowedFileTypes: 'jpg,png,gif,pdf,doc,docx,xls,xlsx',
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    backupTime: new Date(),
    backupRetentionDays: 30,
    maintenanceModeEnabled: false,
    maintenanceMessage: '系统正在维护中，请稍后再试。'
  })
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await settingsAPI.getSettings()
    const settings = response.data
    
    if (settings.basic) {
      Object.assign(basicSettings, settings.basic)
    }
    if (settings.notification) {
      Object.assign(notificationSettings, settings.notification)
    }
    if (settings.security) {
      Object.assign(securitySettings, settings.security)
    }
    if (settings.system) {
      Object.assign(systemSettings, settings.system)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 页面初始化
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings {
  padding: 20px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.settings-container {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

.settings-nav {
  width: 200px;
  flex-shrink: 0;
}

.nav-menu {
  border-right: 1px solid #ebeef5;
}

.settings-content {
  flex: 1;
}

.setting-card {
  border: 1px solid #ebeef5;
}

.sub-settings {
  margin-left: 24px;
  padding-left: 16px;
  border-left: 2px solid #f0f0f0;
}

.setting-desc {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.logo-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}

.logo-uploader:hover {
  border-color: #409eff;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.logo {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
  }
  
  .settings-nav {
    width: 100%;
  }
  
  .nav-menu {
    border-right: none;
    border-bottom: 1px solid #ebeef5;
  }
  
  .sub-settings {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #f0f0f0;
    padding-top: 16px;
    margin-top: 16px;
  }
}
</style>
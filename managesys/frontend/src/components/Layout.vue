<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <img v-if="isCollapse" src="/logo.png" alt="logo" class="logo-img" />
        <div v-else class="logo-expanded">
          <img src="/logo.png" alt="logo" class="logo-img" />
          <span>工单管理系统</span>
        </div>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleSidebar"
            class="collapse-btn"
          >
            <el-icon size="18">
              <Expand v-if="isCollapse" />
              <Fold v-else />
            </el-icon>
          </el-button>
          
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPageTitle">{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ userStore.user?.username || '用户' }}</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 主内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  DataBoard,
  User,
  DataAnalysis,
  Setting,
  Expand,
  Fold,
  ArrowDown,
  SwitchButton,
  TrendCharts,
  Picture,
  Guide
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

// 菜单项配置
const menuItems = [
  {
    path: '/dashboard',
    title: '仪表盘',
    icon: 'DataBoard'
  },
  {
    path: '/work-orders',
    title: '工单管理',
    icon: 'Document'
  },
  {
    path: '/users',
    title: '用户管理',
    icon: 'User'
  },
  {
    path: '/statistics',
    title: '数据统计',
    icon: 'DataAnalysis'
  },
  {
    path: '/ai-dashboard',
    title: 'AI仪表盘',
    icon: 'DataBoard'
  },
  {
    path: '/ai-prediction',
    title: '智能预测',
    icon: 'TrendCharts'
  },
  {
    path: '/ai-recognition',
    title: '图片识别',
    icon: 'Picture'
  },
  {
    path: '/ai-recommendation',
    title: '智能推荐',
    icon: 'Guide'
  },
  {
    path: '/ai-config',
    title: 'AI配置',
    icon: 'Setting'
  },
  {
    path: '/settings',
    title: '系统设置',
    icon: 'Setting'
  }
]

// 当前激活的菜单
const activeMenu = computed(() => {
  const path = route.path
  // 如果是工单详情页，高亮工单管理菜单
  if (path.startsWith('/work-orders')) {
    return '/work-orders'
  }
  return path
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentRoute = route.matched[route.matched.length - 1]
  return currentRoute?.meta?.title as string
})

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 处理用户下拉菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能开发中')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        await userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch (error) {
        // 用户取消操作
      }
      break
  }
}

// 初始化用户信息
onMounted(() => {
  userStore.initializeAuth()
  if (userStore.isLoggedIn && !userStore.user) {
    userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  border-radius: 0 !important;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #434a50;
}

.logo-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.logo-expanded {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-menu {
  border: none;
  background-color: #304156;
}

.sidebar-menu .el-menu-item {
  color: #bfcbd9;
  border-bottom: 1px solid #434a50;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #434a50;
  color: #ffffff;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: #ffffff;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  padding: 0;
  color: #606266;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.arrow-down {
  font-size: 12px;
  color: #909399;
}

.main-content {
  flex: 1;
  background-color: #f0f2f5;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* 平板设备 */
@media (max-width: 1024px) {
  .header {
    padding: 0 15px;
  }
  
  .main-content {
    padding: 0;
  }
}

/* 手机设备 */
@media (max-width: 768px) {
  .layout-container {
    position: relative;
  }
  
  .sidebar {
    position: fixed;
    z-index: 1000;
    height: 100vh;
    left: 0;
    top: 0;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }
  
  .sidebar.collapsed {
    transform: translateX(-100%);
  }
  
  .main-container {
    width: 100%;
    margin-left: 0;
  }
  
  .header {
    padding: 0 10px;
  }
  
  .header-left {
    gap: 10px;
  }
  
  .header-left .breadcrumb {
    display: none;
  }
  
  .main-content {
    padding: 0;
  }
  
  .user-info .username {
    display: none;
  }
}

/* 超小屏幕设备 */
@media (max-width: 480px) {
  .header {
    padding: 0 8px;
  }
  
  .main-content {
    padding: 0;
  }
  
  .logo {
    font-size: 14px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .main-content {
    padding: 0;
  }
  
  .header {
    padding: 0 24px;
  }
}
</style>
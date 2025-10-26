import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../components/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' }
      },
      {
        path: '/work-orders',
        name: 'WorkOrders',
        component: () => import('../views/WorkOrders.vue'),
        meta: { title: '工单管理', icon: 'Document' }
      },
      {
        path: '/work-orders/:id',
        name: 'WorkOrderDetail',
        component: () => import('../views/WorkOrderDetail.vue'),
        meta: { title: '工单详情', hidden: true }
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: '/statistics',
        name: 'Statistics',
        component: () => import('../views/Statistics.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      },
      {
        path: '/ai-dashboard',
        name: 'AIDashboard',
        component: () => import('../views/ai/AIDashboard.vue'),
        meta: { title: 'AI仪表盘', icon: 'DataBoard' }
      },
      {
        path: '/ai-prediction',
        name: 'AIPrediction',
        component: () => import('../views/ai/AIPrediction.vue'),
        meta: { title: '智能预测', icon: 'TrendCharts' }
      },
      {
        path: '/ai-recognition',
        name: 'AIRecognition',
        component: () => import('../views/ai/AIRecognition.vue'),
        meta: { title: '图片识别', icon: 'Picture' }
      },
      {
        path: '/ai-recommendation',
        name: 'AIRecommendation',
        component: () => import('../views/ai/AIRecommendation.vue'),
        meta: { title: '智能推荐', icon: 'Guide' }
      },
      {
        path: '/ai-config',
        name: 'AIConfig',
        component: () => import('../views/ai/AIConfig.vue'),
        meta: { title: 'AI配置', icon: 'Tools' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫已移除，所有路由均可直接访问
// 用户状态仅在内存中管理，不依赖localStorage

export default router
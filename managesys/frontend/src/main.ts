import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import './style.css'
import App from './App.vue'
import aiUtils from './utils/aiUtils'

const app = createApp(App)
const pinia = createPinia()

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 初始化AI工具
aiUtils.initialize().then(() => {
  console.log('AI工具初始化成功')
}).catch(error => {
  console.error('AI工具初始化失败:', error)
})

// 开发环境下加载AI测试
if (import.meta.env.DEV) {
  import('./test/aiTest.js').then(({ testAIInitialization }) => {
    // 延迟执行测试，确保所有依赖都已加载
    setTimeout(() => {
      testAIInitialization()
    }, 2000)
  }).catch(error => {
    console.warn('AI测试加载失败:', error)
  })
}

app.mount('#app')

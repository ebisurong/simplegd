<template>
  <div class="ai-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><DataBoard /></el-icon>
        AI智能仪表盘
      </h1>
      <p class="page-description">实时监控AI系统运行状态，智能分析工单数据趋势</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.title">
        <div class="stat-icon" :style="{ backgroundColor: stat.color }">
          <component :is="stat.icon" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stat.value }}</h3>
          <p class="stat-title">{{ stat.title }}</p>
          <div class="stat-trend" :class="stat.trend > 0 ? 'positive' : 'negative'">
            <el-icon><ArrowUp v-if="stat.trend > 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- AI预测准确率趋势 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>AI预测准确率趋势</h3>
          <el-select v-model="accuracyPeriod" size="small" style="width: 120px">
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
            <el-option label="最近90天" value="90d" />
          </el-select>
        </div>
        <div ref="accuracyChart" class="chart-container"></div>
      </div>

      <!-- 工单处理效率分析 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>工单处理效率分析</h3>
          <el-button-group size="small">
            <el-button :type="efficiencyType === 'time' ? 'primary' : ''" @click="efficiencyType = 'time'">处理时间</el-button>
            <el-button :type="efficiencyType === 'success' ? 'primary' : ''" @click="efficiencyType = 'success'">成功率</el-button>
          </el-button-group>
        </div>
        <div ref="efficiencyChart" class="chart-container"></div>
      </div>

      <!-- AI模型性能监控 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>AI模型性能监控</h3>
          <el-tag type="success" size="small">实时更新</el-tag>
        </div>
        <div ref="performanceChart" class="chart-container"></div>
      </div>

      <!-- 异常检测告警 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>异常检测告警</h3>
          <el-badge :value="alerts.length" class="alert-badge">
            <el-icon><Warning /></el-icon>
          </el-badge>
        </div>
        <div class="alerts-container">
          <div v-if="alerts.length === 0" class="no-alerts">
            <el-icon><CircleCheck /></el-icon>
            <p>系统运行正常，暂无异常</p>
          </div>
          <div v-else class="alerts-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.level">
              <div class="alert-icon">
                <el-icon><Warning v-if="alert.level === 'warning'" /><CircleClose v-else /></el-icon>
              </div>
              <div class="alert-content">
                <h4>{{ alert.title }}</h4>
                <p>{{ alert.message }}</p>
                <span class="alert-time">{{ formatTime(alert.time) }}</span>
              </div>
              <el-button size="small" @click="dismissAlert(alert.id)">忽略</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI功能快捷入口 -->
    <div class="quick-actions">
      <h3>AI功能快捷入口</h3>
      <div class="actions-grid">
        <div class="action-card" v-for="action in quickActions" :key="action.name" @click="navigateTo(action.path)">
          <div class="action-icon" :style="{ backgroundColor: action.color }">
            <component :is="action.icon" />
          </div>
          <h4>{{ action.name }}</h4>
          <p>{{ action.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  DataBoard,
  TrendCharts,
  Picture,
  Guide,
  Tools,
  ArrowUp,
  ArrowDown,
  Warning,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const accuracyPeriod = ref('7d')
const efficiencyType = ref('time')
const accuracyChart = ref()
const efficiencyChart = ref()
const performanceChart = ref()

// 统计数据
const stats = ref([
  {
    title: 'AI预测准确率',
    value: '94.2%',
    trend: 2.3,
    color: '#409EFF',
    icon: 'TrendCharts'
  },
  {
    title: '图像识别成功率',
    value: '97.8%',
    trend: 1.5,
    color: '#67C23A',
    icon: 'Picture'
  },
  {
    title: '智能推荐采纳率',
    value: '86.5%',
    trend: -0.8,
    color: '#E6A23C',
    icon: 'Guide'
  },
  {
    title: '处理效率提升',
    value: '32.1%',
    trend: 5.2,
    color: '#F56C6C',
    icon: 'DataBoard'
  }
])

// 异常告警
const alerts = ref([
  {
    id: 1,
    level: 'warning',
    title: '模型准确率下降',
    message: '设备分类模型准确率低于90%阈值',
    time: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 2,
    level: 'error',
    title: '图像识别服务异常',
    message: 'OpenCV服务连接超时，请检查服务状态',
    time: new Date(Date.now() - 15 * 60 * 1000)
  }
])

// 快捷操作
const quickActions = ref([
  {
    name: '智能预测',
    description: '工单完成时间和资源需求预测',
    path: '/ai-prediction',
    icon: 'TrendCharts',
    color: '#409EFF'
  },
  {
    name: '图片识别',
    description: '设备故障和施工进度识别',
    path: '/ai-recognition',
    icon: 'Picture',
    color: '#67C23A'
  },
  {
    name: '智能推荐',
    description: '处理方案和人员分配建议',
    path: '/ai-recommendation',
    icon: 'Guide',
    color: '#E6A23C'
  },
  {
    name: 'AI配置',
    description: '模型参数和训练数据管理',
    path: '/ai-config',
    icon: 'Tools',
    color: '#F56C6C'
  }
])

// 方法
const navigateTo = (path: string) => {
  router.push(path)
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const dismissAlert = (id: number) => {
  const index = alerts.value.findIndex(alert => alert.id === id)
  if (index > -1) {
    alerts.value.splice(index, 1)
  }
}

// 初始化图表
const initAccuracyChart = () => {
  const chart = echarts.init(accuracyChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '预测准确率',
        type: 'line',
        smooth: true,
        data: [92.1, 94.3, 93.8, 95.2, 94.7, 96.1, 94.2],
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      }
    ]
  }
  chart.setOption(option)
}

const initEfficiencyChart = () => {
  const chart = echarts.init(efficiencyChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['AI辅助', '传统方式']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['设备维修', '故障排查', '资源调配', '进度跟踪', '质量检查']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}h'
      }
    },
    series: [
      {
        name: 'AI辅助',
        type: 'bar',
        data: [2.1, 1.8, 1.5, 1.2, 2.3],
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '传统方式',
        type: 'bar',
        data: [3.2, 2.8, 2.4, 2.1, 3.5],
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
  chart.setOption(option)
}

const initPerformanceChart = () => {
  const chart = echarts.init(performanceChart.value)
  const option = {
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%'
    },
    series: [
      {
        name: '模型性能',
        type: 'gauge',
        detail: {
          formatter: '{value}%'
        },
        data: [{ value: 94.2, name: '综合性能' }],
        axisLine: {
          lineStyle: {
            color: [
              [0.3, '#F56C6C'],
              [0.7, '#E6A23C'],
              [1, '#67C23A']
            ]
          }
        }
      }
    ]
  }
  chart.setOption(option)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  initAccuracyChart()
  initEfficiencyChart()
  initPerformanceChart()
})
</script>

<style scoped>
.ai-dashboard {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  color: #606266;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.stat-title {
  color: #606266;
  margin: 0 0 8px 0;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-trend.positive {
  color: #67C23A;
}

.stat-trend.negative {
  color: #F56C6C;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.chart-container {
  height: 300px;
}

.alerts-container {
  height: 300px;
  overflow-y: auto;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.no-alerts .el-icon {
  font-size: 48px;
  color: #67C23A;
  margin-bottom: 16px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.alert-item.warning {
  background: #fdf6ec;
  border-left-color: #E6A23C;
}

.alert-item.error {
  background: #fef0f0;
  border-left-color: #F56C6C;
}

.alert-icon {
  color: inherit;
}

.alert-content {
  flex: 1;
}

.alert-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.alert-content p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
}

.alert-time {
  font-size: 11px;
  color: #909399;
}

.quick-actions {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.action-card {
  padding: 16px;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: white;
  font-size: 18px;
}

.action-card h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.action-card p {
  margin: 0;
  color: #606266;
  font-size: 12px;
}

.alert-badge {
  cursor: pointer;
}
</style>
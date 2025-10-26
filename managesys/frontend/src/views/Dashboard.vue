<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>仪表盘</h1>
      <p>欢迎回来，{{ userStore.user?.username }}！</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ dashboardData.pendingOrders }}</div>
            <div class="stat-label">待处理工单</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon processing">
            <el-icon size="24"><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ dashboardData.processingOrders }}</div>
            <div class="stat-label">处理中工单</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon completed">
            <el-icon size="24"><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ dashboardData.completedOrders }}</div>
            <div class="stat-label">已完成工单</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ dashboardData.totalOrders }}</div>
            <div class="stat-label">总工单数</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-grid">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>工单状态分布</span>
          </div>
        </template>
        <div ref="pieChartRef" class="chart-container"></div>
      </el-card>
      
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>最近7天工单趋势</span>
          </div>
        </template>
        <div ref="lineChartRef" class="chart-container"></div>
      </el-card>
      
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>施工阶段分布</span>
          </div>
        </template>
        <div ref="stageChartRef" class="chart-container"></div>
      </el-card>
    </div>
    
    <!-- 最近工单 -->
    <el-card class="recent-orders" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>最近工单</span>
          <el-button type="primary" size="small" @click="$router.push('/work-orders')">
            查看全部
          </el-button>
        </div>
      </template>
      
      <el-table :data="recentOrders" style="width: 100%">
        <el-table-column prop="id" label="工单号" width="120" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getPriorityType(row.priority)"
              size="small"
            >
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="$router.push(`/work-orders/${row.id}`)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Clock, Loading, Check, Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { statisticsAPI, workOrderAPI } from '../api/services'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const pieChartRef = ref<HTMLElement>()
const lineChartRef = ref<HTMLElement>()
const stageChartRef = ref<HTMLElement>()

const dashboardData = reactive({
  pendingOrders: 0,
  processingOrders: 0,
  completedOrders: 0,
  totalOrders: 0
})

const stageData = ref([])

const recentOrders = ref([])

// 获取仪表盘数据
const fetchDashboardData = async () => {
  try {
    const response = await statisticsAPI.getDashboardStats()
    const data = response.data
    // 根据后台实际返回的数据结构进行映射
    Object.assign(dashboardData, {
      pendingOrders: data.workOrderStats?.pending || 0,
      processingOrders: data.workOrderStats?.processing || 0,
      completedOrders: data.workOrderStats?.completed || 0,
      totalOrders: data.workOrderStats?.total || 0
    })
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    // 使用模拟数据
    Object.assign(dashboardData, {
      pendingOrders: 15,
      processingOrders: 8,
      completedOrders: 42,
      totalOrders: 65
    })
  }
}

// 获取最近工单
const fetchRecentOrders = async () => {
  try {
    const response = await workOrderAPI.getWorkOrders({ limit: 5, sort: 'createdAt', order: 'desc' })
    // 根据后台实际返回的数据结构进行映射
    recentOrders.value = response.data.workorders || response.data.items || []
  } catch (error) {
    console.error('获取最近工单失败:', error)
    // 使用模拟数据
    recentOrders.value = [
      {
        id: 'WO001',
        title: '办公室空调维修',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'WO002',
        title: '网络设备故障',
        priority: 'medium',
        status: 'processing',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'WO003',
        title: '打印机更换墨盒',
        priority: 'low',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  }
}

// 获取施工阶段统计数据
const fetchStageData = async () => {
  try {
    const response = await statisticsAPI.getStageStats()
    stageData.value = response.data.stageStats || []
  } catch (error) {
    console.error('获取施工阶段数据失败:', error)
    // 使用模拟数据作为后备
    stageData.value = [
      { stage: '设计阶段', count: 15 },
      { stage: '施工准备', count: 8 },
      { stage: '施工中', count: 23 },
      { stage: '验收阶段', count: 12 },
      { stage: '完工', count: 35 }
    ]
  }
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value) return
  
  const chart = echarts.init(pieChartRef.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '工单状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: dashboardData.pendingOrders, name: '待处理' },
          { value: dashboardData.processingOrders, name: '处理中' },
          { value: dashboardData.completedOrders, name: '已完成' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  chart.setOption(option)
}

// 初始化折线图
const initLineChart = () => {
  if (!lineChartRef.value) return
  
  const chart = echarts.init(lineChartRef.value)
  const dates = []
  const data = []
  
  // 生成最近7天的数据
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString())
    data.push(Math.floor(Math.random() * 10) + 1)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增工单',
        data: data,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  chart.setOption(option)
}

// 初始化施工阶段图表
const initStageChart = () => {
  if (!stageChartRef.value) return
  
  const chart = echarts.init(stageChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: stageData.value.map(item => item.stage || item.construction_stage),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '工单数量',
        type: 'bar',
        data: stageData.value.map(item => item.count),
        itemStyle: {
          color: '#67C23A'
        },
        emphasis: {
          itemStyle: {
            color: '#529B2E'
          }
        }
      }
    ]
  }
  chart.setOption(option)
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 工具函数
const getPriorityType = (priority: string) => {
  const types = { high: 'danger', medium: 'warning', low: 'info' }
  return types[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const texts = { high: '高', medium: '中', low: '低' }
  return texts[priority] || '未知'
}

const getStatusType = (status: string) => {
  const types = { pending: 'warning', processing: 'primary', completed: 'success', cancelled: 'info' }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = { pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }
  return texts[status] || '未知'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 页面初始化
onMounted(async () => {
  await fetchDashboardData()
  await fetchRecentOrders()
  await fetchStageData()
  
  nextTick(() => {
    initPieChart()
    initLineChart()
    initStageChart()
  })
})
</script>

<style scoped>
.dashboard {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #303133;
  font-weight: 600;
}

.dashboard-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border: none;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.pending {
  background-color: #e6a23c;
}

.stat-icon.processing {
  background-color: #409eff;
}

.stat-icon.completed {
  background-color: #67c23a;
}

.stat-icon.total {
  background-color: #909399;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  border: none;
  min-height: 400px;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.recent-orders {
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

/* 平板设备 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-container {
    height: 280px;
  }
}

/* 手机设备 */
@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 24px;
  }
  
  .dashboard-header p {
    font-size: 14px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .chart-card {
    min-height: 320px;
  }
  
  .chart-container {
    height: 240px;
  }
  
  .stat-content {
    gap: 12px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
  }
  
  .stat-number {
    font-size: 20px;
  }
}

/* 超小屏幕设备 */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
  }
  
  .stat-number {
    font-size: 18px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .chart-container {
    height: 200px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .dashboard-header h1 {
    font-size: 32px;
  }
  
  .dashboard-header p {
    font-size: 18px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .charts-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .chart-container {
    height: 360px;
  }
}
</style>
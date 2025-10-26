<template>
  <div class="statistics">
    <div class="page-header">
      <h1>数据统计</h1>
      <p>工单数据分析和统计报表</p>
    </div>
    
    <!-- 时间范围选择 -->
    <div class="filter-bar">
      <el-card shadow="never" class="filter-card">
        <div class="filter-content">
          <div class="filter-item">
            <label>时间范围：</label>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
            />
          </div>
          <div class="filter-item">
            <label>快速选择：</label>
            <el-button-group>
              <el-button @click="setQuickRange('today')" :type="quickRange === 'today' ? 'primary' : 'default'">今天</el-button>
              <el-button @click="setQuickRange('week')" :type="quickRange === 'week' ? 'primary' : 'default'">本周</el-button>
              <el-button @click="setQuickRange('month')" :type="quickRange === 'month' ? 'primary' : 'default'">本月</el-button>
              <el-button @click="setQuickRange('quarter')" :type="quickRange === 'quarter' ? 'primary' : 'default'">本季度</el-button>
            </el-button-group>
          </div>
          <div class="filter-item">
            <el-button type="primary" @click="refreshData" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 统计概览 -->
    <div class="overview-section">
      <el-row :gutter="24">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overviewData.total }}</div>
                <div class="stat-label">总工单数</div>
                <div class="stat-change" :class="overviewData.totalChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewData.totalChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewData.totalChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overviewData.pending }}</div>
                <div class="stat-label">待处理</div>
                <div class="stat-change" :class="overviewData.pendingChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewData.pendingChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewData.pendingChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon processing">
                <el-icon><Loading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overviewData.processing }}</div>
                <div class="stat-label">处理中</div>
                <div class="stat-change" :class="overviewData.processingChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewData.processingChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewData.processingChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon completed">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overviewData.completed }}</div>
                <div class="stat-label">已完成</div>
                <div class="stat-change" :class="overviewData.completedChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewData.completedChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewData.completedChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="24">
        <!-- 工单趋势图 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>工单趋势</span>
                <el-button text @click="exportChart('trend')">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 状态分布图 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>状态分布</span>
                <el-button text @click="exportChart('status')">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </template>
            <div ref="statusChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 优先级分布图 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>优先级分布</span>
                <el-button text @click="exportChart('priority')">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </template>
            <div ref="priorityChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 处理人员效率 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>处理人员效率</span>
                <el-button text @click="exportChart('efficiency')">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </template>
            <div ref="efficiencyChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 平均处理时间 -->
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>平均处理时间趋势</span>
                <el-button text @click="exportChart('avgTime')">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </template>
            <div ref="avgTimeChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 详细统计表格 -->
    <div class="table-section">
      <el-card shadow="never" class="table-card">
        <template #header>
          <div class="card-header">
            <span>详细统计</span>
            <div class="header-actions">
              <el-button @click="exportTable">
                <el-icon><Download /></el-icon>
                导出Excel
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table
          :data="tableData"
          v-loading="tableLoading"
          stripe
          border
          style="width: 100%"
        >
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="total" label="总数" width="80" align="center" />
          <el-table-column prop="pending" label="待处理" width="80" align="center" />
          <el-table-column prop="processing" label="处理中" width="80" align="center" />
          <el-table-column prop="completed" label="已完成" width="80" align="center" />
          <el-table-column prop="cancelled" label="已取消" width="80" align="center" />
          <el-table-column prop="avgProcessTime" label="平均处理时间" width="120" align="center">
            <template #default="{ row }">
              {{ row.avgProcessTime }}小时
            </template>
          </el-table-column>
          <el-table-column prop="completionRate" label="完成率" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getCompletionRateType(row.completionRate)">
                {{ row.completionRate }}%
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="table-pagination">
          <el-pagination
            v-model:current-page="tablePagination.page"
            v-model:page-size="tablePagination.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="tablePagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleTableSizeChange"
            @current-change="handleTablePageChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Document,
  Clock,
  Loading,
  Check,
  Download,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
// import { statisticsAPI } from '../api/services' // 已改为使用模拟数据

const loading = ref(false)
const tableLoading = ref(false)
const quickRange = ref('month')
const dateRange = ref<[string, string]>()

// 生成模拟工单数据（与WorkOrders.vue保持一致）
const generateMockData = () => {
  const mockData = []
  const titles = [
    '电梯故障维修', '空调系统检修', '消防设备检查', '水管漏水处理', '电路故障排查',
    '门禁系统维护', '监控设备调试', '照明设备更换', '网络设备故障', '暖通系统维修',
    '给排水管道疏通', '外墙清洗作业', '屋顶防水处理', '地面修补工程', '墙面粉刷作业',
    '窗户玻璃更换', '楼梯扶手维修', '停车场设施维护', '绿化养护工作', '垃圾清运服务'
  ]
  
  const descriptions = [
    '设备出现异常，需要专业技术人员进行检修和维护',
    '定期保养维护，确保设备正常运行和使用安全',
    '按照安全规范进行全面检查，排除安全隐患',
    '紧急处理突发故障，避免影响正常使用',
    '系统升级改造，提升设备性能和使用体验'
  ]
  
  const priorities = ['low', 'medium', 'high', 'urgent']
  const statuses = ['pending', 'processing', 'completed', 'cancelled']
  const stages = ['preparation', 'foundation', 'structure', 'decoration', 'completion', 'maintenance', 'operation']
  const contacts = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  const projects = ['办公大楼A座', '商业综合体B区', '住宅小区C栋', '工业园区D区', '学校教学楼E座']
  const locations = ['1楼大厅', '2楼办公区', '3楼会议室', '地下停车场', '楼顶机房', '外围绿化带']
  
  for (let i = 1; i <= 200; i++) {
    const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    mockData.push({
      id: `WO${String(i).padStart(6, '0')}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      constructionStage: stages[Math.floor(Math.random() * stages.length)],
      contact: contacts[Math.floor(Math.random() * contacts.length)],
      contact_phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      project_name: projects[Math.floor(Math.random() * projects.length)],
      location_name: locations[Math.floor(Math.random() * locations.length)],
      gps_latitude: 39.9042 + (Math.random() - 0.5) * 0.1,
      gps_longitude: 116.4074 + (Math.random() - 0.5) * 0.1,
      photos: Math.random() > 0.5 ? [{ url: 'mock-photo.jpg' }] : [],
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString()
    })
  }
  return mockData
}

// 全部模拟数据
const allMockData = generateMockData()

// 生成趋势数据
const generateTrendData = (data: any[]) => {
  const dates = []
  const created = []
  const completed = []
  const cancelled = []
  
  // 生成最近7天的数据
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dates.push(dateStr)
    
    // 模拟每日数据
    const dayData = data.filter(item => {
      const itemDate = new Date(item.createdAt).toISOString().split('T')[0]
      return itemDate === dateStr
    })
    
    created.push(dayData.length)
    completed.push(dayData.filter(item => item.status === 'completed').length)
    cancelled.push(dayData.filter(item => item.status === 'cancelled').length)
  }
  
  return { dates, created, completed, cancelled }
}

// 生成效率数据
const generateEfficiencyData = (data: any[]) => {
  const contacts = ['张三', '李四', '王五', '赵六', '钱七']
  const users = []
  const counts = []
  
  contacts.forEach(contact => {
    const userTasks = data.filter(item => item.contact === contact && item.status === 'completed')
    users.push(contact)
    counts.push(userTasks.length)
  })
  
  return { users, counts }
}

// 生成平均处理时间数据
const generateAvgTimeData = (data: any[]) => {
  const dates = []
  const avgTimes = []
  
  // 生成最近7天的平均处理时间
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dates.push(dateStr)
    
    // 模拟平均处理时间（小时）
    const avgTime = Math.floor(Math.random() * 24) + 12
    avgTimes.push(avgTime)
  }
  
  return { dates, avgTimes }
}

// 图表引用
const trendChartRef = ref()
const statusChartRef = ref()
const priorityChartRef = ref()
const efficiencyChartRef = ref()
const avgTimeChartRef = ref()

// 图表实例
let trendChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let priorityChart: echarts.ECharts | null = null
let efficiencyChart: echarts.ECharts | null = null
let avgTimeChart: echarts.ECharts | null = null

// 概览数据
const overviewData = reactive({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  totalChange: 0,
  pendingChange: 0,
  processingChange: 0,
  completedChange: 0
})

// 表格数据
const tableData = ref([])
const tablePagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 设置快速时间范围
const setQuickRange = (range: string) => {
  quickRange.value = range
  const today = new Date()
  const start = new Date()
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      dateRange.value = [
        start.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ]
      break
    case 'week':
      start.setDate(today.getDate() - today.getDay())
      dateRange.value = [
        start.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ]
      break
    case 'month':
      start.setDate(1)
      dateRange.value = [
        start.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ]
      break
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3)
      start.setMonth(quarter * 3, 1)
      dateRange.value = [
        start.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ]
      break
  }
  
  refreshData()
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  quickRange.value = ''
  refreshData()
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadOverviewData(),
      loadChartData(),
      loadTableData()
    ])
  } finally {
    loading.value = false
  }
}

// 加载概览数据（使用模拟数据）
const loadOverviewData = async () => {
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 200))
    
    let filteredData = [...allMockData]
    
    // 日期范围过滤
    if (dateRange.value && dateRange.value.length === 2) {
      const startDate = new Date(dateRange.value[0])
      const endDate = new Date(dateRange.value[1])
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt)
        return itemDate >= startDate && itemDate <= endDate
      })
    }
    
    // 计算统计数据
    const total = filteredData.length
    const pending = filteredData.filter(item => item.status === 'pending').length
    const processing = filteredData.filter(item => item.status === 'processing').length
    const completed = filteredData.filter(item => item.status === 'completed').length
    
    // 模拟变化百分比
    const totalChange = Math.floor(Math.random() * 20) - 10
    const pendingChange = Math.floor(Math.random() * 30) - 15
    const processingChange = Math.floor(Math.random() * 25) - 12
    const completedChange = Math.floor(Math.random() * 15) + 5
    
    Object.assign(overviewData, {
      total,
      pending,
      processing,
      completed,
      totalChange,
      pendingChange,
      processingChange,
      completedChange
    })
  } catch (error) {
    console.error('加载概览数据失败:', error)
  }
}

// 加载图表数据（使用模拟数据）
const loadChartData = async () => {
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let filteredData = [...allMockData]
    
    // 日期范围过滤
    if (dateRange.value && dateRange.value.length === 2) {
      const startDate = new Date(dateRange.value[0])
      const endDate = new Date(dateRange.value[1])
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt)
        return itemDate >= startDate && itemDate <= endDate
      })
    }
    
    // 生成趋势数据
    const trendData = generateTrendData(filteredData)
    
    // 生成状态分布数据
    const statusData = {
      pending: filteredData.filter(item => item.status === 'pending').length,
      processing: filteredData.filter(item => item.status === 'processing').length,
      completed: filteredData.filter(item => item.status === 'completed').length,
      cancelled: filteredData.filter(item => item.status === 'cancelled').length
    }
    
    // 生成优先级分布数据
    const priorityData = {
      high: filteredData.filter(item => item.priority === 'high' || item.priority === 'urgent').length,
      medium: filteredData.filter(item => item.priority === 'medium').length,
      low: filteredData.filter(item => item.priority === 'low').length
    }
    
    // 生成效率数据
    const efficiencyData = generateEfficiencyData(filteredData)
    
    // 生成平均处理时间数据
    const avgTimeData = generateAvgTimeData(filteredData)
    
    // 更新各个图表
    updateTrendChart(trendData)
    updateStatusChart(statusData)
    updatePriorityChart(priorityData)
    updateEfficiencyChart(efficiencyData)
    updateAvgTimeChart(avgTimeData)
  } catch (error) {
    console.error('加载图表数据失败:', error)
  }
}

// 加载表格数据（使用模拟数据）
const loadTableData = async () => {
  tableLoading.value = true
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 400))
    
    let filteredData = [...allMockData]
    
    // 日期范围过滤
    if (dateRange.value && dateRange.value.length === 2) {
      const startDate = new Date(dateRange.value[0])
      const endDate = new Date(dateRange.value[1])
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt)
        return itemDate >= startDate && itemDate <= endDate
      })
    }
    
    // 按日期分组统计
    const dateGroups = {}
    filteredData.forEach(item => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      if (!dateGroups[date]) {
        dateGroups[date] = {
          date,
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0,
          avgProcessTime: 0
        }
      }
      
      dateGroups[date].total++
      dateGroups[date][item.status]++
    })
    
    // 转换为数组并计算完成率和平均处理时间
    const tableList = Object.values(dateGroups).map((group: any) => {
      const completionRate = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0
      const avgProcessTime = Math.floor(Math.random() * 48) + 12 // 模拟12-60小时
      
      return {
        ...group,
        completionRate,
        avgProcessTime
      }
    })
    
    // 按日期排序
    tableList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // 分页
    const total = tableList.length
    const start = (tablePagination.page - 1) * tablePagination.size
    const end = start + tablePagination.size
    const pageData = tableList.slice(start, end)
    
    tableData.value = pageData
    tablePagination.total = total
  } catch (error) {
    console.error('加载表格数据失败:', error)
  } finally {
    tableLoading.value = false
  }
}

// 更新趋势图表
const updateTrendChart = (data: any) => {
  if (!trendChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['新建', '完成', '取消']
    },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新建',
        type: 'line',
        data: data.created,
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '完成',
        type: 'line',
        data: data.completed,
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '取消',
        type: 'line',
        data: data.cancelled,
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 更新状态分布图表
const updateStatusChart = (data: any) => {
  if (!statusChart) return
  
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
          { value: data.pending, name: '待处理', itemStyle: { color: '#E6A23C' } },
          { value: data.processing, name: '处理中', itemStyle: { color: '#409EFF' } },
          { value: data.completed, name: '已完成', itemStyle: { color: '#67C23A' } },
          { value: data.cancelled, name: '已取消', itemStyle: { color: '#F56C6C' } }
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
  
  statusChart.setOption(option)
}

// 更新优先级分布图表
const updatePriorityChart = (data: any) => {
  if (!priorityChart) return
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '优先级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '30',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: data.high, name: '高优先级', itemStyle: { color: '#F56C6C' } },
          { value: data.medium, name: '中优先级', itemStyle: { color: '#E6A23C' } },
          { value: data.low, name: '低优先级', itemStyle: { color: '#67C23A' } }
        ]
      }
    ]
  }
  
  priorityChart.setOption(option)
}

// 更新效率图表
const updateEfficiencyChart = (data: any) => {
  if (!efficiencyChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data.users
    },
    yAxis: {
      type: 'value',
      name: '完成数量'
    },
    series: [
      {
        name: '完成工单数',
        type: 'bar',
        data: data.counts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }
  
  efficiencyChart.setOption(option)
}

// 更新平均处理时间图表
const updateAvgTimeChart = (data: any) => {
  if (!avgTimeChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: {
      type: 'value',
      name: '小时'
    },
    series: [
      {
        name: '平均处理时间',
        type: 'line',
        data: data.times,
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        itemStyle: { color: '#409EFF' }
      }
    ]
  }
  
  avgTimeChart.setOption(option)
}

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
    }
    if (statusChartRef.value) {
      statusChart = echarts.init(statusChartRef.value)
    }
    if (priorityChartRef.value) {
      priorityChart = echarts.init(priorityChartRef.value)
    }
    if (efficiencyChartRef.value) {
      efficiencyChart = echarts.init(efficiencyChartRef.value)
    }
    if (avgTimeChartRef.value) {
      avgTimeChart = echarts.init(avgTimeChartRef.value)
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      trendChart?.resize()
      statusChart?.resize()
      priorityChart?.resize()
      efficiencyChart?.resize()
      avgTimeChart?.resize()
    })
  })
}

// 导出图表
const exportChart = (type: string) => {
  let chart: echarts.ECharts | null = null
  let filename = ''
  
  switch (type) {
    case 'trend':
      chart = trendChart
      filename = '工单趋势图'
      break
    case 'status':
      chart = statusChart
      filename = '状态分布图'
      break
    case 'priority':
      chart = priorityChart
      filename = '优先级分布图'
      break
    case 'efficiency':
      chart = efficiencyChart
      filename = '处理人员效率图'
      break
    case 'avgTime':
      chart = avgTimeChart
      filename = '平均处理时间图'
      break
  }
  
  if (chart) {
    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = url
    link.click()
    
    ElMessage.success('图表导出成功')
  }
}

// 导出表格（使用模拟数据）
const exportTable = async () => {
  try {
    // 模拟导出延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 生成CSV格式的数据
    let csvContent = '日期,总工单数,待处理,处理中,已完成,已取消,完成率(%),平均处理时间(小时)\n'
    
    tableData.value.forEach(row => {
      csvContent += `${row.date},${row.total},${row.pending},${row.processing},${row.completed},${row.cancelled},${row.completionRate},${row.avgProcessTime}\n`
    })
    
    // 创建下载链接
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '工单统计数据.csv'
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
  }
}

// 获取完成率类型
const getCompletionRateType = (rate: number) => {
  if (rate >= 90) return 'success'
  if (rate >= 70) return 'warning'
  return 'danger'
}

// 表格分页处理
const handleTableSizeChange = (size: number) => {
  tablePagination.size = size
  loadTableData()
}

const handleTablePageChange = (page: number) => {
  tablePagination.page = page
  loadTableData()
}

// 页面初始化
onMounted(() => {
  setQuickRange('month')
  initCharts()
})
</script>

<style scoped>
.statistics {
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

.filter-bar {
  margin-bottom: 24px;
}

.filter-card {
  border: 1px solid #ebeef5;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.overview-section {
  margin-bottom: 24px;
}

.stat-card {
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.processing {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  border: 1px solid #ebeef5;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.table-section {
  margin-bottom: 24px;
}

.table-card {
  border: 1px solid #ebeef5;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .filter-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>
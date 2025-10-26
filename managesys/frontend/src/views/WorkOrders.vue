<template>
  <div class="work-orders">
    <div class="page-header">
      <h1>工单管理</h1>
      <p>管理和跟踪所有工单</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statistics.total }}</div>
            <div class="stat-label">总工单</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statistics.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon processing">
            <el-icon size="24"><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statistics.processing }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon completed">
            <el-icon size="24"><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statistics.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon urgent">
            <el-icon size="24"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statistics.urgent }}</div>
            <div class="stat-label">紧急</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon today">
            <el-icon size="24"><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statistics.today }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索项目名称..."
            :prefix-icon="Search"
            style="width: 300px"
            @input="handleSearch"
            clearable
          />
          <el-select
            v-model="filters.workType"
            placeholder="工种"
            style="width: 140px"
            @change="handleFilter"
            clearable
          >
            <el-option label="桥架" value="bridge" />
            <el-option label="管道" value="pipe" />
            <el-option label="穿线" value="wiring" />
            <el-option label="端接" value="termination" />
            <el-option label="设备安装" value="equipment" />
            <el-option label="开挖" value="excavation" />
            <el-option label="基础" value="foundation" />
            <el-option label="手井" value="manual" />
          </el-select>
          <el-select
            v-model="filters.constructionStage"
            placeholder="施工阶段"
            style="width: 140px"
            @change="handleFilter"
            clearable
          >
            <el-option label="勘查调研" value="survey" />
            <el-option label="管道安装" value="pipe_install" />
            <el-option label="线缆施工" value="cable_install" />
            <el-option label="设备安装" value="equipment_install" />
            <el-option label="设备调试" value="equipment_debug" />
            <el-option label="维保" value="maintenance" />
          </el-select>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleFilter"
            style="width: 240px"
          />
        </div>
        <div>
          <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 工单列表 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <h3>工单列表</h3>
        <div class="table-actions">
          <el-button type="primary" @click="$router.push('/work-orders/create')">
            <el-icon><Plus /></el-icon>
            新建工单
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="workOrders"
        v-loading="loading"
        @sort-change="handleSortChange"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="工单号" width="120" sortable="custom" />
        <el-table-column prop="project_name" label="项目名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="工种" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ getWorkTypesText(row.work_items) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="施工阶段" width="120" align="center">
          <template #default="{ row }">
            <span>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="处理人" width="100" />
        <el-table-column prop="status" label="当前状态" width="100" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row.id)"
            >
              查看
            </el-button>
            <el-dropdown @command="(command) => handleAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="process" v-if="row.status === 'pending'">
                    开始处理
                  </el-dropdown-item>
                  <el-dropdown-item command="complete" v-if="row.status === 'processing'">
                    标记完成
                  </el-dropdown-item>
                  <el-dropdown-item command="cancel" v-if="row.status !== 'completed' && row.status !== 'cancelled'">
                    取消工单
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Document,
  Clock,
  Loading,
  Check,
  Warning,
  Calendar,
  ArrowDown
} from '@element-plus/icons-vue'
import { workOrderAPI, statisticsAPI } from '../api/services'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const workOrders = ref<any[]>([])
const searchQuery = ref('')

const statistics = reactive({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  urgent: 0,
  today: 0
})

const filters = reactive({
  workType: '',
  constructionStage: '',
  dateRange: null as any
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const sortConfig = reactive({
  prop: '',
  order: ''
})

// 获取统计数据
const fetchStatistics = async () => {
  try {
    console.log('开始获取统计数据...')
    const response = await statisticsAPI.getDashboardStats()
    console.log('统计数据API响应:', response)
    
    // 安全检查响应数据结构
    if (!response) {
      console.warn('统计数据响应为空:', response)
      return
    }
    
    // 直接使用response，因为axios拦截器已经返回了response.data
    const data = response
    console.log('解析后的统计数据:', data)
    
    // 根据后台实际返回的数据结构进行映射，添加安全访问
    statistics.total = data.workOrderStats?.total || 0
    statistics.pending = data.workOrderStats?.pending || 0
    statistics.processing = data.workOrderStats?.processing || 0
    statistics.completed = data.workOrderStats?.completed || 0
    statistics.urgent = data.priorityStats?.urgent || 0
    statistics.today = data.recentTrend?.[0]?.count || 0
    
    console.log('更新后的统计数据:', statistics)
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
    
    // 设置默认值，防止页面显示异常
    statistics.total = 0
    statistics.pending = 0
    statistics.processing = 0
    statistics.completed = 0
    statistics.urgent = 0
    statistics.today = 0
  }
}

// 获取工单列表
const fetchWorkOrders = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.size,
      search: searchQuery.value || undefined,
      work_type: filters.workType || undefined,
      construction_stage: filters.constructionStage || undefined
    }

    // 添加日期范围参数
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.start_date = filters.dateRange[0]
      params.end_date = filters.dateRange[1]
    }

    // 添加排序参数
    if (sortConfig.prop) {
      params.sort_by = sortConfig.prop
      params.sort_order = sortConfig.order
    }

    console.log('开始获取工单列表...')
    const response = await workOrderAPI.getWorkOrders(params)
    console.log('工单列表API响应:', response)
    
    // 安全检查响应数据结构
    if (!response) {
      console.warn('工单列表响应为空:', response)
      workOrders.value = []
      pagination.total = 0
      return
    }
    
    // 直接使用response，因为axios拦截器已经返回了response.data
    const data = response
    console.log('解析后的工单数据:', data)
    
    // 安全访问数据属性 - 修复数据结构匹配
    workOrders.value = Array.isArray(data.workorders) ? data.workorders : []
    pagination.total = typeof data.total === 'number' ? data.total : 0
    
    console.log('工单数据:', workOrders.value)
    console.log('总数:', pagination.total)
  } catch (error) {
    console.error('获取工单列表失败:', error)
    ElMessage.error('获取工单列表失败')
    workOrders.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 搜索处理
let searchTimer: number
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.page = 1
    fetchWorkOrders()
  }, 500)
}

// 筛选处理
const handleFilter = () => {
  pagination.page = 1
  fetchWorkOrders()
}

// 重置筛选
const resetFilters = () => {
  searchQuery.value = ''
  filters.workType = ''
  filters.constructionStage = ''
  filters.dateRange = null
  pagination.page = 1
  fetchWorkOrders()
}

// 排序处理
const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortConfig.prop = prop
  sortConfig.order = order === 'ascending' ? 'asc' : 'desc'
  fetchWorkOrders()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchWorkOrders()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchWorkOrders()
}

// 查看详情
const viewDetail = (id: string) => {
  router.push(`/work-orders/${id}`)
}

// 处理操作
const handleAction = async (command: string, row: any) => {
  switch (command) {
    case 'process':
      await updateStatus(row.id, 'processing')
      break
    case 'complete':
      await updateStatus(row.id, 'completed')
      break
    case 'cancel':
      await confirmCancel(row.id)
      break
  }
}

// 更新状态
const updateStatus = async (id: string, status: string) => {
  try {
    await workOrderAPI.updateWorkOrderStatus(id, status)
    ElMessage.success('状态更新成功')
    fetchWorkOrders()
    fetchStatistics() // 更新统计数据
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  }
}

// 确认取消
const confirmCancel = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消这个工单吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await updateStatus(id, 'cancelled')
  } catch (error) {
    // 用户取消操作
  }
}

// 工具函数
const getPriorityType = (priority: string) => {
  const types: { [key: string]: string } = {
    low: 'info',
    medium: 'warning', 
    high: 'danger',
    urgent: 'danger'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const texts: { [key: string]: string } = {
    low: '低',
    medium: '中',
    high: '高', 
    urgent: '紧急'
  }
  return texts[priority] || '未知'
}

const getStatusType = (status: string) => {
  const types: { [key: string]: string } = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: { [key: string]: string } = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

const getStageText = (stage: string) => {
  const texts: { [key: string]: string } = {
    preparation: '准备阶段',
    foundation: '基础施工',
    structure: '主体结构',
    decoration: '装修阶段',
    completion: '竣工验收',
    maintenance: '维护保养',
    operation: '运营管理'
  }
  return texts[stage] || '未知'
}

const getWorkTypesText = (workItems: any) => {
  try {
    console.log('原始 work_items 数据:', workItems)
    
    if (!workItems) {
      console.log('work_items 为空')
      return '-'
    }
    
    let parsedItems = workItems
    
    // 如果是字符串，尝试解析
    if (typeof workItems === 'string') {
      console.log('work_items 是字符串，开始解析...')
      
      // 清理字符串
      let cleanedString = workItems.trim()
      
      // 移除外层引号
      if ((cleanedString.startsWith('"') && cleanedString.endsWith('"')) ||
          (cleanedString.startsWith("'") && cleanedString.endsWith("'"))) {
        cleanedString = cleanedString.slice(1, -1)
      }
      
      // 处理双重转义
      cleanedString = cleanedString.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      
      console.log('清理后的字符串:', cleanedString)
      
      try {
        parsedItems = JSON.parse(cleanedString)
        console.log('第一次解析结果:', parsedItems)
      } catch (e) {
        console.log('第一次解析失败，尝试第二次解析')
        try {
          parsedItems = JSON.parse(JSON.parse(cleanedString))
          console.log('第二次解析结果:', parsedItems)
        } catch (e2) {
          console.error('JSON解析失败:', e2)
          return '-'
        }
      }
    }
    
    // 检查解析后的数据
    if (!Array.isArray(parsedItems)) {
      console.log('解析后的数据不是数组:', parsedItems)
      return '-'
    }
    
    if (parsedItems.length === 0) {
      console.log('解析后的数组为空')
      return '-'
    }
    
    // 提取工种名称
    const workTypes = parsedItems.map(item => {
      if (typeof item === 'object' && item.work_type) {
        return item.work_type
      }
      return '未知'
    }).filter(type => type !== '未知')
    
    console.log('提取的工种:', workTypes)
    
    return workTypes.length > 0 ? workTypes.join(', ') : '-'
    
  } catch (error) {
    console.error('getWorkTypesText 处理失败:', error)
    return '-'
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('=== WorkOrders 组件已挂载，开始获取数据 ===')
  fetchStatistics()
  fetchWorkOrders()
})
</script>

<style scoped>
.work-orders {
  padding: 20px;
  width: 100%;
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

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
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

.stat-icon.urgent {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-icon.today {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

/* 小程序字段样式 */
.more-text {
  font-size: 12px;
  color: #909399;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.filter-card {
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.table-card {
  border: 1px solid #ebeef5;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .stat-content {
    gap: 12px;
    padding: 6px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-left .el-input,
  .filter-left .el-select,
  .filter-left .el-date-picker {
    width: 100% !important;
  }
}
</style>
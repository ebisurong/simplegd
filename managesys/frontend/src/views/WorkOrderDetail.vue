<template>
  <div class="work-order-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" type="text" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="title-section">
          <h1>工单详情</h1>
          <p v-if="workOrder">工单ID: {{ workOrder.id }}</p>
        </div>
      </div>
      <div class="header-right" v-if="workOrder">
        <el-tag
          :type="getStatusType(workOrder.status)"
          size="large"
        >
          {{ getStatusText(workOrder.status) }}
        </el-tag>
      </div>
    </div>
    
    <div v-loading="loading" class="content">
      <div v-if="workOrder" class="detail-container">
        <!-- 基本信息 -->
        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-button
                v-if="canEdit"
                type="primary"
                size="small"
                @click="editDialogVisible = true"
              >
                编辑
              </el-button>
            </div>
          </template>
          
          <div class="info-grid">
            <div class="info-item">
              <label>工单ID：</label>
              <span>{{ workOrder.id }}</span>
            </div>
            <div class="info-item">
              <label>联系人姓名：</label>
              <span>{{ workOrder.contact_name || '小程序用户' }}</span>
            </div>
            <div class="info-item">
              <label>项目名称：</label>
              <span>{{ workOrder.project_name || '未提供' }}</span>
            </div>
            <div class="info-item">
              <label>详细地址：</label>
              <span>{{ workOrder.location_name || '未提供' }}</span>
            </div>
            <div class="info-item">
              <label>处理人：</label>
              <span>{{ workOrder.assignee?.username || '未分配' }}</span>
            </div>
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ formatDate(workOrder.created_at) }}</span>
            </div>
            
            <!-- GPS坐标信息 -->
            <div v-if="workOrder.gps_latitude && workOrder.gps_longitude" class="info-item full-width">
              <label>GPS坐标：</label>
              <div class="gps-info">
                <span>纬度: {{ workOrder.gps_latitude.toFixed(6) }}</span>
                <span style="margin-left: 20px;">经度: {{ workOrder.gps_longitude.toFixed(6) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 工种和安装内容 -->
        <el-card v-if="workTypeWithContents && workTypeWithContents.length > 0" class="work-types-card" shadow="never">
          <template #header>
            <span>工种和安装内容</span>
          </template>
          
          <div class="work-types-content">
            <div v-for="(workType, index) in workTypeWithContents" :key="index" class="work-type-group">
              <div class="work-type-header">
                <el-tag type="primary" size="medium">{{ workType.category }}</el-tag>
                <span class="content-count">({{ workType.count }}项)</span>
              </div>
              <div class="install-contents">
                <el-tag
                  v-for="(content, contentIndex) in workType.contents"
                  :key="contentIndex"
                  type="info"
                  size="small"
                  class="content-tag"
                >
                  {{ content }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 语音转文字内容 -->
        <el-card v-if="workOrder.voice_text" class="voice-card" shadow="never">
          <template #header>
            <span>语音/备注文字</span>
          </template>
          
          <div class="voice-content">
            <el-icon class="voice-icon"><Microphone /></el-icon>
            <div class="voice-text">{{ workOrder.voice_text }}</div>
          </div>
        </el-card>
        
        <!-- 现场照片 -->
        <el-card v-if="workOrder.photos && workOrder.photos.length > 0" class="photos-card" shadow="never">
          <template #header>
            <span>现场照片 ({{ workOrder.photos.length }})</span>
          </template>
          
          <div class="photos-grid">
            <div
              v-for="(photo, index) in workOrder.photos"
              :key="index"
              class="photo-item"
              @click="previewPhoto(index)"
            >
              <img
                :src="getPhotoUrl(photo)"
                :alt="`现场照片${index + 1}`"
                class="photo-image"
                @error="handleImageError"
              />
              <div class="photo-overlay">
                <el-icon class="preview-icon"><ZoomIn /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 状态操作 -->
        <el-card class="action-card" shadow="never">
          <template #header>
            <span>状态操作</span>
          </template>
          
          <div class="action-buttons">
            <el-button
              v-if="workOrder.status === 'pending'"
              type="primary"
              @click="updateStatus('processing')"
            >
              开始处理
            </el-button>
            <el-button
              v-if="workOrder.status === 'processing'"
              type="success"
              @click="updateStatus('completed')"
            >
              完成工单
            </el-button>
            <el-button
              v-if="workOrder.status === 'pending'"
              @click="assignDialogVisible = true"
            >
              分配处理人
            </el-button>
            <el-button
              v-if="workOrder.status !== 'completed' && workOrder.status !== 'cancelled'"
              type="danger"
              @click="confirmCancel"
            >
              取消工单
            </el-button>
          </div>
        </el-card>
        
        <!-- 进度记录 -->
        <el-card class="progress-card" shadow="never">
          <template #header>
            <span>进度记录</span>
          </template>
          
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in progressRecords"
              :key="index"
              :timestamp="formatDate(record.createdAt)"
              :type="getTimelineType(record.action)"
            >
              <div class="timeline-content">
                <div class="timeline-title">{{ record.title }}</div>
                <div class="timeline-description">{{ record.description }}</div>
                <div class="timeline-user">操作人：{{ record.user?.username }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
        
        <!-- 评论区 -->
        <el-card class="comment-card" shadow="never">
          <template #header>
            <span>评论记录</span>
          </template>
          
          <!-- 添加评论 -->
          <div class="add-comment">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="添加评论..."
              maxlength="500"
              show-word-limit
            />
            <div class="comment-actions">
              <el-button
                type="primary"
                @click="addComment"
                :disabled="!newComment.trim()"
              >
                发表评论
              </el-button>
            </div>
          </div>
          
          <!-- 评论列表 -->
          <div class="comment-list">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-item"
            >
              <div class="comment-header">
                <span class="comment-user">{{ comment.user?.username }}</span>
                <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
            
            <div v-if="comments.length === 0" class="no-comments">
              暂无评论
            </div>
          </div>
        </el-card>
      </div>
      
      <div v-else-if="!loading" class="not-found">
        <el-result
          icon="warning"
          title="工单不存在"
          sub-title="请检查工单号是否正确"
        >
          <template #extra>
            <el-button type="primary" @click="goBack">返回列表</el-button>
          </template>
        </el-result>
      </div>
    </div>
    
    <!-- 编辑工单对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑工单"
      width="600px"
    >
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="editForm.priority" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="editForm.contact" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 分配工单对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配工单"
      width="400px"
    >
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="处理人">
          <el-select v-model="assignForm.assigneeId" placeholder="请选择处理人" style="width: 100%">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 照片预览对话框 -->
    <el-dialog
      v-model="photoPreviewVisible"
      title="照片预览"
      width="80%"
      :show-close="true"
      center
    >
      <div v-if="workOrder.photos && workOrder.photos.length > 0" class="photo-preview-container">
        <img
          :src="getPhotoUrl(workOrder.photos[currentPhotoIndex])"
          :alt="`现场照片${currentPhotoIndex + 1}`"
          class="preview-image"
          @error="handleImageError"
        />
        <div class="photo-navigation" v-if="workOrder.photos.length > 1">
          <el-button
            @click="currentPhotoIndex = (currentPhotoIndex - 1 + workOrder.photos.length) % workOrder.photos.length"
            :disabled="workOrder.photos.length <= 1"
          >
            上一张
          </el-button>
          <span class="photo-counter">
            {{ currentPhotoIndex + 1 }} / {{ workOrder.photos.length }}
          </span>
          <el-button
            @click="currentPhotoIndex = (currentPhotoIndex + 1) % workOrder.photos.length"
            :disabled="workOrder.photos.length <= 1"
          >
            下一张
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ZoomIn, Microphone } from '@element-plus/icons-vue'
import { workOrderAPI, userAPI } from '../api/services'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const workOrder = ref<any>(null)
const progressRecords = ref<any[]>([])
const comments = ref<any[]>([])
const users = ref<any[]>([])
const editDialogVisible = ref(false)
const assignDialogVisible = ref(false)
const photoPreviewVisible = ref(false)
const currentPhotoIndex = ref(0)
const newComment = ref('')

const editForm = reactive({
  contact_name: '',
  voice_text: ''
})

const editFormRules = {
  contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }]
}

const assignForm = reactive({
  assigneeId: ''
})

const editFormRef = ref()

// 计算属性
const canEdit = computed(() => {
  return workOrder.value && (workOrder.value.status === 'pending' || workOrder.value.status === 'processing')
})

// 计算工种和安装内容的关联关系
const workTypeWithContents = computed(() => {
  console.log('=== workTypeWithContents 计算开始 ===')
  console.log('workOrder.value:', workOrder.value)
  
  if (!workOrder.value) {
    console.log('workOrder.value 为空，返回空数组')
    return []
  }

  // 优先使用 work_items 字段（包含层次关系）
  if (workOrder.value.work_items && Array.isArray(workOrder.value.work_items) && workOrder.value.work_items.length > 0) {
    console.log('使用 work_items 数据:', workOrder.value.work_items)
    const result = workOrder.value.work_items.map(item => {
      console.log('处理 work_item:', item)
      return {
        category: item.category || item.work_type || '未分类',
        contents: item.contents || item.install_contents || [],
        count: (item.contents || item.install_contents || []).length
      }
    })
    console.log('work_items 处理结果:', result)
    return result
  }

  // 兼容旧数据：如果没有 work_items，使用 work_types 和 install_contents
  console.log('work_items 不存在或不是数组，使用兼容模式')
  console.log('work_types:', workOrder.value.work_types)
  console.log('install_contents:', workOrder.value.install_contents)
  
  if (!workOrder.value.work_types || !workOrder.value.install_contents) {
    console.log('work_types 或 install_contents 为空，返回空数组')
    return []
  }

  // 工种分类数据（与小程序保持一致）
  const workTypeCategories = {
    '穿线': ['网线穿线', '光纤穿线', '电源线穿线'],
    '基础': ['设备基础', '管道基础', '杆塔基础'],
    '手井': ['手井施工'],
    '桥架': ['交换机', 'LED屏', '空调', '巡更', '环控', '监控', '门禁'],
    '管道': ['光缆敷设', '电缆敷设', '管道清洁', '管道维护', '管道安装']
  }

  const result = []
  
  // 遍历实际选中的工种
  workOrder.value.work_types.forEach(workType => {
    // 查找该工种对应的安装内容
    const categoryContents = workTypeCategories[workType] || []
    const selectedContents = workOrder.value.install_contents.filter(content => 
      categoryContents.includes(content)
    )
    
    // 如果该工种下有安装内容，添加到结果中
    if (selectedContents.length > 0) {
      result.push({
        category: workType,
        contents: selectedContents,
        count: selectedContents.length
      })
    } else {
      // 如果没有匹配的安装内容，显示工种本身
      result.push({
        category: workType,
        contents: [],
        count: 0
      })
    }
  })

  // 处理没有对应工种的安装内容
  const allCategorizedContents = Object.values(workTypeCategories).flat()
  const uncategorizedContents = workOrder.value.install_contents.filter(content => 
    !allCategorizedContents.includes(content)
  )
  
  if (uncategorizedContents.length > 0) {
    result.push({
      category: '其他',
      contents: uncategorizedContents,
      count: uncategorizedContents.length
    })
  }
  
  return result
})

// 获取工单详情
const fetchWorkOrderDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const response = await workOrderAPI.getWorkOrderById(id)
    
    // 处理后端返回的数据结构
    const workOrderData = response.workorder || response.data
    
    // 解析JSON字符串字段
    if (workOrderData.work_types && typeof workOrderData.work_types === 'string') {
      try {
        workOrderData.work_types = JSON.parse(workOrderData.work_types.replace(/\\"/g, '"'))
      } catch (e) {
        workOrderData.work_types = []
      }
    }
    
    if (workOrderData.install_contents && typeof workOrderData.install_contents === 'string') {
      try {
        workOrderData.install_contents = JSON.parse(workOrderData.install_contents.replace(/\\"/g, '"'))
      } catch (e) {
        workOrderData.install_contents = []
      }
    }

    // 解析 work_items 字段（包含层次关系）
    if (workOrderData.work_items && typeof workOrderData.work_items === 'string') {
      try {
        console.log('原始 work_items 字符串:', workOrderData.work_items)
        // 处理双重转义的JSON字符串
        let cleanedString = workOrderData.work_items
        // 移除外层引号
        if (cleanedString.startsWith('"') && cleanedString.endsWith('"')) {
          cleanedString = cleanedString.slice(1, -1)
        }
        // 处理转义字符
        cleanedString = cleanedString.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        console.log('清理后的 work_items 字符串:', cleanedString)
        workOrderData.work_items = JSON.parse(cleanedString)
        console.log('解析后的 work_items:', workOrderData.work_items)
      } catch (e) {
        console.error('解析 work_items 失败:', e)
        workOrderData.work_items = null
      }
    }
    
    if (workOrderData.location_info && typeof workOrderData.location_info === 'string') {
      try {
        workOrderData.location_info = JSON.parse(workOrderData.location_info.replace(/\\"/g, '"'))
      } catch (e) {
        workOrderData.location_info = null
      }
    }
    
    workOrder.value = workOrderData
    
    // 填充编辑表单
    Object.assign(editForm, {
      title: workOrder.value.title,
      description: workOrder.value.description,
      priority: workOrder.value.priority,
      contact_name: workOrder.value.contact_name,
      voice_text: workOrder.value.voice_text || ''
    })
  } catch (error) {
    console.error('获取工单详情失败:', error)
    // 使用模拟数据
    workOrder.value = {
      id: route.params.id,
      title: '办公室空调维修',
      description: '3楼办公室空调不制冷，需要维修。经初步检查，可能是制冷剂不足或者压缩机故障。',
      priority: 'high',
      status: 'processing',
      constructionStage: 'maintenance',
      contact: '张三',
      phone: '13800138000',
      assignee: { username: '技术员A' },
      createdAt: new Date().toISOString(),
      // 小程序特有字段
      work_types: ['空调工', '电工'],
      install_contents: ['空调', '电路检修'],
      voice_text: '现场检查发现空调压缩机运转正常，但制冷效果不佳，初步判断是制冷剂泄漏导致，需要检查管路并补充制冷剂。',
      location_info: {
        address: '办公大楼A座3楼办公区',
        floor: 3,
        room: '3A'
      },
      photos: [
        {
          id: '1',
          photo_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=office%20air%20conditioner%20maintenance%20repair%20work%20site%20photo&image_size=square',
          has_watermark: true
        },
        {
          id: '2',
          photo_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=air%20conditioning%20unit%20technical%20inspection%20close%20up&image_size=square',
          has_watermark: true
        },
        {
          id: '3',
          photo_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=hvac%20technician%20working%20on%20office%20cooling%20system&image_size=square',
          has_watermark: true
        }
      ]
    }
    
    Object.assign(editForm, {
      title: workOrder.value.title,
      description: workOrder.value.description,
      priority: workOrder.value.priority,
      contact: workOrder.value.contact,
      phone: workOrder.value.phone
    })
  } finally {
    loading.value = false
  }
}

// 获取进度记录
const fetchProgressRecords = async () => {
  try {
    const id = route.params.id as string
    const response = await workOrderAPI.getWorkOrderProgress(id)
    progressRecords.value = response.data
  } catch (error) {
    console.error('获取进度记录失败:', error)
    // 使用模拟数据
    progressRecords.value = [
      {
        id: '1',
        action: 'created',
        title: '工单创建',
        description: '工单已创建，等待处理',
        user: { username: '张三' },
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        action: 'assigned',
        title: '工单分配',
        description: '工单已分配给技术员A',
        user: { username: '管理员' },
        createdAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: '3',
        action: 'processing',
        title: '开始处理',
        description: '技术员已开始处理工单',
        user: { username: '技术员A' },
        createdAt: new Date(Date.now() - 21600000).toISOString()
      }
    ]
  }
}

// 获取评论
const fetchComments = async () => {
  try {
    const id = route.params.id as string
    const response = await workOrderAPI.getWorkOrderComments(id)
    comments.value = response.data
  } catch (error) {
    console.error('获取评论失败:', error)
    // 使用模拟数据
    comments.value = [
      {
        id: '1',
        content: '已联系维修人员，预计今天下午到达现场',
        user: { username: '技术员A' },
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        id: '2',
        content: '请尽快处理，影响办公效率',
        user: { username: '张三' },
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await userAPI.getUsers()
    // 修复API响应结构：后端返回的是users字段，不是items字段
    users.value = response.data.users || response.data.items || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
    users.value = [
      { id: '1', username: '管理员' },
      { id: '2', username: '技术员A' },
      { id: '3', username: '技术员B' }
    ]
  }
}

// 返回
const goBack = () => {
  router.push('/work-orders')
}

// 更新状态
const updateStatus = async (status: string) => {
  try {
    const id = route.params.id as string
    await workOrderAPI.updateWorkOrderStatus(id, status)
    ElMessage.success('状态更新成功')
    fetchWorkOrderDetail()
    fetchProgressRecords()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 确认取消
const confirmCancel = async () => {
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
    await updateStatus('cancelled')
  } catch (error) {
    // 用户取消操作
  }
}

// 确认编辑
const confirmEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    const id = route.params.id as string
    await workOrderAPI.updateWorkOrder(id, editForm)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    fetchWorkOrderDetail()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('更新失败')
    }
  }
}

// 确认分配
const confirmAssign = async () => {
  if (!assignForm.assigneeId) {
    ElMessage.warning('请选择处理人')
    return
  }
  
  try {
    const id = route.params.id as string
    await workOrderAPI.assignWorkOrder(id, assignForm.assigneeId)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    fetchWorkOrderDetail()
    fetchProgressRecords()
  } catch (error) {
    ElMessage.error('分配失败')
  }
}

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    const id = route.params.id as string
    await workOrderAPI.addWorkOrderComment(id, newComment.value)
    ElMessage.success('评论添加成功')
    newComment.value = ''
    fetchComments()
  } catch (error) {
    ElMessage.error('评论添加失败')
  }
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

// 获取图片URL
const getPhotoUrl = (photo: any) => {
  if (!photo) return ''
  
  // 如果是新格式的图片数据（包含url字段）
  if (photo.url) {
    // 如果是完整的URL，直接返回
    if (photo.url.startsWith('http')) {
      return photo.url
    }
    // 如果是相对路径，拼接服务器地址
    return `http://192.168.0.104:8000${photo.url}`
  }
  
  // 兼容旧格式的图片数据
  if (photo.photo_url) {
    if (photo.photo_url.startsWith('http')) {
      return photo.photo_url
    }
    if (photo.photo_url.startsWith('/uploads')) {
      return `http://192.168.0.104:8000${photo.photo_url}`
    }
    return `http://192.168.0.104:8000${photo.photo_url}`
  }
  
  // 如果是路径格式
  if (photo.path) {
    if (photo.path.startsWith('http')) {
      return photo.path
    }
    return `http://192.168.0.104:8000${photo.path}`
  }
  
  return ''
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.error('图片加载失败:', img.src)
  // 设置一个默认的占位图片
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEzMEg3MEwxMDAgNzBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxjaXJjbGUgY3g9IjEyMCIgY3k9IjgwIiByPSI4IiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LXNpemU9IjEyIj7lm77niYfliKDovb3lpLHotKU8L3RleHQ+Cjwvc3ZnPgo='
  img.alt = '图片加载失败'
}

const getConstructionStageText = (stage: string) => {
  const texts = {
    preparation: '准备阶段',
    foundation: '基础施工',
    structure: '主体结构',
    decoration: '装修阶段',
    completion: '竣工验收',
    maintenance: '维护保养',
    operation: '运营阶段'
  }
  return texts[stage] || '未知'
}

const getTimelineType = (action: string) => {
  const types = {
    created: 'primary',
    assigned: 'info',
    processing: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[action] || 'primary'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 照片预览
const previewPhoto = (index: number) => {
  currentPhotoIndex.value = index
  photoPreviewVisible.value = true
}

// 页面初始化
onMounted(() => {
  fetchWorkOrderDetail()
  fetchProgressRecords()
  fetchComments()
  fetchUsers()
})
</script>

<style scoped>
.work-order-detail {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-btn {
  padding: 8px;
  margin-top: 4px;
}

.title-section h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.title-section p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card,
.work-types-card,
.voice-card,
.photos-card,
.action-card,
.progress-card,
.comment-card {
  border: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
  flex-direction: column;
  align-items: stretch;
}

.info-item label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
  flex-shrink: 0;
}

.description {
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.timeline-content {
  padding-left: 8px;
}

.timeline-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-description {
  color: #606266;
  margin-bottom: 4px;
}

.timeline-user {
  font-size: 12px;
  color: #909399;
}

.add-comment {
  margin-bottom: 24px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 500;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.no-comments {
  text-align: center;
  color: #909399;
  padding: 32px;
}

.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 照片展示样式 */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.photo-item:hover {
  transform: scale(1.02);
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.preview-icon {
  color: white;
  font-size: 24px;
}

/* 照片预览对话框样式 */
.photo-preview-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.photo-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.photo-counter {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .photo-navigation {
    flex-direction: column;
    gap: 12px;
  }
}

/* 小程序特有字段样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-label {
  font-weight: 500;
  color: #606266;
  min-width: 50px;
}

/* 工种和安装内容样式 */
.work-types-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-type-group {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.work-type-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.content-count {
  color: #606266;
  font-size: 14px;
}

.install-contents {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.content-tag {
  margin: 0;
}

.voice-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.voice-icon {
  color: #409eff;
  font-size: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.voice-text {
  color: #303133;
  line-height: 1.6;
  flex: 1;
}
</style>
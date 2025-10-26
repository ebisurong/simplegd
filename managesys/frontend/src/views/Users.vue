<template>
  <div class="users">
    <div class="page-header">
      <h1>用户管理</h1>
      <p>管理系统用户和权限</p>
    </div>
    
    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <div class="action-row">
        <div class="action-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户名或邮箱"
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select
            v-model="filters.role"
            placeholder="角色筛选"
            style="width: 120px"
            clearable
            @change="handleFilter"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="技术员" value="technician" />
            <el-option label="普通用户" value="user" />
          </el-select>
          
          <el-select
            v-model="filters.status"
            placeholder="状态筛选"
            style="width: 120px"
            clearable
            @change="handleFilter"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </div>
        
        <div class="action-right">
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加用户
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="users"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" sortable="custom" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="role" label="角色" width="120" sortable="custom">
          <template #default="{ row }">
            <el-tag
              :type="getRoleType(row.role)"
              size="small"
            >
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" sortable="custom">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180" sortable="custom">
          <template #default="{ row }">
            {{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="showEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="toggleUserStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="confirmDelete(row)"
              :disabled="row.id === currentUserId"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
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
    
    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form
        :model="userForm"
        :rules="userRules"
        ref="userFormRef"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEdit">
          <el-input v-model="userForm.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="技术员" value="technician" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status" style="width: 100%">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { userAPI } from '../api/services'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const loading = ref(false)
const searchQuery = ref('')
const users = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)

const filters = reactive({
  role: '',
  status: ''
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

const userForm = reactive({
  id: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
  status: 'active'
})

const userFormRef = ref()

// 表单验证规则
const userRules = computed(() => {
  const rules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    role: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ],
    status: [
      { required: true, message: '请选择状态', trigger: 'change' }
    ]
  }
  
  if (!isEdit.value) {
    rules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
    ]
    rules.confirmPassword = [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== userForm.password) {
            callback(new Error('两次输入密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
  
  return rules
})

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑用户' : '添加用户'
})

const currentUserId = computed(() => {
  return userStore.user?.id
})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      search: searchQuery.value,
      ...filters,
      sortBy: sortConfig.prop,
      sortOrder: sortConfig.order
    }
    
    const response = await userAPI.getUsers(params)
    users.value = response.data.items || []
    pagination.total = response.data.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
    // 使用模拟数据
    users.value = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: '2',
        username: 'technician1',
        email: 'tech1@example.com',
        role: 'technician',
        status: 'active',
        lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
      },
      {
        id: '3',
        username: 'user1',
        email: 'user1@example.com',
        role: 'user',
        status: 'inactive',
        lastLoginAt: null,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
      }
    ]
    pagination.total = 3
  } finally {
    loading.value = false
  }
}

// 搜索处理
let searchTimer: NodeJS.Timeout
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.page = 1
    fetchUsers()
  }, 500)
}

// 筛选处理
const handleFilter = () => {
  pagination.page = 1
  fetchUsers()
}

// 重置筛选
const resetFilters = () => {
  searchQuery.value = ''
  filters.role = ''
  filters.status = ''
  pagination.page = 1
  fetchUsers()
}

// 排序处理
const handleSortChange = ({ prop, order }) => {
  sortConfig.prop = prop
  sortConfig.order = order === 'ascending' ? 'asc' : 'desc'
  fetchUsers()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchUsers()
}

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (user: any) => {
  isEdit.value = true
  Object.assign(userForm, {
    id: user.id,
    username: user.username,
    email: user.email,
    password: '',
    confirmPassword: '',
    role: user.role,
    status: user.status
  })
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(userForm, {
    id: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    status: 'active'
  })
  if (userFormRef.value) {
    userFormRef.value.clearValidate()
  }
}

// 确认保存
const confirmSave = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    
    if (isEdit.value) {
      await userAPI.updateUser(userForm.id, {
        email: userForm.email,
        role: userForm.role,
        status: userForm.status
      })
      ElMessage.success('用户更新成功')
    } else {
      await userAPI.createUser({
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        status: userForm.status
      })
      ElMessage.success('用户创建成功')
    }
    
    dialogVisible.value = false
    fetchUsers()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '用户更新失败' : '用户创建失败')
    }
  }
}

// 切换用户状态
const toggleUserStatus = async (user: any) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.username}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userAPI.updateUser(user.id, { status: newStatus })
    ElMessage.success(`用户${action}成功`)
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`用户${action}失败`)
    }
  }
}

// 确认删除
const confirmDelete = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await userAPI.deleteUser(user.id)
    ElMessage.success('用户删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('用户删除失败')
    }
  }
}

// 工具函数
const getRoleType = (role: string) => {
  const types = { admin: 'danger', technician: 'warning', user: 'info' }
  return types[role] || 'info'
}

const getRoleText = (role: string) => {
  const texts = { admin: '管理员', technician: '技术员', user: '普通用户' }
  return texts[role] || '未知'
}

const getStatusType = (status: string) => {
  const types = { active: 'success', inactive: 'info' }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = { active: '启用', inactive: '禁用' }
  return texts[status] || '未知'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 页面初始化
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users {
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

.action-card {
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.action-right {
  display: flex;
  gap: 12px;
  align-items: center;
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
  .action-row {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .action-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-left .el-input,
  .action-left .el-select {
    width: 100% !important;
  }
  
  .action-right {
    justify-content: center;
  }
}
</style>
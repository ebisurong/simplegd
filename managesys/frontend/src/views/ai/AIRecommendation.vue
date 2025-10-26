<template>
  <div class="ai-recommendation">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><MagicStick /></el-icon>
        AI智能推荐
      </h1>
      <p class="page-description">基于机器学习的智能处理方案推荐、人员分配建议和优先级调整</p>
    </div>

    <!-- 推荐功能选项卡 -->
    <el-tabs v-model="activeTab" class="recommendation-tabs">
      <!-- 处理方案推荐 -->
      <el-tab-pane label="处理方案推荐" name="solution">
        <div class="recommendation-section">
          <div class="input-panel">
            <h3>工单信息</h3>
            <el-form :model="solutionForm" label-width="100px" class="solution-form">
              <el-form-item label="工单类型">
                <el-select v-model="solutionForm.type" placeholder="请选择工单类型" style="width: 100%">
                  <el-option label="网络故障" value="network" />
                  <el-option label="设备维修" value="equipment" />
                  <el-option label="系统升级" value="upgrade" />
                  <el-option label="安全检查" value="security" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item label="故障描述">
                <el-input
                  v-model="solutionForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请详细描述故障现象和相关信息"
                />
              </el-form-item>
              <el-form-item label="紧急程度">
                <el-radio-group v-model="solutionForm.priority">
                  <el-radio label="low">低</el-radio>
                  <el-radio label="medium">中</el-radio>
                  <el-radio label="high">高</el-radio>
                  <el-radio label="urgent">紧急</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="影响范围">
                <el-checkbox-group v-model="solutionForm.affectedAreas">
                  <el-checkbox label="办公区域">办公区域</el-checkbox>
                  <el-checkbox label="生产区域">生产区域</el-checkbox>
                  <el-checkbox label="服务器机房">服务器机房</el-checkbox>
                  <el-checkbox label="网络设备">网络设备</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="getSolutionRecommendation" :loading="solutionLoading">
                  获取推荐方案
                </el-button>
                <el-button @click="resetSolutionForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="result-panel" v-if="solutionRecommendations.length > 0">
            <h3>推荐处理方案</h3>
            <div class="recommendations-list">
              <div 
                v-for="(recommendation, index) in solutionRecommendations" 
                :key="index" 
                class="recommendation-card"
                :class="{ 'selected': selectedSolution === index }"
                @click="selectSolution(index)"
              >
                <div class="card-header">
                  <div class="solution-title">
                    <h4>{{ recommendation.title }}</h4>
                    <div class="confidence-score">
                      <el-icon><Star /></el-icon>
                      <span>{{ recommendation.confidence }}%</span>
                    </div>
                  </div>
                  <div class="solution-meta">
                    <span class="difficulty" :class="recommendation.difficulty">
                      {{ recommendation.difficultyText }}
                    </span>
                    <span class="duration">{{ recommendation.estimatedTime }}</span>
                  </div>
                </div>
                
                <div class="card-content">
                  <p class="solution-description">{{ recommendation.description }}</p>
                  
                  <div class="solution-steps">
                    <h5>处理步骤</h5>
                    <ol>
                      <li v-for="step in recommendation.steps" :key="step">{{ step }}</li>
                    </ol>
                  </div>
                  
                  <div class="solution-resources">
                    <h5>所需资源</h5>
                    <div class="resources-grid">
                      <div class="resource-item">
                        <span class="resource-label">人员</span>
                        <span class="resource-value">{{ recommendation.resources.personnel }}</span>
                      </div>
                      <div class="resource-item">
                        <span class="resource-label">工具</span>
                        <span class="resource-value">{{ recommendation.resources.tools }}</span>
                      </div>
                      <div class="resource-item">
                        <span class="resource-label">预算</span>
                        <span class="resource-value">{{ recommendation.resources.budget }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="solution-actions">
                    <el-button size="small" type="primary" @click="adoptSolution(recommendation)">
                      采纳方案
                    </el-button>
                    <el-button size="small" @click="viewSimilarCases(recommendation)">
                      查看相似案例
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 人员分配建议 -->
      <el-tab-pane label="人员分配建议" name="assignment">
        <div class="recommendation-section">
          <div class="input-panel">
            <h3>任务信息</h3>
            <el-form :model="assignmentForm" label-width="100px" class="assignment-form">
              <el-form-item label="任务类型">
                <el-select v-model="assignmentForm.taskType" placeholder="请选择任务类型" style="width: 100%">
                  <el-option label="故障排查" value="troubleshooting" />
                  <el-option label="设备安装" value="installation" />
                  <el-option label="系统维护" value="maintenance" />
                  <el-option label="技术支持" value="support" />
                  <el-option label="项目实施" value="implementation" />
                </el-select>
              </el-form-item>
              <el-form-item label="技能要求">
                <el-checkbox-group v-model="assignmentForm.requiredSkills">
                  <el-checkbox label="网络技术">网络技术</el-checkbox>
                  <el-checkbox label="硬件维修">硬件维修</el-checkbox>
                  <el-checkbox label="软件开发">软件开发</el-checkbox>
                  <el-checkbox label="数据库管理">数据库管理</el-checkbox>
                  <el-checkbox label="安全防护">安全防护</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="工作量">
                <el-slider
                  v-model="assignmentForm.workload"
                  :min="1"
                  :max="10"
                  show-stops
                  show-input
                  input-size="small"
                />
              </el-form-item>
              <el-form-item label="截止时间">
                <el-date-picker
                  v-model="assignmentForm.deadline"
                  type="datetime"
                  placeholder="选择截止时间"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="getAssignmentRecommendation" :loading="assignmentLoading">
                  获取分配建议
                </el-button>
                <el-button @click="resetAssignmentForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="result-panel" v-if="assignmentRecommendations.length > 0">
            <h3>推荐人员分配</h3>
            <div class="assignment-list">
              <div v-for="(assignment, index) in assignmentRecommendations" :key="index" class="assignment-card">
                <div class="assignment-header">
                  <div class="assignment-rank">#{{ index + 1 }}</div>
                  <div class="assignment-info">
                    <h4>{{ assignment.name }}</h4>
                    <p>{{ assignment.position }} · {{ assignment.department }}</p>
                  </div>
                  <div class="assignment-score">
                    <div class="score-circle">
                      <el-progress type="circle" :percentage="assignment.matchScore" :width="60" />
                    </div>
                    <span class="score-label">匹配度</span>
                  </div>
                </div>
                
                <div class="assignment-details">
                  <div class="skills-match">
                    <h5>技能匹配</h5>
                    <div class="skills-list">
                      <el-tag 
                        v-for="skill in assignment.skills" 
                        :key="skill.name" 
                        :type="skill.level === 'expert' ? 'success' : skill.level === 'intermediate' ? 'warning' : 'info'"
                        size="small"
                      >
                        {{ skill.name }} ({{ skill.levelText }})
                      </el-tag>
                    </div>
                  </div>
                  
                  <div class="workload-analysis">
                    <h5>工作负荷分析</h5>
                    <div class="workload-info">
                      <div class="workload-item">
                        <span class="label">当前负荷</span>
                        <el-progress :percentage="assignment.currentWorkload" :show-text="false" :stroke-width="8" />
                        <span class="value">{{ assignment.currentWorkload }}%</span>
                      </div>
                      <div class="workload-item">
                        <span class="label">可用时间</span>
                        <span class="value">{{ assignment.availableHours }}小时/周</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="performance-history">
                    <h5>历史表现</h5>
                    <div class="performance-stats">
                      <div class="stat-item">
                        <span class="stat-label">完成任务</span>
                        <span class="stat-value">{{ assignment.completedTasks }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">平均评分</span>
                        <span class="stat-value">{{ assignment.averageRating }}/5</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">按时完成率</span>
                        <span class="stat-value">{{ assignment.onTimeRate }}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="assignment-actions">
                    <el-button size="small" type="primary" @click="assignToUser(assignment)">
                      分配任务
                    </el-button>
                    <el-button size="small" @click="viewUserProfile(assignment)">
                      查看详情
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 优先级调整 -->
      <el-tab-pane label="优先级调整" name="priority">
        <div class="recommendation-section">
          <div class="input-panel">
            <h3>工单列表</h3>
            <div class="priority-controls">
              <el-button type="primary" @click="analyzePriorities" :loading="priorityLoading">
                AI智能分析
              </el-button>
              <el-button @click="refreshWorkOrders">刷新列表</el-button>
            </div>
            
            <el-table :data="workOrders" style="width: 100%; margin-top: 16px;">
              <el-table-column prop="id" label="工单号" width="100" />
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column prop="currentPriority" label="当前优先级" width="120">
                <template #default="scope">
                  <el-tag :type="getPriorityType(scope.row.currentPriority)">{{ scope.row.currentPriorityText }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="180" />
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button size="small" @click="viewWorkOrderDetail(scope.row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="result-panel" v-if="priorityRecommendations.length > 0">
            <h3>优先级调整建议</h3>
            <div class="priority-recommendations">
              <div v-for="(rec, index) in priorityRecommendations" :key="index" class="priority-card">
                <div class="priority-header">
                  <div class="workorder-info">
                    <h4>{{ rec.title }}</h4>
                    <span class="workorder-id">#{{ rec.id }}</span>
                  </div>
                  <div class="priority-change">
                    <div class="priority-from">
                      <el-tag :type="getPriorityType(rec.currentPriority)" size="small">
                        {{ rec.currentPriorityText }}
                      </el-tag>
                    </div>
                    <el-icon class="priority-arrow"><Right /></el-icon>
                    <div class="priority-to">
                      <el-tag :type="getPriorityType(rec.recommendedPriority)" size="small">
                        {{ rec.recommendedPriorityText }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                
                <div class="priority-analysis">
                  <div class="analysis-factors">
                    <h5>影响因素分析</h5>
                    <div class="factors-list">
                      <div v-for="factor in rec.factors" :key="factor.name" class="factor-item">
                        <div class="factor-info">
                          <span class="factor-name">{{ factor.name }}</span>
                          <span class="factor-desc">{{ factor.description }}</span>
                        </div>
                        <div class="factor-weight">
                          <el-progress :percentage="factor.weight" :show-text="false" :stroke-width="6" />
                          <span class="weight-text">{{ factor.weight }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="recommendation-reason">
                    <h5>调整理由</h5>
                    <p>{{ rec.reason }}</p>
                  </div>
                  
                  <div class="impact-analysis">
                    <h5>影响评估</h5>
                    <div class="impact-grid">
                      <div class="impact-item">
                        <span class="impact-label">处理时间</span>
                        <span class="impact-value" :class="rec.impact.timeChange >= 0 ? 'positive' : 'negative'">
                          {{ rec.impact.timeChange >= 0 ? '+' : '' }}{{ rec.impact.timeChange }}小时
                        </span>
                      </div>
                      <div class="impact-item">
                        <span class="impact-label">资源需求</span>
                        <span class="impact-value">{{ rec.impact.resourceChange }}</span>
                      </div>
                      <div class="impact-item">
                        <span class="impact-label">用户满意度</span>
                        <span class="impact-value" :class="rec.impact.satisfactionChange >= 0 ? 'positive' : 'negative'">
                          {{ rec.impact.satisfactionChange >= 0 ? '+' : '' }}{{ rec.impact.satisfactionChange }}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="priority-actions">
                    <el-button size="small" type="primary" @click="applyPriorityChange(rec)">
                      应用调整
                    </el-button>
                    <el-button size="small" @click="ignorePriorityRecommendation(rec)">
                      忽略建议
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 推荐历史 -->
    <div class="history-section">
      <h3>推荐历史</h3>
      <el-table :data="recommendationHistory" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="type" label="推荐类型" width="120" />
        <el-table-column prop="content" label="推荐内容" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'adopted' ? 'success' : scope.row.status === 'ignored' ? 'info' : 'warning'">
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="viewRecommendationDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick,
  Star,
  Right
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('solution')

// 处理方案推荐
const solutionForm = reactive({
  type: '',
  description: '',
  priority: 'medium',
  affectedAreas: []
})
const solutionLoading = ref(false)
const solutionRecommendations = ref([])
const selectedSolution = ref(-1)

// 人员分配建议
const assignmentForm = reactive({
  taskType: '',
  requiredSkills: [],
  workload: 5,
  deadline: null
})
const assignmentLoading = ref(false)
const assignmentRecommendations = ref([])

// 优先级调整
const priorityLoading = ref(false)
const workOrders = ref([
  {
    id: 'WO001',
    title: '服务器机房空调故障',
    type: '设备维修',
    currentPriority: 'high',
    currentPriorityText: '高',
    createdAt: '2024-01-15 09:30:00'
  },
  {
    id: 'WO002',
    title: '办公区网络连接异常',
    type: '网络故障',
    currentPriority: 'medium',
    currentPriorityText: '中',
    createdAt: '2024-01-15 10:15:00'
  },
  {
    id: 'WO003',
    title: '打印机驱动更新',
    type: '系统升级',
    currentPriority: 'low',
    currentPriorityText: '低',
    createdAt: '2024-01-15 11:00:00'
  }
])
const priorityRecommendations = ref([])

// 推荐历史
const recommendationHistory = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    type: '处理方案',
    content: '网络故障 - 重启路由器方案',
    status: 'adopted',
    statusText: '已采纳'
  },
  {
    id: 2,
    time: '2024-01-15 13:45:12',
    type: '人员分配',
    content: '张工程师 - 设备维修任务',
    status: 'adopted',
    statusText: '已采纳'
  },
  {
    id: 3,
    time: '2024-01-15 11:20:08',
    type: '优先级调整',
    content: 'WO001 优先级提升至紧急',
    status: 'pending',
    statusText: '待处理'
  }
])

// 方法
const getSolutionRecommendation = async () => {
  if (!solutionForm.type || !solutionForm.description) {
    ElMessage.warning('请填写完整的工单信息')
    return
  }
  
  solutionLoading.value = true
  
  try {
    // 调用后端API获取处理方案推荐
    const response = await fetch('/api/ai/recommend/solution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(solutionForm)
    })
    
    if (response.ok) {
      const apiResult = await response.json()
      if (apiResult.success && apiResult.data) {
        solutionRecommendations.value = apiResult.data
        ElMessage.success('获取推荐方案成功')
        return
      }
    }
    
    // 如果API调用失败，使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    solutionRecommendations.value = [
      {
        title: '标准网络故障排查方案',
        confidence: 94,
        difficulty: 'easy',
        difficultyText: '简单',
        estimatedTime: '2-4小时',
        description: '基于历史数据分析，该类型故障通常由网络设备配置问题引起，建议按标准流程进行排查。',
        steps: [
          '检查网络设备状态指示灯',
          '验证网络配置参数',
          '重启相关网络设备',
          '测试网络连通性',
          '更新设备固件（如需要）'
        ],
        resources: {
          personnel: '1名网络工程师',
          tools: '网络测试仪、笔记本电脑',
          budget: '￥200-500'
        }
      },
      {
        title: '深度网络诊断方案',
        confidence: 87,
        difficulty: 'medium',
        difficultyText: '中等',
        estimatedTime: '4-8小时',
        description: '适用于复杂网络环境，通过专业工具进行深度诊断和分析。',
        steps: [
          '使用专业网络分析工具扫描',
          '分析网络流量和性能指标',
          '检查网络拓扑结构',
          '优化网络配置参数',
          '制定长期维护计划'
        ],
        resources: {
          personnel: '1名高级网络工程师',
          tools: '专业网络分析仪、配置工具',
          budget: '￥1000-2000'
        }
      },
      {
        title: '应急临时解决方案',
        confidence: 76,
        difficulty: 'easy',
        difficultyText: '简单',
        estimatedTime: '30分钟-1小时',
        description: '快速恢复网络连接的临时方案，适用于紧急情况。',
        steps: [
          '切换到备用网络线路',
          '配置临时网络接入点',
          '通知用户临时解决方案',
          '安排后续正式维修时间'
        ],
        resources: {
          personnel: '1名技术支持人员',
          tools: '备用网络设备、临时线缆',
          budget: '￥100-300'
        }
      }
    ]
    
    ElMessage.success('获取推荐方案成功')
  } catch (error) {
    ElMessage.error('获取推荐方案失败')
  } finally {
    solutionLoading.value = false
  }
}

const getAssignmentRecommendation = async () => {
  if (!assignmentForm.taskType || assignmentForm.requiredSkills.length === 0) {
    ElMessage.warning('请填写完整的任务信息')
    return
  }
  
  assignmentLoading.value = true
  
  try {
    // 调用后端API获取人员分配建议
    const response = await fetch('/api/ai/recommend/assignment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assignmentForm)
    })
    
    if (response.ok) {
      const apiResult = await response.json()
      if (apiResult.success && apiResult.data) {
        assignmentRecommendations.value = apiResult.data
        ElMessage.success('获取分配建议成功')
        return
      }
    }
    
    // 如果API调用失败，使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    assignmentRecommendations.value = [
      {
        name: '张工程师',
        position: '高级网络工程师',
        department: '技术部',
        matchScore: 95,
        skills: [
          { name: '网络技术', level: 'expert', levelText: '专家' },
          { name: '硬件维修', level: 'intermediate', levelText: '中级' },
          { name: '安全防护', level: 'intermediate', levelText: '中级' }
        ],
        currentWorkload: 65,
        availableHours: 20,
        completedTasks: 156,
        averageRating: 4.8,
        onTimeRate: 94
      },
      {
        name: '李工程师',
        position: '网络工程师',
        department: '技术部',
        matchScore: 88,
        skills: [
          { name: '网络技术', level: 'intermediate', levelText: '中级' },
          { name: '硬件维修', level: 'expert', levelText: '专家' },
          { name: '数据库管理', level: 'beginner', levelText: '初级' }
        ],
        currentWorkload: 45,
        availableHours: 30,
        completedTasks: 89,
        averageRating: 4.5,
        onTimeRate: 91
      },
      {
        name: '王工程师',
        position: '系统工程师',
        department: '技术部',
        matchScore: 82,
        skills: [
          { name: '软件开发', level: 'expert', levelText: '专家' },
          { name: '数据库管理', level: 'expert', levelText: '专家' },
          { name: '网络技术', level: 'beginner', levelText: '初级' }
        ],
        currentWorkload: 70,
        availableHours: 15,
        completedTasks: 203,
        averageRating: 4.9,
        onTimeRate: 96
      }
    ]
    
    ElMessage.success('获取分配建议成功')
  } catch (error) {
    ElMessage.error('获取分配建议失败')
  } finally {
    assignmentLoading.value = false
  }
}

const analyzePriorities = async () => {
  priorityLoading.value = true
  
  try {
    // 调用后端API获取优先级调整建议
    const response = await fetch('/api/ai/recommend/priority', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ workOrders: workOrders.value })
    })
    
    if (response.ok) {
      const apiResult = await response.json()
      if (apiResult.success && apiResult.data) {
        priorityRecommendations.value = apiResult.data
        ElMessage.success('优先级分析完成')
        return
      }
    }
    
    // 如果API调用失败，使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    priorityRecommendations.value = [
      {
        id: 'WO001',
        title: '服务器机房空调故障',
        currentPriority: 'high',
        currentPriorityText: '高',
        recommendedPriority: 'urgent',
        recommendedPriorityText: '紧急',
        factors: [
          {
            name: '影响范围',
            description: '影响整个服务器机房运行',
            weight: 85
          },
          {
            name: '业务影响',
            description: '可能导致服务器过热宕机',
            weight: 90
          },
          {
            name: '修复难度',
            description: '需要专业空调维修人员',
            weight: 70
          }
        ],
        reason: '服务器机房空调故障可能导致设备过热，影响核心业务系统运行，建议立即提升优先级。',
        impact: {
          timeChange: -4,
          resourceChange: '+1名专业技师',
          satisfactionChange: 15
        }
      },
      {
        id: 'WO003',
        title: '打印机驱动更新',
        currentPriority: 'low',
        currentPriorityText: '低',
        recommendedPriority: 'medium',
        recommendedPriorityText: '中',
        factors: [
          {
            name: '用户需求',
            description: '多个部门反馈打印问题',
            weight: 60
          },
          {
            name: '处理难度',
            description: '操作简单，耗时较短',
            weight: 40
          },
          {
            name: '影响范围',
            description: '影响日常办公效率',
            weight: 55
          }
        ],
        reason: '虽然不是紧急问题，但影响多个部门日常工作，且处理相对简单，建议适当提升优先级。',
        impact: {
          timeChange: 0,
          resourceChange: '无变化',
          satisfactionChange: 8
        }
      }
    ]
    
    ElMessage.success('优先级分析完成')
  } catch (error) {
    ElMessage.error('优先级分析失败')
  } finally {
    priorityLoading.value = false
  }
}

const selectSolution = (index: number) => {
  selectedSolution.value = index
}

const adoptSolution = async (solution: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要采纳方案"${solution.title}"吗？`,
      '确认采纳',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 添加到历史记录
    recommendationHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      type: '处理方案',
      content: solution.title,
      status: 'adopted',
      statusText: '已采纳'
    })
    
    ElMessage.success('方案已采纳')
  } catch {
    // 用户取消
  }
}

const assignToUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要将任务分配给${user.name}吗？`,
      '确认分配',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    recommendationHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      type: '人员分配',
      content: `${user.name} - ${assignmentForm.taskType}任务`,
      status: 'adopted',
      statusText: '已采纳'
    })
    
    ElMessage.success('任务已分配')
  } catch {
    // 用户取消
  }
}

const applyPriorityChange = async (recommendation: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要将工单${recommendation.id}的优先级调整为"${recommendation.recommendedPriorityText}"吗？`,
      '确认调整',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新工单优先级
    const workOrder = workOrders.value.find(wo => wo.id === recommendation.id)
    if (workOrder) {
      workOrder.currentPriority = recommendation.recommendedPriority
      workOrder.currentPriorityText = recommendation.recommendedPriorityText
    }
    
    recommendationHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      type: '优先级调整',
      content: `${recommendation.id} 优先级调整为${recommendation.recommendedPriorityText}`,
      status: 'adopted',
      statusText: '已采纳'
    })
    
    ElMessage.success('优先级已调整')
  } catch {
    // 用户取消
  }
}

const resetSolutionForm = () => {
  Object.assign(solutionForm, {
    type: '',
    description: '',
    priority: 'medium',
    affectedAreas: []
  })
  solutionRecommendations.value = []
  selectedSolution.value = -1
}

const resetAssignmentForm = () => {
  Object.assign(assignmentForm, {
    taskType: '',
    requiredSkills: [],
    workload: 5,
    deadline: null
  })
  assignmentRecommendations.value = []
}

const refreshWorkOrders = () => {
  ElMessage.success('工单列表已刷新')
}

const getPriorityType = (priority: string) => {
  const types = {
    urgent: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'info'
  }
  return types[priority] || 'info'
}

const viewSimilarCases = (solution: any) => {
  ElMessage.info(`查看与"${solution.title}"相似的历史案例`)
}

const viewUserProfile = (user: any) => {
  ElMessage.info(`查看${user.name}的详细资料`)
}

const viewWorkOrderDetail = (workOrder: any) => {
  ElMessage.info(`查看工单${workOrder.id}的详细信息`)
}

const ignorePriorityRecommendation = (recommendation: any) => {
  ElMessage.info(`已忽略工单${recommendation.id}的优先级调整建议`)
}

const viewRecommendationDetail = (record: any) => {
  ElMessage.info(`查看推荐记录: ${record.content}`)
}
</script>

<style scoped>
.ai-recommendation {
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

.recommendation-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.recommendation-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 20px;
}

.input-panel,
.result-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.input-panel h3,
.result-panel h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.solution-form,
.assignment-form {
  max-width: 100%;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.recommendation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recommendation-card.selected {
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.solution-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.solution-title h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.confidence-score {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #409EFF;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.solution-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.difficulty {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.difficulty.easy {
  background: #f0f9ff;
  color: #67C23A;
}

.difficulty.medium {
  background: #fdf6ec;
  color: #E6A23C;
}

.difficulty.hard {
  background: #fef0f0;
  color: #F56C6C;
}

.duration {
  color: #606266;
  font-size: 12px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.solution-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.solution-steps h5,
.solution-resources h5 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.solution-steps ol {
  margin: 0;
  padding-left: 20px;
}

.solution-steps li {
  margin-bottom: 4px;
  color: #606266;
  font-size: 13px;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.resource-label {
  font-size: 12px;
  color: #606266;
}

.resource-value {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}

.solution-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assignment-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.assignment-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.assignment-rank {
  width: 32px;
  height: 32px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.assignment-info {
  flex: 1;
}

.assignment-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.assignment-info p {
  margin: 0;
  color: #606266;
  font-size: 12px;
}

.assignment-score {
  text-align: center;
}

.score-label {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #606266;
}

.assignment-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skills-match h5,
.workload-analysis h5,
.performance-history h5 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.workload-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workload-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workload-item .label {
  min-width: 60px;
  font-size: 12px;
  color: #606266;
}

.workload-item .value {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}

.performance-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.assignment-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.priority-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.priority-recommendations {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.priority-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.priority-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.workorder-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.workorder-id {
  color: #606266;
  font-size: 12px;
}

.priority-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-arrow {
  color: #409EFF;
}

.priority-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analysis-factors h5,
.recommendation-reason h5,
.impact-analysis h5 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.factors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.factor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.factor-info {
  flex: 1;
}

.factor-name {
  display: block;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.factor-desc {
  font-size: 12px;
  color: #606266;
}

.factor-weight {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}

.weight-text {
  font-size: 12px;
  color: #303133;
  min-width: 30px;
}

.recommendation-reason p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.impact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.impact-label {
  font-size: 12px;
  color: #606266;
}

.impact-value {
  font-size: 12px;
  font-weight: 500;
}

.impact-value.positive {
  color: #67C23A;
}

.impact-value.negative {
  color: #F56C6C;
}

.priority-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.history-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .recommendation-section {
    grid-template-columns: 1fr;
  }
  
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .priority-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
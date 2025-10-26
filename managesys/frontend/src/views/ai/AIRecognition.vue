<template>
  <div class="ai-recognition">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Picture /></el-icon>
        AI图片识别
      </h1>
      <p class="page-description">基于深度学习的设备识别、故障检测和施工进度分析</p>
    </div>

    <!-- 识别功能选项卡 -->
    <el-tabs v-model="activeTab" class="recognition-tabs">
      <!-- 设备识别 -->
      <el-tab-pane label="设备识别" name="equipment">
        <div class="recognition-section">
          <div class="upload-panel">
            <h3>上传设备图片</h3>
            <el-upload
              ref="equipmentUpload"
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleEquipmentUpload"
              :show-file-list="false"
              accept="image/*"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p>将图片拖到此处，或<em>点击上传</em></p>
                  <p class="upload-tip">支持 JPG、PNG 格式，文件大小不超过 10MB</p>
                </div>
              </div>
            </el-upload>
            
            <div v-if="equipmentImage" class="image-preview">
              <img :src="equipmentImage" alt="设备图片" />
              <div class="image-actions">
                <el-button type="primary" @click="recognizeEquipment" :loading="equipmentLoading">
                  开始识别
                </el-button>
                <el-button @click="clearEquipmentImage">重新上传</el-button>
              </div>
            </div>
          </div>

          <div class="result-panel" v-if="equipmentResult">
            <h3>识别结果</h3>
            <div class="recognition-result">
              <div class="result-header">
                <div class="device-info">
                  <h4>{{ equipmentResult.deviceType }}</h4>
                  <p>{{ equipmentResult.deviceModel }}</p>
                  <div class="confidence-badge">
                    <span>置信度: {{ equipmentResult.confidence }}%</span>
                  </div>
                </div>
                <div class="device-status" :class="equipmentResult.status">
                  <el-icon><CircleCheck v-if="equipmentResult.status === 'normal'" /><Warning v-else /></el-icon>
                  <span>{{ equipmentResult.statusText }}</span>
                </div>
              </div>
              
              <div class="detection-details">
                <h5>检测详情</h5>
                <div class="details-grid">
                  <div class="detail-item" v-for="detail in equipmentResult.details" :key="detail.label">
                    <span class="label">{{ detail.label }}</span>
                    <span class="value" :class="detail.status">{{ detail.value }}</span>
                  </div>
                </div>
              </div>
              
              <div class="recommendations" v-if="equipmentResult.recommendations">
                <h5>维护建议</h5>
                <ul>
                  <li v-for="rec in equipmentResult.recommendations" :key="rec">{{ rec }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 故障识别 -->
      <el-tab-pane label="故障识别" name="fault">
        <div class="recognition-section">
          <div class="upload-panel">
            <h3>上传故障图片</h3>
            <el-upload
              ref="faultUpload"
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleFaultUpload"
              :show-file-list="false"
              accept="image/*"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p>将故障图片拖到此处，或<em>点击上传</em></p>
                  <p class="upload-tip">支持设备损坏、异常状态等图片识别</p>
                </div>
              </div>
            </el-upload>
            
            <div v-if="faultImage" class="image-preview">
              <img :src="faultImage" alt="故障图片" />
              <div class="image-actions">
                <el-button type="primary" @click="recognizeFault" :loading="faultLoading">
                  识别故障
                </el-button>
                <el-button @click="clearFaultImage">重新上传</el-button>
              </div>
            </div>
          </div>

          <div class="result-panel" v-if="faultResult">
            <h3>故障分析结果</h3>
            <div class="fault-analysis">
              <div class="fault-summary">
                <div class="fault-type">
                  <h4>{{ faultResult.faultType }}</h4>
                  <div class="severity" :class="faultResult.severity">
                    <el-icon><Warning /></el-icon>
                    <span>{{ faultResult.severityText }}</span>
                  </div>
                </div>
                <div class="fault-confidence">
                  <div class="confidence-circle">
                    <el-progress type="circle" :percentage="faultResult.confidence" :width="80" />
                  </div>
                  <p>识别准确度</p>
                </div>
              </div>
              
              <div class="fault-details">
                <h5>故障特征</h5>
                <div class="features-list">
                  <div v-for="feature in faultResult.features" :key="feature.name" class="feature-item">
                    <div class="feature-info">
                      <span class="feature-name">{{ feature.name }}</span>
                      <span class="feature-desc">{{ feature.description }}</span>
                    </div>
                    <div class="feature-score">
                      <el-progress :percentage="feature.score" :show-text="false" :stroke-width="6" />
                      <span class="score-text">{{ feature.score }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="repair-suggestions">
                <h5>维修建议</h5>
                <div class="suggestions-timeline">
                  <div v-for="(step, index) in faultResult.repairSteps" :key="index" class="step-item">
                    <div class="step-number">{{ index + 1 }}</div>
                    <div class="step-content">
                      <h6>{{ step.title }}</h6>
                      <p>{{ step.description }}</p>
                      <div class="step-meta">
                        <span class="duration">预计时间: {{ step.duration }}</span>
                        <span class="difficulty" :class="step.difficulty">{{ step.difficultyText }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 施工进度识别 -->
      <el-tab-pane label="施工进度" name="progress">
        <div class="recognition-section">
          <div class="upload-panel">
            <h3>上传施工现场图片</h3>
            <el-upload
              ref="progressUpload"
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleProgressUpload"
              :show-file-list="false"
              accept="image/*"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p>将施工现场图片拖到此处，或<em>点击上传</em></p>
                  <p class="upload-tip">自动识别施工进度和完成情况</p>
                </div>
              </div>
            </el-upload>
            
            <div v-if="progressImage" class="image-preview">
              <img :src="progressImage" alt="施工图片" />
              <div class="image-actions">
                <el-button type="primary" @click="recognizeProgress" :loading="progressLoading">
                  分析进度
                </el-button>
                <el-button @click="clearProgressImage">重新上传</el-button>
              </div>
            </div>
          </div>

          <div class="result-panel" v-if="progressResult">
            <h3>施工进度分析</h3>
            <div class="progress-analysis">
              <div class="progress-overview">
                <div class="progress-circle">
                  <el-progress type="circle" :percentage="progressResult.completionRate" :width="120" />
                  <p>总体完成度</p>
                </div>
                <div class="progress-stats">
                  <div class="stat-item">
                    <span class="stat-label">施工阶段</span>
                    <span class="stat-value">{{ progressResult.currentStage }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">预计完成</span>
                    <span class="stat-value">{{ progressResult.estimatedCompletion }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">质量评分</span>
                    <span class="stat-value">{{ progressResult.qualityScore }}/100</span>
                  </div>
                </div>
              </div>
              
              <div class="stage-breakdown">
                <h5>各阶段进度</h5>
                <div class="stages-list">
                  <div v-for="stage in progressResult.stages" :key="stage.name" class="stage-item">
                    <div class="stage-header">
                      <span class="stage-name">{{ stage.name }}</span>
                      <span class="stage-status" :class="stage.status">{{ stage.statusText }}</span>
                    </div>
                    <div class="stage-progress">
                      <el-progress :percentage="stage.progress" :status="stage.status === 'completed' ? 'success' : ''" />
                    </div>
                    <div class="stage-details">
                      <span class="stage-time">{{ stage.timeSpent }} / {{ stage.estimatedTime }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="quality-issues" v-if="progressResult.issues && progressResult.issues.length > 0">
                <h5>质量问题</h5>
                <div class="issues-list">
                  <div v-for="issue in progressResult.issues" :key="issue.id" class="issue-item" :class="issue.severity">
                    <div class="issue-icon">
                      <el-icon><Warning /></el-icon>
                    </div>
                    <div class="issue-content">
                      <h6>{{ issue.title }}</h6>
                      <p>{{ issue.description }}</p>
                      <div class="issue-location">位置: {{ issue.location }}</div>
                    </div>
                    <div class="issue-action">
                      <el-button size="small" type="warning">标记处理</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 识别历史 -->
    <div class="history-section">
      <h3>识别历史</h3>
      <el-table :data="recognitionHistory" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="type" label="识别类型" width="120" />
        <el-table-column prop="result" label="识别结果" />
        <el-table-column prop="confidence" label="置信度" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.confidence >= 90 ? 'success' : scope.row.confidence >= 70 ? 'warning' : 'danger'">
              {{ scope.row.confidence }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="viewHistoryDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import {
  Picture,
  UploadFilled,
  CircleCheck,
  Warning
} from '@element-plus/icons-vue'
import aiUtils from '../../utils/aiUtils.js'
import ImageUtils from '../../utils/imageUtils.js'

// 响应式数据
const activeTab = ref('equipment')

// 设备识别
const equipmentUpload = ref()
const equipmentImage = ref('')
const equipmentLoading = ref(false)
const equipmentResult = ref(null)

// 故障识别
const faultUpload = ref()
const faultImage = ref('')
const faultLoading = ref(false)
const faultResult = ref(null)

// 施工进度识别
const progressUpload = ref()
const progressImage = ref('')
const progressLoading = ref(false)
const progressResult = ref(null)

// 识别历史
const recognitionHistory = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    type: '设备识别',
    result: '网络交换机 - Cisco Catalyst 2960',
    confidence: 94
  },
  {
    id: 2,
    time: '2024-01-15 13:45:12',
    type: '故障识别',
    result: '电源模块故障',
    confidence: 87
  },
  {
    id: 3,
    time: '2024-01-15 11:20:08',
    type: '施工进度',
    result: '布线工程 - 75%完成',
    confidence: 91
  }
])

// 方法
const handleEquipmentUpload = async (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    equipmentImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
  
  // 自动开始识别
  await handleImageUpload(file.raw, 'equipment')
}

// 处理图片上传
const handleImageUpload = async (file: File, type: string) => {
  // 验证图片文件
  const validation = await ImageUtils.validateImage(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  })

  if (!validation.valid) {
    ElMessage.error(validation.errors.join(', '))
    return false
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在识别图片...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 初始化AI工具（如果尚未初始化）
    if (!aiUtils.isInitialized) {
      await aiUtils.initialize()
    }

    // 将文件转换为图像元素
    const imageElement = await ImageUtils.fileToImage(file)
    
    let result
    if (type === 'equipment') {
      result = await aiUtils.recognizeEquipment(imageElement)
      equipmentResult.value = result
      
      // 绘制识别结果
      const canvas = ImageUtils.drawRecognitionResults(imageElement, result)
      equipmentResult.value.processedImage = canvas.toDataURL()
    } else if (type === 'fault') {
      result = await aiUtils.detectFault(imageElement)
      faultResult.value = result
      
      if (result.hasFault) {
        const canvas = ImageUtils.drawRecognitionResults(imageElement, result)
        faultResult.value.processedImage = canvas.toDataURL()
      }
    } else if (type === 'progress') {
      result = await aiUtils.recognizeProgress(imageElement)
      progressResult.value = result
    }

    // 调用后端API保存记录
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      let apiEndpoint = '/api/ai/recognize/equipment'
      if (type === 'fault') {
        apiEndpoint = '/api/ai/recognize/fault'
      } else if (type === 'progress') {
        apiEndpoint = '/api/ai/recognize/progress'
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const apiResult = await response.json()
        console.log('后端识别结果:', apiResult)
        // 可以将后端结果与前端结果合并
        if (apiResult.success && apiResult.data) {
          result = { ...result, ...apiResult.data }
        }
        
        // 更新历史记录
        recognitionHistory.value.unshift({
          id: Date.now(),
          time: new Date().toLocaleString(),
          type: type === 'equipment' ? '设备识别' : type === 'fault' ? '故障识别' : '施工进度',
          result: result.summary || '识别完成',
          confidence: result.confidence || 90
        })
      }
    } catch (error) {
      console.error('调用后端识别API失败:', error)
    }

    ElMessage.success('识别完成')
  } catch (error) {
    console.error('识别失败:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    loading.close()
  }

  return false
}

const handleFaultUpload = async (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    faultImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
  
  // 自动开始识别
  await handleImageUpload(file.raw, 'fault')
}

const handleProgressUpload = async (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    progressImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
  
  // 自动开始识别
  await handleImageUpload(file.raw, 'progress')
}

const recognizeEquipment = async () => {
  equipmentLoading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    equipmentResult.value = {
      deviceType: '网络交换机',
      deviceModel: 'Cisco Catalyst 2960-X',
      confidence: 94,
      status: 'normal',
      statusText: '运行正常',
      details: [
        { label: '设备状态', value: '在线', status: 'normal' },
        { label: '端口数量', value: '24个', status: 'normal' },
        { label: '电源状态', value: '正常', status: 'normal' },
        { label: '温度', value: '42°C', status: 'normal' },
        { label: '风扇状态', value: '正常', status: 'normal' }
      ],
      recommendations: [
        '建议每月清理设备灰尘',
        '检查网线连接是否牢固',
        '定期更新固件版本'
      ]
    }
    
    // 添加到历史记录
    recognitionHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      type: '设备识别',
      result: `${equipmentResult.value.deviceType} - ${equipmentResult.value.deviceModel}`,
      confidence: equipmentResult.value.confidence
    })
    
    ElMessage.success('设备识别完成')
  } catch (error) {
    ElMessage.error('识别失败，请重试')
  } finally {
    equipmentLoading.value = false
  }
}

const recognizeFault = async () => {
  faultLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    faultResult.value = {
      faultType: '电源模块故障',
      severity: 'high',
      severityText: '高风险',
      confidence: 87,
      features: [
        { name: '异常发热', description: '设备温度超过正常范围', score: 92 },
        { name: '指示灯异常', description: '电源指示灯闪烁', score: 85 },
        { name: '噪音异常', description: '风扇运转声音异常', score: 78 }
      ],
      repairSteps: [
        {
          title: '断电检查',
          description: '关闭设备电源，检查电源线连接',
          duration: '10分钟',
          difficulty: 'easy',
          difficultyText: '简单'
        },
        {
          title: '更换电源模块',
          description: '拆卸故障电源模块，安装新的电源模块',
          duration: '30分钟',
          difficulty: 'medium',
          difficultyText: '中等'
        },
        {
          title: '功能测试',
          description: '重新启动设备，测试各项功能是否正常',
          duration: '15分钟',
          difficulty: 'easy',
          difficultyText: '简单'
        }
      ]
    }
    
    recognitionHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      type: '故障识别',
      result: faultResult.value.faultType,
      confidence: faultResult.value.confidence
    })
    
    ElMessage.success('故障识别完成')
  } catch (error) {
    ElMessage.error('识别失败，请重试')
  } finally {
    faultLoading.value = false
  }
}

const recognizeProgress = async () => {
  progressLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    progressResult.value = {
      completionRate: 75,
      currentStage: '设备安装',
      estimatedCompletion: '2024-01-20',
      qualityScore: 88,
      stages: [
        {
          name: '基础施工',
          progress: 100,
          status: 'completed',
          statusText: '已完成',
          timeSpent: '3天',
          estimatedTime: '3天'
        },
        {
          name: '线路布置',
          progress: 90,
          status: 'in-progress',
          statusText: '进行中',
          timeSpent: '2.5天',
          estimatedTime: '3天'
        },
        {
          name: '设备安装',
          progress: 60,
          status: 'in-progress',
          statusText: '进行中',
          timeSpent: '1.5天',
          estimatedTime: '2天'
        },
        {
          name: '调试测试',
          progress: 0,
          status: 'pending',
          statusText: '待开始',
          timeSpent: '0天',
          estimatedTime: '1天'
        }
      ],
      issues: [
        {
          id: 1,
          title: '线缆整理不规范',
          description: '部分网线未按标准进行整理和标识',
          location: 'A区机柜',
          severity: 'medium'
        }
      ]
    }
    
    recognitionHistory.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleString(),
      type: '施工进度',
      result: `${progressResult.value.currentStage} - ${progressResult.value.completionRate}%完成`,
      confidence: 91
    })
    
    ElMessage.success('施工进度分析完成')
  } catch (error) {
    ElMessage.error('分析失败，请重试')
  } finally {
    progressLoading.value = false
  }
}

const clearEquipmentImage = () => {
  equipmentImage.value = ''
  equipmentResult.value = null
}

const clearFaultImage = () => {
  faultImage.value = ''
  faultResult.value = null
}

const clearProgressImage = () => {
  progressImage.value = ''
  progressResult.value = null
}

const viewHistoryDetail = (row: any) => {
  ElMessage.info(`查看识别记录: ${row.result}`)
}
</script>

<style scoped>
.ai-recognition {
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

.recognition-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.recognition-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 20px;
}

.upload-panel,
.result-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.upload-panel h3,
.result-panel h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.upload-demo {
  width: 100%;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  color: #606266;
}

.upload-text em {
  color: #409EFF;
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.image-preview {
  margin-top: 16px;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.recognition-result {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.device-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.device-info p {
  margin: 0 0 8px 0;
  color: #606266;
}

.confidence-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #409EFF;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.device-status.normal {
  background: #f0f9ff;
  color: #67C23A;
}

.device-status.warning {
  background: #fdf6ec;
  color: #E6A23C;
}

.detection-details h5,
.recommendations h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.detail-item .label {
  font-size: 12px;
  color: #606266;
}

.detail-item .value {
  font-size: 12px;
  font-weight: 500;
}

.detail-item .value.normal {
  color: #67C23A;
}

.recommendations ul {
  margin: 0;
  padding-left: 16px;
}

.recommendations li {
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.fault-analysis {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fault-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.fault-type h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.severity {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.severity.high {
  background: #fef0f0;
  color: #F56C6C;
}

.severity.medium {
  background: #fdf6ec;
  color: #E6A23C;
}

.fault-confidence {
  text-align: center;
}

.fault-confidence p {
  margin: 8px 0 0 0;
  color: #606266;
  font-size: 12px;
}

.fault-details h5,
.repair-suggestions h5 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.feature-info {
  flex: 1;
}

.feature-name {
  display: block;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.feature-desc {
  font-size: 12px;
  color: #606266;
}

.feature-score {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.score-text {
  font-size: 12px;
  color: #303133;
  min-width: 30px;
}

.suggestions-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-number {
  width: 24px;
  height: 24px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h6 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.step-content p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 12px;
}

.step-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.duration {
  color: #909399;
}

.difficulty.easy {
  color: #67C23A;
}

.difficulty.medium {
  color: #E6A23C;
}

.difficulty.hard {
  color: #F56C6C;
}

.progress-analysis {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-overview {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}

.progress-circle {
  text-align: center;
}

.progress-circle p {
  margin: 8px 0 0 0;
  color: #606266;
  font-size: 12px;
}

.progress-stats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stage-breakdown h5,
.quality-issues h5 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.stages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.stage-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stage-name {
  font-weight: 500;
  color: #303133;
}

.stage-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.stage-status.completed {
  background: #f0f9ff;
  color: #67C23A;
}

.stage-status.in-progress {
  background: #fdf6ec;
  color: #E6A23C;
}

.stage-status.pending {
  background: #f4f4f5;
  color: #909399;
}

.stage-progress {
  margin-bottom: 8px;
}

.stage-details {
  font-size: 12px;
  color: #606266;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.issue-item.medium {
  background: #fdf6ec;
  border-left-color: #E6A23C;
}

.issue-item.high {
  background: #fef0f0;
  border-left-color: #F56C6C;
}

.issue-icon {
  color: inherit;
  margin-top: 2px;
}

.issue-content {
  flex: 1;
}

.issue-content h6 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.issue-content p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 12px;
}

.issue-location {
  font-size: 11px;
  color: #909399;
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
  .recognition-section {
    grid-template-columns: 1fr;
  }
  
  .fault-summary {
    flex-direction: column;
    gap: 16px;
  }
  
  .progress-overview {
    flex-direction: column;
  }
}
</style>
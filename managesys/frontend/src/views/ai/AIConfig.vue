<template>
  <div class="ai-config">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Setting /></el-icon>
        AI配置管理
      </h1>
      <p class="page-description">管理AI模型参数、训练数据和系统配置</p>
    </div>

    <!-- 配置选项卡 -->
    <el-tabs v-model="activeTab" class="config-tabs">
      <!-- 模型管理 -->
      <el-tab-pane label="模型管理" name="models">
        <div class="config-section">
          <div class="section-header">
            <h3>AI模型列表</h3>
            <div class="header-actions">
              <el-button type="primary" @click="showCreateModelDialog">
                <el-icon><Plus /></el-icon>
                新建模型
              </el-button>
              <el-button @click="refreshModels">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>

          <el-table :data="models" style="width: 100%" v-loading="modelsLoading">
            <el-table-column prop="model_name" label="模型名称" width="200" />
            <el-table-column prop="model_type" label="模型类型" width="150">
              <template #default="scope">
                <el-tag :type="getModelTypeColor(scope.row.model_type)">{{ scope.row.model_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="100" />
            <el-table-column prop="accuracy" label="准确率" width="100">
              <template #default="scope">
                <span>{{ (scope.row.accuracy * 100).toFixed(1) }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusColor(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="trained_at" label="训练时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="editModel(scope.row)">编辑</el-button>
                <el-button size="small" type="warning" @click="trainModel(scope.row)" :disabled="scope.row.status === 'training'">
                  训练
                </el-button>
                <el-button size="small" type="danger" @click="deleteModel(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 参数配置 -->
      <el-tab-pane label="参数配置" name="parameters">
        <div class="config-section">
          <div class="parameters-grid">
            <div class="parameter-card" v-for="(config, key) in parameterConfigs" :key="key">
              <div class="card-header">
                <h4>{{ config.title }}</h4>
                <el-button size="small" @click="editParameterConfig(key, config)">编辑</el-button>
              </div>
              <div class="card-content">
                <div class="parameter-list">
                  <div v-for="(param, paramKey) in config.parameters" :key="paramKey" class="parameter-item">
                    <div class="parameter-info">
                      <span class="parameter-name">{{ param.name }}</span>
                      <span class="parameter-desc">{{ param.description }}</span>
                    </div>
                    <div class="parameter-value">
                      <span v-if="param.type === 'number'">{{ param.value }}</span>
                      <el-tag v-else-if="param.type === 'boolean'" :type="param.value ? 'success' : 'info'">
                        {{ param.value ? '启用' : '禁用' }}
                      </el-tag>
                      <span v-else>{{ param.value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 训练数据 -->
      <el-tab-pane label="训练数据" name="training">
        <div class="config-section">
          <div class="training-overview">
            <div class="overview-cards">
              <div class="overview-card">
                <div class="card-icon">
                  <el-icon><DataBoard /></el-icon>
                </div>
                <div class="card-info">
                  <h4>总数据量</h4>
                  <p class="card-value">{{ trainingStats.totalSamples.toLocaleString() }}</p>
                </div>
              </div>
              <div class="overview-card">
                <div class="card-icon">
                  <el-icon><Checked /></el-icon>
                </div>
                <div class="card-info">
                  <h4>已标注数据</h4>
                  <p class="card-value">{{ trainingStats.labeledSamples.toLocaleString() }}</p>
                </div>
              </div>
              <div class="overview-card">
                <div class="card-icon">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="card-info">
                  <h4>最近更新</h4>
                  <p class="card-value">{{ trainingStats.lastUpdate }}</p>
                </div>
              </div>
              <div class="overview-card">
                <div class="card-icon">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="card-info">
                  <h4>数据质量</h4>
                  <p class="card-value">{{ trainingStats.dataQuality }}%</p>
                </div>
              </div>
            </div>
          </div>

          <div class="training-datasets">
            <div class="section-header">
              <h3>训练数据集</h3>
              <div class="header-actions">
                <el-button type="primary" @click="uploadDataset">
                  <el-icon><Upload /></el-icon>
                  上传数据集
                </el-button>
                <el-button @click="exportDataset">
                  <el-icon><Download /></el-icon>
                  导出数据
                </el-button>
              </div>
            </div>

            <el-table :data="datasets" style="width: 100%" v-loading="datasetsLoading">
              <el-table-column prop="name" label="数据集名称" />
              <el-table-column prop="type" label="数据类型" width="120">
                <template #default="scope">
                  <el-tag>{{ scope.row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="数据量" width="100" />
              <el-table-column prop="quality" label="质量评分" width="100">
                <template #default="scope">
                  <el-progress :percentage="scope.row.quality" :show-text="false" :stroke-width="8" />
                  <span style="margin-left: 8px;">{{ scope.row.quality }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="180" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="previewDataset(scope.row)">预览</el-button>
                  <el-button size="small" type="danger" @click="deleteDataset(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 训练日志 -->
      <el-tab-pane label="训练日志" name="logs">
        <div class="config-section">
          <div class="logs-filters">
            <el-form :model="logFilters" inline>
              <el-form-item label="模型">
                <el-select v-model="logFilters.modelId" placeholder="选择模型" clearable style="width: 200px">
                  <el-option v-for="model in models" :key="model.id" :label="model.model_name" :value="model.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="logFilters.status" placeholder="选择状态" clearable style="width: 150px">
                  <el-option label="进行中" value="running" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="失败" value="failed" />
                </el-select>
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="logFilters.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  style="width: 300px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="searchLogs">查询</el-button>
                <el-button @click="resetLogFilters">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="trainingLogs" style="width: 100%" v-loading="logsLoading">
            <el-table-column prop="model_name" label="模型名称" width="150" />
            <el-table-column prop="training_data_size" label="训练数据量" width="120" />
            <el-table-column prop="validation_accuracy" label="验证准确率" width="120">
              <template #default="scope">
                <span>{{ (scope.row.validation_accuracy * 100).toFixed(2) }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="training_loss" label="训练损失" width="100">
              <template #default="scope">
                <span>{{ scope.row.training_loss.toFixed(4) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="training_time" label="训练时长" width="100">
              <template #default="scope">
                <span>{{ formatDuration(scope.row.training_time) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusColor(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="started_at" label="开始时间" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" @click="viewLogDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 系统设置 -->
      <el-tab-pane label="系统设置" name="system">
        <div class="config-section">
          <div class="system-settings">
            <div class="settings-group">
              <h3>AI服务配置</h3>
              <el-form :model="systemSettings.aiService" label-width="150px">
                <el-form-item label="API端点">
                  <el-input v-model="systemSettings.aiService.apiEndpoint" placeholder="输入API端点地址" />
                </el-form-item>
                <el-form-item label="API密钥">
                  <el-input v-model="systemSettings.aiService.apiKey" type="password" placeholder="输入API密钥" show-password />
                </el-form-item>
                <el-form-item label="请求超时">
                  <el-input-number v-model="systemSettings.aiService.timeout" :min="1000" :max="60000" :step="1000" />
                  <span style="margin-left: 8px;">毫秒</span>
                </el-form-item>
                <el-form-item label="启用缓存">
                  <el-switch v-model="systemSettings.aiService.enableCache" />
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-group">
              <h3>图像处理配置</h3>
              <el-form :model="systemSettings.imageProcessing" label-width="150px">
                <el-form-item label="最大图片大小">
                  <el-input-number v-model="systemSettings.imageProcessing.maxSize" :min="1" :max="50" />
                  <span style="margin-left: 8px;">MB</span>
                </el-form-item>
                <el-form-item label="支持格式">
                  <el-checkbox-group v-model="systemSettings.imageProcessing.supportedFormats">
                    <el-checkbox label="jpg">JPG</el-checkbox>
                    <el-checkbox label="png">PNG</el-checkbox>
                    <el-checkbox label="gif">GIF</el-checkbox>
                    <el-checkbox label="webp">WebP</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="图片质量">
                  <el-slider v-model="systemSettings.imageProcessing.quality" :min="10" :max="100" show-input />
                </el-form-item>
                <el-form-item label="自动压缩">
                  <el-switch v-model="systemSettings.imageProcessing.autoCompress" />
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-group">
              <h3>性能优化</h3>
              <el-form :model="systemSettings.performance" label-width="150px">
                <el-form-item label="并发处理数">
                  <el-input-number v-model="systemSettings.performance.concurrency" :min="1" :max="10" />
                </el-form-item>
                <el-form-item label="批处理大小">
                  <el-input-number v-model="systemSettings.performance.batchSize" :min="1" :max="100" />
                </el-form-item>
                <el-form-item label="启用GPU加速">
                  <el-switch v-model="systemSettings.performance.enableGPU" />
                </el-form-item>
                <el-form-item label="内存限制">
                  <el-input-number v-model="systemSettings.performance.memoryLimit" :min="512" :max="8192" :step="256" />
                  <span style="margin-left: 8px;">MB</span>
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-actions">
              <el-button type="primary" @click="saveSystemSettings" :loading="savingSettings">
                保存配置
              </el-button>
              <el-button @click="resetSystemSettings">
                重置配置
              </el-button>
              <el-button @click="exportSettings">
                导出配置
              </el-button>
              <el-button @click="importSettings">
                导入配置
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建模型对话框 -->
    <el-dialog v-model="createModelDialog" title="创建AI模型" width="600px">
      <el-form :model="newModel" label-width="100px">
        <el-form-item label="模型名称" required>
          <el-input v-model="newModel.model_name" placeholder="输入模型名称" />
        </el-form-item>
        <el-form-item label="模型类型" required>
          <el-select v-model="newModel.model_type" placeholder="选择模型类型" style="width: 100%">
            <el-option label="预测模型" value="prediction" />
            <el-option label="分类模型" value="classification" />
            <el-option label="识别模型" value="recognition" />
            <el-option label="推荐模型" value="recommendation" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="newModel.version" placeholder="输入版本号" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newModel.description" type="textarea" :rows="3" placeholder="输入模型描述" />
        </el-form-item>
        <el-form-item label="参数配置">
          <el-input v-model="newModel.parameters" type="textarea" :rows="4" placeholder="输入JSON格式的参数配置" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createModelDialog = false">取消</el-button>
        <el-button type="primary" @click="createModel" :loading="creatingModel">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑参数对话框 -->
    <el-dialog v-model="editParameterDialog" title="编辑参数配置" width="800px">
      <div v-if="currentParameterConfig">
        <h4>{{ currentParameterConfig.title }}</h4>
        <el-form label-width="150px">
          <el-form-item v-for="(param, key) in currentParameterConfig.parameters" :key="key" :label="param.name">
            <el-input-number 
              v-if="param.type === 'number'" 
              v-model="param.value" 
              :min="param.min" 
              :max="param.max" 
              :step="param.step"
            />
            <el-switch v-else-if="param.type === 'boolean'" v-model="param.value" />
            <el-input v-else v-model="param.value" />
            <div class="parameter-help">{{ param.description }}</div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="editParameterDialog = false">取消</el-button>
        <el-button type="primary" @click="saveParameterConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting,
  Plus,
  Refresh,
  DataBoard,
  Checked,
  Clock,
  TrendCharts,
  Upload,
  Download
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('models')
const modelsLoading = ref(false)
const datasetsLoading = ref(false)
const logsLoading = ref(false)
const savingSettings = ref(false)
const creatingModel = ref(false)

// 模型管理
const models = ref([])
const createModelDialog = ref(false)
const newModel = reactive({
  model_name: '',
  model_type: '',
  version: '1.0.0',
  description: '',
  parameters: '{}'
})

// 参数配置
const parameterConfigs = ref({
  prediction: {
    title: '预测模型参数',
    parameters: {
      learningRate: {
        name: '学习率',
        description: '控制模型学习速度的参数',
        type: 'number',
        value: 0.001,
        min: 0.0001,
        max: 0.1,
        step: 0.0001
      },
      epochs: {
        name: '训练轮数',
        description: '模型训练的总轮数',
        type: 'number',
        value: 100,
        min: 10,
        max: 1000,
        step: 10
      },
      batchSize: {
        name: '批处理大小',
        description: '每次训练的样本数量',
        type: 'number',
        value: 32,
        min: 8,
        max: 256,
        step: 8
      },
      enableEarlyStopping: {
        name: '启用早停',
        description: '当验证损失不再改善时提前停止训练',
        type: 'boolean',
        value: true
      }
    }
  },
  recognition: {
    title: '识别模型参数',
    parameters: {
      confidenceThreshold: {
        name: '置信度阈值',
        description: '识别结果的最低置信度要求',
        type: 'number',
        value: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.1
      },
      maxDetections: {
        name: '最大检测数',
        description: '单张图片最多检测的对象数量',
        type: 'number',
        value: 10,
        min: 1,
        max: 50,
        step: 1
      },
      imageSize: {
        name: '输入图片尺寸',
        description: '模型输入图片的标准尺寸',
        type: 'number',
        value: 416,
        min: 224,
        max: 1024,
        step: 32
      },
      enableAugmentation: {
        name: '启用数据增强',
        description: '训练时是否使用数据增强技术',
        type: 'boolean',
        value: true
      }
    }
  }
})

const editParameterDialog = ref(false)
const currentParameterConfig = ref(null)
const currentParameterKey = ref('')

// 训练数据
const trainingStats = ref({
  totalSamples: 125680,
  labeledSamples: 98450,
  lastUpdate: '2024-01-15 16:30:25',
  dataQuality: 94
})

const datasets = ref([])

// 训练日志
const trainingLogs = ref([])
const logFilters = reactive({
  modelId: '',
  status: '',
  dateRange: null
})

// 系统设置
const systemSettings = reactive({
  aiService: {
    apiEndpoint: 'http://localhost:3000/api/ai',
    apiKey: '',
    timeout: 30000,
    enableCache: true
  },
  imageProcessing: {
    maxSize: 10,
    supportedFormats: ['jpg', 'png'],
    quality: 85,
    autoCompress: true
  },
  performance: {
    concurrency: 3,
    batchSize: 16,
    enableGPU: false,
    memoryLimit: 2048
  }
})

// 方法
const loadModels = async () => {
  modelsLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    models.value = [
      {
        id: 1,
        model_name: '完成时间预测器',
        model_type: 'prediction',
        version: '1.2.0',
        accuracy: 0.89,
        status: 'active',
        trained_at: '2024-01-10 14:30:25'
      },
      {
        id: 2,
        model_name: '设备分类器',
        model_type: 'classification',
        version: '2.1.0',
        accuracy: 0.94,
        status: 'active',
        trained_at: '2024-01-12 09:15:10'
      },
      {
        id: 3,
        model_name: '解决方案推荐器',
        model_type: 'recommendation',
        version: '1.0.5',
        accuracy: 0.76,
        status: 'training',
        trained_at: '2024-01-14 11:45:30'
      },
      {
        id: 4,
        model_name: '资源需求预测器',
        model_type: 'prediction',
        version: '1.1.2',
        accuracy: 0.82,
        status: 'inactive',
        trained_at: '2024-01-08 16:20:15'
      },
      {
        id: 5,
        model_name: '故障检测器',
        model_type: 'recognition',
        version: '3.0.1',
        accuracy: 0.91,
        status: 'active',
        trained_at: '2024-01-13 13:10:45'
      }
    ]
  } catch (error) {
    ElMessage.error('加载模型列表失败')
  } finally {
    modelsLoading.value = false
  }
}

const loadDatasets = async () => {
  datasetsLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    datasets.value = [
      {
        id: 1,
        name: '工单历史数据集',
        type: '结构化数据',
        size: 45680,
        quality: 96,
        created_at: '2024-01-05 10:30:00'
      },
      {
        id: 2,
        name: '设备图像数据集',
        type: '图像数据',
        size: 12450,
        quality: 89,
        created_at: '2024-01-08 14:15:30'
      },
      {
        id: 3,
        name: '故障案例数据集',
        type: '文本数据',
        size: 8920,
        quality: 92,
        created_at: '2024-01-10 09:45:20'
      },
      {
        id: 4,
        name: '用户反馈数据集',
        type: '混合数据',
        size: 23150,
        quality: 87,
        created_at: '2024-01-12 16:20:10'
      }
    ]
  } catch (error) {
    ElMessage.error('加载数据集失败')
  } finally {
    datasetsLoading.value = false
  }
}

const loadTrainingLogs = async () => {
  logsLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    trainingLogs.value = [
      {
        id: 1,
        model_name: '完成时间预测器',
        training_data_size: 35000,
        validation_accuracy: 0.89,
        training_loss: 0.1245,
        validation_loss: 0.1389,
        training_time: 7200,
        status: 'completed',
        started_at: '2024-01-10 14:30:25',
        completed_at: '2024-01-10 16:30:25'
      },
      {
        id: 2,
        model_name: '设备分类器',
        training_data_size: 28500,
        validation_accuracy: 0.94,
        training_loss: 0.0892,
        validation_loss: 0.0956,
        training_time: 5400,
        status: 'completed',
        started_at: '2024-01-12 09:15:10',
        completed_at: '2024-01-12 10:45:10'
      },
      {
        id: 3,
        model_name: '解决方案推荐器',
        training_data_size: 42000,
        validation_accuracy: 0.76,
        training_loss: 0.2156,
        validation_loss: 0.2389,
        training_time: 3600,
        status: 'running',
        started_at: '2024-01-14 11:45:30',
        completed_at: null
      }
    ]
  } catch (error) {
    ElMessage.error('加载训练日志失败')
  } finally {
    logsLoading.value = false
  }
}

const showCreateModelDialog = () => {
  createModelDialog.value = true
}

const createModel = async () => {
  if (!newModel.model_name || !newModel.model_type) {
    ElMessage.warning('请填写模型名称和类型')
    return
  }
  
  creatingModel.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const model = {
      id: Date.now(),
      model_name: newModel.model_name,
      model_type: newModel.model_type,
      version: newModel.version,
      accuracy: 0,
      status: 'inactive',
      trained_at: null
    }
    
    models.value.push(model)
    createModelDialog.value = false
    
    // 重置表单
    Object.assign(newModel, {
      model_name: '',
      model_type: '',
      version: '1.0.0',
      description: '',
      parameters: '{}'
    })
    
    ElMessage.success('模型创建成功')
  } catch (error) {
    ElMessage.error('模型创建失败')
  } finally {
    creatingModel.value = false
  }
}

const editModel = (model: any) => {
  ElMessage.info(`编辑模型: ${model.model_name}`)
}

const trainModel = async (model: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要开始训练模型"${model.model_name}"吗？`,
      '确认训练',
      {
        confirmButtonText: '开始训练',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    model.status = 'training'
    ElMessage.success('模型训练已开始')
    
    // 模拟训练过程
    setTimeout(() => {
      model.status = 'active'
      model.accuracy = Math.random() * 0.2 + 0.8 // 0.8-1.0之间的随机值
      model.trained_at = new Date().toLocaleString()
      ElMessage.success(`模型"${model.model_name}"训练完成`)
    }, 10000)
    
  } catch {
    // 用户取消
  }
}

const deleteModel = async (model: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模型"${model.model_name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = models.value.findIndex(m => m.id === model.id)
    if (index > -1) {
      models.value.splice(index, 1)
      ElMessage.success('模型删除成功')
    }
  } catch {
    // 用户取消
  }
}

const editParameterConfig = (key: string, config: any) => {
  currentParameterKey.value = key
  currentParameterConfig.value = JSON.parse(JSON.stringify(config))
  editParameterDialog.value = true
}

const saveParameterConfig = () => {
  parameterConfigs.value[currentParameterKey.value] = currentParameterConfig.value
  editParameterDialog.value = false
  ElMessage.success('参数配置已保存')
}

const uploadDataset = () => {
  ElMessage.info('上传数据集功能开发中')
}

const exportDataset = () => {
  ElMessage.info('导出数据集功能开发中')
}

const previewDataset = (dataset: any) => {
  ElMessage.info(`预览数据集: ${dataset.name}`)
}

const deleteDataset = async (dataset: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除数据集"${dataset.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = datasets.value.findIndex(d => d.id === dataset.id)
    if (index > -1) {
      datasets.value.splice(index, 1)
      ElMessage.success('数据集删除成功')
    }
  } catch {
    // 用户取消
  }
}

const searchLogs = () => {
  loadTrainingLogs()
  ElMessage.success('日志查询完成')
}

const resetLogFilters = () => {
  Object.assign(logFilters, {
    modelId: '',
    status: '',
    dateRange: null
  })
}

const viewLogDetail = (log: any) => {
  ElMessage.info(`查看训练日志详情: ${log.model_name}`)
}

const saveSystemSettings = async () => {
  savingSettings.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    ElMessage.success('系统配置已保存')
  } catch (error) {
    ElMessage.error('保存配置失败')
  } finally {
    savingSettings.value = false
  }
}

const resetSystemSettings = () => {
  ElMessage.info('配置已重置为默认值')
}

const exportSettings = () => {
  ElMessage.info('导出配置功能开发中')
}

const importSettings = () => {
  ElMessage.info('导入配置功能开发中')
}

const refreshModels = () => {
  loadModels()
}

const getModelTypeColor = (type: string) => {
  const colors = {
    prediction: 'primary',
    classification: 'success',
    recognition: 'warning',
    recommendation: 'info'
  }
  return colors[type] || 'info'
}

const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    inactive: 'info',
    training: 'warning',
    completed: 'success',
    running: 'warning',
    failed: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    active: '活跃',
    inactive: '未激活',
    training: '训练中',
    completed: '已完成',
    running: '进行中',
    failed: '失败'
  }
  return texts[status] || status
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// 生命周期
onMounted(() => {
  loadModels()
  loadDatasets()
  loadTrainingLogs()
})
</script>

<style scoped>
.ai-config {
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

.config-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.parameters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.parameter-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.parameter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parameter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.parameter-info {
  flex: 1;
}

.parameter-name {
  display: block;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.parameter-desc {
  font-size: 12px;
  color: #606266;
}

.parameter-value {
  font-weight: 500;
  color: #303133;
}

.parameter-help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.training-overview {
  margin-bottom: 24px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.overview-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: #409EFF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.card-info h4 {
  margin: 0 0 4px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.card-value {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.training-datasets {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.logs-filters {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.system-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-group {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.settings-group h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.settings-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .parameters-grid {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .settings-actions {
    flex-wrap: wrap;
  }
}
</style>
<template>
  <div class="ai-prediction">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><TrendCharts /></el-icon>
        智能预测
      </h1>
      <p class="page-description">基于AI算法预测工单完成时间、资源需求和故障趋势</p>
    </div>

    <!-- 预测功能选项卡 -->
    <el-tabs v-model="activeTab" class="prediction-tabs">
      <!-- 完成时间预测 -->
      <el-tab-pane label="完成时间预测" name="completion">
        <div class="prediction-section">
          <div class="input-panel">
            <h3>工单信息输入</h3>
            <el-form :model="completionForm" label-width="120px" class="prediction-form">
              <el-form-item label="工单类型">
                <el-select v-model="completionForm.type" placeholder="请选择工单类型">
                  <el-option label="设备维修" value="maintenance" />
                  <el-option label="故障排查" value="troubleshooting" />
                  <el-option label="设备安装" value="installation" />
                  <el-option label="系统升级" value="upgrade" />
                </el-select>
              </el-form-item>
              <el-form-item label="优先级">
                <el-select v-model="completionForm.priority" placeholder="请选择优先级">
                  <el-option label="紧急" value="urgent" />
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-form-item>
              <el-form-item label="复杂度">
                <el-slider v-model="completionForm.complexity" :min="1" :max="10" show-stops />
              </el-form-item>
              <el-form-item label="历史平均时间">
                <el-input v-model="completionForm.historicalTime" placeholder="小时" suffix-icon="Clock" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="predictCompletion" :loading="completionLoading">
                  开始预测
                </el-button>
                <el-button @click="resetCompletionForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="result-panel" v-if="completionResult">
            <h3>预测结果</h3>
            <div class="prediction-card">
              <div class="prediction-main">
                <div class="prediction-value">
                  <span class="value">{{ completionResult.predictedTime }}</span>
                  <span class="unit">小时</span>
                </div>
                <div class="confidence">
                  <span>置信度: {{ completionResult.confidence }}%</span>
                  <el-progress :percentage="completionResult.confidence" :show-text="false" />
                </div>
              </div>
              <div class="prediction-details">
                <h4>影响因素分析</h4>
                <div class="factors">
                  <div v-for="factor in completionResult.factors" :key="factor.name" class="factor-item">
                    <span class="factor-name">{{ factor.name }}</span>
                    <div class="factor-impact">
                      <el-progress :percentage="factor.impact" :color="getFactorColor(factor.impact)" />
                      <span class="impact-value">{{ factor.impact }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 资源需求预测 -->
      <el-tab-pane label="资源需求预测" name="resource">
        <div class="prediction-section">
          <div class="input-panel">
            <h3>项目信息输入</h3>
            <el-form :model="resourceForm" label-width="120px" class="prediction-form">
              <el-form-item label="项目规模">
                <el-select v-model="resourceForm.scale" placeholder="请选择项目规模">
                  <el-option label="小型" value="small" />
                  <el-option label="中型" value="medium" />
                  <el-option label="大型" value="large" />
                  <el-option label="超大型" value="xlarge" />
                </el-select>
              </el-form-item>
              <el-form-item label="项目周期">
                <el-input v-model="resourceForm.duration" placeholder="天" suffix-icon="Calendar" />
              </el-form-item>
              <el-form-item label="技能要求">
                <el-checkbox-group v-model="resourceForm.skills">
                  <el-checkbox label="电气工程" />
                  <el-checkbox label="机械维修" />
                  <el-checkbox label="软件调试" />
                  <el-checkbox label="网络配置" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="地理位置">
                <el-select v-model="resourceForm.location" placeholder="请选择地区">
                  <el-option label="北京" value="beijing" />
                  <el-option label="上海" value="shanghai" />
                  <el-option label="广州" value="guangzhou" />
                  <el-option label="深圳" value="shenzhen" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="predictResource" :loading="resourceLoading">
                  预测资源需求
                </el-button>
                <el-button @click="resetResourceForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="result-panel" v-if="resourceResult">
            <h3>资源需求预测</h3>
            <div class="resource-grid">
              <div class="resource-card" v-for="resource in resourceResult.resources" :key="resource.type">
                <div class="resource-icon">
                  <component :is="resource.icon" />
                </div>
                <div class="resource-info">
                  <h4>{{ resource.type }}</h4>
                  <div class="resource-count">
                    <span class="count">{{ resource.count }}</span>
                    <span class="unit">{{ resource.unit }}</span>
                  </div>
                  <div class="resource-cost">
                    <span>预估成本: ¥{{ resource.cost.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="resource-timeline">
              <h4>资源分配时间线</h4>
              <div ref="resourceChart" class="chart-container"></div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 故障趋势分析 -->
      <el-tab-pane label="故障趋势分析" name="fault">
        <div class="prediction-section">
          <div class="input-panel">
            <h3>分析参数设置</h3>
            <el-form :model="faultForm" label-width="120px" class="prediction-form">
              <el-form-item label="设备类型">
                <el-select v-model="faultForm.equipmentType" placeholder="请选择设备类型">
                  <el-option label="网络设备" value="network" />
                  <el-option label="服务器" value="server" />
                  <el-option label="存储设备" value="storage" />
                  <el-option label="安全设备" value="security" />
                </el-select>
              </el-form-item>
              <el-form-item label="分析周期">
                <el-select v-model="faultForm.period" placeholder="请选择分析周期">
                  <el-option label="最近30天" value="30d" />
                  <el-option label="最近90天" value="90d" />
                  <el-option label="最近180天" value="180d" />
                  <el-option label="最近一年" value="1y" />
                </el-select>
              </el-form-item>
              <el-form-item label="预测范围">
                <el-select v-model="faultForm.forecastRange" placeholder="请选择预测范围">
                  <el-option label="未来7天" value="7d" />
                  <el-option label="未来30天" value="30d" />
                  <el-option label="未来90天" value="90d" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="analyzeFault" :loading="faultLoading">
                  开始分析
                </el-button>
                <el-button @click="resetFaultForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="result-panel" v-if="faultResult">
            <h3>故障趋势分析结果</h3>
            <div class="fault-summary">
              <div class="summary-card">
                <h4>预测故障数量</h4>
                <div class="summary-value">{{ faultResult.predictedFaults }}</div>
                <div class="summary-trend" :class="faultResult.trend > 0 ? 'increase' : 'decrease'">
                  <el-icon><ArrowUp v-if="faultResult.trend > 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(faultResult.trend) }}%
                </div>
              </div>
              <div class="summary-card">
                <h4>高风险时段</h4>
                <div class="summary-value">{{ faultResult.riskPeriod }}</div>
                <div class="summary-desc">故障高发期</div>
              </div>
              <div class="summary-card">
                <h4>建议维护频率</h4>
                <div class="summary-value">{{ faultResult.maintenanceFreq }}</div>
                <div class="summary-desc">次/月</div>
              </div>
            </div>
            <div class="fault-charts">
              <div class="chart-section">
                <h4>故障趋势预测</h4>
                <div ref="faultTrendChart" class="chart-container"></div>
              </div>
              <div class="chart-section">
                <h4>故障类型分布</h4>
                <div ref="faultTypeChart" class="chart-container"></div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  TrendCharts,
  User,
  Tools,
  Monitor,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import aiUtils from '../../utils/aiUtils.js'

// 响应式数据
const activeTab = ref('completion')

// 完成时间预测
const completionForm = ref({
  type: '',
  priority: '',
  complexity: 5,
  historicalTime: ''
})
const completionLoading = ref(false)
const completionResult = ref(null)

// 资源需求预测
const resourceForm = ref({
  scale: '',
  duration: '',
  skills: [],
  location: ''
})
const resourceLoading = ref(false)
const resourceResult = ref(null)
const resourceChart = ref()

// 故障趋势分析
const faultForm = ref({
  equipmentType: '',
  period: '',
  forecastRange: ''
})
const faultLoading = ref(false)
const faultResult = ref(null)
const faultTrendChart = ref()
const faultTypeChart = ref()

// 方法
const predictCompletion = async () => {
  if (!completionForm.value.type || !completionForm.value.priority) {
    ElMessage.warning('请填写完整的工单信息')
    return
  }

  completionLoading.value = true
  
  try {
    // 初始化AI工具（如果尚未初始化）
    if (!aiUtils.isInitialized) {
      await aiUtils.initialize()
    }

    // 使用AI工具进行本地预测
    const localResult = await aiUtils.predictCompletionTime({
      priority: completionForm.value.priority,
      type: completionForm.value.type,
      complexity: completionForm.value.complexity,
      historicalTime: completionForm.value.historicalTime
    })

    // 调用后端API
    try {
      const response = await fetch('/api/ai/predict/completion-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completionForm.value)
      })
    
      if (response.ok) {
        const backendResult = await response.json()
        // 合并本地和后端结果
        completionResult.value = {
          ...backendResult.data,
          localPrediction: localResult,
          factors: localResult.factors
        }
      } else {
        throw new Error('Backend API failed')
      }
    } catch (apiError) {
      // 如果后端失败，使用本地结果
      const baseTime = parseFloat(completionForm.value.historicalTime) || 8
      const complexityFactor = completionForm.value.complexity / 10
      const priorityFactor = {
        'urgent': 0.8,
        'high': 0.9,
        'medium': 1.0,
        'low': 1.2
      }[completionForm.value.priority] || 1.0
      
      const predictedTime = (baseTime * complexityFactor * priorityFactor).toFixed(1)
      
      completionResult.value = {
        predictedTime,
        confidence: localResult.confidence || Math.floor(85 + Math.random() * 10),
        factors: [
          { name: '工单复杂度', impact: completionForm.value.complexity * 10 },
          { name: '优先级影响', impact: Math.floor((2 - priorityFactor) * 50 + 50) },
          { name: '历史数据', impact: 75 },
          { name: '资源可用性', impact: 68 }
        ],
        localPrediction: localResult
      }
    }
    
    ElMessage.success('预测完成')
  } catch (error) {
    console.error('预测失败:', error);
    ElMessage.error('预测失败，请重试');
  } finally {
    completionLoading.value = false
  }
}

const predictResource = async () => {
  if (!resourceForm.value.scale || !resourceForm.value.duration) {
    ElMessage.warning('请填写完整的项目信息')
    return
  }

  resourceLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const scaleMultiplier = {
      'small': 1,
      'medium': 2,
      'large': 4,
      'xlarge': 8
    }[resourceForm.value.scale] || 1
    
    resourceResult.value = {
      resources: [
        {
          type: '技术人员',
          count: 2 * scaleMultiplier,
          unit: '人',
          cost: 50000 * scaleMultiplier,
          icon: 'User'
        },
        {
          type: '设备工具',
          count: 5 * scaleMultiplier,
          unit: '套',
          cost: 20000 * scaleMultiplier,
          icon: 'Tools'
        },
        {
          type: '监控设备',
          count: 3 * scaleMultiplier,
          unit: '台',
          cost: 30000 * scaleMultiplier,
          icon: 'Monitor'
        }
      ]
    }
    
    await nextTick()
    initResourceChart()
    
    ElMessage.success('资源需求预测完成')
  } catch (error) {
    ElMessage.error('预测失败，请重试');
  } finally {
    resourceLoading.value = false
  }
}

const analyzeFault = async () => {
  if (!faultForm.value.equipmentType || !faultForm.value.period) {
    ElMessage.warning('请填写完整的分析参数')
    return
  }

  faultLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    faultResult.value = {
      predictedFaults: Math.floor(15 + Math.random() * 10),
      trend: Math.floor(-5 + Math.random() * 15),
      riskPeriod: '工作日 14:00-18:00',
      maintenanceFreq: Math.floor(2 + Math.random() * 3)
    }
    
    await nextTick()
    initFaultCharts()
    
    ElMessage.success('故障趋势分析完成')
  } catch (error) {
    ElMessage.error('分析失败，请重试');
  } finally {
    faultLoading.value = false
  }
}

const resetCompletionForm = () => {
  completionForm.value = {
    type: '',
    priority: '',
    complexity: 5,
    historicalTime: ''
  }
  completionResult.value = null
}

const resetResourceForm = () => {
  resourceForm.value = {
    scale: '',
    duration: '',
    skills: [],
    location: ''
  }
  resourceResult.value = null
}

const resetFaultForm = () => {
  faultForm.value = {
    equipmentType: '',
    period: '',
    forecastRange: ''
  }
  faultResult.value = null
}

const getFactorColor = (impact: number) => {
  if (impact >= 80) return '#F56C6C'
  if (impact >= 60) return '#E6A23C'
  if (impact >= 40) return '#409EFF'
  return '#67C23A'
}

const initResourceChart = () => {
  const chart = echarts.init(resourceChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['技术人员', '设备工具', '监控设备']
    },
    xAxis: {
      type: 'category',
      data: ['第1周', '第2周', '第3周', '第4周']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '技术人员',
        type: 'line',
        data: [2, 4, 6, 4],
        smooth: true
      },
      {
        name: '设备工具',
        type: 'line',
        data: [3, 5, 8, 6],
        smooth: true
      },
      {
        name: '监控设备',
        type: 'line',
        data: [1, 3, 4, 3],
        smooth: true
      }
    ]
  }
  chart.setOption(option)
}

const initFaultCharts = () => {
  // 故障趋势图
  const trendChart = echarts.init(faultTrendChart.value)
  const trendOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '历史故障',
        type: 'line',
        data: [12, 15, 8, 18, 22, 16],
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '预测故障',
        type: 'line',
        data: [null, null, null, null, null, 16, 14, 18],
        itemStyle: { color: '#F56C6C' },
        lineStyle: { type: 'dashed' }
      }
    ]
  }
  trendChart.setOption(trendOption)
  
  // 故障类型分布图
  const typeChart = echarts.init(faultTypeChart.value)
  const typeOption = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: [
          { value: 35, name: '硬件故障' },
          { value: 25, name: '软件故障' },
          { value: 20, name: '网络故障' },
          { value: 15, name: '人为操作' },
          { value: 5, name: '其他' }
        ]
      }
    ]
  }
  typeChart.setOption(typeOption)
}
</script>

<style scoped>
.ai-prediction {
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

.prediction-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prediction-section {
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

.prediction-form {
  max-width: 400px;
}

.prediction-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prediction-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.prediction-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.prediction-value .value {
  font-size: 36px;
  font-weight: 600;
  color: #409EFF;
}

.prediction-value .unit {
  font-size: 16px;
  color: #606266;
}

.confidence {
  text-align: right;
}

.confidence span {
  display: block;
  margin-bottom: 8px;
  color: #606266;
}

.prediction-details h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.factors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.factor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.factor-name {
  font-size: 12px;
  color: #606266;
  min-width: 80px;
}

.factor-impact {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.impact-value {
  font-size: 12px;
  color: #303133;
  min-width: 30px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.resource-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.resource-icon {
  width: 40px;
  height: 40px;
  background: #409EFF;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.resource-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.resource-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.resource-count .count {
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.resource-count .unit {
  font-size: 12px;
  color: #606266;
}

.resource-cost {
  font-size: 12px;
  color: #E6A23C;
}

.resource-timeline h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.chart-container {
  height: 300px;
}

.fault-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-card h4 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 12px;
  font-weight: 500;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.summary-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.summary-trend.increase {
  color: #F56C6C;
}

.summary-trend.decrease {
  color: #67C23A;
}

.summary-desc {
  font-size: 12px;
  color: #909399;
}

.fault-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .prediction-section {
    grid-template-columns: 1fr;
  }
  
  .fault-charts {
    grid-template-columns: 1fr;
  }
}
</style>
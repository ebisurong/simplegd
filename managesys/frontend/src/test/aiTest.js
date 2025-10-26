// AI功能测试文件
import aiUtils from '../utils/aiUtils.js'

// 测试AI工具初始化
async function testAIInitialization() {
  console.log('开始测试AI工具初始化...')
  
  try {
    await aiUtils.initialize()
    console.log('✅ AI工具初始化成功')
    
    // 测试TensorFlow.js
    if (aiUtils.isInitialized) {
      console.log('✅ TensorFlow.js 已加载')
    } else {
      console.log('❌ TensorFlow.js 未正确加载')
    }
    
    // 测试OpenCV.js
    if (window.cv && window.cv.Mat) {
      console.log('✅ OpenCV.js 已加载')
    } else {
      console.log('❌ OpenCV.js 未正确加载')
    }
    
    // 创建一个模拟的图像元素用于测试
    const canvas = document.createElement('canvas')
    canvas.width = 224
    canvas.height = 224
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#cccccc'
    ctx.fillRect(0, 0, 224, 224)
    
    // 测试设备识别功能
    try {
      const deviceResult = await aiUtils.recognizeEquipment(canvas)
      console.log('设备识别测试结果:', deviceResult)
    } catch (error) {
      console.warn('设备识别测试失败:', error)
    }
    
    // 测试故障检测功能
    try {
      const faultResult = await aiUtils.detectFault(canvas)
      console.log('故障检测测试结果:', faultResult)
    } catch (error) {
      console.warn('故障检测测试失败:', error)
    }
    
    // 测试施工进度识别功能
    try {
      const progressResult = await aiUtils.recognizeProgress(canvas)
      console.log('施工进度识别测试结果:', progressResult)
    } catch (error) {
      console.warn('施工进度识别测试失败:', error)
    }
    
    // 测试工单完成时间预测
    const mockWorkOrder = {
      priority: 'high',
      type: 'maintenance',
      complexity: 'medium',
      assignedUsers: 2
    }
    try {
      const predictionResult = await aiUtils.predictCompletionTime(mockWorkOrder)
      console.log('完成时间预测测试结果:', predictionResult)
    } catch (error) {
      console.warn('完成时间预测测试失败:', error)
    }
    
    console.log('🎉 所有AI功能测试完成')
    
  } catch (error) {
    console.error('❌ AI工具测试失败:', error)
  }
}

// 导出测试函数
export { testAIInitialization }

// 如果在浏览器环境中直接运行
if (typeof window !== 'undefined') {
  window.testAI = testAIInitialization
  console.log('AI测试函数已挂载到 window.testAI，可在控制台中调用')
}
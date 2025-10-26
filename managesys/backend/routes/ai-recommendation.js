const express = require('express');
const { AIRecommendation, WorkOrder, User, AIModel } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 获取处理方案推荐
router.post('/solution', async (req, res) => {
  try {
    const { workOrderId, problemType, urgency, location } = req.body;

    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 获取推荐模型
    const model = await AIModel.findOne({
      where: { model_name: 'solution_recommender', status: 'active' }
    });

    if (!model) {
      return res.status(404).json({ error: '解决方案推荐模型未找到' });
    }

    // 获取当前工单信息
    const workOrder = await WorkOrder.findByPk(workOrderId);
    if (!workOrder) {
      return res.status(404).json({ error: '工单不存在' });
    }

    // 查找相似的历史工单
    const similarWorkOrders = await WorkOrder.findAll({
      where: {
        id: { [Op.ne]: workOrderId },
        status: '已完成',
        [Op.or]: [
          { title: { [Op.like]: `%${problemType}%` } },
          { description: { [Op.like]: `%${problemType}%` } },
          { location: location }
        ]
      },
      limit: 10,
      order: [['updated_at', 'DESC']]
    });

    // 生成解决方案推荐
    const solutionTemplates = {
      '设备故障': [
        {
          title: '标准检修流程',
          steps: ['断电安全检查', '故障诊断', '更换损坏部件', '功能测试', '恢复供电'],
          estimated_time: '2-4小时',
          success_rate: 0.92,
          cost_estimate: '500-1500元'
        },
        {
          title: '应急修复方案',
          steps: ['临时隔离故障', '启用备用设备', '制定正式维修计划'],
          estimated_time: '30分钟-1小时',
          success_rate: 0.85,
          cost_estimate: '200-800元'
        }
      ],
      '安装任务': [
        {
          title: '标准安装流程',
          steps: ['现场勘察', '材料准备', '设备安装', '调试测试', '验收交付'],
          estimated_time: '4-8小时',
          success_rate: 0.95,
          cost_estimate: '1000-3000元'
        },
        {
          title: '快速安装方案',
          steps: ['预制准备', '现场快装', '基础测试'],
          estimated_time: '2-4小时',
          success_rate: 0.88,
          cost_estimate: '800-2000元'
        }
      ],
      '维护保养': [
        {
          title: '定期维护流程',
          steps: ['设备检查', '清洁保养', '润滑维护', '性能测试', '记录更新'],
          estimated_time: '1-3小时',
          success_rate: 0.98,
          cost_estimate: '200-600元'
        }
      ]
    };

    const solutions = solutionTemplates[problemType] || solutionTemplates['设备故障'];
    
    // 根据紧急程度调整推荐
    let recommendedSolutions = solutions.map(solution => {
      let adjustedSolution = { ...solution };
      
      if (urgency === '紧急') {
        adjustedSolution.priority_score = solution.success_rate * 0.7 + 0.3; // 优先快速方案
        if (solution.title.includes('应急') || solution.title.includes('快速')) {
          adjustedSolution.priority_score += 0.2;
        }
      } else {
        adjustedSolution.priority_score = solution.success_rate; // 优先成功率高的方案
      }
      
      return adjustedSolution;
    });

    // 按优先级排序
    recommendedSolutions.sort((a, b) => b.priority_score - a.priority_score);

    // 计算相似度分数
    const similarityScore = similarWorkOrders.length > 0 ? 
      Math.min(0.95, 0.6 + (similarWorkOrders.length / 10) * 0.3) : 0.6;

    // 保存推荐结果
    const recommendation = await AIRecommendation.create({
      work_order_id: workOrderId,
      recommendation_type: 'solution',
      recommendation_data: JSON.stringify({
        solutions: recommendedSolutions,
        similar_cases: similarWorkOrders.length,
        factors: { problemType, urgency, location }
      }),
      similarity_score: similarityScore,
      success_rate: recommendedSolutions[0]?.success_rate || 0.8
    });

    res.json({
      success: true,
      recommendation: {
        id: recommendation.id,
        solutions: recommendedSolutions,
        similar_cases_count: similarWorkOrders.length,
        similarity_score: similarityScore,
        factors: { problemType, urgency, location }
      }
    });

  } catch (error) {
    console.error('解决方案推荐失败:', error);
    res.status(500).json({ error: '推荐失败，请稍后重试' });
  }
});

// 获取人员分配建议
router.post('/personnel', async (req, res) => {
  try {
    const { workOrderId, skillsRequired, urgency, location, workload } = req.body;

    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 获取所有可用技术人员
    const availableUsers = await User.findAll({
      where: {
        role: { [Op.in]: ['技术员', '工程师', '主管'] },
        status: '在职'
      }
    });

    if (availableUsers.length === 0) {
      return res.status(404).json({ error: '暂无可用技术人员' });
    }

    // 模拟人员技能和工作负载数据
    const personnelData = availableUsers.map(user => {
      const skills = {
        '电气': Math.random(),
        '机械': Math.random(),
        '网络': Math.random(),
        '消防': Math.random(),
        '空调': Math.random()
      };
      
      const currentWorkload = Math.floor(Math.random() * 10); // 当前工单数量
      const experience = Math.floor(Math.random() * 15) + 1; // 工作经验年数
      const locationDistance = Math.random() * 50; // 距离工作地点的距离(km)
      
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        skills: skills,
        experience: experience,
        current_workload: currentWorkload,
        location_distance: locationDistance,
        availability: currentWorkload < 5 ? '空闲' : currentWorkload < 8 ? '一般' : '繁忙'
      };
    });

    // 计算人员匹配分数
    const scoredPersonnel = personnelData.map(person => {
      let score = 0;
      
      // 技能匹配分数 (40%)
      if (skillsRequired && skillsRequired.length > 0) {
        const skillScore = skillsRequired.reduce((sum, skill) => {
          return sum + (person.skills[skill] || 0);
        }, 0) / skillsRequired.length;
        score += skillScore * 0.4;
      } else {
        score += 0.3; // 默认技能分数
      }
      
      // 工作负载分数 (25%)
      const workloadScore = Math.max(0, (10 - person.current_workload) / 10);
      score += workloadScore * 0.25;
      
      // 经验分数 (20%)
      const experienceScore = Math.min(1, person.experience / 10);
      score += experienceScore * 0.2;
      
      // 距离分数 (15%)
      const distanceScore = Math.max(0, (50 - person.location_distance) / 50);
      score += distanceScore * 0.15;
      
      // 紧急情况下优先考虑可用性
      if (urgency === '紧急' && person.current_workload < 3) {
        score += 0.1;
      }
      
      return {
        ...person,
        match_score: Math.min(1, score),
        recommendation_reason: generateRecommendationReason(person, score, urgency)
      };
    });

    // 按匹配分数排序
    scoredPersonnel.sort((a, b) => b.match_score - a.match_score);

    // 生成团队组合建议
    const teamSuggestions = generateTeamSuggestions(scoredPersonnel, workload, urgency);

    // 保存推荐结果
    const recommendation = await AIRecommendation.create({
      work_order_id: workOrderId,
      recommendation_type: 'personnel',
      recommendation_data: JSON.stringify({
        individual_recommendations: scoredPersonnel.slice(0, 5),
        team_suggestions: teamSuggestions,
        factors: { skillsRequired, urgency, location, workload }
      }),
      similarity_score: scoredPersonnel[0]?.match_score || 0.5,
      success_rate: calculateTeamSuccessRate(scoredPersonnel.slice(0, 3))
    });

    res.json({
      success: true,
      recommendation: {
        id: recommendation.id,
        individual_recommendations: scoredPersonnel.slice(0, 5),
        team_suggestions: teamSuggestions,
        factors: { skillsRequired, urgency, location, workload }
      }
    });

  } catch (error) {
    console.error('人员分配推荐失败:', error);
    res.status(500).json({ error: '推荐失败，请稍后重试' });
  }
});

// 获取优先级调整建议
router.post('/priority', async (req, res) => {
  try {
    const { workOrderId, currentPriority, factors } = req.body;

    if (!workOrderId) {
      return res.status(400).json({ error: '工单ID不能为空' });
    }

    // 获取工单信息
    const workOrder = await WorkOrder.findByPk(workOrderId);
    if (!workOrder) {
      return res.status(404).json({ error: '工单不存在' });
    }

    // 分析优先级影响因素
    const priorityFactors = {
      safety_impact: factors?.safetyImpact || 'low', // 安全影响
      business_impact: factors?.businessImpact || 'medium', // 业务影响
      customer_satisfaction: factors?.customerSatisfaction || 'medium', // 客户满意度
      resource_availability: factors?.resourceAvailability || 'high', // 资源可用性
      deadline_pressure: factors?.deadlinePressure || 'medium' // 截止日期压力
    };

    // 计算优先级调整建议
    let priorityScore = 0;
    const priorityWeights = {
      safety_impact: 0.3,
      business_impact: 0.25,
      customer_satisfaction: 0.2,
      deadline_pressure: 0.15,
      resource_availability: 0.1
    };

    const impactScores = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'critical': 1.0
    };

    Object.keys(priorityFactors).forEach(factor => {
      const impact = priorityFactors[factor];
      priorityScore += (impactScores[impact] || 0.5) * priorityWeights[factor];
    });

    // 确定建议优先级
    let suggestedPriority;
    if (priorityScore >= 0.8) {
      suggestedPriority = '紧急';
    } else if (priorityScore >= 0.6) {
      suggestedPriority = '高';
    } else if (priorityScore >= 0.4) {
      suggestedPriority = '中';
    } else {
      suggestedPriority = '低';
    }

    // 生成调整原因和建议
    const adjustmentReasons = [];
    const actionSuggestions = [];

    if (priorityFactors.safety_impact === 'high' || priorityFactors.safety_impact === 'critical') {
      adjustmentReasons.push('存在安全风险，需要优先处理');
      actionSuggestions.push('立即安排安全检查和防护措施');
    }

    if (priorityFactors.business_impact === 'high' || priorityFactors.business_impact === 'critical') {
      adjustmentReasons.push('对业务运营影响较大');
      actionSuggestions.push('协调资源确保业务连续性');
    }

    if (priorityFactors.deadline_pressure === 'high') {
      adjustmentReasons.push('临近截止日期，时间紧迫');
      actionSuggestions.push('加快处理流程，必要时增加人力投入');
    }

    const confidence = Math.min(0.95, 0.7 + Math.abs(priorityScore - 0.5) * 0.5);

    // 保存推荐结果
    const recommendation = await AIRecommendation.create({
      work_order_id: workOrderId,
      recommendation_type: 'priority',
      recommendation_data: JSON.stringify({
        current_priority: currentPriority,
        suggested_priority: suggestedPriority,
        priority_score: priorityScore,
        factors: priorityFactors,
        adjustment_reasons: adjustmentReasons,
        action_suggestions: actionSuggestions
      }),
      similarity_score: confidence,
      success_rate: confidence
    });

    res.json({
      success: true,
      recommendation: {
        id: recommendation.id,
        current_priority: currentPriority,
        suggested_priority: suggestedPriority,
        priority_score: priorityScore,
        confidence: confidence,
        should_adjust: currentPriority !== suggestedPriority,
        factors: priorityFactors,
        adjustment_reasons: adjustmentReasons,
        action_suggestions: actionSuggestions
      }
    });

  } catch (error) {
    console.error('优先级调整推荐失败:', error);
    res.status(500).json({ error: '推荐失败，请稍后重试' });
  }
});

// 采纳推荐建议
router.post('/adopt/:recommendationId', async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { feedback } = req.body;

    const recommendation = await AIRecommendation.findByPk(recommendationId);
    if (!recommendation) {
      return res.status(404).json({ error: '推荐记录不存在' });
    }

    // 更新采纳状态
    await recommendation.update({
      is_adopted: true,
      adopted_at: new Date()
    });

    res.json({
      success: true,
      message: '推荐建议已采纳',
      feedback: feedback
    });

  } catch (error) {
    console.error('采纳推荐失败:', error);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// 获取推荐历史记录
router.get('/history/:workOrderId', async (req, res) => {
  try {
    const { workOrderId } = req.params;
    const { type } = req.query;

    const whereClause = { work_order_id: workOrderId };
    if (type) {
      whereClause.recommendation_type = type;
    }

    const recommendations = await AIRecommendation.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      recommendations: recommendations.map(r => ({
        id: r.id,
        type: r.recommendation_type,
        data: JSON.parse(r.recommendation_data),
        similarity_score: r.similarity_score,
        success_rate: r.success_rate,
        is_adopted: r.is_adopted,
        adopted_at: r.adopted_at,
        created_at: r.created_at
      }))
    });

  } catch (error) {
    console.error('获取推荐历史失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

// 辅助函数：生成推荐原因
function generateRecommendationReason(person, score, urgency) {
  const reasons = [];
  
  if (person.current_workload < 3) {
    reasons.push('当前工作负载较轻');
  }
  
  if (person.experience > 5) {
    reasons.push('经验丰富');
  }
  
  if (person.location_distance < 10) {
    reasons.push('距离工作地点较近');
  }
  
  if (urgency === '紧急' && person.availability === '空闲') {
    reasons.push('紧急情况下可立即响应');
  }
  
  return reasons.join('，');
}

// 辅助函数：生成团队组合建议
function generateTeamSuggestions(personnel, workload, urgency) {
  const suggestions = [];
  
  // 单人团队
  if (workload === 'light' || personnel[0]?.match_score > 0.8) {
    suggestions.push({
      type: '单人作业',
      members: [personnel[0]],
      estimated_efficiency: 0.85,
      cost_estimate: '标准成本',
      suitable_for: ['简单维修', '常规检查', '小型安装']
    });
  }
  
  // 双人团队
  if (personnel.length >= 2) {
    suggestions.push({
      type: '双人协作',
      members: personnel.slice(0, 2),
      estimated_efficiency: 0.92,
      cost_estimate: '1.8倍标准成本',
      suitable_for: ['中等复杂度任务', '需要配合的工作', '安全要求较高的作业']
    });
  }
  
  // 多人团队（紧急或复杂任务）
  if ((urgency === '紧急' || workload === 'heavy') && personnel.length >= 3) {
    suggestions.push({
      type: '多人团队',
      members: personnel.slice(0, 3),
      estimated_efficiency: 0.95,
      cost_estimate: '2.5倍标准成本',
      suitable_for: ['紧急抢修', '大型项目', '复杂技术问题']
    });
  }
  
  return suggestions;
}

// 辅助函数：计算团队成功率
function calculateTeamSuccessRate(teamMembers) {
  if (!teamMembers || teamMembers.length === 0) return 0.5;
  
  const avgScore = teamMembers.reduce((sum, member) => sum + member.match_score, 0) / teamMembers.length;
  const teamSynergy = teamMembers.length > 1 ? 0.1 : 0; // 团队协作加成
  
  return Math.min(0.98, avgScore + teamSynergy);
}

module.exports = router;
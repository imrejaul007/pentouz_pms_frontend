import { api } from './api';

export interface FinancialSummary {
  totalImpacts: number;
  totalDirectCosts: number;
  totalIndirectCosts: number;
  totalRevenueImpact: number;
  averageImpactPerBypass: number;
  totalRecoveredAmount: number;
  byCategory: Array<{
    category: boolean;
    cost: number;
  }>;
}

export interface CostTrend {
  _id: {
    year: number;
    month: number;
  };
  totalCost: number;
  bypassCount: number;
  averageCost: number;
}

export interface CostDriver {
  _id: string;
  totalCost: number;
  frequency: number;
  averageCost: number;
}

export interface BudgetImpact {
  _id: string;
  totalImpact: number;
  totalBudget: number;
  bypassCount: number;
  averageImpact: number;
  overBudgetCount: number;
}

export interface RecoveryData {
  totalImpacts: number;
  totalOutstanding: number;
  totalRecovered: number;
  totalImpactAmount: number;
  overallRecoveryPercentage: number;
  totalRecoveryActions: number;
  completedActions: number;
  actionCompletionRate: number;
  byStatus: Array<{
    status: string;
    amount: number;
    percentage: number;
  }>;
}

export interface FinancialImpact {
  _id: string;
  impactId: string;
  hotelId: string;
  bypassAuditId: {
    bypassId: string;
    reason: {
      category: string;
      description: string;
      urgencyLevel: string;
    };
    securityMetadata: {
      riskScore: number;
    };
  };
  bookingContext: {
    bookingNumber: string;
    roomNumber: string;
    roomType: string;
    guestName: string;
    totalBookingValue: number;
    currency: string;
  };
  directCosts: {
    totalDirectCost: number;
    inventoryItems: Array<{
      itemName: string;
      category: string;
      quantity: number;
      totalCost: number;
      wasBypassed: boolean;
    }>;
    laborCosts: {
      adminTime: { hours: number; totalCost: number };
      managerTime: { hours: number; totalCost: number };
      housekeepingTime: { hours: number; totalCost: number };
      maintenanceTime: { hours: number; totalCost: number };
    };
  };
  indirectCosts: {
    totalIndirectCost: number;
    guestSatisfaction: {
      compensationProvided: number;
      discountGiven: number;
      estimatedFutureRevenueLoss: number;
      reputationImpact: string;
    };
  };
  revenueImpact: {
    netRevenueImpact: number;
    revenueImpactPercentage: number;
  };
  budgetImpact: {
    affectedDepartments: Array<{
      departmentName: string;
      impactAmount: number;
      impactPercentage: number;
      isOverBudget: boolean;
    }>;
    fiscalImpact: {
      fiscalYear: number;
      fiscalQuarter: number;
      quarterlyBudgetImpact: number;
    };
  };
  recovery: {
    recoveredAmount: number;
    recoveryPercentage: number;
    outstandingAmount: number;
    recoveryActions: Array<{
      actionType: string;
      description: string;
      status: string;
      expectedSavings: number;
      actualSavings?: number;
    }>;
  };
  analytics: {
    frequencyPattern: {
      isRecurring: boolean;
      recurrenceInterval: number;
      similarBypassesCount: number;
    };
    costTrends: {
      monthlyTrend: string;
      projectedMonthlyCost: number;
    };
    predictiveIndicators: {
      likelyToRecur: boolean;
      recurrenceProbability: number;
      preventionRecommendations: string[];
    };
  };
  reconciliation: {
    status: string;
    totalReconciledImpact: number;
  };
  totalFinancialImpact: number;
  budgetImpactSeverity: string;
  createdAt: string;
}

export interface ExecutiveReport {
  generatedAt: string;
  timeRange: string;
  summary: {
    totalFinancialImpact: number;
    totalBypasses: number;
    averageImpactPerBypass: number;
    recoveryRate: number;
  };
  keyMetrics: {
    directCosts: number;
    indirectCosts: number;
    revenueImpact: number;
    recoveredAmount: number;
  };
  trends: {
    costTrend: string;
    monthlyData: CostTrend[];
  };
  topCostDrivers: CostDriver[];
  budgetImpact: BudgetImpact[];
  recovery: {
    totalRecovered: number;
    totalOutstanding: number;
    averageRecoveryRate: number;
  };
  patterns: {
    recurringBypasses: number;
    oneTimeBypasses: number;
  };
  recommendations: Array<{
    category: string;
    priority: string;
    title: string;
    description: string;
    action: string;
  }>;
}

export interface PredictiveAnalytics {
  _id: string;
  monthlyData: Array<{
    year: number;
    month: number;
    count: number;
    totalCost: number;
    averageCost: number;
  }>;
  totalOccurrences: number;
  totalCost: number;
  recurringOccurrences: number;
  recurrenceRate: number;
  averageMonthlyCost: number;
  projectedMonthlyCost: number;
}

class BypassFinancialService {
  /**
   * Get financial summary for the hotel
   */
  async getFinancialSummary(timeRange: number = 30): Promise<{ data: FinancialSummary }> {
    console.log('🌐 API: Calling financial summary endpoint with timeRange:', timeRange);
    console.log('🌐 API: Full URL:', `/admin-bypass-management/summary?timeRange=${timeRange}`);
    
    try {
      const response = await api.get(`/admin-bypass-management/summary?timeRange=${timeRange}`);
      console.log('🌐 API: Financial summary response status:', response.status);
      console.log('🌐 API: Financial summary response data:', response.data);
      console.log('🌐 API: Summary data.data:', response.data.data);
      console.log('🌐 API: Summary totalImpacts:', response.data.data?.totalImpacts);
      console.log('🌐 API: Summary totalDirectCosts:', response.data.data?.totalDirectCosts);
      return response.data;
    } catch (error: any) {
      console.error('🌐 API: Financial summary error:', error);
      console.error('🌐 API: Error status:', error.response?.status);
      console.error('🌐 API: Error data:', error.response?.data);
      throw error;
    }
  }

  /**
   * Get cost trends analysis
   */
  async getCostTrends(months: number = 12): Promise<{ data: CostTrend[] }> {
    const response = await api.get(`/admin-bypass-management/trends?months=${months}`);
    return response.data;
  }

  /**
   * Get top cost drivers
   */
  async getTopCostDrivers(limit: number = 10): Promise<{ data: CostDriver[] }> {
    const response = await api.get(`/admin-bypass-management/cost-drivers?limit=${limit}`);
    return response.data;
  }

  /**
   * Get financial impact details for a specific bypass
   */
  async getFinancialImpact(impactId: string): Promise<{ data: FinancialImpact }> {
    const response = await api.get(`/admin-bypass-management/impact/${impactId}`);
    return response.data;
  }

  /**
   * Get all financial impacts with filtering
   */
  async getFinancialImpacts(params: {
    timeRange?: number;
    severity?: string;
    status?: string;
    department?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ data: FinancialImpact[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/admin-bypass-management/impacts?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get budget impact analysis
   */
  async getBudgetImpact(params: {
    fiscalYear?: number;
    fiscalQuarter?: number;
    department?: string;
  } = {}): Promise<{ data: BudgetImpact[] }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/admin-bypass-management/budget-impact?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get recovery tracking data
   */
  async getRecoveryData(timeRange: number = 90): Promise<{ data: RecoveryData }> {
    const response = await api.get(`/admin-bypass-management/recovery?timeRange=${timeRange}`);
    return response.data;
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(params: {
    category?: string;
    months?: number;
  } = {}): Promise<{ data: PredictiveAnalytics[] }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/admin-bypass-management/predictive?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Generate executive report
   */
  async getExecutiveReport(timeRange: number = 90, format: string = 'json'): Promise<{ data: ExecutiveReport }> {
    const response = await api.get(`/admin-bypass-management/executive-report?timeRange=${timeRange}&format=${format}`);
    return response.data;
  }

  /**
   * Export executive report as PDF
   */
  async exportExecutiveReport(timeRange: number = 90, format: string = 'pdf'): Promise<{ data: any }> {
    const response = await api.get(`/admin-bypass-management/executive-report?timeRange=${timeRange}&format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Update financial impact record
   */
  async updateFinancialImpact(impactId: string, updateData: Partial<FinancialImpact>): Promise<{ data: FinancialImpact }> {
    const response = await api.put(`/admin-bypass-management/impact/${impactId}`, updateData);
    return response.data;
  }

  /**
   * Add recovery action
   */
  async addRecoveryAction(impactId: string, actionData: {
    actionType: string;
    description: string;
    assignedTo?: string;
    targetDate: string;
    costToImplement?: number;
    expectedSavings?: number;
  }): Promise<{ data: any }> {
    const response = await api.post(`/admin-bypass-management/impact/${impactId}/recovery-action`, actionData);
    return response.data;
  }

  /**
   * Complete recovery action
   */
  async completeRecoveryAction(impactId: string, actionId: string, actualSavings: number): Promise<{ data: any }> {
    const response = await api.put(`/admin-bypass-management/impact/${impactId}/recovery-action/${actionId}/complete`, {
      actualSavings
    });
    return response.data;
  }

  /**
   * Get financial impact trends by category
   */
  async getCategoryTrends(category?: string, months: number = 6): Promise<{ data: any }> {
    const params = new URLSearchParams({ months: months.toString() });
    if (category) {
      params.append('category', category);
    }

    const response = await api.get(`/admin-bypass-management/predictive?${params.toString()}`);
    return response.data;
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimizationRecommendations(timeRange: number = 90): Promise<{ data: any }> {
    const report = await this.getExecutiveReport(timeRange);
    return {
      data: report.data.recommendations.filter(rec => rec.category === 'cost_optimization' || rec.category === 'cost_reduction')
    };
  }

  /**
   * Get department performance analysis
   */
  async getDepartmentPerformance(department?: string): Promise<{ data: any }> {
    const budgetData = await this.getBudgetImpact({ department });
    const impacts = await this.getFinancialImpacts({ department, limit: 100 });

    return {
      data: {
        budgetImpact: budgetData.data,
        recentImpacts: impacts.data,
        performance: this.calculateDepartmentPerformance(budgetData.data, impacts.data)
      }
    };
  }

  /**
   * Calculate department performance metrics
   */
  private calculateDepartmentPerformance(budgetData: BudgetImpact[], impacts: FinancialImpact[]) {
    if (budgetData.length === 0) return null;

    const dept = budgetData[0];
    const avgImpact = impacts.reduce((sum, impact) => sum + impact.totalFinancialImpact, 0) / impacts.length;
    const recoveryRate = impacts.reduce((sum, impact) => sum + impact.recovery.recoveryPercentage, 0) / impacts.length;

    return {
      budgetUtilization: (dept.totalImpact / dept.totalBudget) * 100,
      averageImpactPerBypass: avgImpact,
      recoveryRate,
      performanceScore: this.calculatePerformanceScore(dept, avgImpact, recoveryRate),
      trend: this.determineTrend(impacts),
      recommendations: this.generateDepartmentRecommendations(dept, avgImpact, recoveryRate)
    };
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(dept: BudgetImpact, avgImpact: number, recoveryRate: number): number {
    let score = 100;

    // Deduct points for budget overruns
    const budgetUtilization = (dept.totalImpact / dept.totalBudget) * 100;
    if (budgetUtilization > 100) {
      score -= Math.min(50, (budgetUtilization - 100) * 2);
    }

    // Deduct points for high average impact
    if (avgImpact > 1000) {
      score -= Math.min(30, (avgImpact - 1000) / 100);
    }

    // Add points for good recovery rate
    if (recoveryRate > 50) {
      score += Math.min(20, (recoveryRate - 50) / 2.5);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Determine trend direction
   */
  private determineTrend(impacts: FinancialImpact[]): string {
    if (impacts.length < 2) return 'stable';

    const sortedImpacts = impacts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstHalf = sortedImpacts.slice(0, Math.ceil(sortedImpacts.length / 2));
    const secondHalf = sortedImpacts.slice(Math.floor(sortedImpacts.length / 2));

    const firstAvg = firstHalf.reduce((sum, impact) => sum + impact.totalFinancialImpact, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, impact) => sum + impact.totalFinancialImpact, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate department-specific recommendations
   */
  private generateDepartmentRecommendations(dept: BudgetImpact, avgImpact: number, recoveryRate: number): string[] {
    const recommendations = [];

    if (dept.overBudgetCount > 0) {
      recommendations.push('Implement stricter budget controls and approval processes');
    }

    if (avgImpact > 1000) {
      recommendations.push('Focus on prevention strategies to reduce high-impact bypasses');
    }

    if (recoveryRate < 30) {
      recommendations.push('Improve recovery action implementation and tracking');
    }

    if (dept.bypassCount > 20) {
      recommendations.push('Conduct root cause analysis to identify systemic issues');
    }

    return recommendations;
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Get severity color for financial impact
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'minimal':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Get trend icon name
   */
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      default:
        return 'minus';
    }
  }

  /**
   * Calculate ROI for recovery actions
   */
  calculateRecoveryROI(recoveryActions: any[]): number {
    const totalCost = recoveryActions.reduce((sum, action) => sum + (action.costToImplement || 0), 0);
    const totalSavings = recoveryActions.reduce((sum, action) => sum + (action.actualSavings || action.expectedSavings || 0), 0);

    if (totalCost === 0) return 0;
    return ((totalSavings - totalCost) / totalCost) * 100;
  }
}

export const bypassFinancialService = new BypassFinancialService();
export default bypassFinancialService;

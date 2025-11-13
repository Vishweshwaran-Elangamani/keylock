// src/utils/slaCalculations.js - CLOSED SLA COMPLIANCE CALCULATION
// ✅ MODIFIED: Includes auto-closure support, escalation tracking, and enhanced compliance logic
 
/**
 * ✅ Calculate urgency status based on deadline and SLA status
 * Closed SLAs show compliance status (OnTime/Breached/Extended)
 * Open SLAs show urgency (Overdue/Due Soon/On Track)
 */
export const calculateUrgencyStatus = (deadline, status, complianceStatus) => {
    // ✅ Closed SLAs show their compliance status
    if (status === 'Closed') {
      return complianceStatus || 'Completed';
    }
   
    // Open SLAs show time-based urgency
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
   
    if (daysUntilDeadline < 0) return 'Overdue';
    if (daysUntilDeadline <= 2) return 'Due Soon';
    if (daysUntilDeadline <= 7) return 'Upcoming';
    return 'On Track';
  };
   
  /**
   * ✅ Calculate days until deadline for open SLAs
   * Returns negative if overdue
   */
  export const calculateDaysUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  };
   
  /**
   * ✅ Get compliance rating based on percentage
   */
  export const getComplianceRating = (percentage) => {
    if (percentage >= 95) return { rating: 'Outstanding', color: '#24A148', icon: '🌟' };
    if (percentage >= 85) return { rating: 'Excellent', color: '#0F62FE', icon: '⭐' };
    if (percentage >= 75) return { rating: 'Good', color: '#F1C21B', icon: '✅' };
    if (percentage >= 60) return { rating: 'Fair', color: '#FF832B', icon: '⚠️' };
    return { rating: 'Critical', color: '#DA1E28', icon: '❌' };
  };
   
  /**
   * ✅ NEW: Get SLA status badge for display
   */
  export const getStatusBadge = (status, complianceStatus) => {
    const statusMap = {
      'Open': { bg: 'bg-primary', text: 'text-white', icon: '📂' },
      'InProgress': { bg: 'bg-info', text: 'text-white', icon: '⏳' },
      'Closed': { bg: 'bg-success', text: 'text-white', icon: '✅' },
      'Breached': { bg: 'bg-danger', text: 'text-white', icon: '❌' },
      'Extended': { bg: 'bg-warning', text: 'text-dark', icon: '⚠️' }
    };
   
    return statusMap[status] || { bg: 'bg-secondary', text: 'text-white', icon: '❓' };
  };
   
  /**
   * ✅ NEW: Detect if SLA is auto-closed
   */
  export const isAutoClosedSLA = (sla) => {
    return sla.status === 'Closed' && sla.isAutoClosed === true;
  };
   
  /**
   * ✅ NEW: Get days since closure
   */
  export const getDaysSinceClosure = (closedAt) => {
    if (!closedAt) return null;
    const now = new Date();
    const closureDate = new Date(closedAt);
    return Math.floor((now - closureDate) / (1000 * 60 * 60 * 24));
  };
   
  /**
   * ✅ IMPROVED: Calculate compliance percentage based on CLOSED SLAs ONLY
   * Includes auto-closed SLAs in the calculation
   * Compliance = (Closed SLAs On Time) / (Total Closed SLAs) * 100
   */
  export const calculateCompliancePercentage = (slaData) => {
    // Handle both old format and new format
    if (typeof slaData === 'number' && typeof arguments[1] === 'number') {
      // Old format: calculateCompliancePercentage(onTimeSLAs, totalSLAs)
      const onTimeSLAs = slaData;
      const totalSLAs = arguments[1];
      if (totalSLAs === 0) return 0;
      return ((onTimeSLAs / totalSLAs) * 100).toFixed(1);
    }
   
    // New format: calculateCompliancePercentage(slaArray)
    if (!Array.isArray(slaData)) {
      console.warn('⚠️ Invalid input for compliance calculation');
      return 0;
    }
   
    // ✅ Filter ONLY Closed SLAs (includes auto-closed)
    const closedSLAs = slaData.filter(sla => sla.status === 'Closed');
   
    if (closedSLAs.length === 0) {
      console.warn('⚠️ No closed SLAs found for compliance calculation');
      return 0;
    }
   
    // Count OnTime Closed SLAs
    const onTimeClosedSLAs = closedSLAs.filter(sla =>
      sla.complianceStatus === 'OnTime' || sla.complianceStatus === 'On Time'
    ).length;
   
    // Count auto-closed (breached) SLAs separately for reporting
    const autoClosedBreachedCount = closedSLAs.filter(sla =>
      sla.isAutoClosed === true && sla.complianceStatus === 'Breached'
    ).length;
   
    const percentage = ((onTimeClosedSLAs / closedSLAs.length) * 100).toFixed(1);
   
    console.log('📊 Compliance Calculation (Closed SLAs Only):', {
      totalClosedSLAs: closedSLAs.length,
      onTimeClosedSLAs,
      autoClosedBreached: autoClosedBreachedCount,
      percentage: `${percentage}%`
    });
   
    return percentage;
  };
   
  /**
   * ✅ IMPROVED: Get compliance summary from SLA array
   * Returns detailed breakdown of closed SLA compliance including auto-closure metrics
   */
  export const getComplianceSummary = (slaData) => {
    if (!Array.isArray(slaData) || slaData.length === 0) {
      return {
        totalSLAs: 0,
        closedSLAs: 0,
        openSLAs: 0,
        onTimeSLAs: 0,
        breachedSLAs: 0,
        extendedSLAs: 0,
        autoClosedCount: 0,
        compliancePercentage: 0,
        rating: 'No Data',
        summary: 'No SLAs available'
      };
    }
   
    // Filter SLAs by status
    const closedSLAs = slaData.filter(sla => sla.status === 'Closed');
    const openSLAs = slaData.filter(sla => sla.status !== 'Closed');
    const autoClosedSLAs = closedSLAs.filter(sla => sla.isAutoClosed === true);
   
    // ✅ Calculate compliance from CLOSED SLAs ONLY
    const onTimeSLAs = closedSLAs.filter(sla =>
      sla.complianceStatus === 'OnTime' || sla.complianceStatus === 'On Time'
    ).length;
   
    const breachedSLAs = closedSLAs.filter(sla =>
      sla.complianceStatus === 'Breached'
    ).length;
   
    const extendedSLAs = closedSLAs.filter(sla =>
      sla.complianceStatus === 'Extended'
    ).length;
   
    const compliancePercentage = closedSLAs.length > 0
      ? ((onTimeSLAs / closedSLAs.length) * 100).toFixed(1)
      : 0;
   
    const { rating, color, icon } = getComplianceRating(compliancePercentage);
   
    return {
      totalSLAs: slaData.length,
      closedSLAs: closedSLAs.length,
      openSLAs: openSLAs.length,
      onTimeSLAs,
      breachedSLAs,
      extendedSLAs,
      autoClosedCount: autoClosedSLAs.length,
      compliancePercentage: parseFloat(compliancePercentage),
      rating,
      color,
      icon,
      summary: `${onTimeSLAs}/${closedSLAs.length} Closed SLAs On Time (${compliancePercentage}%)`,
      autoClosureInfo: autoClosedSLAs.length > 0
        ? `${autoClosedSLAs.length} auto-closed (${breachedSLAs} breached)`
        : 'No auto-closures'
    };
  };
   
  /**
   * ✅ IMPROVED: Filter and calculate compliance by department
   * Returns compliance data for specific department (Closed SLAs only)
   * Includes auto-closure statistics
   */
  export const calculateDepartmentCompliance = (slaData, departmentId) => {
    if (!Array.isArray(slaData) || !departmentId) {
      return null;
    }
   
    // Filter by department
    const departmentSLAs = slaData.filter(sla => sla.departmentId === departmentId);
   
    // Filter by department AND status = Closed
    const departmentClosedSLAs = departmentSLAs.filter(sla => sla.status === 'Closed');
   
    // ✅ NEW: Count auto-closed SLAs
    const autoClosedSLAs = departmentClosedSLAs.filter(sla => sla.isAutoClosed === true);
   
    if (departmentClosedSLAs.length === 0) {
      return {
        departmentId,
        totalSLAs: departmentSLAs.length,
        closedSLAs: 0,
        openSLAs: departmentSLAs.filter(sla => sla.status !== 'Closed').length,
        onTimeSLAs: 0,
        autoClosedCount: 0,
        compliancePercentage: 0,
        message: 'No closed SLAs for this department'
      };
    }
   
    const onTimeSLAs = departmentClosedSLAs.filter(sla =>
      sla.complianceStatus === 'OnTime' || sla.complianceStatus === 'On Time'
    ).length;
   
    const breachedSLAs = departmentClosedSLAs.filter(sla =>
      sla.complianceStatus === 'Breached'
    ).length;
   
    const compliancePercentage = ((onTimeSLAs / departmentClosedSLAs.length) * 100).toFixed(1);
   
    return {
      departmentId,
      totalSLAs: departmentSLAs.length,
      closedSLAs: departmentClosedSLAs.length,
      openSLAs: departmentSLAs.filter(sla => sla.status !== 'Closed').length,
      onTimeSLAs,
      breachedSLAs,
      autoClosedCount: autoClosedSLAs.length,
      compliancePercentage: parseFloat(compliancePercentage),
      rating: getComplianceRating(compliancePercentage).rating,
      autoClosurePercentage: ((autoClosedSLAs.length / departmentClosedSLAs.length) * 100).toFixed(1)
    };
  };
   
  /**
   * ✅ IMPROVED: Batch compliance calculation for multiple departments
   * Returns compliance array for all departments with auto-closure metrics
   */
  export const calculateAllDepartmentsCompliance = (slaData) => {
    if (!Array.isArray(slaData) || slaData.length === 0) {
      return [];
    }
   
    // Get unique department IDs
    const departments = [...new Set(slaData.map(sla => sla.departmentId))];
   
    // Calculate compliance for each department
    return departments
      .map(deptId => calculateDepartmentCompliance(slaData, deptId))
      .filter(result => result !== null)
      .sort((a, b) => b.compliancePercentage - a.compliancePercentage);
  };
   
  /**
   * ✅ NEW: Get escalation status info
   */
  export const getEscalationInfo = (escalations = []) => {
    if (!escalations.length) return { count: 0, hasPending: false, latest: null };
   
    const pendingEscalations = escalations.filter(e => e.escalationStatus === 'Pending');
    const latestEscalation = escalations.sort((a, b) =>
      new Date(b.submittedAt) - new Date(a.submittedAt)
    )[0];
   
    return {
      count: escalations.length,
      hasPending: pendingEscalations.length > 0,
      pendingCount: pendingEscalations.length,
      latest: latestEscalation,
      levels: {
        L1: escalations.filter(e => e.escalationLevel === 'L1').length,
        L2: escalations.filter(e => e.escalationLevel === 'L2').length
      }
    };
  };
   
  /**
   * ✅ NEW: Identify high-risk SLAs (approaching deadline or auto-closure risk)
   */
  export const identifyHighRiskSLAs = (slaData) => {
    const now = new Date();
   
    return slaData
      .filter(sla => {
        if (sla.status === 'Closed') return false;
       
        const daysUntil = calculateDaysUntilDeadline(sla.deadline);
       
        // Overdue or due within 1 day
        return daysUntil < 1;
      })
      .map(sla => ({
        ...sla,
        riskLevel: calculateDaysUntilDeadline(sla.deadline) < -3 ? 'Critical' : 'High',
        daysOverdue: Math.abs(calculateDaysUntilDeadline(sla.deadline))
      }))
      .sort((a, b) => a.daysOverdue - b.daysOverdue);
  };
   
  /**
   * ✅ NEW: Helper for auto-closure analysis
   */
  export const analyzeAutoClosures = (slaData) => {
    const closedSLAs = slaData.filter(sla => sla.status === 'Closed');
    const autoClosedSLAs = closedSLAs.filter(sla => sla.isAutoClosed === true);
    const manualClosedSLAs = closedSLAs.filter(sla => sla.isAutoClosed === false);
   
    return {
      totalClosed: closedSLAs.length,
      autoClosed: autoClosedSLAs.length,
      manuallyClosed: manualClosedSLAs.length,
      autoClosurePercentage: closedSLAs.length > 0
        ? ((autoClosedSLAs.length / closedSLAs.length) * 100).toFixed(1)
        : 0,
      autoClosedBreached: autoClosedSLAs.filter(s => s.complianceStatus === 'Breached').length,
      autoClosedExtended: autoClosedSLAs.filter(s => s.complianceStatus === 'Extended').length
    };
  };
   
  /**
   * ✅ IMPROVED: Format compliance for display
   * Now includes auto-closure insights
   */
  export const formatComplianceDisplay = (complianceSummary) => {
    const { rating, color, icon } = getComplianceRating(complianceSummary.compliancePercentage);
   
    return {
      percentage: `${complianceSummary.compliancePercentage}%`,
      status: rating,
      color,
      icon,
      details: complianceSummary.summary,
      autoClosureInfo: complianceSummary.autoClosureInfo,
      breakdown: {
        onTime: complianceSummary.onTimeSLAs,
        breached: complianceSummary.breachedSLAs,
        extended: complianceSummary.extendedSLAs,
        autoClosed: complianceSummary.autoClosedCount
      }
    };
  };
   
  /**
   * ✅ NEW: Generate compliance report
   */
  export const generateComplianceReport = (slaData) => {
    const summary = getComplianceSummary(slaData);
    const autoClosureAnalysis = analyzeAutoClosures(slaData);
    const highRiskSLAs = identifyHighRiskSLAs(slaData);
    const departmentMetrics = calculateAllDepartmentsCompliance(slaData);
   
    return {
      reportDate: new Date().toISOString(),
      overallCompliance: summary,
      autoClosureAnalysis,
      highRiskSLAs: {
        count: highRiskSLAs.length,
        items: highRiskSLAs.slice(0, 5) // Top 5 at-risk
      },
      departmentMetrics,
      recommendations: generateRecommendations(summary, autoClosureAnalysis, highRiskSLAs)
    };
  };
   
  /**
   * ✅ NEW: Generate recommendations based on compliance data
   */
  export const generateRecommendations = (summary, autoClosureAnalysis, highRiskSLAs) => {
    const recommendations = [];
   
    if (summary.compliancePercentage < 75) {
      recommendations.push({
        type: 'warning',
        message: '⚠️ Compliance below 75%. Focus on meeting deadlines.',
        action: 'Review overdue SLAs and escalate if needed'
      });
    }
   
    if (autoClosureAnalysis.autoClosurePercentage > 20) {
      recommendations.push({
        type: 'alert',
        message: `🔴 ${autoClosureAnalysis.autoClosurePercentage}% of SLAs auto-closed due to missed deadlines.`,
        action: 'Increase deadline monitoring and reminder notifications'
      });
    }
   
    if (highRiskSLAs.length > 0) {
      recommendations.push({
        type: 'urgent',
        message: `🚨 ${highRiskSLAs.length} SLAs at critical risk (overdue).`,
        action: 'Immediate action required. Escalate to managers.'
      });
    }
   
    if (summary.autoClosedCount === 0 && summary.closedSLAs > 0) {
      recommendations.push({
        type: 'info',
        message: '✅ All SLAs closed manually (no auto-closures detected).',
        action: 'Continue current practices'
      });
    }
   
    return recommendations;
  };
   
   
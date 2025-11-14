// src/pages/sla/SLACompliance.jsx - SIMPLIFIED (NO QUARTERS)
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Download, RefreshCw, 
  BarChart3, PieChart, Filter, FileText, AlertCircle
} from 'lucide-react';
import ComplianceCard from '../../components/sla/ComplianceCard';
import slaService from '../../services/sla/slaService';
import { getComplianceSummary, getComplianceRating } from '../../utils/sla/slaCalculations';


const SLACompliance = () => {
  const [allSLAs, setAllSLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [sortBy, setSortBy] = useState('compliancePercentage');
  const [sortOrder, setSortOrder] = useState('desc');


  useEffect(() => {
    fetchAllData();
  }, []);


  //  Fetch ALL SLAs
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await slaService.getAllSLAs();
      
      if (res?.success && Array.isArray(res.data)) {
        console.log(' Loaded', res.data.length, 'SLAs from all departments');
        setAllSLAs(res.data);
      } else {
        setAllSLAs([]);
        setError('No SLA data available');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load SLA data');
      setAllSLAs([]);
    } finally {
      setLoading(false);
    }
  };


  //  Calculate compliance data for each department (ALL SLAs)
  const complianceData = useMemo(() => {
    if (allSLAs.length === 0) return [];

    // Get unique departments
    const departments = [...new Set(allSLAs.map(sla => sla.departmentId))];

    // Calculate compliance for each department
    return departments.map(deptId => {
      const deptSLAs = allSLAs.filter(sla => sla.departmentId === deptId);
      const deptName = deptSLAs[0]?.departmentName || 'Department';
      
      //  Use getComplianceSummary (CLOSED SLAs ONLY for compliance %)
      const summary = getComplianceSummary(deptSLAs);

      // Get date range
      const dates = deptSLAs
        .filter(s => s.deadline)
        .map(s => new Date(s.deadline))
        .sort((a, b) => a - b);

      const periodStartDate = dates.length > 0 ? dates[0] : new Date();
      const periodEndDate = dates.length > 0 ? dates[dates.length - 1] : new Date();

      return {
        complianceId: `${deptId}`,
        departmentId: deptId,
        departmentName: deptName,
        periodStartDate: periodStartDate.toISOString(),
        periodEndDate: periodEndDate.toISOString(),
        totalSlas: summary.totalSLAs,
        closedSlas: summary.closedSLAs,
        openSlas: summary.openSLAs,
        onTimeSlas: summary.onTimeSLAs,
        breachedSlas: summary.breachedSLAs,
        extendedSlas: deptSLAs.filter(s => s.status === 'Closed' && s.complianceStatus === 'Extended').length,
        compliancePercentage: summary.compliancePercentage,
        complianceRating: summary.rating,
        calculatedAt: new Date().toISOString()
      };
    });
  }, [allSLAs]);


  // Calculate overall stats
  const calculateOverallStats = () => {
    if (complianceData.length === 0) {
      return {
        totalSLAs: 0,
        closedSLAs: 0,
        openSLAs: 0,
        onTimeSLAs: 0,
        breachedSLAs: 0,
        avgCompliance: 0,
        excellentDepts: 0
      };
    }

    const totals = complianceData.reduce((acc, dept) => ({
      totalSLAs: acc.totalSLAs + dept.totalSlas,
      closedSLAs: acc.closedSLAs + dept.closedSlas,
      openSLAs: acc.openSLAs + dept.openSlas,
      onTimeSLAs: acc.onTimeSLAs + dept.onTimeSlas,
      breachedSLAs: acc.breachedSLAs + dept.breachedSlas
    }), { totalSLAs: 0, closedSLAs: 0, openSLAs: 0, onTimeSLAs: 0, breachedSLAs: 0 });

    const avgCompliance = complianceData.length > 0 
      ? (complianceData.reduce((sum, dept) => sum + dept.compliancePercentage, 0) / complianceData.length)
      : 0;

    const excellentDepts = complianceData.filter(d => d.compliancePercentage >= 90).length;

    return {
      ...totals,
      avgCompliance: avgCompliance.toFixed(1),
      excellentDepts
    };
  };


  const sortedData = [...complianceData].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });


  const stats = calculateOverallStats();


  const handleExportReport = () => {
    const headers = ['Department', 'Total SLAs', 'Closed', 'Open', 'On-Time', 'Breached', 'Extended', 'Compliance %', 'Rating'];
    const rows = complianceData.map(dept => [
      dept.departmentName,
      dept.totalSlas,
      dept.closedSlas,
      dept.openSlas,
      dept.onTimeSlas,
      dept.breachedSlas,
      dept.extendedSlas,
      dept.compliancePercentage.toFixed(1),
      dept.complianceRating
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLA_Compliance_Report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-muted mb-0">Department-wise SLA compliance metrics (Based on Closed SLAs)</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={fetchAllData}
            style={{ borderRadius: '8px' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={handleExportReport}
            disabled={complianceData.length === 0}
            style={{ borderRadius: '8px' }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: '40px', height: '40px', backgroundColor: '#0F62FE15' }}
              >
                <FileText size={20} color="#0F62FE" />
              </div>
              <h4 className="fw-bold mb-1">{stats.totalSLAs}</h4>
              <small className="text-muted">Total SLAs</small>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: '40px', height: '40px', backgroundColor: '#E2B93B15' }}
              >
                <TrendingUp size={20} color="#E2B93B" />
              </div>
              <h4 className="fw-bold mb-1">{stats.closedSLAs}</h4>
              <small className="text-muted">Closed</small>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: '40px', height: '40px', backgroundColor: '#0F62FE15' }}
              >
                <TrendingUp size={20} color="#0F62FE" />
              </div>
              <h4 className="fw-bold mb-1">{stats.onTimeSLAs}</h4>
              <small className="text-muted">On-Time</small>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: '40px', height: '40px', backgroundColor: '#E0195015' }}
              >
                <TrendingDown size={20} color="#E01950" />
              </div>
              <h4 className="fw-bold mb-1">{stats.breachedSLAs}</h4>
              <small className="text-muted">Breached</small>
            </div>
          </div>
        </div>

        
       
      </div>

      {/* View Mode Toggle & Sort */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('cards')}
                style={{ borderRadius: '8px 0 0 8px' }}
              >
                <PieChart size={16} className="me-2" />
                Cards View
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('table')}
                style={{ borderRadius: '0 8px 8px 0' }}
              >
                <BarChart3 size={16} className="me-2" />
                Table View
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <Filter size={16} className="text-muted" />
                <span className="text-muted small">Sort by:</span>
                <select
                  className="form-select form-select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: 'auto', borderRadius: '6px' }}
                >
                  <option value="compliancePercentage">Compliance %</option>
                  <option value="departmentName">Department</option>
                  <option value="totalSlas">Total SLAs</option>
                  <option value="closedSlas">Closed SLAs</option>
                  <option value="breachedSlas">Breached</option>
                </select>
              </div>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ borderRadius: '6px' }}
              >
                {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <AlertCircle size={18} className="me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading compliance data...</p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row g-4">
              {sortedData.map(compliance => (
                <div key={compliance.complianceId} className="col-md-6 col-lg-4">
                  <ComplianceCard 
                    compliance={compliance}
                    slaData={allSLAs.filter(sla => sla.departmentId === compliance.departmentId)}
                    showActions={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Department</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Total</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Closed</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Open</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>On-Time</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Breached</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Extended</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Compliance</th>
                      <th style={{ padding: '1rem' }}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map(dept => {
                      const ratingObj = getComplianceRating(dept.compliancePercentage);
                      const ratingColor = ratingObj.color;

                      return (
                        <tr key={dept.complianceId}>
                          <td style={{ padding: '1rem' }}>
                            <strong>{dept.departmentName}</strong>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {dept.totalSlas}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span className="badge bg-success">{dept.closedSlas}</span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span className="badge bg-info">{dept.openSlas}</span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span className="badge bg-success">{dept.onTimeSlas}</span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span className="badge bg-danger">{dept.breachedSlas}</span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span className="badge bg-warning text-dark">{dept.extendedSlas}</span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <div 
                                className="progress" 
                                style={{ width: '60px', height: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}
                              >
                                <div
                                  className="progress-bar"
                                  style={{ 
                                    width: `${dept.compliancePercentage}%`,
                                    backgroundColor: ratingColor
                                  }}
                                />
                              </div>
                              <strong style={{ color: ratingColor, minWidth: '45px' }}>
                                {dept.compliancePercentage.toFixed(1)}%
                              </strong>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span 
                              className="badge"
                              style={{ 
                                backgroundColor: `${ratingColor}15`,
                                color: ratingColor,
                                border: `1px solid ${ratingColor}30`
                              }}
                            >
                              {dept.complianceRating}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && sortedData.length === 0 && (
        <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            {/* <FileText size={64} className="text-muted mb-3" /> */}
            <h5 className="text-muted">No Compliance Data</h5>
            <p className="text-muted mb-0">No SLA data available to display</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SLACompliance;

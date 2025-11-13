// src/pages/sla/EmployeeSLADashboard.jsx - MATCHING PROJECT MANAGEMENT UX

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, CheckCircle, FileText, 
  RefreshCw, AlertCircle, Send, Eye, Zap
} from 'lucide-react';
import slaService, { dateHelpers } from '../../services/sla/slaService';

const EmployeeSLADashboard = () => {
  const navigate = useNavigate();
  
  // ========== STATE ==========
  const [slas, setSlas] = useState([]);
  const [filteredSLAs, setFilteredSLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [user, setUser] = useState(null);

  // ========== INITIALIZE ==========
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData?.empId) {
        setError('User not found. Please login again.');
        setLoading(false);
        return;
      }
      setUser(userData);
      fetchSLAs(userData.empId);
    } catch (err) {
      console.error('❌ Error parsing user:', err);
      setError('Failed to load user information');
      setLoading(false);
    }
  }, []);

  // ========== FILTER EFFECT ==========
  useEffect(() => {
    filterSLAs();
  }, [selectedFilter, slas]);

  // ========== FETCH SLAs ==========
  const fetchSLAs = useCallback(async (empId) => {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    
    try {
      if (!empId) throw new Error('Employee ID not found');
      
      console.log('📋 Fetching SLAs for employee:', empId);
      const response = await slaService.getEmployeeSLAs(empId);
      
      console.log('📊 API Response:', response);
      
      if (response?.success) {
        let slasData = [];
        
        if (Array.isArray(response.data)) {
          slasData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          slasData = [response.data];
        } else if (response.data === null || response.data === undefined) {
          slasData = [];
        }
        
        console.log(`✅ SLAs fetched: ${slasData.length} items`);
        
        const processedSLAs = slasData.map((sla, idx) => ({
          ...sla,
          daysUntilDeadline: dateHelpers.daysRemaining(sla.deadline),
          urgencyStatus: dateHelpers.getUrgencyStatus(sla.deadline),
          _key: `${sla.slaid}-${sla.employeeId || idx}`
        }));
        
        setSlas(processedSLAs);
      } else {
        console.warn('⚠️ API returned no data');
        setSlas([]);
        setError(response?.message || 'No SLAs found');
      }
    } catch (err) {
      console.error('❌ Error fetching SLAs:', err);
      setError(err.message || 'Failed to fetch SLAs');
      setSlas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ========== FILTER SLAs ==========
  const filterSLAs = useCallback(() => {
    let filtered = [...slas];

    switch (selectedFilter) {
      case 'Open':
        filtered = slas.filter(sla => sla.status === 'Open');
        break;
      case 'InProgress':
        filtered = slas.filter(sla => sla.status === 'InProgress');
        break;
      case 'Completed':
        filtered = slas.filter(sla => sla.status === 'Closed');
        break;
      case 'Overdue':
        filtered = slas.filter(sla => 
          (sla.status === 'Open' || sla.status === 'InProgress') && 
          sla.daysUntilDeadline < 0
        );
        break;
      default:
        filtered = slas;
    }

    setFilteredSLAs(filtered);
    console.log(`🔍 Filtered SLAs (${selectedFilter}): ${filtered.length} items`);
  }, [slas, selectedFilter]);

  // ========== HANDLERS ==========
  const handleViewDetails = useCallback((slaid) => {
    navigate(`/employee/dashboard/sla/details/`+slaid);
  }, [navigate]);

  const handleEscalate = useCallback((slaid) => {
    navigate(`/sla/employee/escalate/${slaid}`);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    if (user?.empId) {
      fetchSLAs(user.empId);
    }
  }, [user, fetchSLAs]);

  // ========== CALCULATE STATS ==========
  const calculateStats = useCallback(() => {
    return {
      total: slas.length,
      open: slas.filter(s => s.status === 'Open').length,
      inProgress: slas.filter(s => s.status === 'InProgress').length,
      completed: slas.filter(s => s.status === 'Closed').length,
      overdue: slas.filter(s => 
        (s.status === 'Open' || s.status === 'InProgress') && 
        s.daysUntilDeadline < 0
      ).length
    };
  }, [slas]);

  const stats = calculateStats();

  // ========== GET STATUS STYLE ==========
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open':
        return { bg: 'rgba(15, 98, 254, 0.1)', border: '#0F62FE', text: '#0F62FE', icon: Clock };
      case 'InProgress':
        return { bg: 'rgba(226, 185, 59, 0.1)', border: '#E2B93B', text: '#D4941E', icon: Zap };
      case 'Closed':
        return { bg: 'rgba(36, 161, 72, 0.1)', border: '#24A148', text: '#24A148', icon: CheckCircle };
      default:
        return { bg: 'rgba(82, 82, 82, 0.1)', border: '#525252', text: '#525252', icon: FileText };
    }
  };

  const getOverdueStyle = () => ({
    bg: 'rgba(224, 25, 80, 0.1)',
    border: '#E01950',
    text: '#E01950',
    icon: AlertTriangle
  });

  // ========== UTILITY FUNCTIONS ==========
  const isOverdue = (sla) => {
    return (sla.status === 'Open' || sla.status === 'InProgress') && 
           sla.daysUntilDeadline < 0;
  };

  const canEscalate = (sla) => {
    return sla.status !== 'Closed';
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading SLAs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100 d-flex flex-column" style={{ maxWidth: '100%', width: '100%' }}>
      
      {/* ========== HEADER SECTION ========== */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>
            
          </h2>
          <p className="mb-0 small" style={{ color: 'var(--muted)' }}>
            Track your SLA deadlines and compliance status
          </p>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--color-primary-3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.9rem',
              fontWeight: '600',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-5)';
              e.currentTarget.style.borderColor = 'var(--color-primary-3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <RefreshCw 
              size={18}
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========== ERROR ALERT ========== */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert" style={{ borderRadius: 'var(--radius-md)' }}>
          <div className="d-flex align-items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-1" />
            <div>
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)} 
          />
        </div>
      )}

      {/* ========== STATISTICS CARDS ========== */}
      <div className="row g-4 mb-4">
        {[
          { label: 'Total SLAs', value: stats.total, icon: FileText, color: '#525252' },
          { label: 'Open', value: stats.open, icon: Clock, color: '#0F62FE' },
          { label: 'In Progress', value: stats.inProgress, icon: Zap, color: '#E2B93B' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#24A148' }
        ].map((stat) => (
          <div key={stat.label} className="col-md-6 col-lg-3">
            <div className="card border-0" style={{ 
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded p-3" style={{ 
                    backgroundColor: `${stat.color}15`
                  }}>
                    <stat.icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
                <h3 className="mb-1 fw-bold" style={{ color: 'var(--color-primary-1)' }}>
                  {stat.value}
                </h3>
                <p className="mb-0 small" style={{ color: 'var(--muted)' }}>
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========== OVERDUE ALERT ========== */}
      {stats.overdue > 0 && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" style={{ borderRadius: 'var(--radius-md)' }}>
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div>
              <strong>⚠️ {stats.overdue} Overdue SLA(s)</strong>
              <p className="mb-0 small">Please take immediate action on overdue items</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== FILTER BUTTONS ========== */}
      <div className="card border-0 mb-4" style={{
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)'
      }}>
        <div className="card-body p-3">
          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: 'All', key: 'All' },
              { label: 'Open', key: 'Open', count: stats.open },
              { label: 'In Progress', key: 'InProgress', count: stats.inProgress },
              { label: 'Completed', key: 'Completed', count: stats.completed },
              { label: 'Overdue', key: 'Overdue', count: stats.overdue }
            ].map(filter => (
              <button
                key={filter.key}
                type="button"
                className={`btn btn-sm ${
                  selectedFilter === filter.key ? 'btn-primary' : 'btn-outline-primary'
                }`}
                onClick={() => setSelectedFilter(filter.key)}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span className="badge bg-light text-dark ms-2">
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== SLA CARDS GRID ========== */}
      <div className="row g-3 flex-grow-1" style={{ overflowY: 'auto', paddingRight: '4px' }}>
        {filteredSLAs.length === 0 ? (
          <div className="col-12">
            <div className="card border-0" style={{
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              minHeight: '300px'
            }}>
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
                <FileText size={64} className="mb-3" style={{ 
                  color: 'var(--color-primary-3)',
                  opacity: 0.5
                }} />
                <h5 className="text-muted">No SLAs found</h5>
                <p className="text-muted mb-0">
                  {selectedFilter === 'All' 
                    ? 'You don\'t have any SLAs assigned yet'
                    : `No ${selectedFilter.toLowerCase()} SLAs at this time`
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredSLAs.map((sla) => {
            const isOverdueStatus = isOverdue(sla);
            const style = isOverdueStatus ? getOverdueStyle() : getStatusStyle(sla.status);
            const IconComponent = style.icon;
            const urgency = sla.urgencyStatus || { status: 'Unknown', color: '#525252', icon: '❓' };

            return (
              <div key={sla._key} className="col-md-6 col-lg-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    boxShadow: 'var(--shadow)',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: `4px solid ${style.border}`,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  <div className="card-body p-3">
                    {/* Header: Icon + Title + Status Badge */}
                    <div className="d-flex align-items-start gap-2 mb-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: style.bg
                        }}
                      >
                        <IconComponent size={20} color={style.text} />
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>
                          {sla.slatype || 'SLA'}
                        </h6>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: style.text,
                            color: '#FFFFFF',
                            fontSize: '0.7rem',
                            padding: '4px 8px'
                          }}
                        >
                          {isOverdueStatus ? '❌ OVERDUE' : sla.status}
                        </span>
                      </div>
                    </div>

                    {/* SLA Details */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">Deadline</small>
                        <small className="fw-semibold">
                          {dateHelpers.formatDeadline(sla.deadline)}
                        </small>
                      </div>

                      {/* Progress Bar */}
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              backgroundColor: isOverdueStatus ? '#E01950' :
                                               sla.daysUntilDeadline <= 3 ? '#E2B93B' :
                                               sla.daysUntilDeadline <= 7 ? '#0F62FE' : '#24A148',
                              width: `${Math.max(10, Math.min(100, Math.max(0, (sla.daysUntilDeadline / 30) * 100)))}%`
                            }}
                          />
                        </div>
                        <small style={{ color: urgency.color, fontWeight: 'bold', minWidth: '65px', textAlign: 'right' }}>
                          {urgency.icon} {isOverdueStatus 
                            ? `${Math.abs(sla.daysUntilDeadline)}d ago`
                            : `${sla.daysUntilDeadline}d`
                          }
                        </small>
                      </div>

                      <small className="d-block mt-2" style={{ color: urgency.color, fontWeight: '500' }}>
                        {urgency.status}
                      </small>
                    </div>

                    {/* Manager Info */}
                    {sla.assignedToName && (
                      <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <small className="text-muted d-block mb-1">Assigned to</small>
                        <small className="fw-semibold">👤 {sla.assignedToName}</small>
                      </div>
                    )}

                    {/* Compliance Info */}
                    {sla.complianceStatus && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">Compliance</small>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              sla.complianceStatus === 'OnTime' ? '#24A14830' :
                              sla.complianceStatus === 'Breached' ? '#E0195030' : '#E2B93B30',
                            color:
                              sla.complianceStatus === 'OnTime' ? '#24A148' :
                              sla.complianceStatus === 'Breached' ? '#E01950' : '#D4941E',
                            padding: '4px 8px',
                            fontSize: '0.75rem'
                          }}
                        >
                          {sla.complianceStatus}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewDetails(sla.slaid)}
                        style={{ borderRadius: 'var(--radius-sm)' }}
                        title="View SLA details"
                      >
                        <Eye size={14} className="me-1" />
                        View Details
                      </button>

                      {/* {canEscalate(sla) && (
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleEscalate(sla.slaid)}
                          style={{ borderRadius: 'var(--radius-sm)' }}
                          title="Escalate to manager"
                        >
                          <Send size={14} className="me-1" />
                          Escalate
                        </button>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeSLADashboard;

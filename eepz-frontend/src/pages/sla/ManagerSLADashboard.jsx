// src/pages/sla/ManagerSLADashboard.jsx - WITH RESOLVE ESCALATION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Eye, Search, Filter, AlertTriangle, FileText, Send, 
  Download, Users, Clock, CheckCircle, TrendingUp
} from 'lucide-react';
import slaService, { escalationHelpers } from '../../services/sla/slaService';
import ManagerEscalationModal from '../../components/sla/ManagerEscalationModal';
import ResolveEscalationModal from '../../components/sla/ResolveEscalationModal';
import Pagination from '../../components/project_management_components/Pagination';
import { formatDate } from '../../utils/sla/dateFormatter';

const ManagerSLADashboard = () => {
  const navigate = useNavigate();

  // ========== STATE MANAGEMENT ==========
  const [allSLAs, setAllSLAs] = useState([]);
  const [managerSLAs, setManagerSLAs] = useState([]);
  const [managerEscalations, setManagerEscalations] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  // Modal States
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSLAForEscalation, setSelectedSLAForEscalation] = useState(null);
  const [selectedEscalationForResolve, setSelectedEscalationForResolve] = useState(null);
  const [deptHeads, setDeptHeads] = useState([]);
  const [user, setUser] = useState(null);

  // ========== EFFECTS ==========
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [managerSLAs, managerEscalations, searchTerm, statusFilter, complianceFilter, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, complianceFilter, activeTab]);

  // ========== FETCH FUNCTIONS ==========
  const fetchDeptHeads = async (departmentId) => {
    try {
      console.log('📋 Fetching department heads for departmentId:', departmentId);
      const res = await slaService.getDepartmentHeads(departmentId);
      
      if (res?.success && Array.isArray(res.data)) {
        console.log('✅ Department heads fetched:', res.data);
        setDeptHeads(res.data);
      } else {
        console.warn('⚠️ No dept heads received');
        setDeptHeads([]);
      }
    } catch (err) {
      console.error('❌ Error fetching dept heads:', err.message);
      setDeptHeads([]);
    }
  };

  const fetchManagerEscalations = async (managerId) => {
    try {
      console.log('📊 Fetching escalations for manager:', managerId);
      const res = await slaService.getManagerEscalations(managerId);
      
      if (res?.success && Array.isArray(res.data)) {
        console.log('✅ Manager escalations fetched:', res.data);
        setManagerEscalations(res.data);
      } else {
        console.warn('⚠️ No escalations received');
        setManagerEscalations([]);
      }
    } catch (err) {
      console.error('❌ Error fetching escalations:', err.message);
      setManagerEscalations([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      console.log('👤 Current User:', userData);
      
      if (!userData?.empId) {
        setError('User not found in session');
        setLoading(false);
        return;
      }

      if (userData.departmentId) {
        console.log('📊 Department ID:', userData.departmentId);
        fetchDeptHeads(userData.departmentId);
      }

      fetchManagerEscalations(userData.empId);

      const response = await slaService.getAllSLAs();
      console.log('📨 All SLAs Response:', response);
      
      if (response?.success && Array.isArray(response.data)) {
        setAllSLAs(response.data);
        
        const filtered = response.data.filter(sla => sla.assignedToEmployeeId === userData.empId);
        console.log('✅ SLAs assigned to manager:', filtered);
        
        setManagerSLAs(filtered);
        
        if (filtered.length === 0) {
          console.warn('⚠️ No SLAs assigned to this manager');
        }
      } else {
        setAllSLAs([]);
        setManagerSLAs([]);
        setError('No data received from server');
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err.message || 'Failed to load SLAs');
      setAllSLAs([]);
      setManagerSLAs([]);
    } finally {
      setLoading(false);
    }
  };

  // ========== TAB DATA FUNCTIONS ==========
  const getTabData = () => {
    switch (activeTab) {
      case 'open':
        return managerSLAs.filter(s => s.status === 'Open' || s.status === 'InProgress');
      case 'escalated':
        return managerSLAs.filter(s => s.status === 'Escalated');
      case 'closed':
        return managerSLAs.filter(s => s.status === 'Closed');
      case 'escalations':
        return managerEscalations;
      default:
        return managerSLAs;
    }
  };

  // ========== FILTER FUNCTIONS ==========
  const applyFilters = () => {
    let result = getTabData();

    if (activeTab !== 'escalations') {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(sla =>
          (sla.employeeName?.toLowerCase().includes(term)) ||
          (sla.departmentName?.toLowerCase().includes(term)) ||
          (sla.relatedEntityType?.toLowerCase().includes(term)) ||
          (sla.slaid?.toString().includes(term))
        );
      }

      if (statusFilter !== 'All') {
        result = result.filter(sla => sla.status === statusFilter);
      }

      if (complianceFilter !== 'All') {
        result = result.filter(sla => sla.complianceStatus === complianceFilter);
      }
    } else {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(esc =>
          (esc.reason?.toLowerCase().includes(term)) ||
          (esc.employeeName?.toLowerCase().includes(term)) ||
          (esc.description?.toLowerCase().includes(term))
        );
      }

      if (statusFilter !== 'All') {
        result = result.filter(esc => esc.escalationStatus === statusFilter);
      }
    }

    setFilteredSlas(result);
  };

  // ========== CALCULATION FUNCTIONS ==========
  const calculateStats = () => {
    return {
      total: managerSLAs.length,
      open: managerSLAs.filter(s => s.status === 'Open' || s.status === 'InProgress').length,
      escalated: managerSLAs.filter(s => s.status === 'Escalated').length,
      closed: managerSLAs.filter(s => s.status === 'Closed').length,
      escalations: managerEscalations.length,
      pending: managerEscalations.filter(e => e.escalationStatus === 'Pending').length,
      resolved: managerEscalations.filter(e => e.escalationStatus === 'Resolved').length,
    };
  };

  // ========== ACTION HANDLERS ==========
  const handleEscalateClick = (sla) => {
    // ✅ Check if can escalate using helper
    if (!escalationHelpers.canEscalateToL2(sla, [sla])) {
      const reason = escalationHelpers.getEscalationBlockReason(sla, [sla], 'L2');
      alert(`❌ Cannot escalate: ${reason}`);
      return;
    }

    console.log('🚀 Escalating SLA:', sla);
    console.log('📋 Available Dept Heads:', deptHeads);
    setSelectedSLAForEscalation(sla);
    setShowEscalationModal(true);
  };

  const handleEscalateToDeptHead = async (payload) => {
    try {
      console.log('📤 Sending escalation payload:', payload);
      const res = await slaService.escalateToDeptHead(payload);
      
      if (res.success) {
        alert('✅ Escalated successfully!');
        setShowEscalationModal(false);
        setSelectedSLAForEscalation(null);
        loadData();
      } else {
        alert('❌ ' + res.message);
      }
    } catch (err) {
      console.error('❌ Escalation Error:', err);
      alert('Error: ' + err.message);
    }
  };

  // ✅ Handle Resolve Escalation
  const handleResolveClick = (escalation) => {
    console.log('🔧 Resolving escalation:', escalation);
    setSelectedEscalationForResolve(escalation);
    setShowResolveModal(true);
  };

  const handleResolveEscalation = async (payload) => {
    try {
      console.log('📤 Sending resolve payload:', payload);
      const res = await slaService.resolveEscalation(payload);
      
      if (res.success) {
        alert('✅ Escalation resolved successfully!');
        setShowResolveModal(false);
        setSelectedEscalationForResolve(null);
        loadData();
      } else {
        alert('❌ ' + res.message);
      }
    } catch (err) {
      console.error('❌ Resolve Error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleExport = () => {
    if (filteredSlas.length === 0) return;
    
    let csvData, filename;

    if (activeTab === 'escalations') {
      csvData = filteredSlas.map(esc => ({
        ID: esc.escalationId,
        Employee: esc.employeeName,
        Reason: esc.reason,
        Level: esc.escalationLevel,
        Status: esc.escalationStatus,
        SubmittedAt: formatDate(esc.submittedAt),
        Description: esc.description
      }));
      filename = `manager-escalations-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      csvData = filteredSlas.map(sla => ({
        ID: sla.slaid,
        Employee: sla.employeeName,
        Department: sla.departmentName,
        Type: sla.relatedEntityType,
        Status: sla.status,
        Compliance: sla.complianceStatus,
        Deadline: formatDate(sla.deadline)
      }));
      filename = `manager-slas-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setComplianceFilter('All');
  };

  // ========== UTILITY FUNCTIONS ==========
  const getStatusBadge = (status) => {
    const statusMap = {
      'Open': 'bg-primary',
      'Pending': 'bg-warning text-dark',
      'Submitted': 'bg-success',
      'InProgress': 'bg-info',
      'Closed': 'bg-success',
      'Escalated': 'bg-danger',
    };
    return statusMap[status] || 'bg-secondary';
  };

  const getComplianceBadge = (compliance) => {
    const complianceMap = {
      'OnTime': 'bg-success',
      'Breached': 'bg-danger',
      'Extended': 'bg-warning text-dark',
      'NotStarted': 'bg-secondary',
    };
    return complianceMap[compliance] || 'bg-secondary';
  };

  const getEscalationLevelColor = (level) => {
    switch (level) {
      case 'L1': return 'badge bg-info';
      case 'L2': return 'badge bg-warning text-dark';
      case 'L3': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  };

  // ========== COMPUTED VALUES ==========
  const stats = calculateStats();
  const totalPages = Math.ceil(filteredSlas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredSlas.slice(startIndex, endIndex);

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '600px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: '2rem' }}>
      {/* ========== HEADER ========== */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>
            Manager Dashboard
          </h2>
          <p className="text-muted mb-0">Track and manage all assigned SLAs</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary d-flex align-items-center gap-2" 
            onClick={loadData} 
            style={{ borderRadius: '8px' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            className="btn btn-outline-success d-flex align-items-center gap-2" 
            onClick={handleExport} 
            disabled={filteredSlas.length === 0} 
            style={{ borderRadius: '8px' }}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* ========== ERROR ALERT ========== */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <AlertTriangle size={20} className="me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
        </div>
      )}

      {/* ========== STATS CARDS ========== */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total SLAs', value: stats.total, icon: Users, color: '#0F62FE' },
          { label: 'Open', value: stats.open, icon: Clock, color: '#0F62FE' },
          { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, color: '#E01950' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle, color: '#24A148' },
          { label: 'Total Escalations', value: stats.escalations, icon: TrendingUp, color: '#E2B93B' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: '#E2B93B' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="col-md-2">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <Icon size={24} color={color} />
                <div>
                  <h4 className="fw-bold mb-1">{value}</h4>
                  <p className="text-muted mb-0 small">{label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========== TABS ========== */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-header bg-white border-0 px-4 pt-3">
          <ul className="nav nav-tabs border-0" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
                style={{ cursor: 'pointer' }}
              >
                <Users size={16} className="me-2" />
                All ({managerSLAs.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'open' ? 'active' : ''}`}
                onClick={() => setActiveTab('open')}
                style={{ cursor: 'pointer' }}
              >
                <Clock size={16} className="me-2" />
                Open ({stats.open})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'escalated' ? 'active' : ''}`}
                onClick={() => setActiveTab('escalated')}
                style={{ cursor: 'pointer' }}
              >
                <AlertTriangle size={16} className="me-2" />
                Escalated ({stats.escalated})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'closed' ? 'active' : ''}`}
                onClick={() => setActiveTab('closed')}
                style={{ cursor: 'pointer' }}
              >
                <CheckCircle size={16} className="me-2" />
                Closed ({stats.closed})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'escalations' ? 'active' : ''}`}
                onClick={() => setActiveTab('escalations')}
                style={{ cursor: 'pointer' }}
              >
                <TrendingUp size={16} className="me-2" />
                Escalations ({stats.escalations})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ========== FILTERS ========== */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderRadius: '8px 0 0 8px' }}>
                  <Search size={16} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder={activeTab === 'escalations' ? 'Search by employee, reason, or description...' : 'Search by employee, department, type, or SLA ID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: '0 8px 8px 0' }}
                />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="All">All Status</option>
                {activeTab === 'escalations' ? (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                  </>
                ) : (
                  <>
                    <option value="Open">Open</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Closed">Closed</option>
                  </>
                )}
              </select>
            </div>

            {activeTab !== 'escalations' && (
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value)}
                  style={{ borderRadius: '8px' }}
                >
                  <option value="All">All Compliance</option>
                  <option value="OnTime">On Time</option>
                  <option value="Breached">Breached</option>
                  <option value="Extended">Extended</option>
                </select>
              </div>
            )}

            <div className={activeTab === 'escalations' ? 'col-md-4' : 'col-md-1'}>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
                style={{ borderRadius: '8px' }}
                title="Clear all filters"
              >
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DATA TABLE ========== */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  {activeTab === 'escalations' ? (
                    <>
                      <th className="px-4 py-3">Employee</th>
                      <th className="py-3">Reason</th>
                      <th className="py-3">Level</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Submitted At</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">Employee</th>
                      <th className="py-3">Department</th>
                
                      <th className="py-3">Deadline</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Compliance</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'escalations' ? 6 : 7} className="text-center py-5">
                      {activeTab === 'escalations' ? (
                        <>
                          <TrendingUp size={48} className="text-muted mb-3" />
                          <p className="text-muted mb-0">No escalations yet</p>
                        </>
                      ) : (
                        <>
                          <FileText size={48} className="text-muted mb-3" />
                          <p className="text-muted mb-0">
                            {managerSLAs.length === 0 ? 'No SLAs assigned to you' : 'No SLAs match your filters'}
                          </p>
                          {managerSLAs.length > 0 && filteredSlas.length === 0 && (
                            <button className="btn btn-sm btn-outline-primary mt-2" onClick={clearFilters}>
                              Clear Filters
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ) : activeTab === 'escalations' ? (
                  // ✅ Escalations Table with Resolve Button
                  paginatedData.map((esc) => (
                    <tr key={esc.escalationId} className="align-middle">
                      <td className="px-4">
                        <div>
                          <strong>{esc.employeeName || '—'}</strong>
                        </div>
                      </td>
                      <td>
                        <strong>{esc.reason || '—'}</strong>
                        <br />
                        <small className="text-muted">{esc.description || '—'}</small>
                      </td>
                      <td>
                        <span className={getEscalationLevelColor(esc.escalationLevel)}>
                          {esc.escalationLevel}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${esc.escalationStatus === 'Resolved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {esc.escalationStatus}
                        </span>
                      </td>
                      <td>
                        <small>{formatDate(esc.submittedAt)}</small>
                      </td>
                      <td className="px-4 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/sla/manager/details/${esc.slaid}`)}
                            title="View SLA details"
                          >
                            <Eye size={16} />
                          </button>
                          {/* ✅ RESOLVE BUTTON - Only show if Pending */}
                          {esc.escalationStatus === 'Pending' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleResolveClick(esc)}
                              title="Resolve escalation"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // SLAs Table
                  paginatedData.map((sla) => (
                    <tr key={`${sla.slaid}-${sla.employeeId}`} className="align-middle">
                      <td className="px-4">
                        <div>
                          <strong>{sla.employeeName || '—'}</strong>
                          <br />
                          <small className="text-muted">{sla.employeeEmail || '—'}</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{sla.departmentName || '—'}</span>
                      </td>
                     
                      <td>
                        <small>{sla.deadline ? formatDate(sla.deadline) : '—'}</small>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(sla.status)}`}>
                          {sla.status || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getComplianceBadge(sla.complianceStatus)}`}>
                          {sla.complianceStatus || '—'}
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/sla/manager/details/${sla.slaid}`)}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          {/* ✅ Escalate with helper check */}
                          {sla.status !== 'Closed' && (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleEscalateClick(sla)}
                              title="Escalate to Department Head"
                            >
                              <Send size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ========== PAGINATION ========== */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredSlas.length}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* ========== ESCALATION MODAL ========== */}
      {showEscalationModal && selectedSLAForEscalation && (
        <ManagerEscalationModal
          review={selectedSLAForEscalation}
          onClose={() => setShowEscalationModal(false)}
          onEscalate={handleEscalateToDeptHead}
          deptHeads={deptHeads}
        />
      )}

      {/* ========== RESOLVE ESCALATION MODAL ========== */}
      {showResolveModal && selectedEscalationForResolve && (
        <ResolveEscalationModal
          escalation={selectedEscalationForResolve}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolveEscalation}
        />
      )}
    </div>
  );
};

export default ManagerSLADashboard;

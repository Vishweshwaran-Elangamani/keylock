import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  FileText,
  Send,
  Eye,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Home,
  Zap,
  X,
} from 'lucide-react';
import slaService from '../../services/sla/slaService';
import ManagerEscalationModal from '../../components/sla/modals/ManagerEscalationModal';
import ResolveEscalationModal from '../../components/sla/modals/ResolveEscalationModal';
import { formatDate } from '../../utils/sla/dateFormatter';
import { dateHelpers } from '../../services/sla/slaService';
import Pagination from '../../components/project_management_components/common/Pagination';
import '../../styles/sla/ManagerSLADashboard.css';

const ManagerSLADashboard = () => {
  const navigate = useNavigate();

  const [mySLAs, setMySLAs] = useState([]);
  const [managerEscalations, setManagerEscalations] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('my-escalation');

  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSLAForEscalation, setSelectedSLAForEscalation] = useState(null);
  const [selectedEscalationForResolve, setSelectedEscalationForResolve] = useState(null);
  const [deptHeads, setDeptHeads] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mySLAs, managerEscalations, activeSearchTerm, statusFilter, complianceFilter, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm, statusFilter, complianceFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));

      if (!userData?.empId) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      if (userData.departmentId) {
        const deptHeadRes = await slaService.getDepartmentHeads(userData.departmentId);
        if (deptHeadRes?.success && Array.isArray(deptHeadRes.data)) {
          setDeptHeads(deptHeadRes.data);
        }
      }

      // Get escalations received from employees
      const escalationsRes = await slaService.getManagerEscalations(userData.empId);
      if (escalationsRes?.success && Array.isArray(escalationsRes.data)) {
        setManagerEscalations(escalationsRes.data);
      }

      // Get manager's own SLAs
      const mySLAsRes = await slaService.getEmployeeSLAs(userData.empId);
      if (mySLAsRes?.success && Array.isArray(mySLAsRes.data)) {
        setMySLAs(mySLAsRes.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load SLAs');
    } finally {
      setLoading(false);
    }
  };

  const getTabData = () => {
    switch (activeTab) {
      case 'my-escalation':
        return mySLAs;
      case 'team-escalation':
        return managerEscalations;
      default:
        return mySLAs;
    }
  };

  const applyFilters = () => {
    let result = getTabData();

    if (activeTab === 'my-escalation') {
      if (activeSearchTerm) {
        const term = activeSearchTerm.toLowerCase();
        result = result.filter(
          (sla) =>
            sla.employeeName?.toLowerCase().includes(term) ||
            sla.departmentName?.toLowerCase().includes(term) ||
            sla.slaid?.toString().includes(term) ||
            sla.slatype?.toLowerCase().includes(term) ||
            sla.assignedToName?.toLowerCase().includes(term)
        );
      }

      if (statusFilter !== 'All') {
        result = result.filter((sla) => sla.status === statusFilter);
      }

      if (complianceFilter !== 'All') {
        result = result.filter((sla) => sla.complianceStatus === complianceFilter);
      }
    } else if (activeTab === 'team-escalation') {
      if (activeSearchTerm) {
        const term = activeSearchTerm.toLowerCase();
        result = result.filter(
          (esc) =>
            esc.reason?.toLowerCase().includes(term) ||
            esc.employeeName?.toLowerCase().includes(term)
        );
      }

      if (statusFilter !== 'All') {
        result = result.filter((esc) => esc.escalationStatus === statusFilter);
      }
    }

    setFilteredSlas(result);
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  const calculateStats = () => {
    return {
      total: mySLAs.length,
      open: mySLAs.filter((s) => s.status === 'Open').length,
      inProgress: mySLAs.filter((s) => s.status === 'InProgress').length,
      closed: mySLAs.filter((s) => s.status === 'Closed').length,
    };
  };

  const handleViewClick = (e, id) => {
    e.stopPropagation();
    navigate(`/sla/manager/details/${id}`);
  };

  const handleEscalateClick = (e, escalation) => {
    e.stopPropagation();
    setSelectedSLAForEscalation(escalation);
    setShowEscalationModal(true);
  };

  const handleEscalateToDeptHead = async (payload) => {
    try {
      const res = await slaService.escalateToDeptHead(payload);
      if (res.success) {
        toast.success('Escalated to Department Head successfully');
        setShowEscalationModal(false);
        setSelectedSLAForEscalation(null);
        loadData();
      }
    } catch (err) {
      toast.error('Escalation failed');
      throw err;
    }
  };

  const handleResolveClick = (e, escalation) => {
    e.stopPropagation();
    setSelectedEscalationForResolve(escalation);
    setShowResolveModal(true);
  };

  const handleResolveEscalation = async (payload) => {
    try {
      const res = await slaService.resolveEscalation(payload);
      if (res.success) {
        toast.success('Escalation resolved');
        setShowResolveModal(false);
        setSelectedEscalationForResolve(null);
        loadData();
      }
    } catch (err) {
      toast.error('Resolution failed');
    }
  };

  const handleRowClick = (id) => {
    navigate(`/sla/manager/details/${id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setStatusFilter('All');
    setComplianceFilter('All');
    toast.info('Filters cleared');
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Closed') return 'mgr-sla-status-closed';
    if (status === 'Open') return 'mgr-sla-status-open';
    if (status === 'InProgress') return 'mgr-sla-status-inprogress';
    return 'mgr-sla-status-open';
  };

  const stats = calculateStats();
  const totalPages = Math.ceil(filteredSlas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredSlas.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="mgr-sla-wrapper h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-muted mt-3">Loading SLA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mgr-sla-wrapper">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0 p-3 rounded mgr-sla-breadcrumb">
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/manager/dashboard');
              }}
              className="mgr-sla-breadcrumb-link"
            >
              <Home size={14} /> Dashboard
            </a>
          </li>
          <li className="breadcrumb-item">
            <span className="mgr-sla-breadcrumb">SLA Compliance</span>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span className="mgr-sla-breadcrumb-active">Manager</span>
          </li>
        </ol>
      </nav>

      {/* Stats Cards */}
      <div className="row g-3 mb-3">
        {[
          {
            label: 'Total SLAs',
            value: stats.total,
            icon: Users,
            bgColor: '#EEF2FF',
            iconColor: '#3B82F6',
          },
          {
            label: 'Open',
            value: stats.open,
            icon: Clock,
            bgColor: '#E0E7FF',
            iconColor: '#4F46E5',
          },
          {
            label: 'In Progress',
            value: stats.inProgress,
            icon: Zap,
            bgColor: '#FEF3C7',
            iconColor: '#D97706',
          },
          {
            label: 'Closed',
            value: stats.closed,
            icon: CheckCircle,
            bgColor: '#DCFCE7',
            iconColor: '#16A34A',
          },
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="col-lg-3 col-md-6 col-sm-6">
            <div className="mgr-sla-stat-card">
              <div className="mgr-sla-stat-icon" style={{ backgroundColor: bgColor }}>
                <Icon size={28} color={iconColor} strokeWidth={2.5} />
              </div>
              <h3 className="mgr-sla-stat-value">{value}</h3>
              <p className="mgr-sla-stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Card */}
      <div className="mgr-sla-filters-card">
        <div className="row g-3 align-items-center">
          <div className="col-lg-4 col-md-6">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute',
                  left: '0.875rem',
                  color: '#6b7280',
                  pointerEvents: 'none',
                  zIndex: 2
                }} 
              />
              <input
                type="text"
                className="form-control mgr-sla-search-input"
                placeholder={
                  activeTab === 'team-escalation'
                    ? 'Search by reason or employee...'
                    : 'Search by SLA type, assigned to, or department...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                style={{ 
                  paddingLeft: '2.5rem',
                  paddingRight: activeSearchTerm ? '130px' : '90px'
                }}
              />
              {activeSearchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '85px',
                    background: 'transparent',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    padding: 0,
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#c82333';
                    e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#dc3545';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Clear search"
                >
                  <X size={18} style={{ strokeWidth: 2.5 }} />
                </button>
              )}
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  position: 'absolute',
                  right: '4px',
                  background: '#5A5486',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  zIndex: 1,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4A4076';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 84, 134, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#5A5486';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Search size={14} />
                Search
              </button>
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select mgr-sla-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              {activeTab === 'team-escalation' ? (
                <>
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </>
              ) : (
                <>
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Closed">Closed</option>
                </>
              )}
            </select>
          </div>
          {activeTab === 'my-escalation' && (
            <div className="col-lg-2 col-md-6">
              <select
                className="form-select mgr-sla-select"
                value={complianceFilter}
                onChange={(e) => setComplianceFilter(e.target.value)}
              >
                <option value="All">All Compliance</option>
                <option value="OnTime">On Time</option>
                <option value="Breached">Breached</option>
                <option value="Extended">Extended</option>
              </select>
            </div>
          )}
          <div className={`col-lg-${activeTab === 'my-escalation' ? '4' : '6'} col-md-12`}>
            <div className="mgr-sla-filter-actions">
              <button className="btn btn-outline-secondary mgr-sla-btn-clear" onClick={clearFilters}>
                <Filter size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mgr-sla-tabs-wrapper">
        <div className="mgr-sla-tabs-container">
          {[
            { key: 'my-escalation', label: 'My Escalation' },
            { key: 'team-escalation', label: 'Team Escalation' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`mgr-sla-tab-pill ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="mgr-sla-table-wrapper">
        {filteredSlas.length === 0 ? (
          <div className="mgr-sla-empty-state-standalone">
            <FileText size={64} className="mgr-sla-empty-icon" />
            <p className="mgr-sla-empty-text">
              No {activeTab === 'team-escalation' ? 'team escalations' : 'SLAs'} found
            </p>
            {searchTerm || statusFilter !== 'All' || complianceFilter !== 'All' ? (
              <button className="btn btn-outline-primary mt-2" onClick={clearFilters}>
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : activeTab === 'my-escalation' ? (
          // Card View for My Escalation
          <>
            <div className="row g-3">
              {paginatedData.map((sla) => {
                const daysRemaining = dateHelpers.daysRemaining(sla.deadline);
                
                return (
                  <div key={sla.slaid} className="col-lg-4 col-md-6">
                    <div className="mgr-escalation-card">
                      {/* Card Header - Horizontal Layout */}
                      <div className="mgr-escalation-card-header">
                        <div className="mgr-escalation-icon-wrapper">
                          <Zap size={24} className="mgr-escalation-icon" />
                        </div>
                        <div className="mgr-escalation-title-wrapper">
                          <h6 className="mgr-escalation-title">{sla.slatype || 'Sample Sla'}</h6>
                        </div>
                        <span className={`mgr-escalation-status-badge ${getStatusBadgeClass(sla.status)}`}>
                          {sla.status === 'InProgress' ? 'INPROGRESS' : sla.status?.toUpperCase()}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="mgr-escalation-card-body">
                        <div className="mgr-escalation-info-row">
                          <span className="mgr-escalation-label">Deadline</span>
                          <span className="mgr-escalation-value">
                            {dateHelpers.formatDeadline(sla.deadline)}
                          </span>
                        </div>

                        <div className="mgr-escalation-info-row">
                          <span className="mgr-escalation-label">Days Remaining</span>
                          <span className={`mgr-escalation-value ${daysRemaining < 0 ? 'text-danger' : daysRemaining <= 3 ? 'text-warning' : 'text-success'}`}>
                            {Math.abs(daysRemaining)} days
                          </span>
                        </div>

                        <div className="mgr-escalation-info-row">
                          <span className="mgr-escalation-label">Assigned To</span>
                          <span className="mgr-escalation-value mgr-text-truncate">
                            {sla.assignedToName ? (
                              <span className="mgr-sla-assigned-name">{sla.assignedToName}</span>
                            ) : (
                              <span className="mgr-sla-not-assigned">Not assigned</span>
                            )}
                          </span>
                        </div>

                        {sla.complianceStatus && (
                          <div className="mgr-escalation-info-row">
                            <span className="mgr-escalation-label">Compliance</span>
                            <span className={`mgr-compliance-badge ${sla.complianceStatus === 'OnTime' ? 'mgr-compliance-ontime' : 'mgr-compliance-breached'}`}>
                              {sla.complianceStatus}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mgr-escalation-card-footer">
                        <button
                          className="mgr-escalation-view-btn"
                          onClick={() => handleRowClick(sla.slaid)}
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredSlas.length > itemsPerPage && (
              <div className="mgr-sla-pagination-wrapper mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={filteredSlas.length}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          // Table View for Team Escalation
          <>
            <div className="mgr-sla-table-container">
              <div className="table-responsive">
                <table className="table table-hover mb-0 mgr-sla-table">
                  <thead className="mgr-sla-table-header">
                    <tr>
                      <th>Employee</th>
                      <th>Reason</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((esc) => (
                      <tr
                        key={esc.escalationId}
                        className="mgr-sla-clickable-row"
                      >
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          <div className="mgr-sla-employee-cell">
                            <div className="mgr-sla-employee-info">
                              <div className="mgr-sla-employee-name">{esc.employeeName || '—'}</div>
                              <div className="mgr-sla-employee-email">{esc.employeeEmail || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td onClick={() => handleRowClick(esc.slaid)}>{esc.reason || '—'}</td>
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          <span className="mgr-sla-badge mgr-sla-badge-info">{esc.escalationLevel}</span>
                        </td>
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          <span
                            className={`mgr-sla-badge ${
                              esc.escalationStatus === 'Resolved'
                                ? 'mgr-sla-badge-success'
                                : esc.escalationStatus === 'InProgress'
                                ? 'mgr-sla-badge-warning'
                                : 'mgr-sla-badge-primary'
                            }`}
                          >
                            {esc.escalationStatus}
                          </span>
                        </td>
                        <td onClick={() => handleRowClick(esc.slaid)}>{formatDate(esc.submittedAt)}</td>
                        <td>
                          <div className="mgr-sla-actions">
                            <button
                              className="btn btn-sm mgr-sla-action-btn mgr-sla-action-view"
                              onClick={(e) => handleViewClick(e, esc.slaid)}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            {esc.escalationStatus !== 'Resolved' && (
                              <>
                                <button
                                  className="btn btn-sm mgr-sla-action-btn mgr-sla-action-escalate"
                                  onClick={(e) => handleEscalateClick(e, esc)}
                                  title="Escalate to Department Head"
                                >
                                  <Send size={16} />
                                </button>
                                <button
                                  className="btn btn-sm mgr-sla-action-btn mgr-sla-action-resolve"
                                  onClick={(e) => handleResolveClick(e, esc)}
                                  title="Resolve escalation"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredSlas.length > itemsPerPage && (
              <div className="mgr-sla-pagination-wrapper">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={filteredSlas.length}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showEscalationModal && selectedSLAForEscalation && (
        <ManagerEscalationModal
          review={selectedSLAForEscalation}
          onClose={() => setShowEscalationModal(false)}
          onEscalate={handleEscalateToDeptHead}
          deptHeads={deptHeads}
        />
      )}

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

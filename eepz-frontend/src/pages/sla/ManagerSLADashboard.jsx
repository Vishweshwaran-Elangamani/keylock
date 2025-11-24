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
} from 'lucide-react';
import slaService from '../../services/sla/slaService';
import ManagerEscalationModal from '../../components/sla/modals/ManagerEscalationModal';
import ResolveEscalationModal from '../../components/sla/modals/ResolveEscalationModal';
import { formatDate } from '../../utils/sla/dateFormatter';
import Pagination from '../../components/project_management_components/common/Pagination';
import '../../styles/sla/ManagerSLADashboard.css';

const ManagerSLADashboard = () => {
  const navigate = useNavigate();

  const [managerSLAs, setManagerSLAs] = useState([]);
  const [managerEscalations, setManagerEscalations] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

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
  }, [managerSLAs, managerEscalations, searchTerm, statusFilter, complianceFilter, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, complianceFilter, activeTab]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarClass = (index) => {
    const classes = [
      'mgr-sla-avatar-pink',
      'mgr-sla-avatar-purple',
      'mgr-sla-avatar-indigo',
      'mgr-sla-avatar-blue',
      'mgr-sla-avatar-teal',
      'mgr-sla-avatar-green',
    ];
    return classes[index % classes.length];
  };

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

      const escalationsRes = await slaService.getManagerEscalations(userData.empId);
      if (escalationsRes?.success && Array.isArray(escalationsRes.data)) {
        setManagerEscalations(escalationsRes.data);
      }

      const response = await slaService.getAllSLAs();
      if (response?.success && Array.isArray(response.data)) {
        const filtered = response.data.filter(
          (sla) => sla.assignedToEmployeeId === userData.empId
        );
        setManagerSLAs(filtered);
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
      case 'open':
        return managerSLAs.filter((s) => s.status === 'Open');
      case 'closed':
        return managerSLAs.filter((s) => s.status === 'Closed');
      case 'escalations':
        return managerEscalations;
      default:
        return managerSLAs;
    }
  };

  const applyFilters = () => {
    let result = getTabData();

    if (activeTab !== 'escalations') {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (sla) =>
            sla.employeeName?.toLowerCase().includes(term) ||
            sla.departmentName?.toLowerCase().includes(term) ||
            sla.slaid?.toString().includes(term)
        );
      }

      if (statusFilter !== 'All') {
        result = result.filter((sla) => sla.status === statusFilter);
      }

      if (complianceFilter !== 'All') {
        result = result.filter((sla) => sla.complianceStatus === complianceFilter);
      }
    } else {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
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

  const calculateStats = () => {
    return {
      total: managerSLAs.length,
      open: managerSLAs.filter((s) => s.status === 'Open').length,
      escalated: managerSLAs.filter((s) => s.status === 'Escalated').length,
      closed: managerSLAs.filter((s) => s.status === 'Closed').length,
    };
  };

  const handleViewClick = (e, id) => {
    e.stopPropagation();
    navigate(`/sla/manager/details/${id}`);
  };

  const handleEscalateClick = (e, sla) => {
    e.stopPropagation();
    setSelectedSLAForEscalation(sla);
    setShowEscalationModal(true);
  };

  const handleEscalateToDeptHead = async (payload) => {
    try {
      const res = await slaService.escalateToDeptHead(payload);
      if (res.success) {
        toast.success('Escalated successfully');
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
    setStatusFilter('All');
    setComplianceFilter('All');
    toast.info('Filters cleared');
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

      {/* Stats Cards - Only 4 */}
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
            label: 'Escalated',
            value: stats.escalated,
            icon: AlertTriangle,
            bgColor: '#FEE2E2',
            iconColor: '#DC2626',
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
            <div className="mgr-sla-search-wrapper">
              <Search size={16} className="mgr-sla-search-icon" />
              <input
                type="text"
                className="form-control mgr-sla-search-input"
                placeholder={
                  activeTab === 'escalations'
                    ? 'Search by reason or employee...'
                    : 'Search by employee, department, or ID...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select mgr-sla-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
                  <option value="Closed">Closed</option>
                </>
              )}
            </select>
          </div>
          {activeTab !== 'escalations' && (
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
          <div className={`col-lg-${activeTab !== 'escalations' ? '4' : '6'} col-md-12`}>
            <div className="mgr-sla-filter-actions">
              <button className="btn btn-outline-secondary mgr-sla-btn-clear" onClick={clearFilters}>
                <Filter size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Below Filters */}
      <div className="mgr-sla-tabs-wrapper">
        <div className="mgr-sla-tabs-container">
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'closed', label: 'Closed' },
            { key: 'escalations', label: 'Escalations' },
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

      {/* Table */}
      <div className="mgr-sla-table-wrapper">
        <div className="table-responsive">
          <table className="table table-hover mb-0 mgr-sla-table">
            <thead className="mgr-sla-table-header">
              <tr>
                {activeTab === 'escalations' ? (
                  <>
                    <th>Employee</th>
                    <th>Reason</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </>
                ) : (
                  <>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Compliance</th>
                    <th>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="mgr-sla-table-empty">
                    <FileText size={48} className="mgr-sla-empty-icon" />
                    <p className="mgr-sla-empty-text">
                      No {activeTab === 'escalations' ? 'escalations' : 'SLAs'} found
                    </p>
                    {filteredSlas.length === 0 && getTabData().length > 0 && (
                      <button className="btn btn-outline-primary" onClick={clearFilters}>
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : activeTab === 'escalations' ? (
                paginatedData.map((esc, index) => (
                  <tr
                    key={esc.escalationId}
                    onClick={() => handleRowClick(esc.slaid)}
                    className="mgr-sla-clickable-row"
                  >
                    <td>
                      <div className="mgr-sla-employee-cell">
                        
                        <div className="mgr-sla-employee-info">
                          <div className="mgr-sla-employee-name">{esc.employeeName || '—'}</div>
                          <div className="mgr-sla-employee-email">{esc.employeeEmail || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{esc.reason || '—'}</td>
                    <td>
                      <span className="mgr-sla-badge mgr-sla-badge-info">{esc.escalationLevel}</span>
                    </td>
                    <td>
                      <span
                        className={`mgr-sla-badge ${
                          esc.escalationStatus === 'Resolved'
                            ? 'mgr-sla-badge-success'
                            : 'mgr-sla-badge-primary'
                        }`}
                      >
                        {esc.escalationStatus}
                      </span>
                    </td>
                    <td>{formatDate(esc.submittedAt)}</td>
                    <td>
                      <div className="mgr-sla-actions">
                        <button
                          className="btn btn-sm mgr-sla-action-btn mgr-sla-action-view-text"
                          onClick={(e) => handleViewClick(e, esc.slaid)}
                          title="View details"
                        >
                          View
                        </button>
                        {esc.escalationStatus === 'Pending' && (
                          <button
                            className="btn btn-sm mgr-sla-action-btn mgr-sla-action-resolve"
                            onClick={(e) => handleResolveClick(e, esc)}
                            title="Resolve escalation"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                paginatedData.map((sla, index) => (
                  <tr
                    key={sla.slaid}
                    onClick={() => handleRowClick(sla.slaid)}
                    className="mgr-sla-clickable-row"
                  >
                    <td>
                      <div className="mgr-sla-employee-cell">
                        
                        <div className="mgr-sla-employee-info">
                          <div className="mgr-sla-employee-name">{sla.employeeName || '—'}</div>
                          <div className="mgr-sla-employee-email">{sla.employeeEmail || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{sla.departmentName || '—'}</td>
                    <td>{formatDate(sla.deadline)}</td>
                    <td>
                      <span className={`mgr-sla-badge mgr-sla-badge-${sla.status?.toLowerCase()}`}>
                        {sla.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`mgr-sla-badge mgr-sla-badge-compliance-${sla.complianceStatus?.toLowerCase()}`}
                      >
                        {sla.complianceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="mgr-sla-actions">
                        <button
                          className="btn btn-sm mgr-sla-action-btn mgr-sla-action-view"
                          onClick={(e) => handleViewClick(e, sla.slaid)}
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        {sla.status !== 'Closed' && (
                          <button
                            className="btn btn-sm mgr-sla-action-btn mgr-sla-action-escalate"
                            onClick={(e) => handleEscalateClick(e, sla)}
                            title="Escalate SLA"
                          >
                            <Send size={14} />
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

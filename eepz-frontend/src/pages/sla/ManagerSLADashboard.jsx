import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  RefreshCw,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  FileText,
  Send,
  Download,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import slaService from '../../services/sla/slaService';
import ManagerEscalationModal from '../../components/sla/modals/ManagerEscalationModal';
import ResolveEscalationModal from '../../components/sla/modals/ResolveEscalationModal';
import { formatDate } from '../../utils/sla/dateFormatter';
import Breadcrumb from '../../components/sla/common/Breadcrumbs';
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
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [complianceFilter, setComplianceFilter] = useState('All Compliance');
  const [activeTab, setActiveTab] = useState('all');

  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSLAForEscalation, setSelectedSLAForEscalation] = useState(null);
  const [selectedEscalationForResolve, setSelectedEscalationForResolve] = useState(null);
  const [deptHeads, setDeptHeads] = useState([]);

  // User profile state
  const [userData, setUserData] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    loadData();
    loadUserData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [managerSLAs, managerEscalations, searchTerm, statusFilter, complianceFilter, activeTab]);

  const loadUserData = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      setUserData(user);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarClass = (index) => {
    const classes = [
      'sla-mgr-avatar-pink',
      'sla-mgr-avatar-purple',
      'sla-mgr-avatar-indigo',
      'sla-mgr-avatar-blue',
      'sla-mgr-avatar-teal',
      'sla-mgr-avatar-green',
    ];
    return classes[index % classes.length];
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
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

      if (statusFilter !== 'All Status') {
        result = result.filter((sla) => sla.status === statusFilter);
      }

      if (complianceFilter !== 'All Compliance') {
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

      if (statusFilter !== 'All Status') {
        result = result.filter((esc) => esc.escalationStatus === statusFilter);
      }
    }

    setFilteredSlas(result);
  };

  const calculateStats = () => {
    return {
      total: managerSLAs.length,
      open: managerSLAs.filter((s) => s.status === 'Open').length,
      closed: managerSLAs.filter((s) => s.status === 'Closed').length,
      escalated: managerSLAs.filter((s) => s.status === 'Escalated').length,
      totalEscalations: managerEscalations.length,
      pending: managerEscalations.filter((e) => e.escalationStatus === 'Pending').length,
    };
  };

  const handleEscalateClick = (sla) => {
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

  const handleResolveClick = (escalation) => {
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

  const stats = calculateStats();
  const totalPages = Math.ceil(filteredSlas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredSlas.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="sla-mgr-loading-container">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="sla-mgr-dashboard">
      <Breadcrumb
        items={[
          { label: 'Dashboard' },
          { label: 'SLA Management' },
          { label: 'Manager' },
        ]}
      />

      {/* Header with User Profile */}
      <div className="sla-mgr-header">
        <div>
          <h1 className="sla-mgr-title">Manager SLA Dashboard</h1>
          <p className="sla-mgr-subtitle">Track and manage all assigned SLAs</p>
        </div>
        <div className="sla-mgr-header-actions">
          <button className="sla-mgr-btn sla-mgr-btn-refresh" onClick={loadData}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="sla-mgr-btn sla-mgr-btn-export"
            onClick={() => toast.info('Export feature coming soon')}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="sla-mgr-stats-grid">
        {[
          { label: 'Total SLAs', value: stats.total, icon: Users, bg: '#EEF2FF', color: '#3B82F6' },
          { label: 'Open', value: stats.open, icon: Clock, bg: '#E0E7FF', color: '#4F46E5' },
          { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, bg: '#FEE2E2', color: '#DC2626' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle, bg: '#DCFCE7', color: '#16A34A' },
          { label: 'Total Escalations', value: stats.totalEscalations, icon: TrendingUp, bg: '#FEF3C7', color: '#D97706' },
          { label: 'Pending', value: stats.pending, icon: Clock, bg: '#FFF7ED', color: '#EA580C' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="sla-mgr-stat-card">
            <div className="sla-mgr-stat-icon" style={{ backgroundColor: bg }}>
              <Icon size={22} color={color} strokeWidth={2.5} />
            </div>
            <h3 className="sla-mgr-stat-value">{value}</h3>
            <p className="sla-mgr-stat-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Pill-Style Tabs */}
      <div className="sla-mgr-tabs-wrapper">
        <div className="sla-mgr-tabs-container">
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'closed', label: 'Closed' },
            { key: 'escalations', label: 'Escalations' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`sla-mgr-tab-pill ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="sla-mgr-filters">
        <div className="sla-mgr-search-wrapper">
          <Search size={16} className="sla-mgr-search-icon" />
          <input
            type="text"
            className="sla-mgr-search-input"
            placeholder={
              activeTab === 'escalations'
                ? 'Search by reason or employee...'
                : 'Search by employee, department, type, or SLA ID...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="sla-mgr-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          {activeTab === 'escalations' ? (
            <>
              <option>Pending</option>
              <option>Resolved</option>
            </>
          ) : (
            <>
              <option>Open</option>
              <option>Closed</option>
            </>
          )}
        </select>

        {activeTab !== 'escalations' && (
          <select
            className="sla-mgr-select"
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
          >
            <option>All Compliance</option>
            <option>OnTime</option>
            <option>Breached</option>
            <option>Extended</option>
          </select>
        )}

        <button
          className="sla-mgr-btn-filter"
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('All Status');
            setComplianceFilter('All Compliance');
          }}
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="sla-mgr-table-wrapper">
        <div className="table-responsive">
          <table className="sla-mgr-table">
            <thead>
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
                  <td colSpan="6" className="sla-mgr-empty">
                    <FileText size={48} className="sla-mgr-empty-icon" />
                    <p className="sla-mgr-empty-text">
                      No {activeTab === 'escalations' ? 'escalations' : 'SLAs'} found
                    </p>
                  </td>
                </tr>
              ) : activeTab === 'escalations' ? (
                paginatedData.map((esc, index) => (
                  <tr key={esc.escalationId}>
                    <td>
                      <div className="sla-mgr-employee-cell">
                        <div className={`sla-mgr-table-avatar ${getAvatarClass(index)}`}>
                          {getInitials(esc.employeeName)}
                        </div>
                        <div className="sla-mgr-employee-info">
                          <div className="sla-mgr-employee-name">
                            {esc.employeeName || '—'}
                          </div>
                          <div className="sla-mgr-employee-email">
                            {esc.employeeEmail || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{esc.reason || '—'}</td>
                    <td>
                      <span className="sla-mgr-badge sla-mgr-badge-info">
                        {esc.escalationLevel}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`sla-mgr-badge ${
                          esc.escalationStatus === 'Resolved'
                            ? 'sla-mgr-badge-success'
                            : 'sla-mgr-badge-primary'
                        }`}
                      >
                        {esc.escalationStatus}
                      </span>
                    </td>
                    <td>{formatDate(esc.submittedAt)}</td>
                    <td>
                      <div className="sla-mgr-actions">
                        <button
                          className="sla-mgr-action-btn sla-mgr-action-view"
                          onClick={() => navigate(`/sla/manager/details/${esc.slaid}`)}
                        >
                          <Eye size={14} />
                        </button>
                        {esc.escalationStatus === 'Pending' && (
                          <button
                            className="sla-mgr-action-btn sla-mgr-action-approve"
                            onClick={() => handleResolveClick(esc)}
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
                  <tr key={sla.slaid}>
                    <td>
                      <div className="sla-mgr-employee-cell">
                        <div className={`sla-mgr-table-avatar ${getAvatarClass(index)}`}>
                          {getInitials(sla.employeeName)}
                        </div>
                        <div className="sla-mgr-employee-info">
                          <div className="sla-mgr-employee-name">
                            {sla.employeeName || '—'}
                          </div>
                          <div className="sla-mgr-employee-email">
                            {sla.employeeEmail || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{sla.departmentName || '—'}</td>
                    <td>{formatDate(sla.deadline)}</td>
                    <td>
                      <span className={`sla-mgr-badge sla-mgr-badge-${sla.status?.toLowerCase()}`}>
                        {sla.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`sla-mgr-badge sla-mgr-badge-compliance-${sla.complianceStatus?.toLowerCase()}`}
                      >
                        {sla.complianceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="sla-mgr-actions">
                        <button
                          className="sla-mgr-action-btn sla-mgr-action-view"
                          onClick={() => navigate(`/sla/manager/details/${sla.slaid}`)}
                        >
                          <Eye size={14} />
                        </button>
                        {sla.status !== 'Closed' && (
                          <button
                            className="sla-mgr-action-btn sla-mgr-action-escalate"
                            onClick={() => handleEscalateClick(sla)}
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

        {/* Pagination */}
        {filteredSlas.length > 0 && totalPages > 1 && (
          <div className="sla-mgr-pagination">
            <div className="sla-mgr-pagination-info">
              Showing {startIndex + 1} to{' '}
              {Math.min(startIndex + itemsPerPage, filteredSlas.length)} of{' '}
              {filteredSlas.length} entries
            </div>
            <div className="sla-mgr-pagination-nav">
              <button
                className="sla-mgr-pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`sla-mgr-pagination-btn ${
                    currentPage === i + 1 ? 'active' : ''
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="sla-mgr-pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
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

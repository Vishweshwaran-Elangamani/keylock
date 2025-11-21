// src/pages/sla/ManagerSLADashboard.jsx - PROPERLY STRUCTURED
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import slaService, { escalationHelpers } from '../../services/sla/slaService';
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [managerSLAs, managerEscalations, searchTerm, statusFilter, complianceFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));

      if (!userData?.empId) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      // Fetch department heads
      if (userData.departmentId) {
        const deptHeadRes = await slaService.getDepartmentHeads(userData.departmentId);
        if (deptHeadRes?.success && Array.isArray(deptHeadRes.data)) {
          setDeptHeads(deptHeadRes.data);
        }
      }

      // Fetch escalations
      const escalationsRes = await slaService.getManagerEscalations(userData.empId);
      if (escalationsRes?.success && Array.isArray(escalationsRes.data)) {
        setManagerEscalations(escalationsRes.data);
      }

      // Fetch SLAs
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
      <div className="loading-container">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard' }, { label: 'SLA Management' }, { label: 'Manager' }]} />
          <h1 className="dashboard-title">Manager SLA Dashboard</h1>
          <p className="dashboard-subtitle">Track and manage all assigned SLAs with compliance metrics</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadData}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-export" onClick={() => toast.info('Export feature coming soon')}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Compliance Summary Bar */}
      <div className="compliance-card">
        <div className="compliance-metrics">
          <div className="compliance-metric">
            <div className="metric-icon icon-red">
              <TrendingUp size={20} />
            </div>
            <div className="compliance-metric-content">
              <h4>0.0%</h4>
              <small>Compliance</small>
            </div>
          </div>

          <div className="compliance-metric">
            <div className="metric-icon icon-green">
              <CheckCircle size={20} />
            </div>
            <div className="compliance-metric-content">
              <h4>0</h4>
              <small>On-Time</small>
            </div>
          </div>

          <div className="compliance-metric">
            <div className="metric-icon icon-pink">
              <AlertTriangle size={20} />
            </div>
            <div className="compliance-metric-content">
              <h4>0</h4>
              <small>Breached</small>
            </div>
          </div>

          <div className="compliance-metric">
            <div className="metric-icon icon-yellow">
              <Clock size={20} />
            </div>
            <div className="compliance-metric-content">
              <h4>0</h4>
              <small>Extended</small>
            </div>
          </div>
        </div>

        <div className="compliance-rating">
          <span className="rating-badge critical">Critical</span>
          <p className="rating-info">Based on 0 Closed SLAs</p>
          <div className="rating-circle">
            <div className="rating-circle-inner">0%</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {[
          { label: 'Total SLAs', value: stats.total, icon: Users, className: 'icon-blue' },
          { label: 'Open', value: stats.open, icon: Clock, className: 'icon-light-blue' },
          { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, className: 'icon-red' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle, className: 'icon-green' },
          { label: 'Total Escalations', value: stats.totalEscalations, icon: TrendingUp, className: 'icon-yellow' },
          { label: 'Pending', value: stats.pending, icon: Clock, className: 'icon-orange' },
        ].map(({ label, value, icon: Icon, className }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${className}`}>
              <Icon size={24} />
            </div>
            <h3>{value}</h3>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs Container */}
      <div className="tabs-container">
        <div className="tabs-header">
          {[
            { key: 'all', label: 'All', icon: Users, count: stats.total },
            { key: 'open', label: 'Open', icon: Clock, count: stats.open },
            { key: 'closed', label: 'Closed', icon: CheckCircle, count: stats.closed },
            { key: 'escalations', label: 'Escalations', icon: TrendingUp, count: stats.totalEscalations },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} />
              {label} <span className="tab-count">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder={
              activeTab === 'escalations'
                ? 'Search by employee, department, type, or SLA ID...'
                : 'Search by employee, department, type, or SLA ID...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
          <select className="filter-select" value={complianceFilter} onChange={(e) => setComplianceFilter(e.target.value)}>
            <option>All Compliance</option>
            <option>OnTime</option>
            <option>Breached</option>
            <option>Extended</option>
          </select>
        )}

        <button className="btn-filter-icon">
          <Filter size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="sla-table">
            <thead>
              <tr>
                {activeTab === 'escalations' ? (
                  <>
                    <th>EMPLOYEE</th>
                    <th>REASON</th>
                    <th>LEVEL</th>
                    <th>STATUS</th>
                    <th>SUBMITTED</th>
                    <th>ACTIONS</th>
                  </>
                ) : (
                  <>
                    <th>EMPLOYEE</th>
                    <th>SLA'S DEPARTMENT</th>
                    <th>DEADLINE</th>
                    <th>STATUS</th>
                    <th>COMPLIANCE</th>
                    <th>ACTIONS</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <FileText size={56} className="empty-icon" />
                      <h6>No SLAs found</h6>
                    </div>
                  </td>
                </tr>
              ) : activeTab === 'escalations' ? (
                paginatedData.map((esc) => (
                  <tr key={esc.escalationId}>
                    <td><strong>{esc.employeeName || '—'}</strong></td>
                    <td>{esc.reason || '—'}</td>
                    <td><span className="badge">{esc.escalationLevel}</span></td>
                    <td><span className={`badge ${esc.escalationStatus === 'Resolved' ? 'status-closed' : 'status-open'}`}>{esc.escalationStatus}</span></td>
                    <td>{formatDate(esc.submittedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn btn-view" onClick={() => navigate(`/sla/manager/details/${esc.slaid}`)}>
                          <Eye size={14} />
                        </button>
                        {esc.escalationStatus === 'Pending' && (
                          <button className="action-btn btn-approve" onClick={() => handleResolveClick(esc)}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                paginatedData.map((sla) => (
                  <tr key={sla.slaid}>
                    <td><strong>{sla.employeeName || '—'}</strong></td>
                    <td>{sla.departmentName || '—'}</td>
                    <td>{formatDate(sla.deadline)}</td>
                    <td><span className={`badge status-${sla.status?.toLowerCase()}`}>{sla.status}</span></td>
                    <td><span className={`badge compliance-${sla.complianceStatus?.toLowerCase()}`}>{sla.complianceStatus}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn btn-view" onClick={() => navigate(`/sla/manager/details/${sla.slaid}`)}>
                          <Eye size={14} />
                        </button>
                        {sla.status !== 'Closed' && (
                          <button className="action-btn btn-escalate" onClick={() => handleEscalateClick(sla)}>
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
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSlas.length)} of {filteredSlas.length} entries
            </div>
            <nav className="pagination-nav">
              <button className="pagination-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="pagination-btn" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                <ChevronRight size={16} />
              </button>
            </nav>
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

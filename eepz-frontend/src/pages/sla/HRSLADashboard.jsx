import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Download, RefreshCw, Eye, Edit3, Trash2,
  FileText, AlertTriangle, Clock, CheckCircle, TrendingUp
} from 'lucide-react';
import slaService from '../../services/sla/slaService';
import Pagination from '../../components/project_management_components/Pagination';
import EditSLAModal from '../../components/sla/EditSLAModal';
import CreateSLAModal from '../../components/sla/CreateSLAModal';  // Import modal

const HRSLADashboard = () => {
  const navigate = useNavigate();
  const [slas, setSlas] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false); // Create modal state

  useEffect(() => {
    fetchSLAs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [slas, searchTerm, statusFilter, typeFilter, complianceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, complianceFilter]);

  const fetchSLAs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await slaService.getAllSLAs();
      if (response && response.success) {
        const slaList = Array.isArray(response.data) ? response.data : [];
        setSlas(slaList);
      } else {
        setError('Failed to load SLAs');
        setSlas([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load SLAs');
      setSlas([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...slas];
    if (searchTerm) {
      filtered = filtered.filter(sla => 
        sla.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sla.slatype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // sla.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sla.slaid.toString().includes(searchTerm)
      );
    }
    if (statusFilter !== 'All') filtered = filtered.filter(sla => sla.status === statusFilter);
    if (typeFilter !== 'All') filtered = filtered.filter(sla => sla.slatype === typeFilter);
    if (complianceFilter !== 'All') filtered = filtered.filter(sla => sla.complianceStatus === complianceFilter);
    setFilteredSlas(filtered);
  };

  const handleEdit = (sla) => {
    setSelectedSLA(sla);
    setShowEditModal(true);
  };

  const handleUpdate = async (slaid, updateData) => {
    try {
      const response = await slaService.updateSLA(slaid, updateData);
      if (response.success) {
        alert('✅ SLA updated successfully!');
        setShowEditModal(false);
        setSelectedSLA(null);
        fetchSLAs();
      } else {
        alert('❌ Failed to update SLA: ' + response.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (sla) => {
    if (!window.confirm(`⚠️ Are you sure you want to delete SLA #${sla.slaid} for ${sla.employeeName}?\n\nThis action cannot be undone.`)) return;
    try {
      const response = await slaService.deleteSLA(sla.slaid);
      if (response.success) {
        alert('✅ SLA deleted successfully!');
        fetchSLAs();
      } else {
        alert('❌ Failed to delete SLA: ' + response.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleViewDetails = (slaid) => {
    navigate(`/hr/dashboard/sla/details/`+ slaid );
  };

  const handleExport = () => {
    if (filteredSlas.length === 0) return;
    const csvData = filteredSlas.map(sla => ({
      ID: sla.slaid,
      Employee: sla.employeeName,
      Department: sla.departmentName,
      Type: sla.slatype,
      Status: sla.status,
      Compliance: sla.complianceStatus,
      Deadline: formatDate(sla.deadline)
    }));
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sla-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const calculateStats = () => ({
    total: slas.length,
    open: slas.filter(s => s.status === 'Open').length,
    closed: slas.filter(s => s.status === 'Closed').length,
    breached: slas.filter(s => s.complianceStatus === 'Breached').length,
    onTime: slas.filter(s => s.complianceStatus === 'OnTime').length,
    extended: slas.filter(s => s.complianceStatus === 'Extended').length
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Open': return 'bg-primary';
      case 'Closed': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getComplianceBadgeClass = (compliance) => {
    switch(compliance) {
      case 'OnTime': return 'bg-success';
      case 'Breached': return 'bg-danger';
      case 'Extended': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTypeFilter('All');
    setComplianceFilter('All');
  };

  const totalPages = Math.ceil(filteredSlas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSLAs = filteredSlas.slice(startIndex, endIndex);

  const stats = calculateStats();

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
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>
          </h2>
          <p className="text-muted mb-0">Manage all SLAs across the organization</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={fetchSLAs} style={{ borderRadius: '8px' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-outline-success d-flex align-items-center gap-2" onClick={handleExport} disabled={filteredSlas.length === 0} style={{ borderRadius: '8px' }}>
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowCreateModal(true)} style={{ borderRadius: '8px' }}>
            <Plus size={16} />
            Create SLA
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <AlertTriangle size={20} className="me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[{ label: 'Total SLAs', value: stats.total, icon: FileText, color: '#0F62FE' },
          { label: 'Open', value: stats.open, icon: Clock, color: '#0F62FE' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle, color: '#24A148' },
          { label: 'On Time', value: stats.onTime, icon: TrendingUp, color: '#24A148' },
          { label: 'Extended', value: stats.extended, icon: AlertTriangle, color: '#E2B93B' },
          { label: 'Breached', value: stats.breached, icon: AlertTriangle, color: '#E01950'}].map(({ label, value, icon: Icon, color }) => (
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
        )) }
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderRadius: '8px 0 0 8px' }}>
                  <Search size={16} className="text-muted" />
                </span>
                <input type="text" className="form-control border-start-0" placeholder="Search by employee, type, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ borderRadius: '0 8px 8px 0' }} />
              </div>
            </div>

            <div className="col-md-2">
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="col-md-2">
              <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="All">All Types</option>
                <option value="PerformanceForm">Performance Form</option>
                <option value="Review">Review</option>
                <option value="Goal">Goal</option>
              </select>
            </div>

            <div className="col-md-3">
              <select className="form-select" value={complianceFilter} onChange={(e) => setComplianceFilter(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="All">All Compliance</option>
                <option value="OnTime">On Time</option>
                <option value="Breached">Breached</option>
                <option value="Extended">Extended</option>
              </select>
            </div>

            <div className="col-md-1">
              <button className="btn btn-outline-secondary w-100" onClick={clearFilters} style={{ borderRadius: '8px' }} title="Clear all filters">
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                 
                  <th className="py-3">Employee</th>
                  {/* <th className="py-3">Department</th> */}
                  <th className="py-3">Type</th>
                  <th className="py-3">Assigned To</th>
                  <th className="py-3">Deadline</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Compliance</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSLAs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <FileText size={48} className="text-muted mb-3" />
                      <p className="text-muted mb-0">
                        {filteredSlas.length === 0 && slas.length > 0 ? 'No SLAs match your filters' : 'No SLAs found'}
                      </p>
                      {filteredSlas.length === 0 && slas.length > 0 && (
                        <button className="btn btn-sm btn-outline-primary mt-2" onClick={clearFilters}>
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  currentSLAs.map(sla => (
                    <tr key={sla.slaid}>
                    
                      <td>
                        <div>
                          <strong>{sla.employeeName}</strong>
                          <br />
                          <small className="text-muted">{sla.employeeEmail}</small>
                        </div>
                      </td>
                      {/* <td>
                        <span className="badge bg-light text-dark">{sla.departmentName}</span>
                      </td> */}
                      <td>
                        <span className="badge bg-info">{sla.slatype}</span>
                      </td>
                      <td>{sla.assignedToName ? <small>{sla.assignedToName}</small> : <small className="text-muted">Not assigned</small>}</td>
                      <td>
                        <div>
                          <small>{formatDate(sla.deadline)}</small>
                          {sla.closedAt && <><br/><small className="text-success">Closed: {formatDate(sla.closedAt)}</small></>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(sla.status)}`}>{sla.status}</span>
                      </td>
                      <td>
                        <span className={`badge ${getComplianceBadgeClass(sla.complianceStatus)}`}>{sla.complianceStatus}</span>
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetails(sla.slaid)} title="View details">
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(sla)} title="Edit SLA">
                            <Edit3 size={14} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(sla)} title="Delete SLA">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredSlas.length > itemsPerPage && (
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

      {/* Edit SLA Modal */}
      {showEditModal && selectedSLA && (
        <EditSLAModal sla={selectedSLA} onClose={() => {setShowEditModal(false);setSelectedSLA(null);}} onUpdate={handleUpdate} />
      )}

      {/* Create SLA Modal */}
      {showCreateModal && (
        <CreateSLAModal onClose={() => setShowCreateModal(false)} onSuccess={() => {
          setShowCreateModal(false);
          fetchSLAs();
        }} />
      )}
    </div>
  );
};

export default HRSLADashboard;

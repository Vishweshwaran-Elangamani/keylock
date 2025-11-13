// src/components/sla/SLATable.jsx
import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Eye } from 'lucide-react';
import SLAStatusBadge from './SLAStatusBadge';
import UrgencyIndicator from './UrgencyIndicator';
import { formatDate } from '../../utils/dateFormatter';

const SLATable = ({ slas, onViewDetails, onEscalate, showActions = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'deadline', direction: 'asc' });

  // Filter SLAs
  const filteredSLAs = slas.filter(sla => {
    const matchesSearch = sla.slatype.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sla.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || sla.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Sort SLAs
  const sortedSLAs = [...filteredSLAs].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  return (
    <div>
      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="position-relative">
                <Search size={18} className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search by type or employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2">
                <Filter size={18} className="text-muted" />
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ borderRadius: '8px' }}
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Closed">Closed</option>
                  <option value="Breached">Breached</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('slatype')}>
                  <div className="d-flex align-items-center gap-2">
                    SLA Type
                    <ArrowUpDown size={14} className="text-muted" />
                  </div>
                </th>
                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('employeeName')}>
                  <div className="d-flex align-items-center gap-2">
                    Employee
                    <ArrowUpDown size={14} className="text-muted" />
                  </div>
                </th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('deadline')}>
                  <div className="d-flex align-items-center gap-2">
                    Deadline
                    <ArrowUpDown size={14} className="text-muted" />
                  </div>
                </th>
                <th style={{ padding: '1rem' }}>Urgency</th>
                {showActions && <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedSLAs.map(sla => (
                <tr key={sla.slaid} style={{ cursor: 'pointer' }} onClick={() => onViewDetails(sla.slaid)}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{sla.slatype}</strong>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div className="fw-semibold">{sla.employeeName}</div>
                      <small className="text-muted">{sla.departmentName}</small>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <SLAStatusBadge status={sla.status} size="sm" />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {formatDate(sla.deadline)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <UrgencyIndicator 
                      urgencyStatus={sla.urgencyStatus} 
                      daysUntilDeadline={sla.daysUntilDeadline}
                      showLabel={false}
                    />
                  </td>
                  {showActions && (
                    <td style={{ padding: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                        onClick={() => onViewDetails(sla.slaid)}
                        style={{ borderRadius: '6px' }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedSLAs.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted">No SLAs found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SLATable;

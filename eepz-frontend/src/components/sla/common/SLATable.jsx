import React, { useState } from "react";
import { Search, Filter, ArrowUpDown, Eye } from "lucide-react";
import SLAStatusBadge from "./SLAStatusBadge";
import UrgencyIndicator from "../badges/UrgencyIndicator";
import { formatDate } from "../../utils/dateFormatter";
import "../../styles/sla/components/SLATable.css";

const SLATable = ({ slas, onViewDetails, onEscalate, showActions = true }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: "deadline",
    direction: "asc",
  });

  const filteredSLAs = slas.filter((sla) => {
    const matchesSearch =
      sla.slatype.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sla.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || sla.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedSLAs = [...filteredSLAs].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.direction === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  return (
    <div className="sla-table-scope">
      <div className="sla-table-filter-card card border-0 shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="sla-table-search-wrapper position-relative">
                <Search size={18} className="sla-table-search-icon" />
                <input
                  type="text"
                  className="sla-table-search-input form-control"
                  placeholder="Search by type or employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="sla-table-filter-wrapper d-flex align-items-center gap-2">
                <Filter size={18} className="sla-table-filter-icon text-muted" />
                <select
                  className="sla-table-filter-select form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
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

      <div className="sla-table-card card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="sla-table table table-hover mb-0">
            <thead className="sla-table-head">
              <tr>
                <th
                  className="sla-table-th sla-table-th-sortable"
                  onClick={() => handleSort("slatype")}
                >
                  <div className="sla-table-th-content d-flex align-items-center gap-2">
                    SLA Type
                    <ArrowUpDown size={14} className="sla-table-sort-icon text-muted" />
                  </div>
                </th>

                <th
                  className="sla-table-th sla-table-th-sortable"
                  onClick={() => handleSort("employeeName")}
                >
                  <div className="sla-table-th-content d-flex align-items-center gap-2">
                    Employee
                    <ArrowUpDown size={14} className="sla-table-sort-icon text-muted" />
                  </div>
                </th>

                <th className="sla-table-th">Status</th>

                <th
                  className="sla-table-th sla-table-th-sortable"
                  onClick={() => handleSort("deadline")}
                >
                  <div className="sla-table-th-content d-flex align-items-center gap-2">
                    Deadline
                    <ArrowUpDown size={14} className="sla-table-sort-icon text-muted" />
                  </div>
                </th>

                <th className="sla-table-th">Urgency</th>

                {showActions && (
                  <th className="sla-table-th sla-table-th-actions">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {sortedSLAs.map((sla) => (
                <tr
                  key={sla.slaid}
                  className="sla-table-row"
                  onClick={() => onViewDetails(sla.slaid)}
                >
                  <td className="sla-table-td">
                    <strong className="sla-table-strong">{sla.slatype}</strong>
                  </td>

                  <td className="sla-table-td">
                    <div className="sla-table-employee">
                      <div className="sla-table-employee-name fw-semibold">
                        {sla.employeeName}
                      </div>
                      <small className="sla-table-employee-dept text-muted">
                        {sla.departmentName}
                      </small>
                    </div>
                  </td>

                  <td className="sla-table-td">
                    <SLAStatusBadge status={sla.status} size="sm" />
                  </td>

                  <td className="sla-table-td">{formatDate(sla.deadline)}</td>

                  <td className="sla-table-td">
                    <UrgencyIndicator
                      urgencyStatus={sla.urgencyStatus}
                      daysUntilDeadline={sla.daysUntilDeadline}
                      showLabel={false}
                    />
                  </td>

                  {showActions && (
                    <td
                      className="sla-table-td sla-table-td-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="sla-table-view-btn btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                        onClick={() => onViewDetails(sla.slaid)}
                        type="button"
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
          <div className="sla-table-empty text-center py-5">
            <p className="sla-table-empty-text text-muted mb-0">
              No SLAs found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SLATable;

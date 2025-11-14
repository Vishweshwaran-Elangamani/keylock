import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import costMappingService from "../../../../services/hr_operations/hr/costMappingService";
import CreateCostMappingModal from "../modals/CreateCostMappingModal";
import EditCostMappingModal from "../modals/EditCostMappingModal";
import "../../../../styles/hr_operations/hr/costMapping.css";


const CostMapping = () => {
  const [costMappings, setCostMappings] = useState([]);
  const [filteredMappings, setFilteredMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");


  const userRole = localStorage.getItem("userRole");
  const isHR = userRole === "HR";


  useEffect(() => {
    fetchCostMappings();
  }, []);


  useEffect(() => {
    filterMappings();
  }, [costMappings, searchQuery, filterDepartment]);


  const fetchCostMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await costMappingService.getAllCostMappings();
      setCostMappings(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch cost mappings");
      showToast(
        "Error",
        err.message || "Failed to fetch cost mappings",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };


  const filterMappings = () => {
    let filtered = costMappings;


    // Filter by department
    if (filterDepartment !== "all") {
      filtered = filtered.filter(
        (m) => m.departmentId === parseInt(filterDepartment)
      );
    }


    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          (m.departmentName || "").toLowerCase().includes(query) ||
          (m.roleName || "").toLowerCase().includes(query) ||
          (m.costCategory || "").toLowerCase().includes(query)
      );
    }


    setFilteredMappings(filtered);
  };


  const handleCreateClick = () => {
    setSelectedMapping(null);
    setShowCreateModal(true);
  };


  const handleEditClick = (mapping) => {
    setSelectedMapping(mapping);
    setShowEditModal(true);
  };


  const handleDeleteClick = async (mappingId) => {
    if (!window.confirm("Are you sure you want to delete this cost mapping?")) {
      return;
    }


    try {
      await costMappingService.deleteCostMapping(mappingId);
      fetchCostMappings();
      showToast("Success", "Cost mapping deleted successfully", "success");
    } catch (err) {
      showToast(
        "Error",
        err.message || "Failed to delete cost mapping",
        "danger"
      );
    }
  };


  const handleMappingCreated = () => {
    setShowCreateModal(false);
    fetchCostMappings();
    showToast("Success", "Cost mapping created successfully", "success");
  };


  const handleMappingUpdated = () => {
    setShowEditModal(false);
    setSelectedMapping(null);
    fetchCostMappings();
    showToast("Success", "Cost mapping updated successfully", "success");
  };


  const showToast = (title, message, type) => {
    const fullMessage = `${title}: ${message}`;
    
    switch (type) {
      case "success":
        toast.success(fullMessage);
        break;
      case "danger":
      case "error":
        toast.error(fullMessage);
        break;
      case "warning":
        toast.warning(fullMessage);
        break;
      case "info":
        toast.info(fullMessage);
        break;
      default:
        toast(fullMessage);
    }
  };


  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };


  const getDepartments = () => {
    const departments = costMappings.map((m) => ({
      id: m.departmentId,
      name: m.departmentName,
    }));
    return [...new Map(departments.map((d) => [d.id, d])).values()];
  };


  return (
    <div className="cost-mapping-root">
      {error && (
        <div className="alert alert-danger cost-mapping-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}


      <div className="cost-mapping-header">
        <div className="cost-mapping-header-left">
          <h4 className="cost-mapping-title">
            <i className="bi bi-diagram-3"></i>
            Cost Mapping Management
          </h4>
          <p className="cost-mapping-subtitle">
            Configure cost allocation for departments and roles
          </p>
        </div>
        {isHR && (
          <button
            className="cost-mapping-btn-create"
            onClick={handleCreateClick}
          >
            <i className="bi bi-plus-circle"></i>
            Add Cost Mapping
          </button>
        )}
      </div>


      <div className="cost-mapping-filters">
        <div className="cost-mapping-search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="cost-mapping-search-input"
            placeholder="Search by department, role, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="cost-mapping-search-clear"
              onClick={() => setSearchQuery("")}
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>


        <select
          className="cost-mapping-filter-select"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          <option value="all">All Departments</option>
          {getDepartments().map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>


      <div className="cost-mapping-table-container">
        {loading ? (
          <div className="cost-mapping-loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading cost mappings...</p>
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="cost-mapping-table-empty">
            <i className="bi bi-inbox"></i>
            <p>
              {searchQuery
                ? `No cost mappings found matching "${searchQuery}"`
                : "No cost mappings configured"}
            </p>
            {isHR && (
              <button
                className="cost-mapping-btn-create-small"
                onClick={handleCreateClick}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create First Mapping
              </button>
            )}
          </div>
        ) : (
          <table className="cost-mapping-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Role</th>
                <th>Cost Category</th>
                <th>Base Cost</th>
                <th>Cost %</th>
                <th>Effective From</th>
                {isHR && (
                  <th className="cost-mapping-actions-header">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredMappings.map((mapping) => (
                <tr key={mapping.costMappingId}>
                  <td>
                    <strong>{mapping.departmentName || "Unknown"}</strong>
                  </td>
                  <td>{mapping.roleName || "N/A"}</td>
                  <td>
                    <span className="cost-mapping-badge">
                      {mapping.costCategory || "N/A"}
                    </span>
                  </td>
                  <td>{formatCurrency(mapping.baseCost)}</td>
                  <td>
                    <span className="cost-mapping-percentage">
                      {mapping.costPercentage || 0}%
                    </span>
                  </td>
                  <td>
                    {mapping.effectiveFrom
                      ? new Date(mapping.effectiveFrom).toLocaleDateString()
                      : "N/A"}
                  </td>
                  {isHR && (
                    <td>
                      <div className="cost-mapping-actions">
                        <button
                          className="cost-mapping-btn-edit"
                          onClick={() => handleEditClick(mapping)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="cost-mapping-btn-delete"
                          onClick={() =>
                            handleDeleteClick(mapping.costMappingId)
                          }
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {showCreateModal && (
        <CreateCostMappingModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onMappingCreated={handleMappingCreated}
        />
      )}


      {showEditModal && selectedMapping && (
        <EditCostMappingModal
          show={showEditModal}
          mapping={selectedMapping}
          onHide={() => {
            setShowEditModal(false);
            setSelectedMapping(null);
          }}
          onMappingUpdated={handleMappingUpdated}
        />
      )}
    </div>
  );
};


export default CostMapping;

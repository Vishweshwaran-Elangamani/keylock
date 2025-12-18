import { useState, useEffect, useRef } from "react";
import {
  Download,
  Eye,
  CheckCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import ApprovalDecisionModal from "../../../components/lnd/modals/ApprovalDecisionModal";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { APPROVAL_TYPE } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter
  const [typeFilter, setTypeFilter] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef(null);

  // Sorting
  const [sortField, setSortField] = useState("");
  const [sortOrderAsc, setSortOrderAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const roleName = user?.role || "";
    setUserRole(roleName);
    setRolePrefix(getRolePrefix(roleName));
  }, []);

  const getRolePrefix = (role) => {
    const prefixMap = {
      Manager: "/manager",
      "Department Head": "/department-head",
      Leadership: "/leadership",
      Employee: "/employee",
      HR: "/hr",
      Admin: "/admin",
    };
    return prefixMap[role] || "/employee";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target)
      ) {
        setShowTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchPendingApprovals();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    typeFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await lndService.getMyApprovals(
        currentPage,
        typeFilter,
        "PENDING",
        sortField,
        sortOrderAsc ? "asc" : "desc",
        itemsPerPage,
        searchTerm
      );

      if (response.data.success) {
        setApprovals(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
  };

  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReview = (approval) => {
    setSelectedApproval(approval);
    setShowDecisionModal(true);
  };

  const handleDecisionSuccess = () => {
    setShowDecisionModal(false);
    fetchPendingApprovals();
  };

  const handleDownload = async (approval) => {
    try {
      const response = await lndService.downloadApprovalAttachment(
        approval.approvalId
      );
      const filename = `approval_${approval.approvalId}_attachment`;
      downloadFile(response.data, filename);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Failed to download file");
    }
  };

  const getApprovalTypeLabel = (type) => {
    const labels = {
      [APPROVAL_TYPE.SME_REGISTRATION]: "SME Registration",
      [APPROVAL_TYPE.SME_REQUEST]: "SME Request",
      [APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT]: "Assignment Acknowledgement",
      [APPROVAL_TYPE.ASSIGNMENT_COMPLETION]: "Assignment Completion",
    };
    return labels[type] || type;
  };

  const getTypeLabel = (value) => {
    if (!value) return "All Types";
    return getApprovalTypeLabel(value);
  };

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: APPROVAL_TYPE.SME_REGISTRATION, label: "SME Registration" },
    { value: APPROVAL_TYPE.SME_REQUEST, label: "SME Request" },
    {
      value: APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT,
      label: "Assignment Acknowledgement",
    },
    {
      value: APPROVAL_TYPE.ASSIGNMENT_COMPLETION,
      label: "Assignment Completion",
    },
  ];

  const onSortClick = (field) => {
    if (sortField === field) {
      setSortOrderAsc(!sortOrderAsc);
    } else {
      setSortField(field);
      setSortOrderAsc(true);
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <ChevronUp
          size={14}
          style={{
            marginLeft: 4,
            opacity: 0.5,
            color: "white",
          }}
        />
      );
    }
    return sortOrderAsc ? (
      <ChevronUp
        size={14}
        style={{
          marginLeft: 4,
          color: "lightpink",
          fontWeight: "bold",
        }}
      />
    ) : (
      <ChevronDown
        size={14}
        style={{
          marginLeft: 4,
          color: "lightpink",
          fontWeight: "bold",
        }}
      />
    );
  };

  // Show initial loading spinner only when no data
  if (loading && approvals.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "LnD Dashboard", path: "/lnd/dashboard", icon: "" },
          { label: "Pending Approval" },
        ]}
      />

      {/* Search and Filter */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            gap: "0.5rem",
            flexGrow: 1,
            minWidth: 250,
          }}
        >
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search approvals..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              style={{ minHeight: "35.7px" }}
            />
            {searchTerm ? (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancelSearch}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-search me-1"></i>
                Search
              </button>
            )}
          </div>
        </form>

        {/* TYPE FILTER DROPDOWN */}
        <div ref={typeDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            style={{
              padding: "0.5rem 0.875rem",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              cursor: "pointer",
              background: "#fff",
              color: "black",
              minWidth: "220px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
          >
            <span>{getTypeLabel(typeFilter)}</span>
            <i
              className={`bi bi-chevron-${showTypeDropdown ? "up" : "down"}`}
              style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}
            ></i>
          </button>

          {showTypeDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                minWidth: "220px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                overflow: "hidden",
              }}
            >
              {typeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setTypeFilter(option.value);
                    setCurrentPage(1);
                    setShowTypeDropdown(false);
                  }}
                  style={{
                    padding: "0.625rem 0.875rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "#212529",
                    textAlign: "left",
                    transition: "all 0.2s",
                    background:
                      typeFilter === option.value ? "#f3f4f6" : "#fff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgb(39, 35, 92)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      typeFilter === option.value ? "#f3f4f6" : "#fff";
                    e.currentTarget.style.color = "#212529";
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals Table */}
      {approvals.length === 0 && !loading ? (
        <EmptyState
          icon={CheckCircle}
          title="No Pending Approvals"
          message={
            searchTerm || typeFilter
              ? "No approvals match your current search or filters."
              : "You don't have any pending approval requests at the moment."
          }
        />
      ) : (
        <>
          <div
            style={{
              minHeight: "65vh",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1.5fr 1.2fr 1.3fr",
                  padding: "1rem 1.5rem",
                  background: "rgb(39, 35, 92)",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                {[
                  {
                    label: "Request Type",
                    field: "approvalType",
                    align: "left",
                  },
                  {
                    label: "Submitted By",
                    field: "requesterName",
                    align: "left",
                  },
                  {
                    label: "Assigned To",
                    field: "approverName",
                    align: "left",
                  },
                  {
                    label: "Submission Date",
                    field: "requestedOn",
                    align: "left",
                  },
                  { label: "Quick Actions", field: null, align: "center" },
                ].map(({ label, field, align }) => (
                  <div
                    key={field || label}
                    onClick={() => field && onSortClick(field)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        align === "center" ? "center" : "flex-start",
                      gap: 4,
                      userSelect: "none",
                      cursor: field ? "pointer" : "default",
                      transition: "color 0.2s",
                      color: "white",
                    }}
                    onMouseEnter={(e) => {
                      if (field) e.currentTarget.style.color = "lightpink";
                    }}
                    onMouseLeave={(e) => {
                      if (field && sortField !== field) {
                        e.currentTarget.style.color = "white";
                      }
                    }}
                  >
                    {label}
                    {field && renderSortIcon(field)}
                  </div>
                ))}
              </div>

              {/* Table Rows */}
              {approvals.map((approval, idx) => (
                <div
                  key={approval.approvalId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1.5fr 1.2fr 1.3fr",
                    padding: "1rem 1.5rem",
                    borderBottom:
                      idx < approvals.length - 1 ? "1px solid #f3f4f6" : "none",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    color: "#212529",
                    transition: "background 0.2s",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  <div style={{ fontWeight: "500" }}>
                    {getApprovalTypeLabel(approval.approvalType)}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {approval.requesterName}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {approval.approverName || "-"}
                    </div>
                  </div>
                  <div style={{ color: "#6b7280" }}>
                    {approval.requestedOn
                      ? new Date(approval.requestedOn).toLocaleDateString()
                      : "-"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "center",
                    }}
                  >
                    {approval.attachmentPath && (
                      <button
                        onClick={() => handleDownload(approval)}
                        style={{
                          padding: "0.4rem 0.75rem",
                          background: "#fff",
                          border: "1px solid #97247E",
                          borderRadius: "8px",
                          color: "#97247E",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#AC5098";
                          e.currentTarget.style.color = "#AC5098";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#97247E";
                          e.currentTarget.style.color = "#97247E";
                        }}
                        title="Download Attachment"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleReview(approval)}
                      style={{
                        padding: "0.4rem 0.85rem",
                        background:
                          "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        boxShadow: "0 2px 7px rgba(151, 36, 126, 0.3)",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(151, 36, 126, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 7px rgba(151, 36, 126, 0.3)";
                      }}
                      title="Review Approval"
                    >
                      <Eye size={16} />
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </>
      )}

      {showDecisionModal && (
        <ApprovalDecisionModal
          approval={selectedApproval}
          onClose={() => setShowDecisionModal(false)}
          onSuccess={handleDecisionSuccess}
        />
      )}
    </div>
  );
};

export default PendingApprovals;

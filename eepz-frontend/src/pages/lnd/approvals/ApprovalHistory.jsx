import { useState, useEffect, useRef } from "react";
import { Download, Filter, ChevronUp, ChevronDown, Search } from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import {
  APPROVAL_TYPE,
  APPROVAL_STATUS,
} from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const ApprovalHistory = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Dropdown states
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Dropdown refs
  const roleDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setShowRoleDropdown(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target)
      ) {
        setShowTypeDropdown(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchApprovalHistory();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    roleFilter,
    typeFilter,
    statusFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const response = await lndService.getApprovalHistory(
        currentPage,
        roleFilter,
        typeFilter,
        statusFilter,
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc",
        itemsPerPage
      );
      if (response.data.success) {
        setApprovals(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch approval history:", error);
      toast.error("Failed to load approval history");
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

  const getRoleLabel = (value) => {
    const roleMap = {
      all: "All Roles",
      requester: "As Requester",
      approver: "As Approver",
    };
    return roleMap[value] || "All Roles";
  };

  const getTypeLabel = (value) => {
    if (!value) return "All Types";
    return getApprovalTypeLabel(value);
  };

  const getStatusLabel = (value) => {
    const statusMap = {
      "": "All Statuses",
      [APPROVAL_STATUS.APPROVED]: "Approved",
      [APPROVAL_STATUS.REJECTED]: "Rejected",
      [APPROVAL_STATUS.PENDING]: "Pending",
    };
    return statusMap[value] || "All Statuses";
  };

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "requester", label: "As Requester" },
    { value: "approver", label: "As Approver" },
  ];

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

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: APPROVAL_STATUS.APPROVED, label: "Approved" },
    { value: APPROVAL_STATUS.REJECTED, label: "Rejected" },
    { value: APPROVAL_STATUS.PENDING, label: "Pending" },
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
          { label: "Approval History" },
        ]}
      />

      {/* Filters and search inline */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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

        {/* ROLE FILTER DROPDOWN */}
        <div ref={roleDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            style={{
              padding: "0.5rem 0.875rem",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              cursor: "pointer",
              background: "#fff",
              color: "black",
              minWidth: "160px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
          >
            <span>{getRoleLabel(roleFilter)}</span>
            <i
              className={`bi bi-chevron-${showRoleDropdown ? "up" : "down"}`}
              style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}
            ></i>
          </button>

          {showRoleDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                minWidth: "160px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                overflow: "hidden",
              }}
            >
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setRoleFilter(option.value);
                    setCurrentPage(1);
                    setShowRoleDropdown(false);
                  }}
                  style={{
                    padding: "0.625rem 0.875rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "#212529",
                    textAlign: "left",
                    transition: "all 0.2s",
                    background:
                      roleFilter === option.value ? "#f3f4f6" : "#fff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgb(39, 35, 92)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      roleFilter === option.value ? "#f3f4f6" : "#fff";
                    e.currentTarget.style.color = "#212529";
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

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

        {/* STATUS FILTER DROPDOWN */}
        <div ref={statusDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            style={{
              padding: "0.5rem 0.875rem",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              cursor: "pointer",
              background: "#fff",
              color: "black",
              minWidth: "160px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
          >
            <span>{getStatusLabel(statusFilter)}</span>
            <i
              className={`bi bi-chevron-${showStatusDropdown ? "up" : "down"}`}
              style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}
            ></i>
          </button>

          {showStatusDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                minWidth: "160px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                overflow: "hidden",
              }}
            >
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setCurrentPage(1);
                    setShowStatusDropdown(false);
                  }}
                  style={{
                    padding: "0.625rem 0.875rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "#212529",
                    textAlign: "left",
                    transition: "all 0.2s",
                    background:
                      statusFilter === option.value ? "#f3f4f6" : "#fff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgb(39, 35, 92)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      statusFilter === option.value ? "#f3f4f6" : "#fff";
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

      {/* Approval History Table */}
      {approvals.length === 0 && !loading ? (
        <EmptyState
          icon={Filter}
          title="No Approvals Found"
          message="No approvals match your current filters."
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
                minWidth: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.2fr 1fr 1.2fr 1.2fr 0.9fr 0.8fr 0.8fr 0.8fr",
                  background: "rgb(39, 35, 92)",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: 600,
                  color: "white",
                  fontsize: "0.875rem",
                  padding: "1rem 1.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                {[
                  { label: "Request Type", field: "approvalType" },
                  { label: "Skill", field: "skillName" },
                  { label: "Submitted By", field: "requesterName" },
                  { label: "Assigned To", field: "approverName" },
                  { label: "Status", field: "status" },
                  { label: "Date", field: "requestedOn" },
                  { label: "Attachment" },
                  { label: "Comments" },
                ].map(({ label, field }) => (
                  <div
                    key={field || label}
                    onClick={() => field && onSortClick(field)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      userSelect: "none",
                      cursor: field ? "pointer" : "default",
                      textAlign: "center",
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
                <div key={approval.approvalId}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.2fr 1fr 1.2fr 1.2fr 0.9fr 1fr 0.8fr 0.8fr",
                      alignItems: "center",
                      fontSize: "0.875rem",
                      color: "#212529",
                      padding: "1rem 1.5rem",
                      borderBottom:
                        idx < approvals.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                      background: "#fff",
                      transition: "background 0.2s",
                      textAlign: "start",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                    }}
                  >
                    <div style={{ fontWeight: "500", paddingLeft: "5px" }}>
                      {getApprovalTypeLabel(approval.approvalType)}
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      {approval.skillName || "None"}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                      title={approval.requesterName}
                    >
                      {approval.requesterName}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                      title={approval.approverName}
                    >
                      {approval.approverName || "None"}
                    </div>
                    <div>
                      <StatusBadge status={approval.status} />
                    </div>
                    <div style={{ color: "#6b7280", paddingLeft: "20px" }}>
                      {approval.requestedOn
                        ? new Date(approval.requestedOn).toLocaleDateString()
                        : "None"}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      {approval.attachmentPath ? (
                        <button
                          onClick={() => handleDownload(approval)}
                          title="Download Attachment"
                          style={{
                            padding: "0.4rem 0.75rem",
                            background: "#fff",
                            border: "1px solid #97247E",
                            color: "#97247E",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "white";
                            e.currentTarget.style.backgroundColor =
                              "rgb(39, 35, 92)";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#97247E";
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.color = "#97247E";
                          }}
                        >
                          <Download size={15} />
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                          }}
                        >
                          None
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: "left" }}>
                      {approval.approvalType === "SME_REQUEST" ? (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                          }}
                        >
                          None
                        </span>
                      ) : approval.notes ? (
                        <button
                          onClick={() =>
                            setExpandedNotes((prev) => ({
                              ...prev,
                              [approval.approvalId]: !prev[approval.approvalId],
                            }))
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#97247E",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.875rem",
                            textDecoration: expandedNotes?.[approval.approvalId]
                              ? "underline"
                              : "none",
                            padding: "0.25rem 0.5rem",
                          }}
                          title={
                            expandedNotes?.[approval.approvalId]
                              ? "Hide comments"
                              : "Show comments"
                          }
                        >
                          {expandedNotes?.[approval.approvalId]
                            ? "Hide"
                            : "View"}
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                          }}
                        >
                          None
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Expanded notes */}
                  {approval.approvalType !== "SME_REQUEST" &&
                    expandedNotes?.[approval.approvalId] &&
                    approval.notes && (
                      <div
                        style={{
                          padding: "1rem 1.5rem",
                          background: "#f9fafb",
                          fontSize: "0.875rem",
                          color: "#4b5563",
                          whiteSpace: "pre-wrap",
                          borderBottom:
                            idx < approvals.length - 1
                              ? "1px solid #e5e7eb"
                              : "none",
                          borderLeft: "3px solid #97247E",
                          marginLeft: "1.5rem",
                          textAlign: "left",
                        }}
                      >
                        <strong
                          style={{
                            color: "#374151",
                            display: "block",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Approver Comments:
                        </strong>
                        {approval.notes}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Updated Pagination with new props */}
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
    </div>
  );
};

export default ApprovalHistory;

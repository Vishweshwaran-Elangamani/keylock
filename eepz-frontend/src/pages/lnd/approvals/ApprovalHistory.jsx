import { useState, useEffect } from "react";
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
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});
  const [sortField, setSortField] = useState("");
  const [sortOrderAsc, setSortOrderAsc] = useState(true);

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

  useEffect(() => {
    fetchApprovalHistory();
  }, [
    currentPage,
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
        sortOrderAsc ? "asc" : "desc"
      );
      if (response.data.success) {
        setApprovals(response.data.data.items);
        setPagination({
          totalCount: response.data.data.totalCount,
          pageNumber: response.data.data.pageNumber,
          pageSize: response.data.data.pageSize,
          totalPages: response.data.data.totalPages,
          hasPreviousPage: response.data.data.hasPreviousPage,
          hasNextPage: response.data.data.hasNextPage,
        });
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

  const toggleNotes = (approvalId) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [approvalId]: !prev[approvalId],
    }));
  };

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
      // Show a neutral/inactive sort icon when not sorted
      return (
        <ChevronUp
          size={14}
          style={{
            marginLeft: 4,
            opacity: 0.5,
            color: "#000000ff",
          }}
        />
      );
    }
    // Show active sort direction
    return sortOrderAsc ? (
      <ChevronUp
        size={14}
        style={{
          marginLeft: 4,
          color: "#97247E",
          fontWeight: "bold",
        }}
      />
    ) : (
      <ChevronDown
        size={14}
        style={{
          marginLeft: 4,
          color: "#97247E",
          fontWeight: "bold",
        }}
      />
    );
  };

  if (loading) {
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
          {
            label: "Learning & Development",
            path: `${rolePrefix}/lnd/dashboard`,
          },
          { label: "Approvals History" },
        ]}
      />

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            marginBottom: "0.5rem",
            fontWeight: "700",
            color: "#212529",
          }}
        >
          Approval History
        </h2>
        <p style={{ color: "#6c757d", fontSize: "0.9375rem", margin: 0 }}>
          View all your past approvals as requester or approver
        </p>
      </div>

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
          <div style={{ position: "relative", flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Search approvals... (Press Enter)"
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              style={{
                padding: "0.625rem 1rem",
                paddingRight: "2.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: "0.875rem",
                outline: "none",
                width: "100%",
              }}
            />
            <button
              type="submit"
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6c757d",
              }}
              title="Search"
            >
              <Search size={18} />
            </button>
          </div>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "0.625rem 1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "0.875rem",
            outline: "none",
            cursor: "pointer",
            background: "#fff",
          }}
        >
          <option value="all">All Roles</option>
          <option value="requester">As Requester</option>
          <option value="approver">As Approver</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "0.625rem 1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "0.875rem",
            outline: "none",
            cursor: "pointer",
            background: "#fff",
          }}
        >
          <option value="">All Types</option>
          <option value={APPROVAL_TYPE.SME_REGISTRATION}>
            SME Registration
          </option>
          <option value={APPROVAL_TYPE.SME_REQUEST}>SME Request</option>
          <option value={APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT}>
            Assignment Acknowledgement
          </option>
          <option value={APPROVAL_TYPE.ASSIGNMENT_COMPLETION}>
            Assignment Completion
          </option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "0.625rem 1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "0.875rem",
            outline: "none",
            cursor: "pointer",
            background: "#fff",
          }}
        >
          <option value="">All Statuses</option>
          <option value={APPROVAL_STATUS.APPROVED}>Approved</option>
          <option value={APPROVAL_STATUS.REJECTED}>Rejected</option>
          <option value={APPROVAL_STATUS.PENDING}>Pending</option>
        </select>
      </div>

      {/* Approval History Table */}
      {approvals.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No Approvals Found"
          message="No approvals match your current filters."
        />
      ) : (
        <>
          <div style={{ minHeight: "49vh" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.5fr 1fr 1.2fr 1.2fr 0.9fr 1fr 0.8fr 0.8fr",
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.875rem",
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
                  { label: "Submission Date", field: "requestedOn" },
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
                      color: sortField === field ? "#97247E" : "#374151",
                    }}
                    onMouseEnter={(e) => {
                      if (field) e.currentTarget.style.color = "#97247E";
                    }}
                    onMouseLeave={(e) => {
                      if (field && sortField !== field) {
                        e.currentTarget.style.color = "#374151";
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
                        "1.5fr 1fr 1.2fr 1.2fr 0.9fr 1fr 0.8fr 0.8fr",
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
                    <div style={{ fontWeight: "500" }}>
                      {getApprovalTypeLabel(approval.approvalType)}
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      {approval.skillName || "-"}
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
                      {approval.approverName || "-"}
                    </div>
                    <div>
                      <StatusBadge status={approval.status} />
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      {approval.requestedOn
                        ? new Date(approval.requestedOn).toLocaleDateString()
                        : "-"}
                    </div>
                    <div style={{ textAlign: "center" }}>
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
                            e.currentTarget.style.borderColor = "#AC5098";
                            e.currentTarget.style.color = "#AC5098";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#97247E";
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
                          -
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: "center" }}>
                      {approval.approvalType === "SME_REQUEST" ? (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                          }}
                        >
                          -
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
                          -
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

          {/*Pagination*/}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default ApprovalHistory;

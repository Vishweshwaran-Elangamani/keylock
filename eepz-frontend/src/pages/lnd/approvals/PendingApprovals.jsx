import { useState, useEffect } from "react";
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
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
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
    fetchPendingApprovals();
  }, [currentPage, typeFilter, sortField, sortOrderAsc]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await lndService.getMyApprovals(
        currentPage,
        typeFilter,
        "PENDING",
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
      console.error("Failed to fetch pending approvals:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
            color: "#000000ff",
          }}
        />
      );
    }
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
          { label: "Pending Approvals" },
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
          Pending Approvals
        </h2>
        <p style={{ color: "#6c757d", fontSize: "0.9375rem", margin: 0 }}>
          Review and process pending approval requests
        </p>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: "1.5rem" }}>
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
      </div>

      {/* Pending Approvals Table */}
      {approvals.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No Pending Approvals"
          message="You don't have any pending approval requests at the moment."
        />
      ) : (
        <>
          <div style={{ minHeight: "49vh" }}>
            <div
              style={{
                background: "#fff",
                border: "2px solid #abb4c5ff",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1.5fr 1.2fr 1.3fr",
                  padding: "1rem 1.5rem",
                  background: "#f9fafb",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  color: "#374151",
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

          {/*Pagination*/}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
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

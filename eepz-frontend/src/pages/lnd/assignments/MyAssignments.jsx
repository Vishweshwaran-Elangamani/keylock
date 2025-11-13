import { useState, useEffect } from "react";
import {
  Download,
  Upload,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import Pagination from "../../../components/lnd/common/Pagination";
import UploadProofModal from "../../../components/lnd/modals/UploadProofModal";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { ASSIGNMENT_STATUS } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortOrderAsc, setSortOrderAsc] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");

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
    fetchAssignments();
  }, [currentPage, searchTerm, statusFilter, sortField, sortOrderAsc]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await lndService.getMyAssignments(
        currentPage,
        statusFilter,
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc"
      );
      if (response.data.success) {
        setAssignments(response.data.data.items);
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
      console.error("Failed to load assignments:", error);
      toast.error("Failed to load assignments");
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

  const handleUploadProof = (assignment) => {
    setSelectedAssignment(assignment);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    toast.success("Proof uploaded successfully!");
    fetchAssignments();
  };

  const handleDownloadProof = async (assignment) => {
    try {
      const response = await lndService.downloadAssignmentProof(
        assignment.assignmentId
      );
      const filename = `${assignment.skillName}_proof.pdf`;
      downloadFile(response.data, filename);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Failed to download proof:", error);
      toast.error("Failed to download proof");
    }
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
            color: '#000000ff'
          }} 
        />
      );
    }
    return sortOrderAsc ? (
      <ChevronUp 
        size={14} 
        style={{ 
          marginLeft: 4,
          color: '#97247E',
          fontWeight: 'bold'
        }} 
      />
    ) : (
      <ChevronDown 
        size={14} 
        style={{ 
          marginLeft: 4,
          color: '#97247E',
          fontWeight: 'bold'
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
          { label: "My Assignments" },
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
          My Assignments
        </h2>
        <p style={{ color: "#6c757d", fontSize: "0.9375rem", margin: 0 }}>
          View and manage all your learning assignments
        </p>
      </div>

      {/* Filters and search */}
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
              placeholder="Search assignments... (Press Enter)"
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
          <option value={ASSIGNMENT_STATUS.PENDING_ACKNOWLEDGEMENT}>
            Pending Acknowledgement
          </option>
          <option value={ASSIGNMENT_STATUS.IN_PROGRESS}>In Progress</option>
          <option value={ASSIGNMENT_STATUS.PENDING_COMPLETION}>
            Pending Completion
          </option>
          <option value={ASSIGNMENT_STATUS.COMPLETED}>Completed</option>
        </select>
      </div>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No Assignments Found"
          message="No assignments match your current filters."
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
                  "1.5fr 1fr 1.3fr 1fr 1fr 0.7fr 0.7fr 1fr",
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
                { label: "Skill Name", field: "skillName", align: "left" },
                { label: "SME Assigned", field: "smeName", align: "left" },
                { label: "Assignment Status", field: "status", align: "center" },
                { label: "Start Date", field: "createdOn", align: "left" },
                { label: "Due Date", field: "deadline", align: "left" },
                { label: "Score", field: "completionRating", align: "center" },
                { label: "Proof", field: null, align: "center" },
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
                    textAlign: align || "left",
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
            {assignments.map((assignment, idx) => (
              <div
                key={assignment.assignmentId}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.5fr 1fr 1.3fr 1fr 1fr 0.7fr 0.7fr 1fr",
                  alignItems: "center",
                  fontSize: "0.875rem",
                  color: "#212529",
                  padding: "1rem 1.5rem",
                  borderBottom:
                    idx < assignments.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: "#fff",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                  }}
                  title={assignment.skillName}
                >
                  {assignment.skillName}
                </div>
                <div
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                  title={assignment.smeName}
                >
                  {assignment.smeName}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <StatusBadge status={assignment.status} />
                </div>
                <div style={{ textAlign: "left", color: "#6b7280" }}>
                  {assignment.createdOn ? (
                    new Date(assignment.createdOn).toLocaleDateString()
                  ) : (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  )}
                </div>
                <div style={{ textAlign: "left", color: "#6b7280" }}>
                  {assignment.deadline ? (
                    new Date(assignment.deadline).toLocaleDateString()
                  ) : (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  )}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#198754",
                    textAlign: "center",
                  }}
                >
                  {assignment.completionRating ? (
                    `${assignment.completionRating}/10`
                  ) : (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  {assignment.proofFilePath ? (
                    <button
                      onClick={() => handleDownloadProof(assignment)}
                      title="Download Proof"
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
                      <Download size={14} />
                    </button>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>-</span>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  {assignment.status === ASSIGNMENT_STATUS.IN_PROGRESS ? (
                    <button
                      onClick={() => handleUploadProof(assignment)}
                      style={{
                        padding: "0.5rem 1rem",
                        background:
                          "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 6px rgba(151, 36, 126, 0.25)",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 10px rgba(151, 36, 126, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(151, 36, 126, 0.25)";
                      }}
                    >
                      <Upload size={14} /> Upload
                    </button>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>

          {/*Pagination*/}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </>
      )}

      {/* Upload Proof Modal */}
      {showUploadModal && (
        <UploadProofModal
          assignment={selectedAssignment}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default MyAssignments;
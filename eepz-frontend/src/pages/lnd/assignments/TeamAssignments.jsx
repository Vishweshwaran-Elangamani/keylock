import { useState, useEffect } from "react";
import {
  Download,
  CheckCircle,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  AlertTriangle,
} from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import CompleteAssignmentModal from "../../../components/lnd/modals/CompleteAssignmentModal";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { ASSIGNMENT_STATUS } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const TeamAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});
  const [exporting, setExporting] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter
  const [statusFilter, setStatusFilter] = useState("");

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

  useEffect(() => {
    fetchTeamAssignments();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchTeamAssignments = async () => {
    try {
      setLoading(true);
      const response = await lndService.getTeamAssignments(
        currentPage,
        statusFilter,
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc",
        itemsPerPage
      );

      if (response.data.success) {
        setAssignments(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch team assignments:", error);
      toast.error("Failed to load team assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      toast.loading("Preparing Excel export...");

      const response = await lndService.exportTeamAssignments(
        statusFilter,
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc"
      );

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `TeamAssignments_${timestamp}.xlsx`;

      downloadFile(response.data, filename);

      toast.dismiss();
      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.dismiss();
      toast.error("Failed to export team assignments to Excel");
    } finally {
      setExporting(false);
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

  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
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

  const handleCompleteAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowCompleteModal(true);
  };

  const handleCompleteSuccess = () => {
    setShowCompleteModal(false);
    toast.success("Assignment completed successfully!");
    fetchTeamAssignments();
  };

  const handleDownloadProof = async (assignment) => {
    try {
      const response = await lndService.downloadAssignmentProof(
        assignment.assignmentId
      );
      const filename = `${assignment.menteeName}_${assignment.skillName}_proof.pdf`;
      downloadFile(response.data, filename);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Failed to download:", error);
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

  if (loading && assignments.length === 0) {
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
          { label: "Team Assignments" },
        ]}
      />

      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
            flexGrow: 1,
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
                placeholder="Search by employee or skill..."
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
            <option value={ASSIGNMENT_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT}>
              SME Review
            </option>
            <option value={ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT}>
              Your Review
            </option>
            <option value={ASSIGNMENT_STATUS.COMPLETED}>Completed</option>
            <option value={ASSIGNMENT_STATUS.OVERDUE}>Overdue</option>
          </select>
        </div>

        <button
          onClick={handleExportToExcel}
          disabled={exporting || assignments.length === 0}
          className="btn btn-success"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {exporting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Export to Excel
            </>
          )}
        </button>
      </div>

      {assignments.length === 0 && !loading ? (
        <EmptyState
          icon={Filter}
          title="No Assignments Found"
          message={
            searchTerm || statusFilter
              ? "No assignments match your current filters."
              : "No assignments have been created for your team yet."
          }
        />
      ) : (
        <>
          <div
            style={{
              minHeight: "49vh",
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
              }}
            >
              {/*  UPDATED: Added 0.8fr for Overdue column */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.2fr 1.2fr 1fr 1.4fr 1fr 0.7fr 0.7fr 0.8fr 0.7fr 1fr",
                  background: "rgb(39, 35, 92)",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "white",
                  padding: "1rem 1.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                {[
                  {
                    label: "Employee Name",
                    field: "menteeName",
                    align: "left",
                  },
                  { label: "Skill Name", field: "skillName", align: "left" },
                  { label: "SME Assigned", field: "smeName", align: "left" },
                  {
                    label: "Status",
                    field: "status",
                    align: "center",
                  },
                  { label: "Start Date", field: "createdOn", align: "left" },
                  { label: "Due Date", field: "deadline", align: "left" },
                  {
                    label: "Score",
                    field: "completionRating",
                    align: "center",
                  },
                  { label: "Overdue", field: null, align: "center" }, //  NEW
                  { label: "Proof", field: null, align: "center" },
                  { label: "Comments", field: null, align: "center" },
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

              {/* Assignment Rows */}
              {assignments.map((assignment, idx) => (
                <div key={assignment.assignmentId}>
                  {/* UPDATED: Added 0.8fr for Overdue column */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.2fr 1.2fr 1fr 1.4fr 1fr 0.7fr 0.7fr 0.8fr 0.7fr 1fr",
                      alignItems: "center",
                      fontSize: "0.875rem",
                      color: "#212529",
                      padding: "1rem 1.5rem",
                      borderBottom:
                        idx < assignments.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
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
                    {/* Employee Name */}
                    <div
                      style={{
                        fontWeight: 600,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                      title={assignment.menteeName}
                    >
                      {assignment.menteeName}
                    </div>

                    {/* Skill Name */}
                    <div
                      style={{
                        fontWeight: 500,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                      title={assignment.skillName}
                    >
                      {assignment.skillName}
                    </div>

                    {/* SME Assigned */}
                    <div
                      style={{
                        fontWeight: 500,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                        color: "#6b7280",
                      }}
                      title={assignment.smeName}
                    >
                      {assignment.smeName}
                    </div>

                    {/* Status */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <StatusBadge status={assignment.status} />
                    </div>

                    {/* Start Date */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "left",
                        color: "#6b7280",
                      }}
                    >
                      {assignment.createdOn ? (
                        new Date(assignment.createdOn).toLocaleDateString()
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          None
                        </span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "left",
                        color: assignment.isOverdue ? "#DC2626" : "#6b7280",
                        fontWeight: assignment.isOverdue ? "600" : "normal",
                      }}
                    >
                      {assignment.deadline ? (
                        <>
                          {assignment.isOverdue && (
                            <AlertTriangle
                              size={14}
                              style={{ marginRight: "0.25rem", color: "#DC2626" }}
                            />
                          )}
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          None
                        </span>
                      )}
                    </div>

                    {/* Score */}
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
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          None
                        </span>
                      )}
                    </div>

                    {/*  NEW: Overdue Column */}
                    <div style={{ textAlign: "center" }}>
                      {assignment.isOverdue ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.4rem",
                            padding: "0.4rem 0.75rem",
                            background: "#FEE2E2",
                            border: "1px solid #DC2626",
                            borderRadius: "8px",
                            color: "#DC2626",
                            fontWeight: "700",
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap",
                          }}
                          title={`${assignment.daysOverdue} day(s) overdue`}
                        >
                          <AlertTriangle size={14} />
                          {assignment.daysOverdue}{" "}
                          {assignment.daysOverdue === 1 ? "day" : "days"}
                        </div>
                      ) : assignment.deadline &&
                        assignment.status !== ASSIGNMENT_STATUS.COMPLETED ? (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#10B981",
                            fontWeight: "600",
                          }}
                        >
                          On Track
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          None
                        </span>
                      )}
                    </div>

                    {/* Proof */}
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
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          None
                        </span>
                      )}
                    </div>

                    {/* Comments */}
                    <div style={{ textAlign: "center" }}>
                      {assignment.status ===
                      ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT ? (
                        <button
                          onClick={() => handleCompleteAssignment(assignment)}
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
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 10px rgba(151, 36, 126, 0.35)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 6px rgba(151, 36, 126, 0.25)";
                          }}
                        >
                          <CheckCircle size={16} /> Complete
                        </button>
                      ) : assignment.completionNotes ? (
                        <button
                          onClick={() =>
                            setExpandedNotes((prev) => ({
                              ...prev,
                              [assignment.assignmentId]:
                                !prev[assignment.assignmentId],
                            }))
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#97247E",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.875rem",
                            textDecoration: expandedNotes?.[
                              assignment.assignmentId
                            ]
                              ? "underline"
                              : "none",
                            padding: "0.25rem 0.5rem",
                          }}
                          title={
                            expandedNotes?.[assignment.assignmentId]
                              ? "Hide notes"
                              : "Show notes"
                          }
                        >
                          {expandedNotes?.[assignment.assignmentId]
                            ? "Hide"
                            : "View"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          None
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Notes */}
                  {expandedNotes?.[assignment.assignmentId] &&
                    assignment.completionNotes && (
                      <div
                        style={{
                          padding: "1rem 1.5rem",
                          background: "#f9fafb",
                          fontSize: "0.875rem",
                          color: "#4b5563",
                          whiteSpace: "pre-wrap",
                          borderBottom:
                            idx < assignments.length - 1
                              ? "1px solid #e5e7eb"
                              : "none",
                          textAlign: "left",
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
                          Completion Notes:
                        </strong>
                        {assignment.completionNotes}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

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

      {showCompleteModal && (
        <CompleteAssignmentModal
          assignment={selectedAssignment}
          onClose={() => setShowCompleteModal(false)}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
};

export default TeamAssignments; 

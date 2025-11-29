import { useState, useEffect } from "react";
import {
  Download,
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
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { ASSIGNMENT_STATUS } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const OrganizationAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
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
    fetchAssignments();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await lndService.getAllOrganizationAssignments(
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
      console.error("Failed to fetch assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      toast.loading("Preparing Excel export...");

      const response = await lndService.exportOrganizationAssignments(
        statusFilter,
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc"
      );

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `OrganizationalAssignments_${timestamp}.xlsx`;

      downloadFile(response.data, filename);

      toast.dismiss();
      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.dismiss();
      toast.error("Failed to export assignments to Excel");
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
          { label: "Organizational Assignments" },
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
              Manager Review
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
              : "No assignments have been created yet."
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
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.5fr 1.5fr 1fr 1.6fr 1.1fr 1.1fr 0.8fr 0.9fr",
                  background: "rgb(39, 35, 92)",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: 600,
                  color: "white",
                  fontSize: "13px",
                  padding: "1rem 1.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                  height: "50px",
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
                    label: "Assignment Status",
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
                  { label: "Overdue", field: null, align: "center" },
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

              {assignments.map((assignment, idx) => (
                <div key={assignment.assignmentId}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.5fr 1.5fr 1fr 1.6fr 1.1fr 1.1fr 0.8fr 0.9fr",
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

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <StatusBadge status={assignment.status} />
                    </div>

                    <div style={{ textAlign: "left", color: "#6b7280" }}>
                      {assignment.createdOn ? (
                        new Date(assignment.createdOn).toLocaleDateString()
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          None
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        textAlign: "left",
                        color: assignment.isOverdue ? "#DC2626" : "#6b7280",
                        fontWeight: assignment.isOverdue ? "600" : "normal",
                      }}
                    >
                      {assignment.deadline ? (
                        <>
                          {assignment.isOverdue && (
                            <AlertTriangle
                              size={14}
                              style={{
                                marginRight: "0.25rem",
                                color: "#DC2626",
                              }}
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
                        <span
                          style={{ fontSize: "0.75rem", color: "#9ca3af" }}
                        >
                          N/A
                        </span>
                      )}
                    </div>
                  </div>
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
    </div>
  );
};

export default OrganizationAssignments;

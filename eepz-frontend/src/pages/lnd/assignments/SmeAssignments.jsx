import { useState, useEffect } from "react";
import { Download, Search, ChevronUp, ChevronDown, Filter } from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { ASSIGNMENT_STATUS } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const SmeAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortOrderAsc, setSortOrderAsc] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});

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
    fetchSmeAssignments();
  }, [currentPage, searchTerm, statusFilter, sortField, sortOrderAsc]);

  const fetchSmeAssignments = async () => {
    try {
      setLoading(true);
      const response = await lndService.getSmeAssignments(
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
      console.error("Failed to fetch SME assignments:", error);
      toast.error("Failed to load SME assignments");
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
          { label: "SME Assignments" },
        ]}
      />

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
              placeholder="Search by mentee or skill... (Press Enter)"
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
          <option value={ASSIGNMENT_STATUS.IN_PROGRESS}>In Progress</option>
          <option value={ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT}>
            Pending My Review
          </option>
          <option value={ASSIGNMENT_STATUS.ACKNOWLEDGED}>Acknowledged</option>
          <option value={ASSIGNMENT_STATUS.COMPLETED}>Completed</option>
        </select>
      </div>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No SME Assignments Found"
          message={
            searchTerm || statusFilter
              ? "No assignments match your current filters."
              : "You don't have any SME assignments yet."
          }
        />
      ) : (
        <>
          <div style={{ minHeight: "65vh" }}>
            <div
              style={{
                background: "#fff",
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
                    "1.5fr 1.3fr 1.2fr 1fr 1fr 0.7fr 0.7fr 0.8fr",
                  background: "rgb(39, 35, 92)",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: 600,
                  color: "white",
                  fontSize: "14px",
                  padding: "1rem 1.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                {[
                  { label: "Mentee Name", field: "menteeName", align: "left" },
                  { label: "Skill Name", field: "skillName", align: "left" },
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
              {assignments.map((assignment, idx) => (
                <div key={assignment.assignmentId}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.5fr 1.3fr 1.2fr 1fr 1fr 0.7fr 0.7fr 0.8fr",
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
                    <div style={{ textAlign: "left", color: "#6b7280" }}>
                      {assignment.deadline ? (
                        new Date(assignment.deadline).toLocaleDateString()
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
                    <div style={{ textAlign: "center" }}>
                      {assignment.completionNotes ? (
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
                              ? "Hide comments"
                              : "Show comments"
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
                  {/* Expanded notes */}
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
                          Mentee's Completion Notes:
                        </strong>
                        {assignment.completionNotes}
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

export default SmeAssignments;

import { useState, useEffect } from "react";
import { Search, X, Award, Star, ChevronUp, ChevronDown } from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import BecomeSmeModal from "../../../components/lnd/modals/BecomeSmeModal";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";

const MySkills = () => {
  const [skills, setSkills] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showSmeModal, setShowSmeModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
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
    fetchSkills();
  }, [currentPage, searchTerm, sortField, sortOrderAsc]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await lndService.getMySkills(
        currentPage,
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc"
      );

      if (response.data.success) {
        setSkills(response.data.data.items);
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
      console.error("Failed to fetch skills:", error);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleBecomeSme = (skill) => {
    setSelectedSkill(skill);
    setShowSmeModal(true);
  };

  const handleSmeSuccess = () => {
    setShowSmeModal(false);
    toast.success("SME application submitted successfully!");
    fetchSkills();
  };

  const getRatingColor = (rating) => {
    if (rating < 5) return "#dc3545";
    if (rating < 8) return "#0d6efd";
    return "#198754";
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
          { label: "My Skills" },
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
          My Skills
        </h2>
        <p style={{ color: "#6c757d", fontSize: "0.9375rem", margin: 0 }}>
          View your skills and apply to become an SME
        </p>
      </div>

      {/* Inline Search Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            placeholder="Search skills... (Press Enter)"
            style={{
              width: "100%",
              padding: "0.625rem 2.5rem 0.625rem 2.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "0.875rem",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#97247E";
              e.target.style.boxShadow = "0 0 0 3px rgba(151, 36, 126, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                color: "#6c757d",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#212529")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6c757d")}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Skills List - Table View */}
      {skills.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Skills Found"
          message={
            searchTerm
              ? "No skills match your search criteria."
              : "You don't have any recorded skills yet."
          }
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
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                  padding: "1rem 1.5rem",
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                {[
                  { label: "Skill Name", field: "skillName", align: "left" },
                  { label: "Last Updated", field: "updatedOn", align: "left" },
                  { label: "Proficiency", field: "rating", align: "center" },
                  { label: "SME Status", align: "center" },
                  { label: "Quick Actions", align: "center" },
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
              {skills.map((skill, index) => (
                <div
                  key={skill.mapperId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                    padding: "1rem 1.5rem",
                    borderBottom:
                      index < skills.length - 1 ? "1px solid #f3f4f6" : "none",
                    alignItems: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                  }}
                >
                  {/* Skill Name */}
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: "600",
                        color: "#212529",
                        fontSize: "0.9375rem",
                      }}
                    >
                      {skill.skillName}
                    </p>
                  </div>

                  {/* Last Updated */}
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "#6b7280",
                      }}
                    >
                      {new Date(skill.updatedOn).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Rating */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.375rem 0.75rem",
                        borderRadius: "8px",
                        background: `${getRatingColor(skill.rating)}15`,
                        border: `1px solid ${getRatingColor(skill.rating)}30`,
                      }}
                    >
                      <Star
                        size={14}
                        fill={getRatingColor(skill.rating)}
                        color={getRatingColor(skill.rating)}
                      />
                      <span
                        style={{
                          fontWeight: "700",
                          fontSize: "0.875rem",
                          color: getRatingColor(skill.rating),
                        }}
                      >
                        {skill.rating}/10
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    style={{
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {skill.isSme ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: "#d1fae5",
                          color: "#065f46",
                          border: "1px solid #065f4620",
                        }}
                      >
                        <Award size={12} />
                        SME
                      </span>
                    ) : skill.canBecomeSme ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #92400e20",
                        }}
                      >
                        Eligible
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: "#f3f4f6",
                          color: "#6c757d",
                        }}
                      >
                        Not Eligible
                      </span>
                    )}
                  </div>

                  {/* Apply SME */}
                  <div
                    style={{
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {skill.canBecomeSme && !skill.isSme ? (
                      <button
                        onClick={() => handleBecomeSme(skill)}
                        style={{
                          padding: "0.5rem 1rem",
                          background:
                            "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "0.8125rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 6px rgba(151, 36, 126, 0.25)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 10px rgba(151, 36, 126, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 2px 6px rgba(151, 36, 126, 0.25)";
                        }}
                      >
                        <Award size={14} />
                        Apply
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
              ))}
            </div>
          </div>

          {/* Pagination */}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </>
      )}

      {/* Become SME Modal */}
      {showSmeModal && (
        <BecomeSmeModal
          skill={selectedSkill}
          onClose={() => setShowSmeModal(false)}
          onSuccess={handleSmeSuccess}
        />
      )}
    </div>
  );
};

export default MySkills;

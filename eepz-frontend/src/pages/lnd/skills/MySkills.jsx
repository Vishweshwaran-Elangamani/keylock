import { useState, useEffect } from "react";
import { Search, X, Award, Star, ChevronUp, ChevronDown } from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import BecomeSmeModal from "../../../components/lnd/modals/BecomeSmeModal";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import {
  APPROVAL_TYPE,
  APPROVAL_STATUS,
} from "../../../constants/lnd/lndConstants";

const MySkills = () => {
  const [skills, setSkills] = useState([]);
  const [approvals, setApprovals] = useState([]);
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
    fetchApprovalHistory();
  }, [currentPage, searchTerm, sortField, sortOrderAsc, showSmeModal]);

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

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const response = await lndService.getApprovalHistory(
        1,
        "",
        APPROVAL_TYPE.SME_REGISTRATION,
        APPROVAL_STATUS.PENDING,
        "",
        "",
        "desc"
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

  const hasPendingSmeRequest = (skillId) => {
    return approvals.some(
      (approval) =>
        approval.skillId === skillId && approval.status === "PENDING"
    );
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "LnD Dashboard", path: "/lnd/dashboard", icon: "" },
          { label: "My Skills" },
        ]}
      />

      <div className="row g-3 mb-4">
  <div className="col-md-6">
    <div className="input-group">
      <input
        type="text"
        className="form-control"
        placeholder="Search skills..."
        value={searchInput}
        onChange={handleSearchChange}
        onKeyPress={handleSearchKeyPress}
        style={{ minHeight: "35.7px" }}
      />
      {searchTerm ? (
        <button
          className="btn btn-outline-secondary"
          onClick={handleCancelSearch}
        >
          <i className="bi bi-x-lg me-1"></i>
          Cancel
        </button>
      ) : (
        <button className="btn btn-primary" onClick={handleSearch}>
          <i className="bi bi-search me-1"></i>
          Search
        </button>
      )}
    </div>
  </div>
</div>

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
          <div style={{ minHeight: "65vh" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr",
                  padding: "1rem 1.5rem",
                  background: "rgb(39, 35, 92)",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                {[
                  { label: "Skill Name", field: "skillName", align: "left" },
                  { label: "Last Updated", field: "updatedOn", align: "left" },
                  { label: "Proficiency", field: "rating", align: "center" },
                  { label: "SME Status", align: "center" },
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

              {skills.map((skill, index) => (
                <div
                  key={skill.mapperId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr",
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
                      hasPendingSmeRequest(skill.skillId) ? (
                        <button
                          disabled
                          style={{
                            padding: "0.375rem 0.5rem",
                            background: "#f59e0b",
                            border: "none",
                            borderRadius: "4px",
                            color: "#fff",
                            cursor: "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            gap: "0.3rem",
                            opacity: 0.8,
                          }}
                          title="SME Activation request is pending approval"
                        >
                          <i
                            className="bi bi-hourglass-split"
                            style={{ fontSize: "12px" }}
                          ></i>
                          Pending
                        </button>
                      ) : (
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
                          <Award size={14} />
                          Apply
                        </button>
                      )
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
                </div>
              ))}
            </div>
          </div>

          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </>
      )}

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

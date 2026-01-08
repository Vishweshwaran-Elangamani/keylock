import { useState, useEffect } from "react";
import { Search, X, Award, Star, ChevronUp, ChevronDown } from "lucide-react";
import Breadcrumb from "../../../components/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import BecomeSmeModal from "../../../components/lnd/modals/BecomeSmeModal";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import {
  APPROVAL_TYPE,
  APPROVAL_STATUS,
} from "../../../constants/lnd/lndConstants";
import styles from "../../../styles/lnd/pages/skills/MySkills.module.css";

const MySkills = () => {
  const [skills, setSkills] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSmeModal, setShowSmeModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

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
    fetchSkills();
    fetchApprovalHistory();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    sortField,
    sortOrderAsc,
    showSmeModal,
  ]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      
      // UPDATED: Include sortField and sortOrder
      const response = await lndService.getMySkills({
        searchTerm: searchTerm,
        pageNumber: currentPage,
        
        pageSize: itemsPerPage,
      });

      if (response.data.success) {
        setSkills(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
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
      // UPDATED: Use params object instead of individual parameters
      const response = await lndService.getApprovalHistory({
        pageNumber: 1,
        role: "",
        approvalType: APPROVAL_TYPE.SME_REGISTRATION,
        status: APPROVAL_STATUS.PENDING,
        searchTerm: "",
        sortField: "",
        sortOrder: "desc",
      });
      
      if (response.data.success) {
        setApprovals(response.data.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch approval history:", error);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const getRatingClass = (rating) => {
    if (rating < 5) return styles.ratingLow;
    if (rating < 8) return styles.ratingMedium;
    return styles.ratingHigh;
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
    const isActive = sortField === field;
    const iconClass = isActive
      ? styles.sortIconActive
      : styles.sortIconInactive;

    if (!isActive) {
      return (
        <ChevronUp size={14} className={`${styles.sortIcon} ${iconClass}`} />
      );
    }
    return sortOrderAsc ? (
      <ChevronUp size={14} className={`${styles.sortIcon} ${iconClass}`} />
    ) : (
      <ChevronDown size={14} className={`${styles.sortIcon} ${iconClass}`} />
    );
  };

  const getHeaderCellClass = (field, align) => {
    const baseClass = styles.tableHeaderCell;
    const alignClass =
      align === "center"
        ? styles.tableHeaderCellCenter
        : styles.tableHeaderCellLeft;
    const sortableClass = field ? styles.tableHeaderCellSortable : "";
    const activeClass = sortField === field ? styles.tableHeaderCellActive : "";
    return `${baseClass} ${alignClass} ${sortableClass} ${activeClass}`.trim();
  };

  if (loading && skills.length === 0) {
    return (
      <div className={styles.loadingContainer}>
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
          { label: "LnD Dashboard", path: `${rolePrefix}/lnd/dashboard` },
          { label: "My Skills" },
        ]}
      />

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${styles.searchInput}`}
              placeholder="Search skills..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
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

      {skills.length === 0 && !loading ? (
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
          <div
            className={`${styles.tableContainer} ${
              loading ? styles.tableContainerLoading : ""
            }`}
          >
            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>
                {[
                  { label: "Skill Name", field: "skillName", align: "left" },
                  { label: "Last Updated", field: "updatedOn", align: "left" },
                  { label: "Proficiency", field: "rating", align: "center" },
                  { label: "SME Status", align: "center" },
                ].map(({ label, field, align }) => (
                  <div
                    key={field || label}
                    onClick={() => field && onSortClick(field)}
                    className={getHeaderCellClass(field, align)}
                  >
                    {label}
                    {field && renderSortIcon(field)}
                  </div>
                ))}
              </div>

              {skills.map((skill, index) => (
                <div
                  key={skill.mapperId}
                  className={`${styles.tableRow} ${
                    index < skills.length - 1 ? styles.tableRowBorder : ""
                  }`}
                >
                  <div className={styles.cellLeft}>
                    <p className={styles.skillName}>{skill.skillName}</p>
                  </div>

                  <div className={styles.cellLeft}>
                    <p className={styles.dateText}>
                      {new Date(skill.updatedOn).toLocaleDateString()}
                    </p>
                  </div>

                  <div className={styles.proficiencyContainer}>
                    <div
                      className={`${styles.ratingBadge} ${getRatingClass(
                        skill.rating
                      )}`}
                      style={{
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
                        className={styles.ratingText}
                        style={{ color: getRatingColor(skill.rating) }}
                      >
                        {skill.rating}/10
                      </span>
                    </div>
                  </div>

                  <div className={styles.cellCenter}>
                    {skill.isSme ? (
                      <span className={styles.smeBadge}>
                        <Award size={12} />
                        SME
                      </span>
                    ) : skill.canBecomeSme ? (
                      hasPendingSmeRequest(skill.skillId) ? (
                        <button
                          disabled
                          className={styles.pendingButton}
                          title="SME Activation request is pending approval"
                        >
                          <i
                            className={`bi bi-hourglass-split ${styles.pendingIcon}`}
                          ></i>
                          Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBecomeSme(skill)}
                          className={styles.applyButton}
                        >
                          <Award size={14} />
                          Apply
                        </button>
                      )
                    ) : (
                      <span className={styles.notEligibleBadge}>
                        Not Eligible
                      </span>
                    )}
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

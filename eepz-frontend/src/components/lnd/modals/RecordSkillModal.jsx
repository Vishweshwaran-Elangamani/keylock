import { useState, useEffect, useRef } from "react";
import { X, AlertCircle } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { RATING } from "../../../constants/lnd/lndConstants";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/RecordSkillModal.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

// Custom Dropdown Component
const CustomDropdown = ({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  return (
    <div ref={dropdownRef} className={styles.customDropdownContainer}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${styles.customDropdownButton} ${
          disabled ? styles.customDropdownButtonDisabled : ""
        }`}
      >
        <span className={styles.customDropdownButtonText}>{displayText}</span>
        <i
          className={`bi bi-chevron-${isOpen ? "up" : "down"}`}
          style={{ fontSize: "0.7rem", marginLeft: "0.5rem", flexShrink: 0 }}
        ></i>
      </button>
      {isOpen && !disabled && (
        <div
          className={styles.customDropdownMenu}
          style={{
            top: dropdownRef.current?.getBoundingClientRect().top - 4 || 0,
            left: dropdownRef.current?.getBoundingClientRect().left || 0,
            width: dropdownRef.current?.getBoundingClientRect().width || "auto",
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                if (option.value !== "") {
                  onChange({ target: { value: option.value } });
                  setIsOpen(false);
                }
              }}
              className={`${styles.customDropdownItem} ${
                value === option.value ? styles.customDropdownItemActive : ""
              } ${
                option.value === "" ? styles.customDropdownItemDisabled : ""
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const RecordSkillModal = ({ key, skill, onClose, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    skill?.employeeId || ""
  );
  const [selectedSkillId, setSelectedSkillId] = useState(skill?.skillId || "");
  const [rating, setRating] = useState(skill?.rating || 5);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [fetchingSkills, setFetchingSkills] = useState(false);
  const [allSkillsLoaded, setAllSkillsLoaded] = useState(false);
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const isEditMode = !!skill?.mapperId;
  // Load employees and all skills on mount
  useEffect(() => {
    fetchEmployees();
    if (!isEditMode) {
      fetchAllSkills();
    }
  }, []);
  useEffect(() => {
    if (selectedEmployeeId && !isEditMode && allSkillsLoaded) {
      fetchEmployeeSkills();
    }
  }, [allSkillsLoaded]);
  // Load available skills when employee is selected AND all skills are loaded
  useEffect(() => {
    if (selectedEmployeeId && !isEditMode && allSkillsLoaded) {
      fetchEmployeeSkills();
    }
  }, [selectedEmployeeId]);
  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await lndService.getSubordinateEmployees();

      if (response.data.success) {
        setEmployees(response.data.data.items);
      } else {
        toast.error(LND_TOASTS.FAILED_TO_LOAD_EMPLOYEES);
      }
    } catch (error) {
      toast.error(LND_TOASTS.FAILED_TO_LOAD_EMPLOYEES);
    } finally {
      setFetchingEmployees(false);
    }
  };
  const fetchAllSkills = async () => {
    try {
      const response = await lndService.getAllSkills();

      if (response.data.success) {
        setAllSkills(response.data.data);
        setAllSkillsLoaded(true);
      }
    } catch (error) {
      toast.error(LND_TOASTS.FAILED_TO_LOAD_SKILLS);
    }
  };
  const fetchEmployeeSkills = async () => {
    if (!allSkillsLoaded || allSkills.length === 0) {
      return;
    }
    try {
      setFetchingSkills(true);
      setSelectedSkillId("");

      const response = await lndService.getSubordinateSkills(
        1,
        parseInt(selectedEmployeeId),
        "",
        "skillname"
      );
      if (response.data.success) {
        const existingSkillIds = response.data.data.items.map(
          (item) => item.skillId
        );

        const available = allSkills.filter(
          (skill) => !existingSkillIds.includes(skill.skillId)
        );
        setAvailableSkills(available);

        if (available.length === 0 && allSkills.length > 0) {
          toast.info(LND_TOASTS.ALREADY_HAS_ALL_SKILLS_MESSAGE);
        }
      }
    } catch (error) {
      toast.error(LND_TOASTS.FAILED_TO_LOAD_SKILLS);
    } finally {
      setFetchingSkills(false);
    }
  };
  const handleEmployeeChange = (e) => {
    setSelectedEmployeeId(e.target.value);
    setSelectedSkillId("");
    setAvailableSkills([]);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditMode) {
      setPendingSubmit({ selectedEmployeeId, selectedSkillId, rating });
      setShowConfirmModal(true);
    } else {
      submitSkill();
    }
  };
  const submitSkill = async () => {
    try {
      setLoading(true);

      if (isEditMode) {
        const data = {
          mapperId: skill.mapperId,
          rating: rating,
        };
        const response = await lndService.updateSkillRating(data);

        if (response.data.success) {
          toast.success(LND_TOASTS.SKILL_RATING_UPDATED);
          onSuccess();
        } else {
          toast.error(
            response.data.message || LND_TOASTS.FAILED_TO_UPDTE_RATING
          );
        }
      } else {
        const data = {
          employeeId: parseInt(selectedEmployeeId),
          skillId: parseInt(selectedSkillId),
          rating: rating,
        };
        const response = await lndService.recordSkill(data);

        if (response.data.success) {
          toast.success(LND_TOASTS.SKILL_RECORDED);
          onSuccess();
        } else {
          toast.error(
            response.data.message || LND_TOASTS.FAILED_TO_RECORD_SKILL
          );
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || LND_TOASTS.FAILED_TO_RECORD_SKILL
      );
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setPendingSubmit(null);
    }
  };
  const getRatingLabel = (rating) => {
    if (rating < RATING.MIN_REQUEST_SME) return "Needs Improvement";
    if (rating < RATING.MIN_SME) return "Competent";
    return "Expert (SME Eligible)";
  };
  const getRatingColor = (rating) => {
    if (rating < RATING.MIN_REQUEST_SME) return "#dc3545";
    if (rating < RATING.MIN_SME) return "#0d6efd";
    return "#198754";
  };
  // Prepare dropdown options
  const employeeOptions = [
    {
      value: "",
      label: fetchingEmployees ? "Loading employees..." : "Select Employee",
    },
    ...employees.map((emp) => ({
      value: emp.employeeId,
      label: `${emp.employeeName}${
        emp.departmentName ? ` (${emp.departmentName})` : ""
      }`,
    })),
  ];
  const skillOptions = [
    {
      value: "",
      label: !selectedEmployeeId
        ? "Select employee first"
        : !allSkillsLoaded
        ? "Loading skills..."
        : fetchingSkills
        ? "Loading available skills..."
        : availableSkills.length === 0
        ? "No skills available"
        : "Select Skill",
    },
    ...availableSkills.map((skill) => ({
      value: skill.skillId,
      label: skill.skillName,
    })),
  ];
  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h5 className={styles.headerTitle}>
              {isEditMode ? "Update Skill Rating" : "Record Employee Skill"}
            </h5>
            <button
              type="button"
              className={`btn-close-white ${styles.btnClose}`}
              onClick={onClose}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.color = "red";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.color = "white";
                }
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className={styles.body}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formContent}>
                {isEditMode ? (
                  <div className={styles.editModeInfo}>
                    <p className={styles.infoLabel}>Employee</p>
                    <p className={styles.infoValue}>{skill.employeeName}</p>
                    <p className={styles.infoLabel}>Skill</p>
                    <p className={styles.infoValue}>{skill.skillName}</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>
                        Employee <span className={styles.required}> *</span>
                      </label>
                      <CustomDropdown
                        value={selectedEmployeeId}
                        onChange={handleEmployeeChange}
                        options={employeeOptions}
                        disabled={true}
                        placeholder="Select Employee"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label
                        className={`${styles.formLabel} ${
                          selectedEmployeeId ? "" : styles.formLabelDisabled
                        }`}
                      >
                        Select Skill <span className={styles.required}> *</span>
                      </label>
                      <CustomDropdown
                        value={selectedSkillId}
                        onChange={(e) => setSelectedSkillId(e.target.value)}
                        options={skillOptions}
                        disabled={
                          !selectedEmployeeId ||
                          fetchingSkills ||
                          !allSkillsLoaded
                        }
                        placeholder="Select Skill"
                      />
                      {selectedEmployeeId && availableSkills.length > 0 && (
                        <p className={styles.availableCount}>
                          {availableSkills.length} skill(s) available for this
                          employee
                        </p>
                      )}
                    </div>
                  </>
                )}
                <div
                  className={`${styles.ratingContainer} ${
                    !isEditMode && !selectedSkillId
                      ? styles.ratingContainerDisabled
                      : ""
                  }`}
                >
                  <label className={styles.ratingLabel}>
                    Rating:{" "}
                    <span
                      className={styles.ratingCurrent}
                      style={{ color: getRatingColor(rating) }}
                    >
                      {rating}
                    </span>
                    <span className={styles.ratingScaleLabel}>/10</span>
                  </label>
                  <div className={styles.ratingButtons}>
                    {[...Array(10)].map((_, index) => {
                      const value = index + 1;
                      const isActive = rating === value;
                      const ratingClass = isActive
                        ? value < RATING.MIN_REQUEST_SME
                          ? styles.ratingBtnLow
                          : value < RATING.MIN_SME
                          ? styles.ratingBtnMedium
                          : styles.ratingBtnHigh
                        : styles.ratingBtn;

                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() => setRating(value)}
                          disabled={!isEditMode && !selectedSkillId}
                          className={`${ratingClass} ${
                            !isEditMode && !selectedSkillId
                              ? styles.ratingBtnDisabled
                              : ""
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                  <div className={styles.ratingScale}>
                    <div className={styles.ratingScaleMin}>
                      <span className={styles.ratingScaleLabel}>Min</span>
                      <span className={styles.ratingScaleValueMin}>1</span>
                    </div>

                    <div className={styles.ratingScaleCenter}>
                      <span
                        className={styles.ratingBadge}
                        style={{
                          "--bg-color": `${getRatingColor(rating)}15`,
                          "--border-color": `${getRatingColor(rating)}30`,
                          color: getRatingColor(rating),
                        }}
                      >
                        {getRatingLabel(rating)}
                      </span>
                    </div>

                    <div className={styles.ratingScaleMax}>
                      <span className={styles.ratingScaleLabel}>Max</span>
                      <span className={styles.ratingScaleValueMax}>10</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.footer}>
                <button
                  type="button"
                  className={`btn btn-secondary ${styles.btnCancel}`}
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`
                  ${styles.btnSubmit}
                  ${
                    !loading &&
                    (isEditMode || (selectedEmployeeId && selectedSkillId))
                      ? styles.btnSubmitEnabled
                      : ""
                  }
                `}
                  disabled={
                    loading ||
                    (!isEditMode && (!selectedEmployeeId || !selectedSkillId))
                  }
                >
                  {loading ? (
                    <>
                      <span
                        className={`spinner-border spinner-border-sm ${styles.loadingSpinner}`}
                        role="status"
                      />
                      {isEditMode ? "Updating..." : "Recording..."}
                    </>
                  ) : isEditMode ? (
                    "Update Rating"
                  ) : (
                    "Record Skill"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingSubmit(null);
        }}
        onConfirm={submitSkill}
        title="Update Skill Rating"
        message={`Are you sure you want to update the rating for "${
          skill?.skillName
        }" to ${rating}/10 (${getRatingLabel(rating)})?`}
        confirmText="Update"
        cancelText="Cancel"
        confirmColor="#97247E"
        loading={loading}
      />
    </>
  );
};

export default RecordSkillModal;

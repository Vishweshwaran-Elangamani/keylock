import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { RATING } from "../../../constants/lnd/lndConstants";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "sonner";

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

  // Add this NEW useEffect to fetch available skills when modal opens with employeeId:
  useEffect(() => {
    // If modal opens with employeeId already set (from parent), fetch skills once allSkills loads
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
        toast.error("Failed to load employees");
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
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
      console.error("Failed to fetch skills:", error);
      toast.error("Failed to load skills");
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
          toast.info("This employee already has all available skills");
        }
      }
    } catch (error) {
      console.error("Failed to fetch employee skills:", error);
      toast.error("Failed to load employee skills");
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

    if (!selectedEmployeeId || !selectedSkillId) {
      toast.error("Please select both employee and skill");
      return;
    }

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
          toast.success("Skill rating updated successfully!");
          onSuccess();
        } else {
          toast.error(response.data.message || "Failed to update skill rating");
        }
      } else {
        const data = {
          employeeId: parseInt(selectedEmployeeId),
          skillId: parseInt(selectedSkillId),
          rating: rating,
        };
        const response = await lndService.recordSkill(data);

        if (response.data.success) {
          toast.success("Skill recorded successfully!");
          onSuccess();
        } else {
          toast.error(response.data.message || "Failed to record skill");
        }
      }
    } catch (error) {
      console.error("Failed to save skill:", error);
      toast.error(error.response?.data?.message || "Failed to save skill");
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

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
          animation: "fadeIn 0.2s ease-in-out",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: "14px",
            width: "100%",
            maxWidth: "500px",
            maxHeight: "90vh",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div
            style={{
              padding: "1.5rem",
              background: "rgb(39, 35, 92)",
              borderBottom: "1px solid #e5e7eb",
              borderRadius: "12px 12px 0px 0px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <h5 style={{ margin: 0, fontWeight: "600", color: "white" }}>
              {isEditMode ? "Update Skill Rating" : "Record Employee Skill"}
            </h5>
            <button
              type="button"
              class="btn-close-white"
              onClick={onClose}
              disabled={loading}
              style={{
                border: "none",
                width: "36px",
                backgroundColor: "transparent",
                height: "36px",
                borderRadius: "0.5rem",
                cursor: loading ? "not-allowed" : "pointer",
                color: "white",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
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

          <div
            style={{
              overflowY: "auto",
              flexGrow: 1,
              padding: 0,
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "1.5rem" }}>
                {isEditMode ? (
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#6c757d",
                        margin: 0,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Employee
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#212529",
                        margin: 0,
                        marginBottom: "0.75rem",
                      }}
                    >
                      {skill.employeeName}
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#6c757d",
                        margin: 0,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Skill
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#212529",
                        margin: 0,
                      }}
                    >
                      {skill.skillName}
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#212529",
                          marginBottom: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        Employee <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <select
                        value={selectedEmployeeId}
                        className="EmployeeSelector"
                        onChange={handleEmployeeChange}
                        required
                        disabled
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none",
                          background: "#fff",
                          cursor: fetchingEmployees ? "not-allowed" : "pointer",
                          disabled: "true",
                          appearance: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                          backgroundImage: "none",
                        }}
                      >
                        <option value="">
                          {fetchingEmployees
                            ? "Loading employees..."
                            : "Select Employee"}
                        </option>
                        {employees.map((emp) => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.employeeName}{" "}
                            {emp.departmentName && `(${emp.departmentName})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: selectedEmployeeId ? "#212529" : "#9ca3af",
                          marginBottom: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        Select Skill <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <select
                        value={selectedSkillId}
                        onChange={(e) => setSelectedSkillId(e.target.value)}
                        required
                        disabled={
                          !selectedEmployeeId ||
                          fetchingSkills ||
                          !allSkillsLoaded
                        }
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none",
                          background: !selectedEmployeeId ? "#f9fafb" : "#fff",
                          cursor:
                            !selectedEmployeeId || fetchingSkills
                              ? "not-allowed"
                              : "pointer",
                          color: !selectedEmployeeId ? "#9ca3af" : "#212529",
                        }}
                      >
                        <option value="">
                          {!selectedEmployeeId
                            ? "Select employee first"
                            : !allSkillsLoaded
                            ? "Loading skills..."
                            : fetchingSkills
                            ? "Loading available skills..."
                            : availableSkills.length === 0
                            ? "No skills available"
                            : "Select Skill"}
                        </option>
                        {availableSkills.map((skill) => (
                          <option key={skill.skillId} value={skill.skillId}>
                            {skill.skillName}
                          </option>
                        ))}
                      </select>
                      {selectedEmployeeId && availableSkills.length > 0 && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6c757d",
                            margin: "0.5rem 0 0 0",
                          }}
                        >
                          {availableSkills.length} skill(s) available for this
                          employee
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div
                  style={{ opacity: isEditMode || selectedSkillId ? 1 : 0.5 }}
                >
                  <label
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color:
                        isEditMode || selectedSkillId ? "#212529" : "#9ca3af",
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    Rating:{" "}
                    <span
                      style={{
                        color: getRatingColor(rating),
                        fontWeight: "700",
                        fontSize: "1.25rem",
                      }}
                    >
                      {rating}
                    </span>
                    <span style={{ color: "#6c757d", fontWeight: "500" }}>
                      /10
                    </span>
                  </label>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {[...Array(10)].map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() => setRating(value)}
                          disabled={!isEditMode && !selectedSkillId}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            border:
                              rating === value
                                ? `2px solid ${getRatingColor(value)}`
                                : "1px solid #ccc",
                            backgroundColor:
                              rating === value
                                ? getRatingColor(value)
                                : "#f8f9fa",
                            color: rating === value ? "#fff" : "#212529",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor:
                              !isEditMode && !selectedSkillId
                                ? "not-allowed"
                                : "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.75rem",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6c757d",
                          display: "block",
                        }}
                      >
                        Min
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#dc3545",
                        }}
                      >
                        1
                      </span>
                    </div>

                    <div style={{ textAlign: "center", flex: 1 }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: getRatingColor(rating),
                          padding: "0.375rem 0.75rem",
                          background: `${getRatingColor(rating)}15`,
                          borderRadius: "12px",
                          border: `1px solid ${getRatingColor(rating)}30`,
                        }}
                      >
                        {getRatingLabel(rating)}
                      </span>
                    </div>

                    <div style={{ textAlign: "right", flex: 1 }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6c757d",
                          display: "block",
                        }}
                      >
                        Max
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#198754",
                        }}
                      >
                        10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    padding: "0.625rem 1.25rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (!isEditMode && (!selectedEmployeeId || !selectedSkillId))
                  }
                  style={{
                    padding: "0.625rem 1.25rem",
                    border: "none",
                    borderRadius: "8px",
                    background:
                      !loading &&
                      (isEditMode || (selectedEmployeeId && selectedSkillId))
                        ? "linear-gradient(90deg, #97247E 0%, #E01950 100%)"
                        : "#e5e7eb",
                    color:
                      !loading &&
                      (isEditMode || (selectedEmployeeId && selectedSkillId))
                        ? "#fff"
                        : "#6c757d",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor:
                      !loading &&
                      (isEditMode || (selectedEmployeeId && selectedSkillId))
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
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

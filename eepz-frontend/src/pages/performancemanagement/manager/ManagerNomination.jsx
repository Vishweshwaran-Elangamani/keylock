import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as managerNominationApi from "../../../services/performancemanagement/manager/managernominationapi";
import "../../../styles/performancemanagement/manager/ManagerNomination.css";

function ManagerNomination() {
  // Get manager ID from JWT token
  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user ? user.empId : null;
  const [managerId] = useState(() => empId);

  // State management
  const [rewardTypes, setRewardTypes] = useState([]);
  const [selectedRewardType, setSelectedRewardType] = useState(null);
  const [categoryRewards, setCategoryRewards] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [justification, setJustification] = useState("");
  const [parameterValues, setParameterValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [myNominations, setMyNominations] = useState([]);
  const [showNominationModal, setShowNominationModal] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch reward types on mount
  useEffect(() => {
    fetchRewardTypes();
  }, []);

  // Auto-fetch data when managerId is available
  useEffect(() => {
    if (managerId) {
      fetchTeamMembers();
      fetchMyNominations();
    }
  }, [managerId]);

  // ============ API CALLS ============
  const fetchRewardTypes = async () => {
    try {
      const { data } = await managerNominationApi.getRewardTypes();
      if (data.success) {
        setRewardTypes(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching reward types:", error);
      toast.error("Failed to load reward types");
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const { data } = await managerNominationApi.getTeamMembers(managerId);
      if (data.success) {
        setTeamMembers(data.data || []);
        toast.success(`Loaded ${data.data?.length || 0} team members`);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Error loading team members. Please check the Manager ID.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyNominations = async () => {
    try {
      const { data } = await managerNominationApi.getMyNominations(managerId);
      if (data.success) {
        setMyNominations(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      toast.error("Failed to load nominations");
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getNominationStatus = (employeeId) => {
    const nomination = myNominations.find((n) => n?.nominee?.employeeId === employeeId);
    if (!nomination) return "No nomination yet";
    return nomination.status || "Unknown";
  };

  const resetNominationForm = () => {
    setSelectedRewardType(null);
    setSelectedEmployee(null);
    setJustification("");
    setParameterValues({});
    setParameters([]);
    setCategoryRewards([]);
  };

  // ============ EVENT HANDLERS ============
  const handleNominateClick = async (employee) => {
    setSelectedEmployee(employee);
    setSelectedRewardType(null);
    setCategoryRewards([]);
    setParameters([]);
    setJustification("");
    setParameterValues({});

    // Auto-load Recognition rewards
    const recognitionRewards = rewardTypes.filter(
      (rt) => rt?.rewardCategory === "Recognition"
    );
    setCategoryRewards(recognitionRewards);
    setShowNominationModal(true);
  };

  const handleRewardTypeSelect = async (rewardTypeId) => {
    const rewardType = rewardTypes.find((rt) => rt?.rewardTypeId === rewardTypeId);
    setSelectedRewardType(rewardType);
    setParameters([]);
    setParameterValues({});

    if (rewardTypeId) {
      try {
        const { data } = await managerNominationApi.getNominationParameters(rewardTypeId);
        if (data.success) {
          setParameters(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching parameters:", error);
        toast.error("Error loading parameters. Please try again.");
      }
    }
  };

  const handleParameterChange = (parameterId, value) => {
    setParameterValues({
      ...parameterValues,
      [parameterId]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRewardType) {
      toast.warning("Please select a reward type");
      return;
    }

    if (!justification.trim()) {
      toast.warning("Justification is required");
      return;
    }

    const requiredParams = parameters.filter((p) => p?.isRequired);
    const missingParams = requiredParams.filter(
      (p) =>
        !parameterValues[p.parameterId] ||
        parameterValues[p.parameterId].toString().trim() === ""
    );

    if (missingParams.length > 0) {
      toast.warning(
        `Please fill in all required fields: ${missingParams
          .map((p) => p.parameterName)
          .join(", ")}`
      );
      return;
    }

    try {
      const payload = {
        rewardTypeId: selectedRewardType.rewardTypeId,
        nomineeEmployeeId: selectedEmployee?.employeeId,
        nominatedByEmployeeId: parseInt(managerId),
        justification: justification,
        parameterValues: Object.entries(parameterValues).map(
          ([parameterId, value]) => ({
            parameterId: parseInt(parameterId),
            value: value.toString(),
          })
        ),
      };

      const { data } = await managerNominationApi.submitNomination(payload);

      if (data.success) {
        toast.success("Nomination submitted successfully!");
        setShowNominationModal(false);
        resetNominationForm();
        fetchMyNominations();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        "Error submitting nomination: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // ============ RENDER FUNCTIONS ============
  const renderParameterField = (parameter) => {
    if (!parameter) return null;

    const value = parameterValues[parameter.parameterId] || "";

    switch (parameter.parameterType) {
      case "Text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            placeholder={parameter.placeholderText || "Enter text..."}
            required={parameter.isRequired}
            className="tlp-input"
          />
        );

      case "TextArea":
        return (
          <textarea
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            placeholder={parameter.placeholderText || "Enter details..."}
            required={parameter.isRequired}
            className="tlp-textarea"
          />
        );

      case "Number":
      case "Rating":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            placeholder={parameter.placeholderText || "Enter number..."}
            min={parameter.minimumValue || undefined}
            max={parameter.maximumValue || undefined}
            required={parameter.isRequired}
            className="tlp-input"
          />
        );

      case "Date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) =>
              handleParameterChange(parameter.parameterId, e.target.value)
            }
            required={parameter.isRequired}
            className="tlp-input"
          />
        );

      default:
        return null;
    }
  };

  // Filter nominations by status
  const approvedNominations = myNominations.filter(
    (n) => n && n.status === "Approved"
  );
  const pendingNominations = myNominations.filter(
    (n) => n && n.status === "Pending"
  );
  const rejectedNominations = myNominations.filter(
    (n) => n && n.status === "Rejected"
  );

  // Get approved team members
  const approvedMembers = approvedNominations
    .filter((nom) => nom && nom.rewardType && nom.nominee)
    .map((nom) => ({
      name: `${nom.nominee.firstName || ""} ${nom.nominee.lastName || ""}`.trim(),
      rewardName: nom.rewardType.rewardName || "N/A",
    }));

  return (
    <div className="tlp-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Congratulations Banner */}
      {approvedMembers.length > 0 && (
        <div className="tlp-congrats-card">
          <div className="tlp-congrats-header">
            <div className="tlp-congrats-icon">🎉</div>
            <div>
              <h2 className="tlp-congrats-title">
                Congratulations! {approvedMembers.length} Team{" "}
                {approvedMembers.length === 1 ? "Member" : "Members"} Approved
                by HR
              </h2>
              <p className="tlp-congrats-subtitle">
                Your nominations have been successfully approved
              </p>
            </div>
          </div>

          <div className="tlp-approved-members-list">
            {approvedMembers.map((member, index) => (
              <div key={index} className="tlp-approved-member">
                <div className="tlp-approved-member-info">
                  <div className="tlp-approved-member-number">{index + 1}</div>
                  <div>
                    <div className="tlp-approved-member-name">{member.name}</div>
                    <div className="tlp-approved-reward-name">
                      {member.rewardName}
                    </div>
                  </div>
                </div>
                <div className="tlp-approved-badge">Approved</div>
              </div>
            ))}
          </div>
        </div>
      )}

      

      {/* Team Members Section with Tabs */}
      {teamMembers.length > 0 && (
        <div className="tlp-card">
          <h2 className="tlp-section-title">My Team Nominations</h2>

          {/* Tabs */}
          <div className="tlp-tab-container">
            <button
              onClick={() => setActiveTab("pending")}
              className={`tlp-tab ${activeTab === "pending" ? "tlp-tab-active" : ""}`}
            >
              Pending ({pendingNominations.length})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`tlp-tab ${activeTab === "approved" ? "tlp-tab-active" : ""}`}
            >
              Approved ({approvedNominations.length})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`tlp-tab ${activeTab === "rejected" ? "tlp-tab-active" : ""}`}
            >
              Rejected ({rejectedNominations.length})
            </button>
          </div>

          {/* Nominations Table */}
          <div className="tlp-table-wrapper">
            <table className="tlp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Reward Type</th>
                  <th>Status</th>
                  {activeTab === "pending" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {activeTab === "pending" &&
                  pendingNominations.map((nom, index) => (
                    <tr key={nom?.nominationId || index}>
                      <td>{index + 1}</td>
                      <td>
                        {nom?.nominee?.firstName || ""}{" "}
                        {nom?.nominee?.lastName || ""}
                      </td>
                      <td>
                        {nom?.nominee?.department?.departmentName || "N/A"}
                      </td>
                      <td>{nom?.rewardType?.rewardName || "N/A"}</td>
                      <td>
                        <span className="tlp-badge tlp-badge-pending">
                          Pending
                        </span>
                      </td>
                      <td>
                        <button className="tlp-view-button">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}

                {activeTab === "approved" &&
                  approvedNominations.map((nom, index) => (
                    <tr key={nom?.nominationId || index}>
                      <td>{index + 1}</td>
                      <td>
                        {nom?.nominee?.firstName || ""}{" "}
                        {nom?.nominee?.lastName || ""}
                      </td>
                      <td>
                        {nom?.nominee?.department?.departmentName || "N/A"}
                      </td>
                      <td>{nom?.rewardType?.rewardName || "N/A"}</td>
                      <td>
                        <span className="tlp-badge tlp-badge-approved">
                          Approved
                        </span>
                      </td>
                    </tr>
                  ))}

                {activeTab === "rejected" &&
                  rejectedNominations.map((nom, index) => (
                    <tr key={nom?.nominationId || index}>
                      <td>{index + 1}</td>
                      <td>
                        {nom?.nominee?.firstName || ""}{" "}
                        {nom?.nominee?.lastName || ""}
                      </td>
                      <td>
                        {nom?.nominee?.department?.departmentName || "N/A"}
                      </td>
                      <td>{nom?.rewardType?.rewardName || "N/A"}</td>
                      <td>
                        <span className="tlp-badge tlp-badge-rejected">
                          Rejected
                        </span>
                      </td>
                    </tr>
                  ))}

                {((activeTab === "pending" &&
                  pendingNominations.length === 0) ||
                  (activeTab === "approved" &&
                    approvedNominations.length === 0) ||
                  (activeTab === "rejected" &&
                    rejectedNominations.length === 0)) && (
                  <tr>
                    <td
                      colSpan={activeTab === "pending" ? 6 : 5}
                      className="tlp-empty-row"
                    >
                      No {activeTab} nominations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Available for Nomination */}
          <div className="tlp-available-section">
            <h3 className="tlp-subsection-title">
              Available for Nomination
            </h3>
            <table className="tlp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers
                  .filter(
                    (member) =>
                      getNominationStatus(member?.employeeId) ===
                      "No nomination yet"
                  )
                  .map((member, index) => (
                    <tr key={member?.employeeId || index}>
                      <td>{index + 1}</td>
                      <td>
                        {member?.firstName || ""} {member?.lastName || ""}
                      </td>
                      <td>
                        {member?.department?.departmentName || "N/A"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleNominateClick(member)}
                          className="tlp-nominate-button"
                        >
                          Nominate
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nomination Modal */}
      {showNominationModal && (
        <div
          className="tlp-modal-overlay"
          onClick={() => setShowNominationModal(false)}
        >
          <div
            className="tlp-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tlp-modal-header">
              <h3 className="tlp-modal-title">
                Nominate {selectedEmployee?.firstName || ""}{" "}
                {selectedEmployee?.lastName || ""}
              </h3>
              <p className="tlp-modal-subtitle">
                Select a Recognition reward type and fill in the details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="tlp-modal-form">
              {/* Select Reward Type - Only Recognition */}
              {!selectedRewardType && (
                <div className="tlp-form-section">
                  <label className="tlp-form-label">
                    Select Recognition Reward{" "}
                    <span className="tlp-required">*</span>
                  </label>

                  <div className="tlp-reward-grid">
                    {categoryRewards.map((reward) => (
                      <div
                        key={reward?.rewardTypeId}
                        onClick={() =>
                          handleRewardTypeSelect(reward?.rewardTypeId)
                        }
                        className="tlp-reward-card"
                      >
                        <div className="tlp-reward-name">
                          {reward?.rewardName || "N/A"}
                        </div>
                        {reward?.description && (
                          <div className="tlp-reward-desc">
                            {reward.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Justification & Parameters */}
              {selectedRewardType && (
                <>
                  <div className="tlp-selected-info">
                    <strong>Selected:</strong>{" "}
                    {selectedRewardType?.rewardName || "N/A"}
                  </div>

                  <div className="tlp-form-section">
                    <label className="tlp-form-label">
                      Justification <span className="tlp-required">*</span>
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Explain why this employee deserves this nomination..."
                      required
                      className="tlp-textarea"
                    />
                  </div>

                  {/* Parameters */}
                  {parameters.length > 0 && (
                    <div className="tlp-form-section">
                      <h4 className="tlp-parameters-title">
                        Additional Information ({parameters.length} fields)
                      </h4>

                      {parameters.map((parameter, index) => (
                        <div
                          key={parameter?.parameterId || index}
                          className="tlp-parameter-field"
                        >
                          <label className="tlp-form-label">
                            {index + 1}. {parameter?.parameterName || "N/A"}
                            {parameter?.isRequired && (
                              <span className="tlp-required"> *</span>
                            )}
                            <span className="tlp-parameter-type">
                              ({parameter?.parameterType || "Text"})
                            </span>
                          </label>
                          {renderParameterField(parameter)}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Submit Buttons */}
              <div className="tlp-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowNominationModal(false)}
                  className="tlp-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedRewardType}
                  className="tlp-submit-button"
                >
                  Submit Nomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerNomination;

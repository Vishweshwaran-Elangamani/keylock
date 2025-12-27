import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Send, AlertTriangle, Loader } from "lucide-react";
import {
  peerQueueApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/SubmitPeerFeedback.css";

export default function SubmitPeerFeedback() {
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1004,
        firstName: "Dave",
        lastName: "Dev",
      },
    []
  );

  const [form, setForm] = useState({
    recipientEmployeeId: "",
    feedbackContent: "",
    isAnonymous: false,
  });

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await employeeApi.getAll();

      if (response?.data) {
        const employeesList = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        setEmployees(employeesList);
      } else {
        console.error("Invalid response format");
        setError("Failed to load employees: Invalid data format");
      }
    } catch (err) {
      console.error("Error fetching employees:", err.message);
      setError(`Failed to load employees: ${err.message}`);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selectedEmp = employees.find(
        (emp) =>
          String(emp.employeeMasterId) === String(form.recipientEmployeeId)
      );

      if (!selectedEmp) {
        setError("Selected employee not found");
        setLoading(false);
        return;
      }

      const payload = {
        submittedByEmployeeId: Number(user?.empId),
        recipientEmployeeId: Number(selectedEmp.employeeId),
        feedbackContent: form.feedbackContent.trim(),
        isAnonymous: form.isAnonymous,
      };

      const createResponse = await peerQueueApi.create(payload);

      if (createResponse?.success || createResponse?.data?.success) {
        const queueId =
          createResponse.data?.queueId || createResponse.data?.data?.queueId;

        if (!queueId) {
          throw new Error("Queue ID not returned from create endpoint");
        }

        try {
          const approveResponse = await peerQueueApi.approve(queueId, {
            isProfessional: true,
            isRelevant: true,
            approvedByHRId: Number(user?.empId),
          });

          if (approveResponse?.success || approveResponse?.data?.success) {
            setSuccessMsg(
              `Feedback submitted and approved successfully for ${selectedEmp.firstName} ${selectedEmp.lastName}!`
            );
            resetForm();
          } else {
            setSuccessMsg(
              `Feedback submitted to ${selectedEmp.firstName} ${selectedEmp.lastName}, but auto-approval failed. HR will review it.`
            );
            resetForm();
          }
        } catch (approveErr) {
          console.warn("Auto-approval failed:", approveErr);
          setSuccessMsg(
            `Feedback submitted to ${selectedEmp.firstName} ${selectedEmp.lastName}, pending HR review.`
          );
          resetForm();
        }
      } else {
        setError(createResponse?.message || "Failed to submit feedback");
      }
    } catch (err) {
      console.error("Submit error:", {
        status: err?.response?.status,
        message: err?.response?.data?.message,
        fullError: err,
      });

      const errorMsg = err?.message || "Failed to submit feedback";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientChange = (e) => {
    setForm((prev) => ({ ...prev, recipientEmployeeId: e.target.value }));
  };

  const handleFeedbackChange = (e) => {
    setForm((prev) => ({ ...prev, feedbackContent: e.target.value }));
  };

  const handleAnonymousChange = (e) => {
    setForm((prev) => ({ ...prev, isAnonymous: e.target.checked }));
  };

  const validateForm = () => {
    if (!form.recipientEmployeeId) {
      setError("Please select a recipient employee");
      return false;
    }
    if (!form.feedbackContent || form.feedbackContent.trim().length === 0) {
      setError("Please enter feedback content");
      return false;
    }
    if (form.feedbackContent.length > 5000) {
      setError("Feedback content cannot exceed 5000 characters");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setForm({
      recipientEmployeeId: "",
      feedbackContent: "",
      isAnonymous: false,
    });
  };

  const closeAlert = (type) => {
    if (type === "error") setError("");
    if (type === "success") setSuccessMsg("");
  };

  const selectedEmployee = employees.find(
    (emp) => String(emp.employeeMasterId) === String(form.recipientEmployeeId)
  );

  const charCount = form.feedbackContent.length;
  const charRemaining = 5000 - charCount;
  const isNearLimit = charCount > 4500;

  return (
    <div className="spf-container">
      <div className="spf-header">
        <h2 className="spf-title">Submit Peer Feedback</h2>
        <p className="spf-subtitle">
          Share constructive feedback with a colleague to support their growth
        </p>
      </div>

      {error && (
        <div className="spf-alert spf-alert-error">
          <AlertTriangle size={20} className="spf-alert-icon" />
          <div className="spf-alert-content">
            <strong>Error</strong>
            <p className="spf-alert-message">{error}</p>
          </div>
          <button
            type="button"
            className="spf-alert-close"
            onClick={() => closeAlert("error")}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="spf-alert spf-alert-success">
          <CheckCircle size={20} className="spf-alert-icon" />
          <div className="spf-alert-content">{successMsg}</div>
          <button
            type="button"
            className="spf-alert-close"
            onClick={() => closeAlert("success")}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      <div className="spf-card">
        <div className="spf-card-body">
          <div className="spf-debug-info">
            <strong>Logged in as:</strong> {user?.firstName} {user?.lastName}{" "}
            (ID: {user?.empId})
            <br />
            <strong>Available Recipients:</strong> {employees.length} employees
            <br />
            <strong>Auto-approval:</strong> Enabled (feedback will be approved
            immediately)
          </div>

          <form onSubmit={submitFeedback} noValidate>
            <div className="spf-form-row">
              <div className="spf-form-col">
                <label htmlFor="recipientSelect" className="spf-label">
                  Select Recipient Employee <span className="spf-required">*</span>
                </label>
                <div className="spf-select-wrapper">
                  <select
                    id="recipientSelect"
                    className="spf-select"
                    value={form.recipientEmployeeId}
                    onChange={handleRecipientChange}
                    disabled={loadingEmployees || employees.length === 0}
                    aria-label="Select recipient employee"
                  >
                    <option value="">
                      {loadingEmployees
                        ? "Loading employees..."
                        : employees.length === 0
                        ? "No employees available"
                        : "-- Select an employee --"}
                    </option>
                    {employees.map((emp) => (
                      <option
                        key={`emp-${emp.employeeMasterId}`}
                        value={emp.employeeMasterId}
                      >
                        {emp.firstName} {emp.lastName} ({emp.employeeCompanyId})
                      </option>
                    ))}
                  </select>
                  {loadingEmployees && (
                    <Loader size={16} className="spf-select-loader" />
                  )}
                </div>
                <small className="spf-help-text">
                  {selectedEmployee
                    ? `Selected: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                    : "Choose an employee to give feedback to"}
                </small>
              </div>

              {selectedEmployee && (
                <div className="spf-form-col">
                  <label className="spf-label">Recipient Details</label>
                  <div className="spf-recipient-details">
                    <div className="spf-details-content">
                      <p className="spf-detail-item">
                        <strong>Name:</strong>
                        <br />
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </p>
                      <p className="spf-detail-item">
                        <strong>Email:</strong>
                        <br />
                        {selectedEmployee.email}
                      </p>
                      <p className="spf-detail-item">
                        <strong>Role:</strong>
                        <br />
                        {selectedEmployee.roleName}
                      </p>
                      <p className="spf-detail-item spf-detail-item-last">
                        <strong>Department:</strong>
                        <br />
                        {selectedEmployee.departmentName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="spf-form-group">
              <label htmlFor="feedbackContent" className="spf-label">
                Feedback Content <span className="spf-required">*</span>
              </label>
              <textarea
                id="feedbackContent"
                className="spf-textarea"
                rows={5}
                placeholder="Share specific, constructive feedback. Example: 'Your communication in meetings is clear and inclusive...'"
                value={form.feedbackContent}
                onChange={handleFeedbackChange}
                disabled={loading}
                maxLength={5000}
                aria-label="Enter feedback content"
              />
              <div className="spf-textarea-footer">
                <small className="spf-help-text">
                  Provide specific, actionable, and constructive feedback
                </small>
                <small
                  className={`spf-char-count ${
                    isNearLimit ? "spf-char-count-warning" : ""
                  }`}
                >
                  {charCount} / 5000 characters
                  {isNearLimit && ` (${charRemaining} remaining)`}
                </small>
              </div>
            </div>

            <div className="spf-form-group">
              <div className="spf-checkbox-wrapper">
                <input
                  id="isAnonymous"
                  type="checkbox"
                  className="spf-checkbox-input"
                  checked={form.isAnonymous}
                  onChange={handleAnonymousChange}
                  disabled={loading}
                />
                <label htmlFor="isAnonymous" className="spf-checkbox-label">
                  <strong>Submit anonymously</strong>
                  <small className="spf-checkbox-hint">
                    Your name won't be shown to the recipient
                  </small>
                </label>
              </div>
            </div>

            <div className="spf-button-group">
              <button
                type="submit"
                className="spf-submit-button"
                disabled={
                  loading || loadingEmployees || !form.recipientEmployeeId
                }
              >
                {loading ? (
                  <>
                    <Loader size={16} className="spf-button-loader" />
                    Submitting & Approving...
                  </>
                ) : (
                  <>
                    <Send size={16} className="spf-button-icon" />
                    Submit Feedback
                  </>
                )}
              </button>
              <button
                type="button"
                className="spf-clear-button"
                onClick={resetForm}
                disabled={loading}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="spf-tips">
        <strong>Tips for good feedback:</strong>
        <ul className="spf-tips-list">
          <li>Be specific about behaviors and outcomes, not personality</li>
          <li>Provide examples to support your feedback</li>
          <li>Balance constructive criticism with recognition</li>
          <li>Focus on things they can improve</li>
        </ul>
      </div>
    </div>
  );
}

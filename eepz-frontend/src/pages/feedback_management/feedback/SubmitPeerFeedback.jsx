import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Send, AlertTriangle, Loader } from "lucide-react";
import { peerQueueApi } from "../../../services/feedbackmanagement/feedbackApi";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

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
      const response = await axios.get(`${API_BASE}/employeemanagement/all`);

      if (response.data?.success && Array.isArray(response.data.data)) {
        setEmployees(response.data.data);
        console.log(` Loaded ${response.data.data.length} employees`);
      } else {
        console.error(" Invalid response format");
        setError("Failed to load employees: Invalid data format");
      }
    } catch (err) {
      console.error(" Error fetching employees:", err.message);
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
      // Find the selected employee
      const selectedEmp = employees.find(
        (emp) =>
          String(emp.employeeMasterId) === String(form.recipientEmployeeId)
      );

      if (!selectedEmp) {
        setError("Selected employee not found");
        setLoading(false);
        return;
      }

      // STEP 1: Create the feedback (initially in Pending status)
      const payload = {
        submittedByEmployeeId: Number(user?.empId),
        recipientEmployeeId: Number(selectedEmp.employeeId),
        feedbackContent: form.feedbackContent.trim(),
        isAnonymous: form.isAnonymous,
      };

      console.log(" Step 1: Creating peer feedback");
      console.log("Payload:", payload);

      const createResponse = await peerQueueApi.create(payload);

      console.log(" Step 1 Complete - Feedback created:", createResponse.data);

      if (createResponse.data?.success) {
        const queueId = createResponse.data?.data?.queueId;

        if (!queueId) {
          throw new Error("Queue ID not returned from create endpoint");
        }

        console.log(` Step 2: Auto-approving feedback with queueId ${queueId}`);

        // STEP 2: Auto-approve the feedback
        const approveResponse = await axios.post(
          `${API_BASE}/PeerFeedbackQueue/${queueId}/approve`,
          null, // No body needed
          {
            params: {
              isProfessional: true,
              isRelevant: true,
              approvedByHRId: Number(user?.empId), // Use current user as approver
            },
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          }
        );

        console.log(
          " Step 2 Complete - Feedback approved:",
          approveResponse.data
        );

        if (approveResponse.data?.success || approveResponse.status === 200) {
          setSuccessMsg(
            ` Feedback submitted and approved successfully for ${selectedEmp.firstName} ${selectedEmp.lastName}!`
          );
          resetForm();
        } else {
          // Feedback created but approval failed - still show partial success
          setSuccessMsg(
            ` Feedback submitted to ${selectedEmp.firstName} ${selectedEmp.lastName}, but auto-approval failed. HR will review it.`
          );
          resetForm();
        }
      } else {
        setError(createResponse.data?.message || "Failed to submit feedback");
      }
    } catch (err) {
      console.error(" Submit error:", {
        status: err?.response?.status,
        message: err?.response?.data?.message,
        fullError: err,
      });

      const errorMsg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to submit feedback";
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
    <div className="container-fluid py-4" style={{ maxWidth: "1000px" }}>
      {/* HEADER */}
      <div className="mb-4">
        <h2
          className="fw-bold mb-2"
          style={{ color: "var(--color-primary-1)" }}
        >
          👥 Submit Peer Feedback
        </h2>
        <p className="text-muted mb-0">
          Share constructive feedback with a colleague to support their growth
        </p>
      </div>

      {/* ALERTS */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-2"
          role="alert"
        >
          <AlertTriangle size={20} className="mt-1 flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>Error</strong>
            <p className="mb-0 mt-1">{error}</p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => closeAlert("error")}
            aria-label="Close"
          />
        </div>
      )}

      {successMsg && (
        <div
          className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2"
          role="alert"
        >
          <CheckCircle size={20} className="flex-shrink-0" />
          <div className="flex-grow-1">{successMsg}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => closeAlert("success")}
            aria-label="Close"
          />
        </div>
      )}

      {/* MAIN CARD */}
      <div className="card shadow-sm" style={{ borderRadius: "8px" }}>
        <div className="card-body p-4">
          {/* DEBUG INFO */}
          <div className="alert alert-info small mb-4">
            <strong> Logged in as:</strong> {user?.firstName} {user?.lastName}{" "}
            (ID: {user?.empId})
            <br />
            <strong> Available Recipients:</strong> {employees.length} employees
            <br />
            <strong> Auto-approval:</strong> Enabled (feedback will be approved
            immediately)
          </div>

          {/* FORM */}
          <form onSubmit={submitFeedback} noValidate>
            {/* RECIPIENT SELECTION ROW */}
            <div className="row g-3 mb-4">
              {/* DROPDOWN COLUMN */}
              <div className="col-lg-6">
                <label
                  htmlFor="recipientSelect"
                  className="form-label fw-bold mb-2"
                >
                  Select Recipient Employee *
                </label>
                <div className="position-relative">
                  <select
                    id="recipientSelect"
                    className="form-select"
                    value={form.recipientEmployeeId}
                    onChange={handleRecipientChange}
                    disabled={loadingEmployees || employees.length === 0}
                    aria-label="Select recipient employee"
                    style={{ height: "40px" }}
                  >
                    <option value="">
                      {loadingEmployees
                        ? " Loading employees..."
                        : employees.length === 0
                        ? " No employees available"
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
                    <Loader
                      size={16}
                      className="position-absolute"
                      style={{
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  )}
                </div>
                <small className="d-block mt-2 text-muted">
                  {selectedEmployee
                    ? `✓ Selected: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                    : "Choose an employee to give feedback to"}
                </small>
              </div>

              {/* RECIPIENT DETAILS COLUMN */}
              {selectedEmployee && (
                <div className="col-lg-6">
                  <label className="form-label fw-bold mb-2">
                    {" "}
                    Recipient Details
                  </label>
                  <div
                    className="p-3 rounded h-100"
                    style={{
                      backgroundColor: "#e7f3ff",
                      border: "1px solid #b3d9ff",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ fontSize: "0.9rem" }}>
                      <p className="mb-2">
                        <strong>Name:</strong>
                        <br />
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </p>
                      <p className="mb-2">
                        <strong>Email:</strong>
                        <br />
                        {selectedEmployee.email}
                      </p>
                      <p className="mb-2">
                        <strong>Role:</strong>
                        <br />
                        {selectedEmployee.roleName}
                      </p>
                      <p className="mb-0">
                        <strong>Department:</strong>
                        <br />
                        {selectedEmployee.departmentName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FEEDBACK CONTENT */}
            <div className="mb-3">
              <label
                htmlFor="feedbackContent"
                className="form-label fw-bold mb-2"
              >
                Feedback Content *
              </label>
              <textarea
                id="feedbackContent"
                className="form-control"
                rows={5}
                placeholder="Share specific, constructive feedback. Example: 'Your communication in meetings is clear and inclusive...'"
                value={form.feedbackContent}
                onChange={handleFeedbackChange}
                disabled={loading}
                style={{
                  resize: "vertical",
                  minHeight: "140px",
                  borderRadius: "8px",
                }}
                aria-label="Enter feedback content"
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">
                  Provide specific, actionable, and constructive feedback
                </small>
                <small
                  className={isNearLimit ? "text-danger fw-bold" : "text-muted"}
                >
                  {charCount} / 5000 characters
                  {isNearLimit && ` (${charRemaining} remaining)`}
                </small>
              </div>
            </div>

            {/* ANONYMOUS CHECKBOX */}
            <div className="mb-4">
              <div className="form-check">
                <input
                  id="isAnonymous"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isAnonymous}
                  onChange={handleAnonymousChange}
                  disabled={loading}
                />
                <label htmlFor="isAnonymous" className="form-check-label">
                  <strong>Submit anonymously</strong>
                  <small className="d-block text-muted mt-1">
                    Your name won't be shown to the recipient
                  </small>
                </label>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="d-grid gap-2 d-sm-flex justify-content-sm-between">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={
                  loading || loadingEmployees || !form.recipientEmployeeId
                }
                style={{ minWidth: "200px", borderRadius: "8px" }}
              >
                {loading ? (
                  <>
                    <Loader
                      size={16}
                      className="me-2"
                      style={{
                        display: "inline",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Submitting & Approving...
                  </>
                ) : (
                  <>
                    <Send
                      size={16}
                      className="me-2"
                      style={{ display: "inline" }}
                    />
                    Submit Feedback
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-lg"
                onClick={resetForm}
                disabled={loading}
                style={{ borderRadius: "8px" }}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-4 p-3 bg-light rounded small text-muted">
        <strong> Tips for good feedback:</strong>
        <ul className="mb-0 mt-2 ps-3">
          <li>Be specific about behaviors and outcomes, not personality</li>
          <li>Provide examples to support your feedback</li>
          <li>Balance constructive criticism with recognition</li>
          <li>Focus on things they can improve</li>
        </ul>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

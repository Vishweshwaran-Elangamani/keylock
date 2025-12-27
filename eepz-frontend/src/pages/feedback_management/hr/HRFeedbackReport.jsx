import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  Trash2,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";
import {
  hrFormApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import ResponseViewModal from "../../../components/FeedbackManagement/ResponseViewModal";
import "../../../styles/feedback/hr/HRFeedbackReport.css";

const Badge = ({ text, color = "#525252" }) => (
  <span className="hfr-badge" style={{ color, backgroundColor: `${color}20` }}>
    {text}
  </span>
);

export default function HRFeedbackReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Forms");
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  const fetchEmployeeMap = async () => {
    try {
      const response = await employeeApi.getAll();
      if (response?.data) {
        const employees = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        const map = {};
        employees.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        return map;
      }
    } catch (err) {
      console.error("Error fetching employee map:", err.message);
    }
    return {};
  };

  const fetchData = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      const empMap = await fetchEmployeeMap();

      const formsRes = await hrFormApi.getActiveForms();
      let formsData = [];
      const formsArr = formsRes?.data || [];
      if (Array.isArray(formsArr)) {
        formsData = formsArr;
        setForms(formsData);
      }

      let allResponses = [];

      for (const form of formsData) {
        try {
          const respRes = await hrFormApi.getResponsesByFormId(form.formId);
          const responseData = respRes?.data || [];

          if (Array.isArray(responseData)) {
            const mappedResponses = responseData.map((r) => ({
              responseId: r.responseId,
              formId: form.formId,
              formName: form.formName,
              employeeId: r.employeeId,
              employeeName:
                empMap[r.employeeId] ||
                empMap[r.submittedByEmployeeId] ||
                `Employee ${r.employeeId}`,
              status: r.status || "Submitted",
              submittedDate:
                r.submittedDate ||
                r.createdAt ||
                r.createdDate ||
                r.submittedOn ||
                new Date().toISOString(),
              hrReviewComments: r.hrReviewComments,
              ...r,
            }));

            allResponses = [...allResponses, ...mappedResponses];
          }
        } catch (err) {
          console.warn(
            `Error fetching responses for form ${form.formId}:`,
            err.message
          );
        }
      }

      allResponses.sort(
        (a, b) => new Date(b.submittedDate) - new Date(a.submittedDate)
      );
      setResponses(allResponses);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
  };

  const deleteResponse = async (responseId) => {
    if (!window.confirm("Delete this response? This action cannot be undone."))
      return;
    setError("");

    try {
      await hrFormApi.deleteResponse(responseId);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err?.message || "Failed to delete");
    }
  };

  const TabBtn = ({ label, icon: Icon, active, count }) => (
    <button
      type="button"
      className={`hfr-tab-btn ${active ? "hfr-tab-btn-active" : ""}`}
      onClick={() => setTab(label)}
    >
      <Icon size={14} className="hfr-tab-icon" />
      {label}
      {count !== undefined && (
        <span className="hfr-tab-count">{count}</span>
      )}
    </button>
  );

  return (
    <div className="hfr-page">
      <div className="hfr-header">
        <div className="hfr-header-left">
          <div className="hfr-header-title-row">
            <FileText size={24} className="hfr-header-icon" />
            <h2 className="hfr-title">HR Feedback Report</h2>
          </div>
          <p className="hfr-subtitle">View all forms and submitted responses</p>
        </div>
        <button
          className="hfr-refresh-btn"
          onClick={fetchData}
          disabled={refreshing || loading}
        >
          <RefreshCw
            size={18}
            className={refreshing ? "hfr-icon-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="hfr-alert hfr-alert-error">
          <div className="hfr-alert-main">
            <AlertTriangle size={18} className="hfr-alert-icon" />
            <div>
              <strong>Error</strong>
              <p className="hfr-alert-text">{error}</p>
            </div>
          </div>
          <button
            className="hfr-alert-close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="hfr-stats-row">
        <div className="hfr-stat-card">
          <div className="hfr-stat-body">
            <h4 className="hfr-stat-number hfr-stat-number-primary">
              {forms.length}
            </h4>
            <small className="hfr-stat-label">Total Forms</small>
          </div>
        </div>
        <div className="hfr-stat-card">
          <div className="hfr-stat-body">
            <h4 className="hfr-stat-number hfr-stat-number-success">
              {responses.length}
            </h4>
            <small className="hfr-stat-label">Submitted</small>
          </div>
        </div>
      </div>

      <div className="hfr-tabs-card">
        <div className="hfr-tabs-body">
          <TabBtn
            label="Forms"
            icon={FileText}
            active={tab === "Forms"}
            count={forms.length}
          />
          <TabBtn
            label="Responses"
            icon={CheckCircle}
            active={tab === "Responses"}
            count={responses.length}
          />
        </div>
      </div>

      {tab === "Forms" && (
        <div className="hfr-card">
          <div className="hfr-card-body">
            <div className="hfr-section-header">
              <FileText size={20} className="hfr-section-icon" />
              <h5 className="hfr-section-title">Active Forms</h5>
            </div>
            {forms.length === 0 ? (
              <div className="hfr-empty-alert">No forms available</div>
            ) : (
              <div className="hfr-forms-grid">
                {forms.map((form) => {
                  const formResponses = responses.filter(
                    (r) => r.formId === form.formId
                  );
                  return (
                    <div className="hfr-form-col" key={form.formId}>
                      <div className="hfr-form-card">
                        <div className="hfr-form-card-body">
                          <div className="hfr-form-header">
                            <h6 className="hfr-form-name">
                              {form.formName}
                            </h6>
                            <Badge
                              text={`${formResponses.length}`}
                              color="#0F62FE"
                            />
                          </div>
                          <p className="hfr-form-description">
                            {form.formDescription || "No description"}
                          </p>
                          <div className="hfr-form-responses">
                            <CheckCircle
                              size={12}
                              className="hfr-form-responses-icon"
                            />
                            {formResponses.length} response
                            {formResponses.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "Responses" && (
        <div className="hfr-card">
          <div className="hfr-card-body">
            <div className="hfr-section-header">
              <CheckCircle size={20} className="hfr-section-icon" />
              <h5 className="hfr-section-title">Submitted Responses</h5>
            </div>
            {responses.length === 0 ? (
              <p className="hfr-empty-text">No responses submitted yet</p>
            ) : (
              <div className="hfr-responses-grid">
                {responses.map((response) => {
                  const daysAgo = Math.floor(
                    (new Date() - new Date(response.submittedDate)) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      className="hfr-response-col"
                      key={response.responseId}
                    >
                      <div className="hfr-response-card">
                        <div className="hfr-response-card-body">
                          <div className="hfr-response-header">
                            <div>
                              <h6 className="hfr-response-form-label">
                                Form:
                              </h6>
                              <p className="hfr-response-form-name">
                                {response.formName}
                              </p>
                            </div>
                            <Badge text="Submitted" color="#24A148" />
                          </div>

                          <div className="hfr-response-employee-box">
                            <h6 className="hfr-response-employee-label">
                              <User
                                size={12}
                                className="hfr-inline-icon"
                              />
                              Employee:
                            </h6>
                            <p className="hfr-response-employee-name">
                              {response.employeeName}
                            </p>
                          </div>

                          <small className="hfr-response-time">
                            <Clock
                              size={12}
                              className="hfr-inline-icon"
                            />
                            {new Date(
                              response.submittedDate
                            ).toLocaleDateString()}{" "}
                            ({daysAgo}d ago)
                          </small>

                          {response.hrReviewComments && (
                            <div className="hfr-response-review-box">
                              <small className="hfr-response-review-label">
                                <MessageSquare
                                  size={12}
                                  className="hfr-inline-icon"
                                />
                                HR Review:
                              </small>
                              <p className="hfr-response-review-text">
                                {response.hrReviewComments.substring(0, 60)}
                                ...
                              </p>
                            </div>
                          )}

                          <div className="hfr-response-actions">
                            <button
                              className="hfr-btn hfr-btn-outline hfr-btn-full"
                              onClick={() => handleViewResponse(response)}
                            >
                              <Eye size={14} className="hfr-inline-icon" />
                              View
                            </button>
                            <button
                              className="hfr-btn hfr-btn-outline-danger"
                              onClick={() =>
                                deleteResponse(response.responseId)
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <ResponseViewModal
        show={showModal}
        response={selectedResponse}
        onClose={handleCloseModal}
        type="HR"
      />
    </div>
  );
}

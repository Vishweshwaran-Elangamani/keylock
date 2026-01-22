import React, { useEffect, useState, useMemo } from "react";
import { RefreshCw, AlertTriangle, Users, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  employeeApi,
  peerQueueApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import CustomDropdown from "../../../components/project-management/common/CustomDropdown";
import "../../../styles/feedback/components/AllManagerReviews.css";

const Badge = ({ text, variant = "default" }) => (
  <span className={`amr-badge amr-badge-${variant}`}>{text}</span>
);

export default function AllManagerReviews() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );

  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});
  const [managerIds, setManagerIds] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("All");

  const fetchEmployeeMap = async () => {
    try {
      const res = await employeeApi.getAll();
      let employeeList = [];

      if (res.data?.success && Array.isArray(res.data.data)) {
        employeeList = res.data.data;
      } else if (Array.isArray(res.data)) {
        employeeList = res.data;
      } else if (res.data?.$values && Array.isArray(res.data.$values)) {
        employeeList = res.data.$values;
      }

      const map = {};
      const managerList = [];
      const managerIdList = [];

      employeeList.forEach((emp) => {
        map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;

        if (emp.roleName === "Manager" || emp.role === "Manager") {
          managerIdList.push(emp.employeeId);
          managerList.push({
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
          });
        }
      });

      setEmployeeMap(map);
      setManagerIds(managerIdList);
      setManagers(managerList);
    } catch (err) {
      console.error("Error fetching employee map:", err);
    }
  };

  const fetchPeerFeedbacks = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      const res = await peerQueueApi.list();

      let feedbackList = [];
      if (res.data?.success && Array.isArray(res.data.data)) {
        feedbackList = res.data.data;
      } else if (Array.isArray(res.data)) {
        feedbackList = res.data;
      } else if (res.data?.$values && Array.isArray(res.data.$values)) {
        feedbackList = res.data.$values;
      }

      const managerFeedbacks = feedbackList.filter((feedback) =>
        managerIds.includes(feedback.submittedByEmployeeId)
      );

      const enriched = managerFeedbacks.map((feedback) => ({
        ...feedback,
        fromName:
          employeeMap[feedback.submittedByEmployeeId] ||
          `Manager ${feedback.submittedByEmployeeId}`,
        toName:
          employeeMap[feedback.recipientEmployeeId] ||
          `Employee ${feedback.recipientEmployeeId}`,
      }));

      setFeedbacks(enriched);
      setFilteredFeedbacks(enriched);
    } catch (err) {
      setError("Failed to load manager peer feedbacks");
      console.error("Error fetching peer feedbacks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployeeMap();
  }, []);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0 && managerIds.length > 0) {
      fetchPeerFeedbacks();
    }
  }, [employeeMap, managerIds]);

  useEffect(() => {
    let filtered = feedbacks;

    if (selectedManager !== "All" && !isNaN(Number(selectedManager))) {
      filtered = filtered.filter(
        (f) => f.submittedByEmployeeId === Number(selectedManager)
      );
    }

    setFilteredFeedbacks(filtered);
  }, [selectedManager, feedbacks]);

  const extractProjectContext = (feedbackContent) => {
    const match = feedbackContent?.match(/^\[([^\]]+)\]/);
    return match ? match[1] : null;
  };

  const extractFeedbackText = (feedbackContent) => {
    return feedbackContent?.replace(/^\[[^\]]+\]\s*/, "") || feedbackContent;
  };

  const managerDropdownOptions = useMemo(() => {
    return [
      { value: "All", label: "All Managers" },
      ...managers.map((m) => ({ value: String(m.id), label: m.name })),
    ];
  }, [managers]);

  if (loading) {
    return (
      <div className="amr-loading-container">
        <div className="amr-spinner" />
      </div>
    );
  }

  return (
    <div className="amr-page">
      <FeedbackBreadcrumb
        items={[
          {
            label: <span className="amr-breadcrumb-title">Manager Reviews</span>,
          },
        ]}
      />

      <div className="amr-container">
        <div className="amr-header">
          <div className="amr-header-content">
            <h5 className="amr-title">Manager Feedbacks</h5>
            <p className="amr-subtitle">
              View the feedback submitted by managers to their team members
            </p>
          </div>
          <button
            onClick={fetchPeerFeedbacks}
            disabled={refreshing}
            className="amr-refresh-btn"
            type="button"
          >
            <RefreshCw size={18} className={refreshing ? "amr-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="amr-alert amr-alert-error">
            <AlertTriangle size={18} />
            <div className="amr-alert-content">
              <strong>Error</strong>
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="amr-alert-close"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        <div className="amr-filter-card">
          <div className="amr-filter-content">
            <div className="amr-filter-wrapper">
              <CustomDropdown
                name="manager"
                value={selectedManager}
                options={managerDropdownOptions}
                placeholder="Select manager"
                onChange={(name, value) => setSelectedManager(value)}
                className="amr-custom-dd"
              />
            </div>
          </div>
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="amr-empty-state">
            <Users size={48} className="amr-empty-icon" />
            <p className="amr-empty-title">No manager feedbacks found</p>
            <p className="amr-empty-text">
              {selectedManager === "All"
                ? "No peer feedback has been submitted by managers yet"
                : "This manager hasn't submitted any peer feedback yet"}
            </p>
          </div>
        ) : (
          <div className="amr-feedback-grid">
            {filteredFeedbacks.map((feedback) => {
              const projectContext = extractProjectContext(
                feedback.feedbackContent
              );
              const feedbackText = extractFeedbackText(
                feedback.feedbackContent
              );

              return (
                <div key={feedback.queueId} className="amr-feedback-card">
                  <div className="amr-card-field">
                    <div className="amr-field-header">
                      <User size={14} />
                      <span>From</span>
                    </div>
                    <p className="amr-field-value">{feedback.fromName}</p>
                  </div>

                  <div className="amr-card-field">
                    <div className="amr-field-header">
                      <User size={14} />
                      <span>To</span>
                    </div>
                    <p className="amr-field-value">{feedback.toName}</p>
                  </div>

                  <div className="amr-card-field">
                    <div className="amr-field-header">
                      <Calendar size={14} />
                      <span className="amr-date">
                        {new Date(
                          feedback.createdAt || feedback.submittedAt
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="amr-feedback-content">
                    {projectContext && (
                      <Badge text={projectContext} variant="primary" />
                    )}
                    <p className="amr-feedback-text">{feedbackText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

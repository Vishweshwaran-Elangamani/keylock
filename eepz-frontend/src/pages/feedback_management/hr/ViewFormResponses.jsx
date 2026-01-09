import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import "../../../styles/feedback/hr/HRFormResponse.css";

export default function ViewFormResponses() {
  const navigate = useNavigate();
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const formRes = await hrFormApi.getFormById(formId);
        setForm(formRes.data?.data);

        const respRes = await hrFormApi.getResponsesByFormId(formId);
        setResponses(respRes.data?.data || []);
      } catch (err) {
        setError("Failed to load form");
        setForm({
          formId,
          formName: "Sample Form",
          formDescription: "Sample Description",
          formType: "feedback",
        });
        setResponses([
          {
            responseId: 1,
            employeeName: "Employee 1",
            status: "Submitted",
            submittedAt: new Date().toISOString(),
            answers: "5,4,5,4,5",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [formId]);

  if (loading) {
    return (
      <div className="hfrp-page hfrp-page-loading">
        <div className="hfrp-spinner-main" />
      </div>
    );
  }

  return (
    <div className="hfrp-page">
      <div className="hfrp-container">
        <button className="hfrp-btn hfrp-btn-outline hfrp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="hfrp-inline-icon-left" />
          Back
        </button>
        {error && (
          <div className="hfrp-alert hfrp-alert-warning">
            <AlertTriangle size={16} className="hfrp-alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <h2 className="hfrp-title">{form?.formName}</h2>
        <div className="hfrp-responses-grid">
          {responses.map((resp) => (
            <div key={resp.responseId} className="hfrp-response-col">
              <div className="hfrp-card">
                <div className="hfrp-card-body">
                  <div className="hfrp-card-header">
                    <h6 className="hfrp-employee-name">{resp.employeeName}</h6>
                    <span className="hfrp-status-badge">
                      <CheckCircle size={12} className="hfrp-inline-icon-left"/>
                      Submitted
                    </span>
                  </div>

                  <small className="hfrp-submitted-text">
                    Submitted: {new Date(resp.submittedAt).toLocaleDateString()}
                  </small>

                  <div className="hfrp-answers-block">
                    <strong className="hfrp-answers-label">Answers:</strong>
                    <div className="hfrp-answers-list">
                      {resp.answers ? (
                        resp.answers.split(",").map((ans, idx) => (
                          <div key={idx} className="hfrp-answer-row">
                            Q{idx + 1}:{" "}
                            <span className="hfrp-answer-badge">{ans} ⭐</span>
                          </div>
                        ))
                      ) : (
                        <p className="hfrp-no-answers">No answers recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

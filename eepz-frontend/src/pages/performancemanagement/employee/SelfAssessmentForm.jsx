import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
 
 export default function  SelfAssessmentForm() {
  const user = JSON.parse(localStorage.getItem("user"));
      const id = user ? user.empId : null;
  const navigate = useNavigate();
 
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
 
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMsg(null);
 
    api.get(`/AppraisalProcess/employee/${id}`)
      .then(({ data }) => {
        if (!mounted) return;
        setModel(data?.data ?? data);
      })
      .catch(() => setMsg("Failed to load assessment."))
      .finally(() => mounted && setLoading(false));
 
    return () => (mounted = false);
  }, [id]);
 
  const setAnswer = (detailId, key, value) => {
    setModel(prev => {
      const next = structuredClone(prev);
      const det = next.assessmentdetails.find(d => d.detailId === detailId);
      if (!det) return prev;
      det[key] = key === "employeeRating" ? Number(value || 0) : value;
      return next;
    });
  };
 
  const onSubmit = async () => {
    if (!model) return;
 
    const invalidRating = model.assessmentdetails.some(
      d => !d.employeeRating || d.employeeRating < 1 || d.employeeRating > 5
    );
    if (invalidRating) {
      setMsg("All ratings must be between 1 and 5.");
      return;
    }
 
    setSaving(true);
    setMsg(null);
 
    try {
      const payload = {
        assessmentId: model.assessmentId,
        details: model.assessmentdetails.map(d => ({
          detailId: d.detailId,
          employeeRating: d.employeeRating,
          employeeComments: d.employeeComments ?? ""
        }))
      };
 
      const { data } = await api.post("/SelfAssessment/submit", payload);
      setMsg(data?.message || "Submitted successfully.");
      setTimeout(() => navigate("/me/assessments"), 700);
    } catch {
      setMsg("Submit failed. Please check required fields.");
    } finally {
      setSaving(false);
    }
  };
 
  if (loading) return <div>Loading...</div>;
  if (!model) return <div>Assessment not found.</div>;
 
  return (
    <div style={{ padding: "20px" }}>
      <h3 style={{ color: "#27235C", marginBottom: "10px" }}>
        Self Assessment #{model.assessmentId}
      </h3>
      <div style={{ marginBottom: "8px" }}>Status: {model.status}</div>
      <div style={{ marginBottom: "16px", fontSize: "14px" }}>
        Form: <b>{model.form?.name || model.formId}</b> • User: <b>{model.userId}</b> • Submitted:{" "}
        <b>{model.submittedAt ? new Date(model.submittedAt).toLocaleString() : "-"}</b>
      </div>
 
      {msg && <div style={{ marginBottom: "16px", color: "red" }}>{msg}</div>}
 
      {/* ✅ Table Layout */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f4f4f4" }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Rating</th>
            <th style={thStyle}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {model?.map(d => (
            <tr key={d.detailId}>
              <td style={tdStyle}>{d.competency?.name ?? `Competency #${d.competencyId}`}</td>
              <td style={tdStyle}>{d.competency?.description ?? "-"}</td>
              <td style={tdStyle}>
                <select
                  value={d.employeeRating ?? ""}
                  onChange={e => setAnswer(d.detailId, "employeeRating", e.target.value)}
                  required
                  style={{
                    width: "140px",
                    padding: "6px",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                  }}
                >
                  <option value="">Select Rating</option>
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </td>
              <td style={tdStyle}>
                <textarea
                  value={d.employeeComments ?? ""}
                  onChange={e => setAnswer(d.detailId, "employeeComments", e.target.value)}
                  placeholder="Optional comments"
                  style={{
                    width: "100%",
                    minHeight: "40px",
                    padding: "6px",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
 
      <button
        onClick={onSubmit}
        disabled={saving}
        style={{
          padding: "10px 20px",
          backgroundColor: "#27235C",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: saving ? "not-allowed" : "pointer",
          fontWeight: "600"
        }}
      >
        {saving ? "Submitting..." : "Submit Assessment"}
      </button>
    </div>
  );
}
 
// ✅ Styles for table headers and cells
const thStyle = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "2px solid #ddd",
  fontWeight: "600",
  color: "#27235C"
};
 
const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  verticalAlign: "top"
};
 

 
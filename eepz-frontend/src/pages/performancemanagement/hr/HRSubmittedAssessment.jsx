import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../../../services/performancemanagement/hr/api"; // Axios instance

function HRSubmittedAssessments() {
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/all-details"); // your backend route

        if (res.data.success) {
          setSubmissions(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Submitted Assessments</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Project</th>
            <th>Submitted At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => (
            <tr
              key={`${sub.EmployeeId}-${sub.ProjectName}`}
              style={{ borderBottom: "1px solid #ccc" }}
            >
              <td>{sub.EmployeeName}</td>
              <td>{sub.ProjectName}</td>
              <td>
                {sub.SelfAssessmentSubmittedAt
                  ? new Date(sub.SelfAssessmentSubmittedAt).toLocaleDateString()
                  : "Pending"}
              </td>
              <td>
                <button
                  onClick={() =>
                    navigate(
                      `/view/submissions/${sub.EmployeeId}/${sub.ProjectName}`
                    )
                  }
                  style={{ padding: "5px 10px", cursor: "pointer" }}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HRSubmittedAssessments;

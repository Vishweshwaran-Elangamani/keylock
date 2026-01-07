import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/api/api";
import Breadcrumb from "../../../components/common/Breadcrumb";
import styles from "../../../styles/performancemanagement/hr/HRSubmittedAssessments.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function HRSubmittedAssessments() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/all-details");
        if (res.data.success) {
          setSubmissions(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.hrSubmittedLoadingWrapper}>
        <div className={styles.hrSubmittedLoadingContent}>
          <div
            className={`spinner-border ${styles.hrSubmittedSpinner}`}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className={styles.hrSubmittedLoadingText}>
            Loading submitted assessments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hrSubmittedContainer}>
      <Breadcrumb
        items={[
          { label: "Performance", path: "/hr/dashboard/performance" },
          { label: "Submitted Assessments", path: null },
        ]}
      />

      <div className={styles.hrSubmittedHeader}>
        <h2 className={styles.hrSubmittedTitle}>
          Submitted Assessments
          <span className={styles.hrSubmittedStatsBadge}>
            <i
              className={`bi bi-file-earmark-check ${styles.hrSubmittedStatsIcon}`}
            ></i>
            {submissions.length}
          </span>
        </h2>
        <p className={styles.hrSubmittedSubtitle}>
          View and manage all employee assessment submissions
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className={styles.hrSubmittedEmptyState}>
          <i className={`bi bi-inbox ${styles.hrSubmittedEmptyIcon}`}></i>
          <h3 className={styles.hrSubmittedEmptyTitle}>No Submissions Yet</h3>
          <p className={styles.hrSubmittedEmptyText}>
            Employee assessment submissions will appear here once they are
            completed.
          </p>
        </div>
      ) : (
        <div className={styles.hrSubmittedTableWrapper}>
          <table className={styles.hrSubmittedTable}>
            <thead className={styles.hrSubmittedTableHead}>
              <tr>
                <th className={styles.hrSubmittedTableTh}>Employee</th>
                <th className={styles.hrSubmittedTableTh}>Project</th>
                <th className={styles.hrSubmittedTableTh}>Submitted At</th>
                <th className={styles.hrSubmittedTableTh}>Action</th>
              </tr>
            </thead>
            <tbody className={styles.hrSubmittedTableBody}>
              {submissions.map((sub) => (
                <tr
                  key={`${sub.EmployeeId}-${sub.ProjectName}`}
                  className={styles.hrSubmittedTableRow}
                >
                  <td className={styles.hrSubmittedTableTd}>
                    <span className={styles.hrSubmittedEmployeeName}>
                      {sub.EmployeeName}
                    </span>
                  </td>
                  <td className={styles.hrSubmittedTableTd}>
                    <span className={styles.hrSubmittedProjectName}>
                      {sub.ProjectName}
                    </span>
                  </td>
                  <td className={styles.hrSubmittedTableTd}>
                    {sub.SelfAssessmentSubmittedAt ? (
                      <span className={styles.hrSubmittedDate}>
                        {new Date(
                          sub.SelfAssessmentSubmittedAt
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className={styles.hrSubmittedDatePending}>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className={styles.hrSubmittedTableTd}>
                    <button
                      onClick={() =>
                        navigate(
                          `/view/submissions/${sub.EmployeeId}/${sub.ProjectName}`
                        )
                      }
                      className={styles.hrSubmittedActionBtn}
                    >
                      <i className="bi bi-eye"></i>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HRSubmittedAssessments;

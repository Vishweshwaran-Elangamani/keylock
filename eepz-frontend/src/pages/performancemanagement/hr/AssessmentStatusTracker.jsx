import React, { useEffect, useState } from "react";
import api from "../../../services/performancemanagement/hr/api";
import toast, { Toaster } from "react-hot-toast";
import Breadcrumb from "../../../components/common/Breadcrumb";
import styles from "../../../styles/performancemanagement/hr/AssessmentStatusTracker";

const Badge = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case "Completed":
        return styles.assessmentBadgeCompleted;
      case "Pending":
        return styles.assessmentBadgePending;
      case "Not Started":
        return styles.assessmentBadgeNotStarted;
      case "N/A":
        return styles.assessmentBadgeNA;
      default:
        return styles.assessmentBadgeDefault;
    }
  };

  return (
    <span className={`${styles.assessmentBadge} ${getBadgeClass()}`}>
      {status}
    </span>
  );
};

const processAppraisalData = (data) =>
  data.map((appraisal) => {
    const employeeSubmitted = !!appraisal.selfAssessmentSubmittedAt;
    const firstCompetency = appraisal.competencies[0];

    const employeeStatus = employeeSubmitted ? "Completed" : "Pending";

    const l1Completed =
      firstCompetency &&
      firstCompetency.l1Rating !== null &&
      firstCompetency.l1Comments?.trim();

    const l2Completed =
      firstCompetency &&
      firstCompetency.l2Rating !== null &&
      firstCompetency.l2Comments?.trim();

    return {
      ...appraisal,
      employeeStatus,
      l1Status: employeeSubmitted
        ? l1Completed
          ? "Completed"
          : "Pending"
        : "Not Started",
      l2Status: l1Completed
        ? l2Completed
          ? "Completed"
          : "Pending"
        : "Not Started",
    };
  });

function AssessmentStatusTracker() {
  const [appraisalData, setAppraisalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppraisalDetails = async () => {
      try {
        const { data } = await api.get("/AppraisalProcess/all-details");
        if (data.success && Array.isArray(data.data)) {
          setAppraisalData(processAppraisalData(data.data));
          toast.success("Appraisal statuses loaded successfully!");
        } else {
          toast.error("Invalid data format received.");
        }
      } catch (error) {
        console.error("Error fetching appraisal details:", error);
        toast.error("Failed to load appraisal details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppraisalDetails();
  }, []);

  if (loading) {
    return (
      <div className={styles.assessmentLoadingContainer}>
        <p>Loading assessment data...</p>
      </div>
    );
  }

  return (
    <div className={styles.assessmentContainer}>
      <Toaster position="top-right" />

      <Breadcrumb
        items={[
          { label: "Performance", path: "/hr/dashboard/performance" },
          { label: "Appraisal Status", path: null },
        ]}
      />

      <div className={styles.assessmentHeader}>
        <h2 className={styles.assessmentTitle}> Detailed Appraisal Status Tracker</h2>
        <button
          className={styles.assessmentActionButton}
          onClick={() => window.location.reload()}
        >
          Refresh Data
        </button>
      </div>

      <div className={styles.assessmentCard}>
        <div className={styles.assessmentCardHeader}>
          <h5 className={styles.assessmentCardTitle}>
            All Appraisals ({appraisalData.length})
          </h5>
        </div>

        <div className={styles.assessmentTableContainer}>
          {appraisalData.length > 0 ? (
            <table className={styles.assessmentTable}>
              <thead className={styles.assessmentTableHead}>
                <tr>
                  <th className={styles.assessmentTh}>Employee ID</th>
                  <th className={styles.assessmentTh}>Employee Name</th>
                  <th className={styles.assessmentTh}>Project</th>
                  <th className={styles.assessmentTh}>Employee Status</th>
                  <th className={styles.assessmentTh}>L1 Status</th>
                  <th className={styles.assessmentTh}>L2 Status</th>
                  <th className={styles.assessmentTh}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {appraisalData.map((a) => (
                  <tr key={a.employeeId} className={styles.assessmentTableRow}>
                    <td className={styles.assessmentTd}>{a.employeeId}</td>
                    <td className={styles.assessmentTd}>
                      <strong>{a.employeeName}</strong>
                    </td>
                    <td className={styles.assessmentTd}>{a.projectName}</td>
                    <td className={styles.assessmentTd}>
                      <Badge status={a.employeeStatus} />
                    </td>
                    <td className={styles.assessmentTd}>
                      <Badge status={a.l1Status} />
                    </td>
                    <td className={styles.assessmentTd}>
                      <Badge status={a.l2Status} />
                    </td>
                    <td className={styles.assessmentTd}>
                      <Badge
                        status={
                          a.l2Status === "Completed" ? "Completed" : "Pending"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.assessmentEmptyState}>No appraisal data found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssessmentStatusTracker;

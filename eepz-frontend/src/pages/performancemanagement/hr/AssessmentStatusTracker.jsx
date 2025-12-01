import React, { useEffect, useState } from "react";
import api from "../../../services/performancemanagement/hr/api";
import toast, { Toaster } from 'react-hot-toast';


const styles = {
    container: {
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f7f9",
        minHeight: "100vh",
    },
    header: {
        marginBottom: "20px",
        borderBottom: "2px solid #e0e0e0",
        paddingBottom: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        color: "#27235C",
        fontSize: "24px",
        fontWeight: 700,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        marginBottom: "30px",
    },
    cardHeader: {
        padding: "15px 25px",
        borderBottom: "1px solid #e0e0e0",
    },
    cardTitle: {
        margin: 0,
        color: "#27235C",
        fontWeight: 600,
    },
    tableContainer: {
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    tableHead: {
        backgroundColor: "#F7F9FA",
    },
    th: {
        padding: "12px 20px",
        textAlign: "left",
        color: "#5C5C5C",
        fontSize: "14px",
        fontWeight: 600,
        textTransform: "uppercase",
        borderBottom: "2px solid #e0e0e0",
    },
    td: {
        padding: "15px 20px",
        borderBottom: "1px solid #f0f0f0",
        fontSize: "14px",
        verticalAlign: "top",
    },
    tableRow: {
        cursor: "default",
        transition: "background-color 0.2s",
    },
    badge: (bgColor, textColor = '#FFFFFF') => ({
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: "15px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: bgColor,
        color: textColor,
        textAlign: "center",
        minWidth: '80px',
    }),
    loadingContainer: {
        textAlign: "center",
        padding: "50px",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px",
        color: "#6c757d",
    },
    actionButton: {
        padding: "8px 15px",
        fontSize: "14px",
        borderRadius: "6px",
        cursor: "pointer",
        border: "none",
        backgroundColor: "#97247E",
        color: "#FFFFFF",
        fontWeight: 600,
        transition: "background-color 0.2s",
    }
};


const Badge = ({ status }) => {
    let color, text;

    switch (status) {
        case "Completed":
            color = "#24A148";
            text = "Completed";
            break;
        case "Pending":
            color = "#ffc107";
            text = "Pending";
            break;
        case "Not Started":
            color = "#6c757d";
            text = "Not Started";
            break;
        case "N/A":
            color = "#e9ecef";
            text = "N/A";
            break;
        default:
            color = "#97247E";
            text = status;
    }

    return <span style={styles.badge(color, status === 'N/A' ? '#495057' : '#FFFFFF')}>{text}</span>;
};


const processAppraisalData = (data) => {
    return data.map(appraisal => {
        const employeeSubmitted = !!appraisal.selfAssessmentSubmittedAt;

        const firstCompetency = appraisal.competencies[0];

        let l1Status = "N/A";
        let l2Status = "N/A";
        let employeeStatus = "Not Started";

        if (employeeSubmitted) {
            employeeStatus = "Completed";
        } else {
            employeeStatus = "Pending";
        }


        const l1Completed = firstCompetency &&
            firstCompetency.l1Rating !== null &&
            firstCompetency.l1Comments?.trim();

        if (employeeSubmitted && l1Completed) {
            l1Status = "Completed";
        } else if (employeeSubmitted && !l1Completed) {
            l1Status = "Pending";
        } else {
            l1Status = "Not Started";
        }


        const l2Completed = firstCompetency &&
            firstCompetency.l2Rating !== null &&
            firstCompetency.l2Comments?.trim();

        if (l1Completed && l2Completed) {
            l2Status = "Completed";
        } else if (l1Completed && !l2Completed) {
            l2Status = "Pending";
        } else {
            l2Status = "Not Started";
        }

        return {
            ...appraisal,

            employeeStatus,
            l1Status,
            l2Status,
        };
    });
};


function AssessmentStatusTracker() {
    const [appraisalData, setAppraisalData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppraisalDetails = async () => {
            setLoading(true);
            try {

                const { data } = await api.get("/AppraisalProcess/all-details");

                if (data.success && Array.isArray(data.data)) {

                    const processedData = processAppraisalData(data.data);
                    setAppraisalData(processedData);
                    toast.success("Appraisal statuses loaded successfully!");
                } else {
                    toast.error("Invalid data format received.");
                }
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("Failed to load appraisal details.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppraisalDetails();
    }, []);

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div className="spinner-border" style={styles.spinner}></div>
                <p>Loading assessment data...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Toaster position="top-right" reverseOrder={false} />

            <div style={styles.header}>
                <h2 style={styles.title}>🎯 Detailed Appraisal Status Tracker</h2>
                <button style={styles.actionButton} onClick={() => window.location.reload()}>
                    Refresh Data
                </button>
            </div>

            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h5 style={styles.cardTitle}>All Appraisals ({appraisalData.length})</h5>
                </div>
                <div style={styles.tableContainer}>
                    {appraisalData.length > 0 ? (
                        <table style={styles.table}>
                            <thead style={styles.tableHead}>
                                <tr>
                                    <th style={{ ...styles.th, width: "10%" }}>Employee ID</th>
                                    <th style={{ ...styles.th, width: "15%" }}>Employee Name</th>
                                    <th style={{ ...styles.th, width: "15%" }}>Project</th>

                                    <th style={{ ...styles.th, width: "15%" }}>Employee Status</th>
                                    <th style={{ ...styles.th, width: "15%" }}>L1 Status (Manager)</th>
                                    <th style={{ ...styles.th, width: "15%" }}>L2 Status (Leader)</th>
                                    <th style={{ ...styles.th, width: "15%" }}>Overall Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appraisalData.map((appraisal) => (
                                    <tr key={appraisal.employeeId} style={styles.tableRow}>
                                        <td style={styles.td}>{appraisal.employeeId}</td>
                                        <td style={styles.td}>
                                            <strong>{appraisal.employeeName}</strong>
                                        </td>
                                        <td style={styles.td}>{appraisal.projectName}</td>


                                        <td style={styles.td}>
                                            <Badge status={appraisal.employeeStatus} />
                                        </td>
                                        <td style={styles.td}>
                                            <Badge status={appraisal.l1Status} />
                                        </td>
                                        <td style={styles.td}>
                                            <Badge status={appraisal.l2Status} />
                                        </td>

                                        <td style={styles.td}>
                                            <Badge status={appraisal.l2Status === "Completed" ? "Completed" : "Pending"} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={styles.emptyState}>No appraisal data found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssessmentStatusTracker;
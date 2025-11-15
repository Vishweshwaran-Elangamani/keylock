import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { toast, ToastContainer } from "react-toastify";
import api from "../../../services/performancemanagement/hr/api";

import "react-toastify/dist/ReactToastify.css";

const THEME = {

  primary: "#2563eb",

  secondary: "#3b82f6",

  success: "#10b981",

  warning: "#f59e0b",

  background: "#f8f9fa",

  card: "#ffffff",

  text: "#2c3e50",

  textLight: "#6c757d",

  border: "#e0e0e0"

};

export default function EmployeeHome() {

  const navigate = useNavigate();

  const [nominations, setNominations] = useState([]);

  const [loadingNominations, setLoadingNominations] = useState(true);

  //   const employeeId = localStorage.getItem("employeeId");

  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user ? user.empId : null;
  const [employeeId] = useState(() => empId);

  useEffect(() => {

    if (!employeeId) {

      navigate("/employee/login");

      return;

    }

    fetchNominations();

  }, [employeeId, navigate]);

  const fetchNominations = async () => {

    try {

      const response = await fetch(

        `http://localhost:5253/api/EmployeeNomination/search?employeeId=${employeeId}`

      );

      if (response.ok) {

        const data = await response.json();

        if (data.success && data.count > 0) {

          setNominations(data.data);

        }

      }

    } catch (error) {

      console.error("Error fetching nominations:", error);

    } finally {

      setLoadingNominations(false);

    }

  };

  const handleLogout = () => {

    localStorage.removeItem("employeeId");

    toast.success("Logged out successfully", {

      position: "top-right",

      autoClose: 2000

    });

    navigate("/employee/login");

  };

  return (
    <div style={{

      minHeight: "100vh",

      background: THEME.background,

      padding: "40px 20px"

    }}>
      <ToastContainer />

      {/* Header */}
      <div style={{

        maxWidth: "1200px",

        margin: "0 auto 40px",

        background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,

        borderRadius: "16px",

        padding: "32px",

        color: "#fff",

        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"

      }}>
        <div style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          flexWrap: "wrap",

          gap: "16px"

        }}>
          {/* <button
 
            onClick={handleLogout}
 
            style={{
 
              padding: "12px 24px",
 
              background: "rgba(255,255,255,0.2)",
 
              border: "2px solid rgba(255,255,255,0.3)",
 
              borderRadius: "10px",
 
              color: "#fff",
 
              fontSize: "15px",
 
              fontWeight: "600",
 
              cursor: "pointer",
 
              transition: "all 0.3s"
 
            }}
 
            onMouseOver={(e) => {
 
              e.target.style.background = "rgba(255,255,255,0.3)";
 
            }}
 
            onMouseOut={(e) => {
 
              e.target.style.background = "rgba(255,255,255,0.2)";
 
            }}
>
 
            Logout
</button> */}
        </div>
      </div>

      <div style={{

        maxWidth: "1200px",

        margin: "0 auto"

      }}>

        {/* Nomination Notification Card (Only if nominated) */}

        {!loadingNominations && nominations.length > 0 && (
          <div style={{

            background: `linear-gradient(135deg, #10b981, #059669)`,

            borderRadius: "16px",

            padding: "24px",

            marginBottom: "24px",

            color: "#fff",

            boxShadow: "0 8px 20px rgba(16, 185, 129, 0.3)",

            display: "flex",

            alignItems: "center",

            gap: "20px"

          }}>
            <div style={{

              fontSize: "48px",

              background: "rgba(255,255,255,0.2)",

              borderRadius: "50%",

              width: "80px",

              height: "80px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center"

            }}>

              🎉
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{

                fontSize: "24px",

                fontWeight: "700",

                marginBottom: "8px"

              }}>

                Congratulations!
              </h3>
              <p style={{

                fontSize: "16px",

                opacity: 0.95,

                marginBottom: "8px"

              }}>

                You have been nominated for: <strong>{nominations.map(n => n.roleType).join(", ")}</strong>
              </p>
              <p style={{

                fontSize: "14px",

                opacity: 0.85,

                margin: 0

              }}>

                Your hard work and dedication have been recognized!
              </p>
            </div>
          </div>

        )}

        {/* Assessment Card */}
        <div style={{

          background: THEME.card,

          borderRadius: "16px",

          padding: "32px",

          cursor: "pointer",

          //   transition: "all 0.3s",

          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",

          border: `2px solid ${THEME.border}`,

          position: "relative",

          overflow: "hidden"

        }}

          onClick={() => navigate("/employee/dashboard/performance/my-assessments")}

          onMouseOver={(e) => {

            e.currentTarget.style.transform = "translateY(-8px)";

            e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";

            e.currentTarget.style.borderColor = THEME.primary;

          }}

          onMouseOut={(e) => {

            e.currentTarget.style.transform = "translateY(0)";

            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";

            e.currentTarget.style.borderColor = THEME.border;

          }}
        >



          {/* Title */}
          <h3 style={{

            fontSize: "22px",

            fontWeight: "700",

            color: THEME.text,

            marginBottom: "8px"

          }}>

            Assessments
          </h3>

          {/* Description */}
          <p style={{

            fontSize: "15px",

            color: THEME.textLight,

            marginBottom: "16px",

            lineHeight: "1.6"

          }}>

            Complete your performance assessments and track your progress
          </p>

          {/* Action Text */}
          <div style={{

            display: "inline-block",

            padding: "8px 16px",

            background: `${THEME.primary}10`,

            borderRadius: "8px",

            color: THEME.primary,

            fontSize: "14px",

            fontWeight: "600"

          }}>

            View Details →
          </div>

          {/* Arrow */}
          <div style={{

            position: "absolute",

            bottom: "20px",

            right: "20px",

            fontSize: "28px",

            color: THEME.primary,

            opacity: 0.3

          }}>

            →
          </div>
        </div>
      </div>
    </div>

  );

}



import { useState, useEffect } from "react";
import { X, Users, AlertCircle, Calendar } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";

const RequestSmeModal = ({ employeeId, skillId, onClose, onSuccess }) => {
  const [availableSmes, setAvailableSmes] = useState([]);
  const [selectedSmeId, setSelectedSmeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSmes, setFetchingSmes] = useState(true);

  useEffect(() => {
    fetchAvailableSmes();
  }, []);

  const fetchAvailableSmes = async () => {
    try {
      setFetchingSmes(true);
      const response = await lndService.getAvailableSmes(skillId, 1);

      if (response.data.success) {
        setAvailableSmes(response.data.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch SMEs:", error);
      toast.error("Failed to load available SMEs");
    } finally {
      setFetchingSmes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSmeId) {
      toast.error("Please select an SME");
      return;
    }

    try {
      setLoading(true);

      const data = {
        skillId: skillId,
        mentorEmployeeId: selectedSmeId,
        menteeEmployeeId: employeeId,
        deadline: deadline || null,
      };

      const response = await lndService.requestSmeAssignment(data);

      if (response.data.success) {
        onSuccess();
      } else {
        toast.error(
          response.data.message || "Failed to request SME assignment"
        );
      }
    } catch (error) {
      console.error("Failed to request SME:", error);
      toast.error(
        error.response?.data?.message || "Failed to request SME assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitEnabled =
    !loading && availableSmes.length > 0 && selectedSmeId && deadline;

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (fetchingSmes) {
    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ background: "#fff", padding: "2rem", borderRadius: "12px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: "1rem", marginBottom: 0 }}>
            Loading available SMEs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          animation: "fadeIn 0.2s ease-in-out",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "650px",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "rgb(39, 35, 92)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h5 style={{ margin: 0, fontWeight: "600", color: "white" }}>
              Request SME Assignment
            </h5>
            <button
              type="button"
              class="btn-close-white"
              onClick={onClose}
              style={{
                border: "none",
                width: "36px",
                backgroundColor: "transparent",
                height: "36px",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: "white",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "red";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "white";
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "1.5rem" }}>
              {availableSmes.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    background: "#fff3cd",
                    borderRadius: "8px",
                    border: "1px solid #ffc107",
                  }}
                >
                  <Users
                    size={48}
                    color="#856404"
                    style={{ marginBottom: "1rem" }}
                  />
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#856404",
                      margin: 0,
                      marginBottom: "0.5rem",
                    }}
                  >
                    No Available SMEs
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#856404",
                      margin: 0,
                    }}
                  >
                    All SMEs for this skill are currently at maximum capacity (3
                    assignments). Please try again later.
                  </p>
                </div>
              ) : (
                <>
                  {/* Available SMEs List */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#212529",
                        marginBottom: "0.75rem",
                        display: "block",
                        textAlign: "left",
                      }}
                    >
                      Available SMEs ({availableSmes.length})
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {availableSmes.map((sme) => (
                        <div
                          key={sme.employeeId}
                          style={{
                            padding: "1rem",
                            border:
                              selectedSmeId === sme.employeeId
                                ? "2px solid #97247E"
                                : "1px solid rgba(39, 35, 92, 0.5)",
                            borderRadius: "8px",
                            background:
                              selectedSmeId === sme.employeeId
                                ? "#f9f5ff"
                                : "#fff",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onClick={() => setSelectedSmeId(sme.employeeId)}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: "0.9375rem",
                                  fontWeight: "600",
                                  color: "#212529",
                                  margin: 0,
                                  marginBottom: "0.25rem",
                                  textAlign: "left",
                                }}
                              >
                                {sme.employeeName}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.8125rem",
                                  color: "#6c757d",
                                  margin: 0,
                                }}
                              >
                                Current Assignments: {sme.inProgressAssignments}
                                /3
                              </p>
                            </div>
                            <input
                              type="radio"
                              name="smeSelection"
                              checked={selectedSmeId === sme.employeeId}
                              onChange={() => setSelectedSmeId(sme.employeeId)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#212529",
                        marginBottom: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Calendar size={16} />
                      Deadline <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={deadline || ""}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={getMinDate()}
                      required
                      style={{
                        width: "100%",
                        padding: "0.625rem",
                        border: "1px solid rgba(39, 35, 92, 0.5)",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#97247E";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(151, 36, 126, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "0.625rem 1.25rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitEnabled}
                style={{
                  padding: "0.625rem 1.25rem",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    !loading && availableSmes.length > 0 && selectedSmeId
                      ? "linear-gradient(90deg, #97247E 0%, #E01950 100%)"
                      : "#e5e7eb",
                  color:
                    !loading && availableSmes.length > 0 && selectedSmeId
                      ? "#fff"
                      : "#6c757d",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor:
                    !loading && availableSmes.length > 0 && selectedSmeId
                      ? "pointer"
                      : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    Requesting...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RequestSmeModal;

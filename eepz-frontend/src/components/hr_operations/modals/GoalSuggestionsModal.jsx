import { Modal, Spinner, CloseButton } from "react-bootstrap";

const GoalSuggestionsModal = ({ 
  show, 
  onHide, 
  goalSuggestions, 
  loadingSuggestions 
}) => {
  if (!show) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onHide}
      />

      {/* Modal Container with Scroll */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "800px",
          maxHeight: "75vh",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER - Fixed */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                color: "#fff",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                <i className="bi bi-lightbulb-fill" style={{ marginRight: 8 }}></i>
                Goal Suggestions for
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#e0e7ff",
                  fontStyle: "italic",
                }}
              >
                {goalSuggestions?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={onHide}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div
            style={{
              padding: "20px",
              background: "#fff",
              textAlign: "left",
              overflowY: "auto",
              flex: 1,
              minHeight: 200,
            }}
          >
            {loadingSuggestions ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    border: "4px solid #e0e7ff",
                    borderTop: "4px solid #27235C",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                  }}
                />
                <p
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  Loading suggestions...
                </p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                  }
                `}</style>
              </div>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {goalSuggestions &&
                  goalSuggestions.suggestions.map((g, idx) => (
                    <li
                      key={idx}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 16,
                        background: "#f8fafc",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(39, 35, 92, 0.15)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#1e293b",
                            flex: 1,
                          }}
                        >
                          {g.goalTitle}
                        </span>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            background: "#e0e7ff",
                            color: "#3730a3",
                          }}
                        >
                          {g.goalType}
                        </span>
                      </div>

                      {/* Description */}
                      <div
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          lineHeight: 1.6,
                          marginBottom: 12,
                        }}
                      >
                        {g.goalDescription}
                      </div>

                      {/* Meta Information */}
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          fontSize: 12,
                          color: "#475569",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          Priority:
                          <strong
                            style={{
                              color:
                                g.priority === "High"
                                  ? "#dc2626"
                                  : g.priority === "Medium"
                                  ? "#ea580c"
                                  : "#16a34a",
                              fontWeight: 600,
                            }}
                          >
                            {g.priority}
                          </strong>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          Duration:
                          <strong style={{ color: "#1e293b", fontWeight: 600 }}>
                            {g.estimatedDuration}
                          </strong>
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* FOOTER - Fixed */}
          <div
            style={{
              padding: "10px 15px",
              borderTop: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              justifyContent: "flex-end",
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onHide}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#6c757d";
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalSuggestionsModal;

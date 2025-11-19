import React from "react";

function statusRender(status) {
  if (typeof status !== "string") return "-";
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <span style={{ color: "#ffb11b", fontWeight: 600 }}>
        <i className="bi bi-hourglass-split" style={{ marginRight: 6 }}></i>
        Pending
      </span>
    );
  } else if (s === "completed") {
    return (
      <span style={{ color: "#059669", fontWeight: 600 }}>
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
        Completed
      </span>
    );
  }
  return <span>{status}</span>;
}

const fieldOrder = [
  ["Competency", "competencyName"],
  ["Employee Rating", "employeeRating"],
  ["Employee Comments", "employeeComments"],
  ["L1 Reviewer", "l1ReviewerName"],
  ["L1 Rating", "l1Rating"],
  ["L1 Comments", "l1Comments"],
  ["L2 Reviewer", "l2ReviewerName"],
  ["L2 Rating", "l2Rating"],
  ["L2 Comments", "l2Comments"],
  ["Status", "status"],
];

const AppraisalDetailsModal = ({
  show,
  onClose,
  employeeName,
  projectName,
  competencies = [],
}) => {
  if (!show) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(39, 35, 92, 0.42)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />
      {/* Modal container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "920px",
          maxWidth: "98vw",
          minHeight: "490px",
          maxHeight: "92vh",
          borderRadius: 12,
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.18)",
          background: "#fff",
          overflow: "hidden",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#27235C",
            padding: "18px 36px 18px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            minHeight: 64,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 20, fontWeight: 700, color: "#fff", textAlign: "left"
            }}>
             
              Appraisal Details
            </div>
            <div style={{
              color: "#E3DDFE",
              fontWeight: 500,
              fontSize: 15,
              textAlign: "left"
            }}>
              <span style={{marginRight:6}}>{employeeName}</span>
              <span style={{
                margin: "0 10px", color: "#bfb9e2", fontWeight: 300, fontSize: 18
              }}>|</span>
             {projectName}
            </div>
          </div>

        </div>
        {/* Cards Section */}
        <div
          style={{
            flex: 1,
            padding: "32px 36px 18px 36px",
            overflowY: "auto",
            background: "#fff",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {competencies.length === 0 &&
            <div style={{
              color: "#aaa",
              fontStyle: "italic",
              marginTop: "32px",
              textAlign: "center"
            }}>No competencies found</div>
          }
          {competencies.map((c, idx) => (
            <div
              key={idx}
              style={{
                background: "#f6f7fa",
                borderRadius: 10,
                margin: "0 0 26px 0",
                padding: "20px 32px 18px 32px",
                border: "1.5px solid #e5e7eb",
                boxShadow: "0 1.5px 10px rgba(151,36,126,0.04)",
                maxWidth: "100%",
                textAlign:"left"
              }}
            >
              {/* Title */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#97247E",
                  marginBottom: 12,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: ".03em",
                  textAlign: "left"
                }}>
                #{idx + 1} &nbsp; {c.competencyName}
              </div>
              {/* Details Grid */}
              <div style={{width: "100%", maxWidth: 820}}>
                {fieldOrder.map(([label, key]) =>
                  key === "competencyName" ? null : (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: 7,
                        minHeight: "26px",
                      }}
                    >
                      <span style={{
                        minWidth: "165px",
                        fontWeight: 600,
                        color: "#27235C",
                        fontSize: "14px",
                        textAlign: "left",
                        lineHeight: 1.8,
                      }}>{label}</span>
                      <span style={{
                        color: "#332c48",
                        fontSize: "14px",
                        paddingLeft: 0,
                        fontWeight: key === "status" ? 700 : 500,
                        whiteSpace: key==="employeeComments"||key==="l1Comments"||key==="l2Comments" ? "pre-wrap" : 'inherit',
                        wordBreak: "break-word",
                        marginLeft: 10,
                        flex: 1,
                        textAlign: "left",
                        lineHeight: 1.8,
                      }}>
                        {key === "status"
                          ? statusRender(c.status)
                          : (c[key] !== undefined && c[key] !== null && c[key] !== "")
                            ? c[key]
                            : "-"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <style>{`
            div[style*="overflow-y: auto"]::-webkit-scrollbar {display:none;}
          `}</style>
        </div>
        <div
          style={{
            background: "#F5F5F7",
            borderTop: "1px solid #E5E7EB",
            padding: "16px 36px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "11px"
          }}
        >
          <button
            style={{
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 6,
              color: "#fff",
              background: "#6C757D",
              padding: "9px 26px",
              cursor: "pointer",
              transition: ".13s",
              letterSpacing: ".02em"
            }}
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.background = "#5a6268"}
            onMouseLeave={e => e.currentTarget.style.background = "#6C757D"}
          >Close</button>
          {/* Optional: Add primary button as in your modal */}
          {/* <button
            style={{
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 6,
              color: "#fff",
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              padding: "9px 26px",
              cursor: "pointer",
              transition: ".13s",
              letterSpacing: ".02em"
            }}
          >
            <i className="bi bi-pencil-square"></i> Edit Details
          </button> */}
        </div>
      </div>
    </>
  );
};

export default AppraisalDetailsModal;

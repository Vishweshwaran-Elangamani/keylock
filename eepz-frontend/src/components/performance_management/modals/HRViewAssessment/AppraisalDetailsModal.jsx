import React from "react";

const fieldIcons = {
  "Competency": "bi-star-fill",
  "Employee Rating": "bi-graph-up",
  "Employee Comments": "bi-chat-left-text",
  "L1 Reviewer": "bi-person-badge",
  "L1 Rating": "bi-graph-up",
  "L1 Comments": "bi-chat-dots",
  "L2 Reviewer": "bi-person-badge-fill",
  "L2 Rating": "bi-graph-up-arrow",
  "L2 Comments": "bi-chat-left-dots",
  "Status": "bi-info-circle",
};

function statusRender(status) {
  if (typeof status !== "string") return "";
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <span className="hrview-badge hrview-badge-pending" style={{ verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center' }}>
        <i className="bi bi-hourglass-split" style={{ marginRight: 6 }}></i>Pending
      </span>
    );
  } else if (s === "completed") {
    return (
      <span className="hrview-badge hrview-badge-completed" style={{ verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center' }}>
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>Completed
      </span>
    );
  }
  return <span>{status}</span>;
}

const AppraisalDetailsModal = ({
  show,
  onClose,
  employeeName,
  projectName,
  competencies = []
}) => {
  if (!show) return null;
  return (
    <div className="hrview-modal-overlay" onClick={onClose}>
      <div className="hrview-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="hrview-modal-header" style={{ flexDirection: "column", alignItems: "center" }}>
          <h2 className="hrview-modal-title" style={{ textAlign: "center", color: "#a151ab", fontWeight: 800, margin: 0, fontSize: "1.5rem" }}>
            Appraisal Details
          </h2>
          <div style={{marginBottom: 7, marginTop: 4, fontSize: '.94rem', color: "#aa6cc5", display:"flex", alignItems:"center", gap:7, fontWeight:600}}>
            <i className="bi bi-person-circle"></i> {employeeName}
            <span style={{color:"#d6aedb", fontWeight:400, margin: "0 6px"}}>|</span>
            <i className="bi bi-journals"></i> {projectName}
          </div>
          <button className="hrview-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{borderBottom: "2px solid #af70ad", margin: "0 18px 10px 18px"}} />
        <div className="hrview-modal-body" style={{ padding: "14px 26px" }}>
          {competencies.map((c, idx) => (
            <div key={idx} style={{marginBottom: "16px"}}>
              {/* Competency Fields as 2-column */}
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-star-fill" style={{color:"#aa6cc5", fontSize:"1.1em", textAlign: "right"}}/>
                <span className="hrview-label">Competency</span>
                <span className="hrview-value">{c.competencyName}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-graph-up" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">Employee Rating</span>
                <span className="hrview-value">{c.employeeRating ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-chat-left-text" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">Employee Comments</span>
                <span className="hrview-value">{c.employeeComments ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-person-badge" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">L1 Reviewer</span>
                <span className="hrview-value">{c.l1ReviewerName ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-graph-up" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">L1 Rating</span>
                <span className="hrview-value">{c.l1Rating ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-chat-dots" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">L1 Comments</span>
                <span className="hrview-value">{c.l1Comments ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-person-badge-fill" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">L2 Reviewer</span>
                <span className="hrview-value">{c.l2ReviewerName ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-graph-up-arrow" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">L2 Rating</span>
                <span className="hrview-value">{c.l2Rating ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-chat-left-dots" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">L2 Comments</span>
                <span className="hrview-value">{c.l2Comments ?? "-"}</span>
              </div>
              <div className="hrview-fields-row" style={{display:'grid', gridTemplateColumns:"40px 170px 1fr", alignItems:"center", marginBottom:"7px"}}>
                <span className="bi bi-info-circle" style={{color:"#aa6cc5"}}/>
                <span className="hrview-label">Status</span>
                <span className="hrview-value">{statusRender(c.status)}</span>
              </div>
              <div style={{borderBottom: "1.3px solid #d1b3e4",margin:"16px 0 0 0"}}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppraisalDetailsModal;

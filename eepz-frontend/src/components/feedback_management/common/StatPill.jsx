import React from "react";
import "../../../styles/feedback/components/StatPill.css";

export default function StatPill({ label, value, Icon, color = "#525252" }) {
  return (
    <div className="card border-0 sp-pill" style={{ "--sp-color": color }}>
      <div className="card-body sp-pill__body">
        <div className="d-flex justify-content-between mb-2 sp-pill__top">
          <div className="rounded p-2 sp-pill__icon-wrap">
            <Icon size={20} className="sp-pill__icon" />
          </div>
        </div>

        <h3 className="fw-bold sp-pill__value">{value}</h3>
        <p className="mb-0 small sp-pill__label">{label}</p>
      </div>
    </div>
  );
}

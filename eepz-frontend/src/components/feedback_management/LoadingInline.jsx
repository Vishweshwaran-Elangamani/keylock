// src/components/LoadingInline.jsx
import React from "react";

export default function LoadingInline({ text = "Loading…" }) {
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span
        className="spinner-border spinner-border-sm"
        role="status"
        aria-hidden="true"
      ></span>
      <span className="small text-muted">{text}</span>
    </span>
  );
}

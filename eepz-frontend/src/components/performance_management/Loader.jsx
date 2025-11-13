import React from "react";
import PropTypes from "prop-types";

/**
 * Loader — reusable Bootstrap spinner component.
 * Can be used inline or as a full-screen overlay.
 *
 * Props:
 *  - fullScreen: boolean → show overlay if true
 *  - text: optional string → message below spinner
 */
export default function Loader({ fullScreen = false, text = "Loading..." }) {
  if (fullScreen) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center bg-dark bg-opacity-50 text-white"
        style={{ zIndex: 2000 }}
      >
        <div className="spinner-border" role="status" />
        <div className="mt-3 fs-5">{text}</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center p-3">
      <div className="spinner-border text-primary" role="status" />
      {text && <div className="mt-2 text-muted">{text}</div>}
    </div>
  );
}

Loader.propTypes = {
  fullScreen: PropTypes.bool,
  text: PropTypes.string,
};
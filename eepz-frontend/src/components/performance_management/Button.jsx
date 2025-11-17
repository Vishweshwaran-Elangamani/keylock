// import React from "react";
// import PropTypes from "prop-types";

// /**
//  * Button — reusable Bootstrap-styled button.
//  *
//  * Props:
//  *  - variant: primary | secondary | success | danger | outline-primary | etc.
//  *  - size: sm | lg (optional)
//  *  - type: button | submit | reset (default: button)
//  *  - loading: boolean (shows spinner)
//  *  - children: text or node content
//  *  - onClick: handler
//  */
// export default function Button({
//   variant = "primary",
//   size = "",
//   type = "button",
//   loading = false,
//   disabled = false,
//   className = "",
//   children,
//   onClick,
// }) {
//   const classes = `btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`.trim();

//   return (
//     <button
//       type={type}
//       className={classes}
//       disabled={disabled || loading}
//       onClick={onClick}
//     >
//       {loading && (
//         <span
//           className="spinner-border spinner-border-sm me-2"
//           role="status"
//           aria-hidden="true"
//         ></span>
//       )}
//       {children}
//     </button>
//   );
// }

// Button.propTypes = {
//   variant: PropTypes.string,
//   size: PropTypes.string,
//   type: PropTypes.string,
//   loading: PropTypes.bool,
//   disabled: PropTypes.bool,
//   className: PropTypes.string,
//   children: PropTypes.node.isRequired,
//   onClick: PropTypes.func,
// };
import React, { useState, useEffect, useRef } from "react";
import styles from "../../../styles/performancemanagement/hr/HRViewAssessment.module.css";

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = options.find((o) => o.value === value) || {
    label: placeholder || "Select",
    value: "",
  };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={styles.customDropdown}
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className={`${styles.customSelected} ${
          disabled ? styles.customDisabled : ""
        }`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className={styles.customArrow} />
      </div>

      {open && !disabled && (
        <div className={styles.customMenu}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`${styles.customOption} ${
                opt.value === value ? styles.customOptionActive : ""
              }`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PaginationDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={styles.paginationDropdown} tabIndex={0}>
      <div
        className={styles.paginationSelected}
        onClick={() => setOpen((prev) => !prev)}
      >
        {value}
        <span className={styles.paginationArrow} />
      </div>

      {open && (
        <div className={styles.paginationMenu}>
          {options.map((opt) => (
            <div
              key={opt}
              className={`${styles.paginationOption} ${
                opt === value ? styles.paginationOptionActive : ""
              }`}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell =
              cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator)
      )
      .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function statusBadge(status) {
  if (typeof status !== "string") return "";
  const s = status.toLowerCase();
  if (s === "completed")
    return (
      <span
        className={`${styles.hrViewAssessmentBadge} ${styles.hrViewAssessmentBadgeCompleted}`}
      >
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
        Completed
      </span>
    );
  if (s.startsWith("pending"))
    return (
      <span
        className={`${styles.hrViewAssessmentBadge} ${styles.hrViewAssessmentBadgePending}`}
      >
        Pending
      </span>
    );
  return (
    <span
      className={`${styles.hrViewAssessmentBadge} ${styles.hrViewAssessmentBadgeDefault}`}
    >
      Completed
    </span>
  );
}

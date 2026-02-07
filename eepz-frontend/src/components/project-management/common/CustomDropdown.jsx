import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import "../../../styles/projectmanagement/components/CustomDropdown.css";
 
const normalizeOptions = (options) => {
  if (!Array.isArray(options)) return [];
 
  return options
    .map((opt) => {
      if (opt === null || opt === undefined) return null;
 
      if (typeof opt === "string" || typeof opt === "number") {
        return { value: opt, label: String(opt) };
      }
 
      const value =
        opt.value ??
        opt.id ??
        opt.departmentId ??
        opt.businessUnitId ??
        opt.departmentName ??
        opt.businessUnitName ??
        opt.name ??
        opt.label;
 
      const label =
        opt.label ??
        opt.name ??
        opt.departmentName ??
        opt.businessUnitName ??
        (value !== undefined ? String(value) : "");
 
      if (value === undefined || label === "") return null;
 
      return { value, label };
    })
    .filter(Boolean);
};
 
const CustomDropdown = ({
  label,
  required = false,
  name,
  value,
  options = [],
  placeholder = "Select",
  disabled = false,
  error = "",
  onChange,
  anchorRef,
  className = "",
  align = "left",
  offset = { x: 0, y: 4 },
}) => {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
 
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
 
  const normalizedOptions = useMemo(
    () => normalizeOptions(options),
    [options]
  );
 
  const selected = useMemo(() => {
    return normalizedOptions.find(
      (o) => String(o.value) === String(value)
    );
  }, [normalizedOptions, value]);
 
  const updatePosition = () => {
    const target = anchorRef?.current || triggerRef.current;
    if (!target) return;
 
    const rect = target.getBoundingClientRect();
 
    let left = rect.left + window.scrollX;
    if (align === "right") {
      left = rect.right + window.scrollX - rect.width;
    }
 
    setPos({
      top: rect.bottom + window.scrollY + (offset?.y ?? 4),
      left: left + (offset?.x ?? 0),
      width: rect.width,
    });
  };
 
  useEffect(() => {
    if (!open) return;
    updatePosition();
 
    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
 
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, align, offset, anchorRef]);
 
  useLayoutEffect(() => {
    if (!open || !dropdownRef.current) return;
 
    dropdownRef.current.style.top = `${pos.top}px`;
    dropdownRef.current.style.left = `${pos.left}px`;
    dropdownRef.current.style.width = `${pos.width}px`;
  }, [open, pos]);
 
  useEffect(() => {
    const onClickOutside = (e) => {
      const trig = triggerRef.current;
      const drop = dropdownRef.current;
      const anchor = anchorRef?.current;
 
      const clickedTrigger =
        (trig && trig.contains(e.target)) ||
        (anchor && anchor.contains(e.target));
 
      const clickedDropdown = drop && drop.contains(e.target);
 
      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
      }
    };
 
    document.addEventListener("mousedown", onClickOutside);
    return () =>
      document.removeEventListener("mousedown", onClickOutside);
  }, [anchorRef]);
 
  const handleSelect = (opt) => {
    if (disabled) return;
    onChange?.(name, opt.value);
    setOpen(false);
  };
 
  const dropdownContent =
    open && !disabled ? (
      <div ref={dropdownRef} className="cdrop-menu">
        {normalizedOptions.length === 0 ? (
          <div className="cdrop-empty">No options</div>
        ) : (
          normalizedOptions.map((opt) => {
            const active = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                className={`cdrop-item ${
                  active ? "cdrop-item-active" : ""
                }`}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </button>
            );
          })
        )}
      </div>
    ) : null;
 
  return (
    <div className={`cdrop-wrap ${className}`}>
      {label && (
        <label className="cdrop-label">
          {label}
          {required && <span className="cdrop-required">*</span>}
        </label>
      )}
 
      <button
        ref={triggerRef}
        type="button"
        className={`cdrop-trigger ${open ? "cdrop-open" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setTimeout(updatePosition, 0);
        }}
      >
        <span className={`cdrop-value ${!value ? "cdrop-placeholder" : ""}`}>
          {selected?.label || placeholder}
        </span>
 
        <ChevronDown
          size={18}
          strokeWidth={2.4}
          className={`cdrop-icon ${open ? "cdrop-icon-open" : ""}`}
        />
      </button>
 
      {error && <div className="cdrop-error-text">{error}</div>}
      {createPortal(dropdownContent, document.body)}
    </div>
  );
};
 
export default CustomDropdown;
 
 
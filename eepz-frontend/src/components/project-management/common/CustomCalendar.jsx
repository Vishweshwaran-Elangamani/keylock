import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../../styles/projectmanagement/components/CustomCalendar.css";

const CustomCalendar = ({
  isOpen,
  onClose,
  value,      
  onChange,   
  anchorRef,   
  position = "auto",
  align = "auto",
  offset = { x: 0, y: 0 },
  minDate,   
}) => {
  const calendarRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const derivedMinDate = useMemo(() => {
    if (minDate) {
      const d = new Date(minDate);
      d.setHours(0, 0, 0, 0);
      return d > todayStart ? d : todayStart;
    }
    return todayStart;
  }, [minDate, todayStart]);

  useEffect(() => {
    if (isOpen) {
      const base = value ? new Date(value) : new Date();
      base.setHours(0, 0, 0, 0);
      const initial = base < derivedMinDate ? derivedMinDate : base;
      setCalendarMonth(initial.getMonth());
      setCalendarYear(initial.getFullYear());
    }
  }, [isOpen, value, derivedMinDate]);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef?.current) return;

    const updatePosition = () => {
      const iconButton =
        anchorRef.current.querySelector(".epm-date-icon-btn") ||
        anchorRef.current.querySelector(".prj-date-icon-btn");

      const anchorEl = iconButton || anchorRef.current;
      const anchorRect = anchorEl.getBoundingClientRect();

      const calRect = calendarRef.current?.getBoundingClientRect();
      const calendarWidth = calRect?.width || 260;
      const calendarHeight = calRect?.height || 350;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;

      const ox = offset?.x || 0;
      const oy = offset?.y || 0;

      switch (position) {
        case "below-icon": {
          top = anchorRect.bottom + oy;
          if (align === "right") left = anchorRect.right - calendarWidth + ox;
          else if (align === "left") left = anchorRect.left + ox;
          else left = anchorRect.left + anchorRect.width / 2 - calendarWidth / 2 + ox;
          break;
        }
        case "below-input": {
          const wrapperRect = anchorRef.current.getBoundingClientRect();
          top = wrapperRect.bottom + oy;
          if (align === "right") left = wrapperRect.right - calendarWidth + ox;
          else if (align === "left") left = wrapperRect.left + ox;
          else left = wrapperRect.left + wrapperRect.width / 2 - calendarWidth / 2 + ox;
          break;
        }
        case "above-icon": {
          top = anchorRect.top - calendarHeight + oy;
          if (align === "right") left = anchorRect.right - calendarWidth + ox;
          else if (align === "left") left = anchorRect.left + ox;
          else left = anchorRect.left + anchorRect.width / 2 - calendarWidth / 2 + ox;
          break;
        }
        case "right-of-icon": {
          top = anchorRect.top + oy;
          left = anchorRect.right + ox;
          break;
        }
        case "left-of-icon": {
          top = anchorRect.top + oy;
          left = anchorRect.left - calendarWidth + ox;
          break;
        }
        case "auto":
        default: {
          const spaceBelow = viewportHeight - anchorRect.bottom;
          const spaceAbove = anchorRect.top;

          if (spaceBelow >= calendarHeight + 20) {
            top = anchorRect.bottom + 4 + oy;
          } else if (spaceAbove >= calendarHeight + 20) {
            top = anchorRect.top - calendarHeight - 4 + oy;
          } else {
            top = Math.max(
              10,
              Math.min(
                viewportHeight - calendarHeight - 10,
                anchorRect.bottom + 4 + oy
              )
            );
          }

          if (align === "right") left = anchorRect.right - calendarWidth + ox;
          else if (align === "left") left = anchorRect.left + ox;
          else left = anchorRect.left + anchorRect.width / 2 - calendarWidth / 2 + ox;
          break;
        }
      }

      if (left < 10) left = 10;
      if (left + calendarWidth > viewportWidth - 10)
        left = viewportWidth - calendarWidth - 10;
      if (top < 10) top = 10;
      if (top + calendarHeight > viewportHeight - 10)
        top = viewportHeight - calendarHeight - 10;

      setCalendarPosition({ top, left });
    };

    requestAnimationFrame(() => {
      updatePosition();
      requestAnimationFrame(updatePosition);
    });

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, anchorRef, position, align, offset]);

  useLayoutEffect(() => {
    if (!isOpen || !calendarRef.current) return;
    calendarRef.current.style.top = `${calendarPosition.top}px`;
    calendarRef.current.style.left = `${calendarPosition.left}px`;
  }, [isOpen, calendarPosition]);

  useEffect(() => {
    const handler = (e) => {
      if (
        isOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, anchorRef]);

  const getCalendarMatrix = () => {
    const today = new Date();
    const month = calendarMonth ?? today.getMonth();
    const year = calendarYear ?? today.getFullYear();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ day: nextDay++, current: false });
    }
    return { cells, month, year };
  };

  const handleSelectDay = (day, current) => {
    if (!current) return;
    const selected = new Date(calendarYear, calendarMonth, day);
    selected.setHours(0, 0, 0, 0);
    if (selected < derivedMinDate) return;

    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const isBeforeMinMonth = (y, m) => {
    const firstOfTarget = new Date(y, m, 1);
    const firstOfMin = new Date(
      derivedMinDate.getFullYear(),
      derivedMinDate.getMonth(),
      1
    );
    firstOfTarget.setHours(0, 0, 0, 0);
    firstOfMin.setHours(0, 0, 0, 0);
    return firstOfTarget < firstOfMin;
  };

  const goPrevMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth - 1;
    let y = calendarYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (isBeforeMinMonth(y, m)) return; 
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goNextMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth + 1;
    let y = calendarYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const target = t < derivedMinDate ? derivedMinDate : t;

    setCalendarMonth(target.getMonth());
    setCalendarYear(target.getFullYear());

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  if (!isOpen) return null;

  const { cells, month, year } = getCalendarMatrix();
  const selectedDate = value ? new Date(value) : null;
  const minDateObj = derivedMinDate;

  const calendarContent = (
    <div className="csla-calendar-dropdown" ref={calendarRef}>
      <div className="csla-calendar-header">
        <button
          type="button"
          className="csla-calendar-nav-btn"
          onClick={goPrevMonth}
          aria-label="Previous month"
          disabled={isBeforeMinMonth(
            calendarMonth === 0 ? calendarYear - 1 : calendarYear,
            calendarMonth === 0 ? 11 : calendarMonth - 1
          )}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="csla-calendar-title">
          {monthNames[month]} {year}
        </span>

        <button
          type="button"
          className="csla-calendar-nav-btn"
          onClick={goNextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="csla-calendar-weekdays">
        {weekdays.map((w) => (
          <div key={w} className="csla-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="csla-calendar-grid">
        {cells.map((c, idx) => {
          const cellDate = new Date(year, month, c.day);
          cellDate.setHours(0, 0, 0, 0);

          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);

          const isToday = c.current && cellDate.getTime() === todayDate.getTime();

          const isSelected =
            selectedDate &&
            c.current &&
            cellDate.getDate() === new Date(selectedDate).getDate() &&
            cellDate.getMonth() === new Date(selectedDate).getMonth() &&
            cellDate.getFullYear() === new Date(selectedDate).getFullYear();

          const isDisabled = c.current && minDateObj && cellDate < minDateObj;

          return (
            <div
              key={idx}
              className={`csla-calendar-day ${
                c.current ? "csla-calendar-day--current" : ""
              } ${isToday ? "csla-calendar-day--today" : ""} ${
                isSelected ? "csla-calendar-day--selected" : ""
              } ${isDisabled ? "csla-calendar-day--disabled" : ""}`}
              onClick={() => !isDisabled && handleSelectDay(c.day, c.current)}
            >
              {c.day}
            </div>
          );
        })}
      </div>

      <div className="csla-calendar-footer">
        <button type="button" className="csla-today-btn" onClick={goToday}>
          Today
        </button>
      </div>
    </div>
  );

  return createPortal(calendarContent, document.body);
};

export default CustomCalendar;

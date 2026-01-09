import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { CheckCircle, Send, AlertTriangle, Loader, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  mentorFeedbackApi,
  employeeApi,
  smeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/SubmitMentorFeedback.css";

const PRIMARY = "#27235C";
const getFeedbackDashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/feedback",
    Manager: "/manager/dashboard/feedback",
    DepartmentHead: "/depthead/dashboard/feedback",
    "Department Head": "/depthead/dashboard/feedback",
    HR: "/hr/dashboard/feedback",
  };
  return routes[roleName] || "/hr/dashboard/feedback";
};

const DropdownIcon = ({ open }) => (
<svg width="18" height="18" viewBox="0 0 24 24" className={`smf-dropdown-icon ${open ? "smf-dropdown-icon--open" : ""}`}>
  <polyline points="6 9 12 15 18 9"  fill="none"
      stroke={PRIMARY} strokeWidth="2.4"strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CustomSelect = ({
  name, value, onChange,options,
  placeholder = "Select", disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    const opt = options.find((o) => String(o.value) === String(value));
    return opt ? opt.label : placeholder;
  };

  return (
    <div className="smf-dropdown-wrapper" ref={dropdownRef}>
      <div
        className={`smf-dropdown-select ${ isOpen ? "smf-dropdown-select--open" : ""
        } ${disabled ? "smf-dropdown-select--disabled" : ""}`}
        onClick={() => !disabled && setIsOpen((o) => !o)}>
        <span className="smf-dropdown-value">{getDisplayValue()}</span>
        <span className="smf-dropdown-arrow"> <DropdownIcon open={isOpen} /></span>
      </div>
      {isOpen && (
        <ul className="smf-dropdown-list">
          {options.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li key={idx}  className={`smf-dropdown-option ${ isSelected ? "smf-dropdown-option--selected" : ""}`}
                onClick={() => handleSelect(opt.value)}>
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default function SubmitMentorFeedback() {
  const navigate = useNavigate();
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1004,
        firstName: "Dave",
        lastName: "Dev",
      },
    []
  );

  const [form, setForm] = useState({
    smeId: "",
    rating: 5,
    feedbackComments: "",
    isAnonymous: false,
  });

  const [smeList, setSmeList] = useState([]);
  const [smeDetails, setSmeDetails] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingSme, setLoadingSme] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEmployeeMap = useCallback(async (signal) => {
    setLoadingEmployees(true);
    try {
      const response = await employeeApi.getAll();

      if (response?.data) {
        const employees = Array.isArray(response.data)
          ? response.data : response.data.data || [];

        const map = {};
        employees.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      console.error("Error fetching employees:", err.message);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  const fetchSmeList = useCallback(
    async (signal) => {
      if (Object.keys(employeeMap).length === 0 && !loadingEmployees) return;

      setLoadingSme(true);
      try {
        const response = await smeApi.getActive();

        if (response?.data) {
          const activeSmes = Array.isArray(response.data)
            ? response.data
            : response.data.data || [];

          const formattedSmes = activeSmes.map((sme) => ({
            smeId: sme.smeId, employeeId: sme.employeeId,
            skillName: sme.skillName || "Unknown Skill", skillIdReference: sme.skillIdReference || sme.skillId,
            employeeName: employeeMap[sme.employeeId] || `Employee ${sme.employeeId}`,
            skillCategoryName: sme.skillCategoryName, proficiencyLevel: sme.proficiencyLevel, status: sme.status,
          }));

          setSmeList(formattedSmes);
          setError("");
        } else {
          setSmeList([]);
          setError("No active mentors found at this time.");
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        setError(err?.message || "Failed to load mentor list.");
        setSmeList([]);
      } finally {
        setLoadingSme(false);
      }
    },
    [employeeMap, loadingEmployees]
  );

  useEffect(() => {
    const abortController = new AbortController();
    fetchEmployeeMap(abortController.signal);
    return () => abortController.abort();
  }, [fetchEmployeeMap]);

  useEffect(() => {
    if (Object.keys(employeeMap).length === 0) return;
    const abortController = new AbortController();
    fetchSmeList(abortController.signal);
    return () => abortController.abort();
  }, [employeeMap, fetchSmeList]);

  const handleSmeChange = useCallback(
    (smeId) => {
      setForm((prev) => ({ ...prev, smeId }));
      setError("");

      if (!smeId) {
        setSmeDetails(null);
        return;
      }

      const sme = smeList.find((s) => s.smeId === Number(smeId));
      if (sme) {
        setSmeDetails(sme);
      } else {
        setSmeDetails(null);
        setError("Invalid SME selection.");
      }
    },
    [smeList]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!smeDetails) {
        setError("Please select a valid SME");
        return;
      }
      if (!form.feedbackComments.trim()) {
        setError("Please enter your feedback");
        return;
      }
      if (form.feedbackComments.length > 5000) {
        setError("Feedback exceeds 5000 characters");
        return;
      }

      const payload = {
        smeId: smeDetails.smeId,mentorEmployeeId: smeDetails.employeeId,
        menteeEmployeeId: Number(user?.empId),skillIdReference: smeDetails.skillIdReference,
        rating: Number(form.rating),feedbackComments: form.feedbackComments,
        submittedByEmployeeId: Number(user?.empId),feedbackFrom: "Mentee",
        isAnonymous: !!form.isAnonymous,
      };
      setLoading(true);
      try {
        const response = await mentorFeedbackApi.create(payload);
        if (response?.success || response?.data?.success) {
          const trackingId =
            response.data?.mentorFeedbackId || response.data?.data?.mentorFeedbackId ||
            "Generated";
          setSuccess(`Feedback submitted successfully! ID: ${trackingId}`);
          setForm({
            smeId: "",rating: 5,feedbackComments: "",isAnonymous: false,
          });
          setSmeDetails(null);
          setTimeout(() => setSuccess(""), 5000);
        } else {
          setError(response?.message || "Submission failed");
        }
      } catch (err) {
        setError(err?.message || "Failed to submit feedback");
      } finally {
        setLoading(false);
      }
    },
    [smeDetails, form, user?.empId]
  );

  const handleStarClick = useCallback((rating) => {
    setForm((prev) => ({ ...prev, rating }));
  }, []);
  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const rating = index + 1;
      return (
        <button key={index} type="button"
          className={`smf-star-button ${  rating <= form.rating ? "smf-star-button--active" : ""}`}
          onClick={() => handleStarClick(rating)} aria-label={`Rate ${rating} star${rating > 1 ? "s" : ""}`} >
          <Star size={24}  fill={rating <= form.rating ? "currentColor" : "none"}
           strokeWidth={rating <= form.rating ? 0 : 2}/>
        </button>
      );
    });
  };

  const isFormValid =
    smeDetails &&
    form.feedbackComments.trim() &&
    form.feedbackComments.length <= 5000;
  const isLoading = loadingSme || loadingEmployees;

  const feedbackDashboardPath = user?.roleName
    ? getFeedbackDashboardPath(user.roleName)
    : "/hr/dashboard/feedback";

  return (
    <div className="smf-container">
      <div className="smf-content">
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: feedbackDashboardPath },
            { label: "Submit Mentor Feedback" },
          ]}
        />
        <div className="smf-header-gap"></div>
        {error && (
          <div className="smf-alert smf-alert-error">
            <AlertTriangle size={18} className="smf-alert-icon" />
            <div className="smf-alert-content">
              <p className="smf-alert-message">{error}</p>
            </div>
            <button type="button" className="smf-alert-close" onClick={() => setError("")} >
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="smf-alert smf-alert-success">
            <CheckCircle size={18} className="smf-alert-icon" />
            <p className="smf-alert-message">{success}</p>
          </div>
        )}
        <div className="smf-card">
          <div className="smf-card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="smf-form-group">
                <label htmlFor="smeSelect" className="smf-label smf-label-with-loader">
                  <span> Select Your Mentor/SME{" "}
                    <span className="smf-required">*</span>
                  </span>
                  {isLoading && (
                    <Loader size={16} className="smf-loader-inline" />
                  )}
                </label>
                <CustomSelect name="smeId"  value={form.smeId}
                 onChange={(val) => handleSmeChange(val)}  disabled={isLoading || loading}
                  options={smeList.map((sme) => ({ value: String(sme.smeId),
                    label: `${sme.employeeName} - ${sme.skillName}${
                      sme.proficiencyLevel ? ` (${sme.proficiencyLevel})` : ""
                    }`,
                  }))}
                  placeholder={
                    loadingEmployees
                      ? "Loading employee data..." : loadingSme
                      ? "Loading mentors..." : smeList.length === 0
                      ? "No mentors available"
                      : "Choose a mentor to provide feedback for"
                  }
                />
                <div className="smf-form-text">
                  Select the SME whose guidance you'd like to rate
                </div>
              </div>

              {smeDetails && (
                <div className="smf-details-section">
                  <div className="smf-sme-details">
                    <h6 className="smf-sme-details-title"> Selected SME Details</h6>
                    <div className="smf-sme-details-grid">
                      <div className="smf-sme-detail-item">
                        <div className="smf-detail-label">Expertise Area</div>
                        <div className="smf-detail-value">
                          {smeDetails.skillName}
                        </div>
                        {smeDetails.skillCategoryName && (
                          <small className="smf-detail-meta">
                            Category: {smeDetails.skillCategoryName}
                          </small>
                        )}
                      </div>
                      <div className="smf-sme-detail-item">
                        <div className="smf-detail-label">SME</div>
                        <div className="smf-detail-value">
                          {smeDetails.employeeName}
                        </div>
                        {smeDetails.proficiencyLevel && (
                          <small className="smf-detail-meta">
                            Level: {smeDetails.proficiencyLevel}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="smf-form-group">
                    <label className="smf-label"> Rating <span className="smf-required">*</span> </label>
                    <div className="smf-rating-box">
                      <div className="smf-stars">{renderStars()}</div>
                      <span className="smf-rating-value">{form.rating}/5 Stars </span>
                    </div>
                    <div className="smf-form-text"> 1 = Needs Improvement | 5 = Outstanding</div>
                  </div>

                  <div className="smf-form-group">
                    <label htmlFor="feedbackComments" className="smf-label">
                       Detailed Feedback <span className="smf-required">*</span>
                    </label>
                    <textarea  id="feedbackComments"className="smf-textarea"
                      rows={6} value={form.feedbackComments} onChange={(e) =>
                        setForm((prev) => ({...prev, feedbackComments: e.target.value,
                        }))}
                      placeholder="Describe your experience with this mentor's teaching style, knowledge sharing, and overall impact..."
                      maxLength={5000} />
                    <div className="smf-textarea-footer">
                      <span className="smf-form-text"> Be specific and constructiv </span>
                      <span
                        className={`smf-char-count ${
                          form.feedbackComments.length > 4500  ? "smf-char-count--warning" : ""
                        }`}>
                        {form.feedbackComments.length}/5000
                      </span>
                    </div>
                  </div>

                  <div className="smf-form-group">
                    <div className="smf-checkbox-wrapper">
                      <input  type="checkbox" className="smf-checkbox-input" id="anonCheck" checked={form.isAnonymous}
                        onChange={(e) => setForm((prev) => ({  ...prev, isAnonymous: e.target.checked, })) }
                        disabled={loading} />
                      <label className="smf-checkbox-label" htmlFor="anonCheck"> Submit anonymously
                        <div className="smf-checkbox-hint"> Your identity will be hidden from the mentor</div>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="smf-submit-button" disabled={loading || !isFormValid}>
                    {loading ? (
                      <>
                        <Loader size={20} className="smf-loader" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={20} />Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

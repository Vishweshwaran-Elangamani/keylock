import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  MessageSquare,
  Eye,
  Users,
  Star,
  Search,
  Award,
} from "lucide-react";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import {
  peerQueueApi,
  smeApi,
  managerReviewApi,
  employeeApi,
  mentorFeedbackApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import "../../../styles/feedback/components/FeedbackEmployeeDashboard.css";

export default function FeedbackEmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [isMentor, setIsMentor] = useState(false);
  const [pendingFormsCount, setPendingFormsCount] = useState(0);
  const [peerCount, setPeerCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [mentorFeedbackCount, setMentorFeedbackCount] = useState(0);

  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1004,
        firstName: "User",
        lastName: "",
      },
    []
  );

  const getFormId = (obj) =>
    Number(obj?.formId ?? obj?.id ?? obj?.formID ?? obj?.hrFormId ?? 0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const empId = user?.empId || user?.employeeId || 1004;

      try {
        try {
          const formsRes = await hrFormApi.getAllForms(1, 1000);
          const forms = formsRes?.data?.items || [];
          const submittedRes = await hrFormApi.getResponsesByEmployee(empId);
          const submitted = Array.isArray(submittedRes?.data)
            ? submittedRes.data
            : submittedRes?.data?.data || [];
          const submittedIds = new Set(submitted.map(getFormId));
          const pending = forms.filter((f) => !submittedIds.has(getFormId(f)));
          setPendingFormsCount(pending.length);
        } catch (e) {
          console.warn("HR forms fetch error:", e?.message);
          setPendingFormsCount(0);
        }

        try {
          const reviewRes = await managerReviewApi.getForTarget(empId);
          const reviews = Array.isArray(reviewRes?.data)
            ? reviewRes.data
            : reviewRes?.data?.data || [];
          setReviewsCount(reviews.length);
        } catch (e) {
          console.warn("Reviews fetch error:", e?.message);
          setReviewsCount(0);
        }
        try {
          let empMap = {};
          try {
            const empRes = await employeeApi.getAll();
            const employees = Array.isArray(empRes?.data)
              ? empRes.data
              : empRes?.data?.data || [];
            employees.forEach((emp) => {
              empMap[emp.employeeId] = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
            });
          } catch (e) {
            console.warn("Employee map fetch error:", e?.message);
          }

          const peerRes = await peerQueueApi.list(1, 1000);
          const peerData = Array.isArray(peerRes?.data)
            ? peerRes.data
            : peerRes?.data?.data || [];

          const myPeer = peerData?.filter(
            (p) => Number(p?.recipientEmployeeId) === Number(empId)
          );
          setPeerCount(myPeer?.length || 0);
        } catch (e) {
          console.warn("Peer feedback fetch error:", e?.message);
          setPeerCount(0);
        }

        try {
          const smeResponse = await smeApi.getActive();
          const smeList = Array.isArray(smeResponse?.data)
            ? smeResponse.data
            : smeResponse?.data?.data || [];

          const mentor = smeList.some(
            (s) => Number(s?.employeeId) === Number(empId)
          );
          setIsMentor(mentor);

          if (mentor) {
            try {
              const aboutRes = await mentorFeedbackApi.aboutMe(empId);
              const feedbackList = Array.isArray(aboutRes?.data)
                ? aboutRes.data
                : aboutRes?.data?.data || [];
              setMentorFeedbackCount(feedbackList.length || 0);
            } catch (e) {
              console.warn("Mentor aboutMe fetch error:", e?.message);
              setMentorFeedbackCount(0);
            }
          } else {
            setMentorFeedbackCount(0);
          }
        } catch (e) {
          console.warn("SME check error:", e?.message);
          setIsMentor(false);
          setMentorFeedbackCount(0);
        }
      } catch (err) {
        console.error("Employee dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.empId, user?.employeeId]);

  if (loading) {
    return (
      <div className="fm-lnd-wrapper">
        <div className="fm-lnd-header" style={{ marginTop: "20px" }}>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fm-lnd-wrapper">
      <div className="fm-lnd-breadcrumb">
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: "/employee/dashboard/feedback" },
            { label: "Employee Dashboard" },
          ]}
        />
      </div>

      <div className="fm-lnd-header">
        <h3>Feedback Management</h3>
        <p>Submit feedback, check assignments, and view received reviews</p>
      </div>

      <div className="fm-lnd-grid">
        <Link to="/employee/dashboard/feedback/submit-mentor" className="fm-lnd-card">
          <div className="fm-lnd-icon blue"><Send size={22} /></div>
          <div>
            <h3>Mentor Feedback</h3>
            <p>Provide feedback to mentors</p>
          </div>
          {mentorFeedbackCount > 0 && (
            <span className="fm-lnd-badge" aria-label="Mentor feedback count">
              {mentorFeedbackCount}
            </span>
          )}
        </Link>

        <Link to="/employee/dashboard/feedback/contextfeedback" className="fm-lnd-card">
          <div className="fm-lnd-icon gray"><MessageSquare size={22} /></div>
          <div>
            <h3>Context Feedback</h3>
            <p>Give contextual feedback anytime</p>
          </div>
        </Link>

        <Link to="/employee/dashboard/feedback/assignedform" className="fm-lnd-card">
          <div className="fm-lnd-icon yellow"><Eye size={22} /></div>
          <div>
            <h3>Assigned Forms</h3>
            <p>Track and complete assigned forms</p>
          </div>
          {pendingFormsCount > 0 && (
            <span className="fm-lnd-badge" aria-label="Pending forms">
              {pendingFormsCount}
            </span>
          )}
        </Link>

        <Link to="/employee/dashboard/feedback/submit-peer" className="fm-lnd-card">
          <div className="fm-lnd-icon green"><Users size={22} /></div>
          <div>
            <h3>Peer Feedback Received</h3>
            <p>See feedback from peers</p>
          </div>
          {peerCount > 0 && (
            <span className="fm-lnd-badge" aria-label="Peer feedback received">
              {peerCount}
            </span>
          )}
        </Link>

        <Link to="/employee/dashboard/feedback/reviews-received" className="fm-lnd-card">
          <div className="fm-lnd-icon blue"><Star size={22} /></div>
          <div>
            <h3>Reviews Received</h3>
            <p>View reviews you’ve received</p>
          </div>
          {reviewsCount > 0 && (
            <span className="fm-lnd-badge" aria-label="Reviews received count">
              {reviewsCount}
            </span>
          )}
        </Link>

        <Link to="/employee/dashboard/feedback/submissions" className="fm-lnd-card">
          <div className="fm-lnd-icon gray"><Search size={22} /></div>
          <div>
            <h3>My Submissions</h3>
            <p>View feedback you have submitted</p>
          </div>
        </Link>

        {isMentor && (
          <Link to="/employee/dashboard/feedback/mentor" className="fm-lnd-card">
            <div className="fm-lnd-icon purple"><Award size={22} /></div>
            <div>
              <h3>SME Dashboard</h3>
              <p>Manage SME/mentor responsibilities</p>
            </div>
            {mentorFeedbackCount > 0 && (
              <span className="fm-lnd-badge" aria-label="SME items">
                {mentorFeedbackCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}
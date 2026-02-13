import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Eye,
  Users,
  Send,
  MessageSquare,
  Target,
  Search,
  Star
} from "lucide-react";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/FeedbackManagerDashboard.css";

export default function FeedbackManagerDashboard() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}") || {}, []);

  return (
    <div className="fm-lnd-wrapper">

      <div className="fm-lnd-breadcrumb">
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: "/manager/dashboard/feedback" },
            { label: "Manager Dashboard" }
          ]}
        />
      </div>

      <div className="fm-lnd-header">
        <h3>Feedback Management</h3>
        <p>Manage reviews, track feedback, and monitor assigned forms</p>
      </div>

      <div className="fm-lnd-grid">

         <Link to="/manager/dashboard/feedback/create-review" className="fm-lnd-card">
          <div className="fm-lnd-icon purple"><Plus size={22} /></div>
          <div>
            <h3>Create Review</h3>
            <p>Start a new performance review</p>
          </div>
        </Link>

        <Link to="/manager/dashboard/feedback/all-review" className="fm-lnd-card">
          <div className="fm-lnd-icon blue"><Star size={22} /></div>
          <div>
            <h3>My Reviews</h3>
            <p>View and manage reviews you created</p>
          </div>
        </Link>

        <Link to="/manager/dashboard/feedback/team" className="fm-lnd-card">
          <div className="fm-lnd-icon green"><Users size={22} /></div>
          <div>
            <h3>Peer Feedback</h3>
            <p>See feedback received by team members</p>
          </div>
        </Link>

       <Link to="/manager/dashboard/feedback/submit-mentor" className="fm-lnd-card">
          <div className="fm-lnd-icon blue"><Send size={22} /></div>
          <div>
            <h3>Mentor Feedback</h3>
            <p>Provide feedback to mentors</p>
          </div>
        </Link>

        <Link to="/manager/dashboard/feedback/contextfeedback" className="fm-lnd-card">
          <div className="fm-lnd-icon gray"><MessageSquare size={22} /></div>
          <div>
            <h3>Context Feedback</h3>
            <p>Give contextual feedback anytime</p>
          </div>
        </Link>

        <Link to="/manager/dashboard/feedback/assignedform" className="fm-lnd-card">
          <div className="fm-lnd-icon yellow"><Target size={22} /></div>
          <div>
            <h3>Assigned Forms</h3>
            <p>Track and complete assigned feedback forms</p>
          </div>
        </Link>

        <Link to="/manager/dashboard/feedback/submissions" className="fm-lnd-card">
          <div className="fm-lnd-icon gray"><Search size={22} /></div>
          <div>
            <h3>My Submissions</h3>
            <p>View feedback you have submitted</p>
          </div>
        </Link>
      </div>
    </div>
  );
}


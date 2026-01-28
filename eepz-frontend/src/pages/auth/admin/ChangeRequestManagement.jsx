import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import Breadcrumb from "../../../components/common/Breadcrumb";
import ApproveEmailChangeModal from "../../../components/auth/Modal/changerequest/ApproveEmailChangeModal";
import RejectEmailChangeModal from "../../../components/auth/Modal/changerequest/RejectEmailChangeModal";
import { PendingRequests, AllRequests } from "../../../components/auth/Modal/changerequest/RequestsTabContent";
import useChangeRequestsManagement from "../../../hooks/auth/changerequest/useChangeRequestsManagement";
import "../../../styles/auth/admin/ChangeRequestManagement.css";
const ChangeRequestManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const {
    requests,
    loading,
    fetchRequests,
    handleApproveRequest,
    handleRejectRequest,
  } = useChangeRequestsManagement();
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/pending")) return "pending";
    if (path.includes("/all")) return "all";
    return "pending";
  };
  const [activeTab, setActiveTab] = useState(getActiveTab());
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);
  useEffect(() => {
    const isAnyModalOpen = showApproveModal || showRejectModal;
    
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showApproveModal, showRejectModal]);


  const tabs = [
    {
      key: "pending",
      label: "Pending Requests",
      path: "/admin/change-requests/pending",
      icon: "bi-hourglass-split",
    },
    {
      key: "all",
      label: "All Requests",
      path: "/admin/change-requests/all",
      icon: "bi-list-ul",
    },
  ];
  const handleTabChange = (tab) => {
    setActiveTab(tab.key);
    navigate(tab.path);
  };
  const handleProcessClick = (request, action) => {
    setSelectedRequest(request);
    if (action === "Approved") {
      setShowApproveModal(true);
    } else {
      setShowRejectModal(true);
    }
    toast.info(`Processing email change request #${request.requestId}`);
  };
  const handleApprove = async (adminRemarks) => {
    setProcessing(true);
    const success = await handleApproveRequest(selectedRequest.requestId, adminRemarks);
    setProcessing(false);
    if (success) {
      setShowApproveModal(false);
      setSelectedRequest(null);
      fetchRequests(true);
    }
  };
  const handleReject = async (adminRemarks) => {
    setProcessing(true);
    const success = await handleRejectRequest(selectedRequest.requestId, adminRemarks);
    setProcessing(false);
    if (success) {
      setShowRejectModal(false);
      setSelectedRequest(null);
      fetchRequests(true);
    }
  };
  const getCurrentTabLabel = () => {
    const currentTab = tabs.find((tab) => tab.key === activeTab);
    return currentTab ? currentTab.label : "Pending Requests";
  };
  if (loading) {
    return (
      <div className="crm-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="crm-page">
      <Breadcrumb
        items={[
          { label: "Email Change Requests", path: "/admin/change-requests/pending" },
          { label: getCurrentTabLabel() },
        ]}
      />
      <div className="stats-cards-crm">
        <div className="stat-card-crm stat-total-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-inbox-fill"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">{requests.length}</div>
            <div className="stat-label-crm">Total Requests</div>
          </div>
        </div>
        <div className="stat-card-crm stat-pending-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">
              {requests.filter((r) => r.status === "Pending").length}
            </div>
            <div className="stat-label-crm">Pending</div>
          </div>
        </div>
        <div className="stat-card-crm stat-approved-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">
              {requests.filter((r) => r.status === "Approved").length}
            </div>
            <div className="stat-label-crm">Approved</div>
          </div>
        </div>
        <div className="stat-card-crm stat-rejected-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">
              {requests.filter((r) => r.status === "Rejected").length}
            </div>
            <div className="stat-label-crm">Rejected</div>
          </div>
        </div>
      </div>
      <div className="crm-request-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`crm-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => handleTabChange(tab)}
          >
            <i className={`bi ${tab.icon}`}></i>
            {tab.label}
            {tab.key === "pending" && requests.filter((r) => r.status === "Pending").length > 0 && (
              <span className="badge bg-warning ms-2">
                {requests.filter((r) => r.status === "Pending").length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="tab-content-crm">
        <Routes>
          <Route
            path="pending"
            element={
              <PendingRequests
                requests={requests}
                handleProcessClick={handleProcessClick}
              />
            }
          />
          <Route
            path="all"
            element={
              <AllRequests
                requests={requests}
                handleProcessClick={handleProcessClick}
              />
            }
          />
          <Route
            path="*"
            element={
              <PendingRequests
                requests={requests}
                handleProcessClick={handleProcessClick}
              />
            }
          />
        </Routes>
      </div>
      <ApproveEmailChangeModal
        show={showApproveModal}
        request={selectedRequest}
        onHide={() => setShowApproveModal(false)}
        onApprove={handleApprove}
        processing={processing}
      />
      <RejectEmailChangeModal
        show={showRejectModal}
        request={selectedRequest}
        onHide={() => setShowRejectModal(false)}
        onReject={handleReject}
        processing={processing}
      />
    </div>
  );
};
export default ChangeRequestManagement;

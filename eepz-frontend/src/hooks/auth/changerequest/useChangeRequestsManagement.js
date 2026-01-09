import { useState, useEffect } from "react";
import { toast } from "sonner";
import ChangeRequestService from "../../../services/auth/changeRequestService";

const useChangeRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchRequests();
    const refreshInterval = setInterval(() => {
      fetchRequests(true);
    }, 30000000);
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchRequests = async (silent = false) => {
    try {
      setLoading(true);
      const response = await ChangeRequestService.getAllChangeRequests();
      if (response.success) {
        setRequests(response.data || []);
        setLastUpdated(new Date());
        if (!silent) {
          toast.dismiss();
        }
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching email change requests:", error);
      toast.dismiss();
      toast.error("Failed to fetch email change requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, adminRemarks) => {
    try {
      toast.loading("Approving email change request...");
      const processData = {
        RequestId: requestId,
        Status: "Approved",
        AdminRemarks: adminRemarks.trim() || null,
      };
      const response = await ChangeRequestService.processChangeRequest(processData);
      toast.dismiss();
      
      if (response.success) {
        toast.success(response.message || "Email change request approved successfully!");
        return true;
      } else {
        toast.error(response.message || "Failed to approve email change request");
        return false;
      }
    } catch (error) {
      console.error("Error approving email change request:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message || error.message || "Failed to approve email change request"
      );
      return false;
    }
  };

  const handleRejectRequest = async (requestId, adminRemarks) => {
    try {
      toast.loading("Rejecting email change request...");
      const processData = {
        RequestId: requestId,
        Status: "Rejected",
        AdminRemarks: adminRemarks.trim(),
      };
      const response = await ChangeRequestService.processChangeRequest(processData);
      toast.dismiss();
      
      if (response.success) {
        toast.success(response.message || "Email change request rejected successfully!");
        return true;
      } else {
        toast.error(response.message || "Failed to reject email change request");
        return false;
      }
    } catch (error) {
      console.error("Error rejecting email change request:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message || error.message || "Failed to reject email change request"
      );
      return false;
    }
  };

  return {
    requests,
    loading,
    lastUpdated,
    fetchRequests,
    handleApproveRequest,
    handleRejectRequest,
  };
};

export default useChangeRequestsManagement;

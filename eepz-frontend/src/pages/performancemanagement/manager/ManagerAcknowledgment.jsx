import React, { useEffect, useState } from "react";
import { getManagerEmployeeAcknowledgments } from "../../../services/performancemanagement/api/rolesapi";
import { getUserIdFromToken } from "../../../utils/PerformanceManagement/jwtDecoder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManagerAcknowledgmentModal from "../../../components/performance_management/modals/ManagerAcknowledgment/ManagerAcknowledgmentModal";

export default function ManagerAcknowledgment() {
  const [ackList, setAckList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAckList();
  }, []);

  const fetchAckList = async () => {
    setLoading(true);
    setError(null);
    try {
      const managerId = getUserIdFromToken();
      if (!managerId) {
        setError("Manager ID not found in token");
        setLoading(false);
        return;
      }
      const res = await getManagerEmployeeAcknowledgments(managerId);
      if (res.data.success) {
        setAckList(res.data.data);
      } else {
        setError("Failed to load acknowledgments");
      }
    } catch (err) {
      setError("Failed to load acknowledgments");
      toast.error("Failed to load acknowledgments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manageracknowledgment-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <ManagerAcknowledgmentModal
        ackList={ackList}
        error={error}
        loading={loading}
      />
    </div>
  );
}

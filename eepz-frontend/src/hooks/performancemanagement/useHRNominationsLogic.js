import { useState, useEffect } from "react";
import * as api from "../../services/performancemanagement/api/nominationapi";
import { toast } from "react-toastify";

export const useHRNominationsLogic = () => {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [showModal, setShowModal] = useState(false);
  const [selectedNominationDetails, setSelectedNominationDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionNominationId, setActionNominationId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");

  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [selectedRewardEmployees, setSelectedRewardEmployees] = useState([]);
  const [selectedRewardName, setSelectedRewardName] = useState("");

  const [statistics, setStatistics] = useState({
    totalNominations: 0,
    pendingNominations: 0,
    approvedNominations: 0,
    rejectedNominations: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchNominations();
    fetchStatistics();
    setCurrentPage(1);
    setShowEmployeeList(false);
  }, [activeTab]);

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const { data } = await api.getStatistics();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const groupApprovedProfiles = (profiles) => {
    const grouped = {};
    profiles.forEach((profile) => {
      const key = `${profile.opportunity.opportunityName}-${profile.opportunity.rewardType}`;
      if (!grouped[key]) {
        grouped[key] = {
          opportunityId: profile.nominationId,
          opportunityName: profile.opportunity.opportunityName,
          opportunityDeadline: profile.submittedAt,
          rewardType: {
            rewardTypeId: 0,
            rewardName: profile.opportunity.rewardType,
            rewardCategory: profile.opportunity.rewardCategory,
          },
          nominationCount: 0,
          nominations: [],
        };
      }
      grouped[key].nominations.push({
        nominationId: profile.nominationId,
        nomineeName: `${profile.nominee.firstName} ${profile.nominee.lastName}`,
        nomineeEmail: profile.nominee.employeeId,
        nomineeDepartmentName: profile.nominee.departmentName,
        managerName: "HR Review",
        justification: profile.justification,
        submittedAt: profile.submittedAt,
        reviewedAt: profile.reviewedAt,
        status: activeTab,
      });
      grouped[key].nominationCount = grouped[key].nominations.length;
    });
    return Object.values(grouped);
  };

  const fetchNominations = async () => {
    try {
      setLoading(true);
      let data = null;

      if (activeTab === "Pending") {
        const res = await api.getAllManagerNominations();
        data = res.data;
      } else if (activeTab === "Approved") {
        const res = await api.getApprovedProfiles();
        data = {
          success: res.data.success,
          data: groupApprovedProfiles(res.data.data),
          message: res.data.message,
        };
      } else {
        const res = await api.getRejectedProfiles();
        data = {
          success: res.data.success,
          data: groupApprovedProfiles(res.data.data),
          message: res.data.message,
        };
      }

      if (data.success) {
        setNominations(data.data);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      toast.error("Failed to load nominations");
    } finally {
      setLoading(false);
    }
  };

  const groupByRewardType = (nominations) => {
    const grouped = {};

    nominations.forEach((opp) => {
      const rewardName = opp.rewardType?.rewardName || "Unknown Reward";

      if (!grouped[rewardName]) {
        grouped[rewardName] = {
          rewardName: rewardName,
          rewardCategory: opp.rewardType?.rewardCategory || "",
          employees: [],
          totalCount: 0,
        };
      }

      opp.nominations.forEach((nom) => {
        if (nom.status === activeTab) {
          grouped[rewardName].employees.push(nom);
          grouped[rewardName].totalCount++;
        }
      });
    });

    return Object.values(grouped).filter((group) => group.totalCount > 0);
  };

  const filterNominationsByStatus = (status) => {
    return nominations
      .map((opp) => ({
        ...opp,
        nominations: opp.nominations.filter((nom) => nom.status === status),
      }))
      .filter((opp) => opp.nominations.length > 0);
  };

  const openApproveModal = (nominationId) => {
    setActionType("approve");
    setActionNominationId(nominationId);
    setActionRemarks("");
    setShowActionModal(true);
  };

  const openRejectModal = (nominationId) => {
    setActionType("reject");
    setActionNominationId(nominationId);
    setActionRemarks("");
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (!actionRemarks.trim()) {
      toast.warning("Please enter remarks");
      return;
    }

    try {
      if (actionType === "approve") {
        const payload = {
          selectedNominationIds: [actionNominationId],
          hrUserId: 1,
          approvalRemarks: actionRemarks,
          rejectionRemarks: "Not selected in final round",
        };

        const { data } = await api.approveNominations(payload);

        if (data.success || data.Success) {
          toast.success(`✓ Nomination approved successfully!`);
          setShowActionModal(false);
          setActionRemarks("");

          setSelectedRewardEmployees((prev) =>
            prev.filter((emp) => emp.nominationId !== actionNominationId)
          );

          fetchNominations();
          fetchStatistics();
        }
      } else {
        const { data } = await api.rejectNominations({
          selectedNominationIds: [actionNominationId],
          hrUserId: 1,
          rejectionRemarks: actionRemarks,
        });

        if (data.success || data.Success) {
          toast.success(`✓ Nomination rejected successfully!`);
          setShowActionModal(false);
          setActionRemarks("");

          setSelectedRewardEmployees((prev) =>
            prev.filter((emp) => emp.nominationId !== actionNominationId)
          );

          fetchNominations();
          fetchStatistics();
        }
      }
    } catch (error) {
      console.error("Error submitting action:", error);
      toast.error("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const viewDetails = async (nominationId) => {
    try {
      setDetailsLoading(true);
      const { data } = await api.getNominationDetails(nominationId);
      if (data.success) {
        setSelectedNominationDetails(data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error viewing details:", error);
      toast.error("Failed to load nomination details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const viewEmployeeList = (rewardGroup) => {
    setSelectedRewardName(rewardGroup.rewardName);
    setSelectedRewardEmployees(rewardGroup.employees);
    setShowEmployeeList(true);
  };

  const goBackToNominations = () => {
    setShowEmployeeList(false);
    setSelectedRewardName("");
    setSelectedRewardEmployees([]);
  };

  const filteredNominations = filterNominationsByStatus(activeTab);
  const groupedRewards = groupByRewardType(filteredNominations);

  return {
    nominations,
    loading,
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    viewMode,
    setViewMode,
    showModal,
    setShowModal,
    selectedNominationDetails,
    detailsLoading,
    showActionModal,
    setShowActionModal,
    actionType,
    actionRemarks,
    setActionRemarks,
    showEmployeeList,
    selectedRewardEmployees,
    selectedRewardName,
    statistics,
    statsLoading,
    groupedRewards,
    openApproveModal,
    openRejectModal,
    submitAction,
    viewDetails,
    viewEmployeeList,
    goBackToNominations,
  };
};

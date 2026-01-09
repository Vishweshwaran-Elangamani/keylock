import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import api from "../../services/performancemanagement/api/api";
import { apiPort5113 } from "../../services/performancemanagement/api/rolesapi";

export const useFormsListLogic = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineInDays, setDeadlineInDays] = useState(7);
  const [pendingAction, setPendingAction] = useState(null);
  const [viewFormDetails, setViewFormDetails] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [formsPage, setFormsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [formsPerPage, setFormsPerPage] = useState(8);
  const [usersPerPage, setUsersPerPage] = useState(9);

  const [formSearchQuery, setFormSearchQuery] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("All");
  const [formDeliveryFilter, setFormDeliveryFilter] = useState("All");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [formSearchInput, setFormSearchInput] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");

  const formTypes = useMemo(
    () => ["All", ...new Set(rows.map((f) => f.type).filter(Boolean))],
    [rows]
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const storedUserId = localStorage.getItem("userId");
        if (storedUserId) {
          setCurrentUserId(parseInt(storedUserId));
          return;
        }
        const res = await api.get("/Auth/current-user");
        const userId = res.data?.data?.userId || res.data?.userId;
        if (userId) {
          setCurrentUserId(userId);
          localStorage.setItem("userId", userId.toString());
        } else {
          toast.error(
            "Unable to retrieve user information. Please login again."
          );
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .get("/FormManagement/all")
      .then(({ data }) => {
        if (!mounted) return;
        const payload = data?.data ?? [];
        setRows(Array.isArray(payload) ? payload : [payload]);
      })
      .catch(() => toast.error("Failed to load forms."))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const fetchAssignedUsers = useCallback(async (formId) => {
    try {
      const response = await api.get(`/Assignments/form/${formId}`);
      const apiData = response.data?.data || response.data || [];
      const ids = apiData
        .filter((a) => (a.action || a.Action) === "Send")
        .map((a) => a.employeeId || a.EmployeeId || a.userId || a.UserId)
        .filter((id) => id !== undefined && id !== null);
      return ids;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!selectedFormId) {
      setUsers([]);
      setAssignedUserIds([]);
      return;
    }
    const fetchUsersBasedOnFormType = async () => {
      try {
        const selectedForm = rows.find((f) => f.formId === selectedFormId);
        if (!selectedForm) return;
        const creatorId = selectedForm?.createdBy;

        const assignedIds = await fetchAssignedUsers(selectedFormId);
        setAssignedUserIds(assignedIds);

        let filteredUsersData = [];
        if (selectedForm.type === "Manager") {
          const managersRes = await apiPort5113.get("/Employees/all-managers");
          filteredUsersData = Array.isArray(managersRes.data?.data)
            ? managersRes.data.data
            : [];
        } else {
          const usersRes = await api.get("/Assignments/upcoming-eligible");
          filteredUsersData = Array.isArray(usersRes.data?.data)
            ? usersRes.data.data
            : [];
        }

        filteredUsersData = filteredUsersData.filter((u) => {
          const role = (
            u.role ||
            u.Role ||
            u.roleCode ||
            u.RoleCode ||
            ""
          ).toUpperCase();
          if (userRoleFilter !== "All") {
            return role === userRoleFilter.toUpperCase();
          }
          return role !== "HR" && role !== "ADMIN";
        });

        filteredUsersData = filteredUsersData.filter(
          (u) =>
            u.userId !== creatorId &&
            !assignedIds.map(String).includes(String(u.userId))
        );

        if (userSearchQuery.trim() !== "") {
          const query = userSearchQuery.toLowerCase();
          filteredUsersData = filteredUsersData.filter(
            (u) =>
              u.firstName?.toLowerCase().includes(query) ||
              u.lastName?.toLowerCase().includes(query)
          );
        }

        setUsers(filteredUsersData);
        setUsersPage(1);
      } catch {
        toast.error("Failed to load eligible users");
      }
    };
    fetchUsersBasedOnFormType();
  }, [
    selectedFormId,
    rows,
    fetchAssignedUsers,
    userSearchQuery,
    userRoleFilter,
  ]);

  const filteredForms = useMemo(() => {
    return rows.filter((form) => {
      if (formSearchQuery.trim() !== "") {
        const query = formSearchQuery.toLowerCase();
        if (
          !(
            form.name?.toLowerCase().includes(query) ||
            form.type?.toLowerCase().includes(query)
          )
        )
          return false;
      }
      if (formTypeFilter !== "All" && form.type !== formTypeFilter)
        return false;
      if (formDeliveryFilter !== "All") {
        if (formDeliveryFilter === "Delivery and Enablement") {
          if (form.deliveryEnablement !== undefined) {
            const val = form.deliveryEnablement.toLowerCase();
            if (
              !(
                val === "deliveryandenablement" ||
                val === "both" ||
                (val.includes("delivery") && val.includes("enablement"))
              )
            ) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          if (form.deliveryEnablement !== formDeliveryFilter) return false;
        }
      }
      return true;
    });
  }, [rows, formSearchQuery, formTypeFilter, formDeliveryFilter]);

  const analytics = useMemo(() => {
    const totalForms = rows.length;
    const managerForms = rows.filter((f) => f.type === "Manager").length;
    const deliveryForms = rows.filter(
      (f) => f.deliveryEnablement === "Delivery"
    ).length;
    const enablementForms = rows.filter(
      (f) => f.deliveryEnablement === "Enablement"
    ).length;
    const assignedUsersCount = assignedUserIds.length;
    return {
      totalForms,
      managerForms,
      deliveryForms,
      enablementForms,
      assignedUsersCount,
    };
  }, [rows, assignedUserIds]);

  const handleFormSelect = (formId) => {
    setSelectedFormId(formId);
    setSelectedUserIds([]);
    setUsersPage(1);
  };

  const toggleUser = (userId) => {
    if (assignedUserIds.map(String).includes(String(userId))) {
      toast.error("This user has already been assigned this form!");
      return;
    }
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const eligibleUsers = users.filter(
      (u) => !assignedUserIds.includes(u.userId)
    );
    const allSelected = eligibleUsers.every((u) =>
      selectedUserIds.includes(u.userId)
    );
    if (allSelected) {
      setSelectedUserIds([]);
      toast.success("All users deselected");
    } else {
      setSelectedUserIds(eligibleUsers.map((u) => u.userId));
      toast.success(`Selected ${eligibleUsers.length} users`);
    }
  };

  const handleClearFilters = () => {
    setFormSearchQuery("");
    setFormSearchInput("");
    setFormTypeFilter("All");
    setFormDeliveryFilter("All");
    setFormsPage(1);
    toast.success("Filters cleared");
  };

  const hasActiveFilters =
    formSearchQuery !== "" ||
    formTypeFilter !== "All" ||
    formDeliveryFilter !== "All";

  const openDeadlineModal = (action) => {
    if (!selectedFormId) {
      toast.error("Please select a form first.");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }
    if (!currentUserId) {
      toast.error(
        "User information not available. Please refresh the page or login again."
      );
      return;
    }
    setPendingAction(action);
    setShowDeadlineModal(true);
  };

  const confirmShare = async () => {
    setShowDeadlineModal(false);
    await shareFormToUsers(pendingAction);
  };

  const shareFormToUsers = async (actionType = "Send") => {
    if (!currentUserId) {
      toast.error(
        "User information not available. Please refresh the page or login again."
      );
      return;
    }
    setSharing(true);
    const loadingToast = toast.loading(
      actionType === "Send" ? "Sharing form to users..." : "Saving as draft..."
    );
    try {
      const payload = {
        formId: selectedFormId,
        userIds: selectedUserIds,
        assignedBy: currentUserId,
        action: actionType,
        deadlineInDays: deadlineInDays || 7,
      };

      const { data } = await api.post("/Assignments/initiate", payload);

      if (data?.success) {
        const appraisals = data.data || [];
        const skipped = data.skipped || [];
        const successfulUserIds = appraisals
          .map((a) => a.userId || a.UserId || a.employeeId || a.EmployeeId)
          .filter(Boolean);

        const alreadyAssignedIds = Array.isArray(skipped)
          ? skipped
              .filter((s) => s.Reason === "Already Assigned")
              .map((s) => s.UserId || s.userId || s.EmployeeId || s.employeeId)
              .filter(Boolean)
          : [];

        const allProcessedUserIds = [
          ...successfulUserIds,
          ...alreadyAssignedIds,
        ];

        setAssignedUserIds((prev) => [
          ...new Set([...prev, ...allProcessedUserIds]),
        ]);

        setUsers((prevUsers) =>
          prevUsers.filter(
            (u) => !allProcessedUserIds.map(String).includes(String(u.userId))
          )
        );

        setSelectedUserIds([]);

        if (appraisals.length > 0) {
          toast.success(
            `Successfully ${
              actionType === "Send" ? "shared" : "saved"
            } form to ${appraisals.length} user(s)!`,
            { id: loadingToast }
          );
        }
        if (skipped.length > 0) {
          const skippedInfo = skipped
            .map((s) => `User ${s.UserId || s.userId}: ${s.Reason}`)
            .join(", ");
        }
        if (appraisals.length === 0 && skipped.length > 0) {
          toast.info(`Selected user(s) already have this form assigned.`, {
            id: loadingToast,
          });
        }
        if (appraisals.length === 0 && skipped.length === 0) {
          toast.error("No appraisals were assigned.", { id: loadingToast });
        }
      } else {
        toast.error("Failed to share form. (Unexpected API result)", {
          id: loadingToast,
        });
      }
    } catch (e) {
      const errorMsg =
        e?.response?.data?.message ||
        e?.response?.data?.title ||
        (actionType === "Send"
          ? "Failed to share form."
          : "Failed to save draft.");
      toast.error(errorMsg, { id: loadingToast });
      console.error("Error details:", e.response?.data);
    } finally {
      setSharing(false);
    }
  };

  const handleView = (form) => {
    setViewFormDetails(form);
  };

  return {
    rows,
    loading,
    users,
    selectedFormId,
    selectedUserIds,
    assignedUserIds,
    sharing,
    showDeadlineModal,
    setShowDeadlineModal,
    deadlineInDays,
    setDeadlineInDays,
    pendingAction,
    viewFormDetails,
    setViewFormDetails,
    currentUserId,
    formsPage,
    setFormsPage,
    usersPage,
    setUsersPage,
    formsPerPage,
    setFormsPerPage,
    usersPerPage,
    setUsersPerPage,
    formSearchQuery,
    setFormSearchQuery,
    formTypeFilter,
    setFormTypeFilter,
    formDeliveryFilter,
    setFormDeliveryFilter,
    userSearchQuery,
    setUserSearchQuery,
    userRoleFilter,
    setUserRoleFilter,
    formSearchInput,
    setFormSearchInput,
    userSearchInput,
    setUserSearchInput,
    formTypes,
    filteredForms,
    analytics,
    handleFormSelect,
    toggleUser,
    handleSelectAll,
    handleClearFilters,
    hasActiveFilters,
    openDeadlineModal,
    confirmShare,
    handleView,
  };
};

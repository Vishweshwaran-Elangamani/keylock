import { useState, useEffect, useRef } from "react";
import {
  getEmployeeAssignments,
  submitSelfAssessment,
  viewSelfAssessment,
} from "../../services/performancemanagement/api/api";
import { getUserRole } from "../../services/performancemanagement/api/rolesapi";
import { toast } from "sonner";

export const useManagerDashboardLogic = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.empId : null;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("submit");
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assessmentData, setAssessmentData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPerPage, setPendingPerPage] = useState(5);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedPerPage, setCompletedPerPage] = useState(5);

  const [pendingFormNameInput, setPendingFormNameInput] = useState("");
  const [pendingFormNameFilter, setPendingFormNameFilter] = useState("");
  const [completedFormNameInput, setCompletedFormNameInput] = useState("");
  const [completedFormNameFilter, setCompletedFormNameFilter] = useState("");

  const recentToastsRef = useRef(new Set());

  const safeToast = (type, message, id, duration = 3000) => {
    const key = id || message;
    if (recentToastsRef.current.has(key)) return;
    recentToastsRef.current.add(key);

    const options = { duration, icon: null };
    switch (type) {
      case "success":
        console.info("SUCCESS:", message);
        break;
      case "info":
        break;
      case "warning":
        toast(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      default:
        toast(message, options);
    }

    setTimeout(() => {
      recentToastsRef.current.delete(key);
    }, duration + 200);
  };

  useEffect(() => {
    if (userId) {
      fetchAssignments();
    }
  }, [userId]);

  const fetchAssignments = async () => {
    if (!userId) {
      safeToast(
        "error",
        "Unable to load manager ID. Please login again.",
        "no-manager-id"
      );
      return;
    }

    setLoading(true);
    setAssignments([]);
    try {
      const roleResponse = await getUserRole(userId);
      if (!roleResponse.data.success) {
        safeToast("error", "User not found.", "user-not-found");
        return;
      }
      const userRole = roleResponse.data.data;
      if (!userRole.isManager) {
        safeToast("error", "This user is not a Manager.", "not-manager");
        return;
      }
      const assignmentRes = await getEmployeeAssignments(userId);
      if (assignmentRes.data.success) {
        setAssignments(assignmentRes.data.data);
        const pending = assignmentRes.data.data.filter(
          (a) => !a.isCompleted
        ).length;
        const completed = assignmentRes.data.data.filter(
          (a) => a.isCompleted
        ).length;
        safeToast(
          "success",
          `Found ${pending} pending and ${completed} completed assessments.`,
          "found-assignments"
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      safeToast("error", "Failed to load data.", "fetch-failed");
    } finally {
      setLoading(false);
    }
  };

  const updateAssessmentData = (competencyId, field, value) => {
    setAssessmentData((prev) =>
      prev.map((item) =>
        item.competencyId === competencyId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmitAssessment = async () => {
    const incompleteRating = assessmentData.filter((item) => !item.rating);
    if (incompleteRating.length > 0) {
      safeToast(
        "warning",
        "Please provide ratings for all competencies.",
        "incomplete-ratings"
      );
      return;
    }

    const incompleteComments = assessmentData.filter(
      (item) => !item.comments || item.comments.trim() === ""
    );
    if (incompleteComments.length > 0) {
      safeToast(
        "warning",
        "Please provide comments for all competencies.",
        "incomplete-comments"
      );
      return;
    }

    setSubmitting(true);
    const payload = {
      formId: currentAssignment.formId,
      userId: parseInt(userId),
      status: "Submitted",
      assessmentDetails: assessmentData.map((item) => ({
        competencyId: item.competencyId,
        employeeRating: parseInt(item.rating),
        employeeComments: item.comments || "",
      })),
    };

    try {
      const response = await submitSelfAssessment(payload);
      if (response.data?.success) {
        toast.success("Form submitted successfully!");
        setShowModal(false);
        await fetchAssignments();
      } else {
        safeToast(
          "error",
          response.data?.message || "Failed.",
          "submit-failed"
        );
      }
    } catch (error) {
      safeToast(
        "error",
        error.response?.data?.message || "Failed.",
        "submit-error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCompleted = async (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("view");
    setSubmitting(true);
    try {
      const { data } = await viewSelfAssessment(assignment.formId, userId);
      if (data.success) {
        const viewData = data.data.details.map((detail) => ({
          competencyId: detail.competencyId,
          competencyName: detail.competencyName,
          competencyDescription: detail.competencyDescription,
          rating: detail.rating,
          comments: detail.comments || "",
        }));
        setAssessmentData(viewData);
        setShowModal(true);
        safeToast(
          "info",
          "Assessment loaded successfully",
          "assessment-loaded"
        );
      } else {
        safeToast(
          "error",
          "Failed to load submitted assessment.",
          "assessment-load-failed"
        );
      }
    } catch (error) {
      console.error("View error:", error);
      safeToast(
        "error",
        "Error loading assessment: " +
          (error.response?.data?.message || error.message),
        "assessment-load-error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssignments = assignments
    .filter((a) => !a.isCompleted)
    .filter((a) =>
      a.formName.toLowerCase().includes(pendingFormNameFilter.toLowerCase())
    );

  const completedAssignments = assignments
    .filter((a) => a.isCompleted)
    .filter((a) =>
      a.formName.toLowerCase().includes(completedFormNameFilter.toLowerCase())
    );

  const getStatistics = () => {
    return {
      total: assignments.length,
      pending: pendingAssignments.length,
      completed: completedAssignments.length,
    };
  };

  return {
    userId,
    assignments,
    loading,
    showModal,
    setShowModal,
    modalMode,
    setModalMode,
    currentAssignment,
    setCurrentAssignment,
    assessmentData,
    setAssessmentData,
    submitting,
    activeTab,
    setActiveTab,
    pendingPage,
    setPendingPage,
    pendingPerPage,
    setPendingPerPage,
    completedPage,
    setCompletedPage,
    completedPerPage,
    setCompletedPerPage,
    pendingFormNameInput,
    setPendingFormNameInput,
    pendingFormNameFilter,
    setPendingFormNameFilter,
    completedFormNameInput,
    setCompletedFormNameInput,
    completedFormNameFilter,
    setCompletedFormNameFilter,
    pendingAssignments,
    completedAssignments,
    updateAssessmentData,
    handleSubmitAssessment,
    handleViewCompleted,
    getStatistics,
  };
};

import { useState, useEffect, useMemo } from "react";
import api from "../../services/performancemanagement/api/api";

export const useHRViewAppraisalsLogic = () => {
  const [loading, setLoading] = useState(true);
  const [appraisals, setAppraisals] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [modalRow, setModalRow] = useState(null);
  const [modalAttachments, setModalAttachments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function fetchAppraisals() {
      try {
        const response = await api.get("/AssessmentDetails/all-details");
        if (response.data?.success) {
          const initiatedAppraisals = response.data.data.filter((appraisal) => {
            const hasInitiatedCompetency = appraisal.competencies.some(
              (comp) => {
                const action = (comp.action || comp.Action || "").toLowerCase();
                return action === "send";
              }
            );
            const hasValidStatus = appraisal.competencies.some((comp) => {
              const status = (comp.status || comp.Status || "").toLowerCase();
              return (
                status !== "" &&
                status !== "draft" &&
                status !== "save as draft"
              );
            });
            return hasInitiatedCompetency || hasValidStatus;
          });
          setAppraisals(initiatedAppraisals);
        } else {
          setError("Failed to load data");
        }
      } catch (err) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    }
    fetchAppraisals();
  }, []);

  function average(values) {
    const arr = values.filter((v) => typeof v === "number");
    if (!arr.length) return "N/A";
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  }

  const allSummaryRows = useMemo(() => {
    return appraisals.map((a, idx) => {
      const empRatings = a.competencies
        .map((c) => c.employeeRating)
        .filter((r) => typeof r === "number");
      const l1Name = a.competencies[0]?.l1ReviewerName || "N/A";
      const l1Ratings = a.competencies
        .map((c) => c.l1Rating)
        .filter((r) => typeof r === "number");
      const l2Name = a.competencies[0]?.l2ReviewerName || "N/A";
      const l2Ratings = a.competencies
        .map((c) => c.l2Rating)
        .filter((r) => typeof r === "number");
      let status = a.competencies[0]?.status ?? "N/A";
      if (a.competencies.some((c) => c.status !== status)) status = "Mixed";
      return {
        key: `${a.employeeId}-${a.projectName}-${idx}`,
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        projectName: a.projectName,
        empAvg: average(empRatings),
        l1ReviewerName: l1Name,
        l1Avg: average(l1Ratings),
        l2ReviewerName: l2Name,
        l2Avg: average(l2Ratings),
        status,
        competencies: a.competencies,
        attachments: a.attachments || [],
      };
    });
  }, [appraisals]);

  const uniqueProjects = useMemo(() => {
    const projects = [{ label: "All Projects", value: "all" }];
    const projectSet = new Set();
    allSummaryRows.forEach((row) => {
      if (row.projectName && !projectSet.has(row.projectName)) {
        projectSet.add(row.projectName);
        projects.push({ label: row.projectName, value: row.projectName });
      }
    });
    return projects;
  }, [allSummaryRows]);

  const summaryRows = useMemo(() => {
    let filtered = [...allSummaryRows];

    if (filterStatus !== "all") {
      filtered = filtered.filter((row) => {
        const status = (row.status || "").toLowerCase();
        if (filterStatus === "completed") return status === "completed";
        if (filterStatus === "pending") return status.startsWith("pending");
        return false;
      });
    }

    if (filterProject !== "all") {
      filtered = filtered.filter((row) => row.projectName === filterProject);
    }

    if (searchTerm.trim() !== "") {
      const search = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((row) =>
        (row.employeeName || "").toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [allSummaryRows, filterStatus, filterProject, searchTerm]);

  const csvData = useMemo(() => {
    return summaryRows.map((r) => ({
      "Employee Name": r.employeeName,
      "Project Name": r.projectName,
      "Employee Average": r.empAvg,
      "L1 Reviewer Name": r.l1ReviewerName,
      "L1 Average": r.l1Avg,
      "L2 Reviewer Name": r.l2ReviewerName,
      "L2 Average": r.l2Avg,
      Status: r.status,
    }));
  }, [summaryRows]);

  const handleViewDetails = (row) => {
    setModalRow(row);
    setModalAttachments(row.attachments || []);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchInput("");
    setFilterStatus("all");
    setFilterProject("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" || filterStatus !== "all" || filterProject !== "all";

  return {
    loading,
    appraisals,
    error,
    searchTerm,
    searchInput,
    setSearchInput,
    filterStatus,
    setFilterStatus,
    filterProject,
    setFilterProject,
    modalRow,
    setModalRow,
    modalAttachments,
    setModalAttachments,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    summaryRows,
    uniqueProjects,
    csvData,
    handleViewDetails,
    handleSearch,
    handleClearFilters,
    hasActiveFilters,
  };
};

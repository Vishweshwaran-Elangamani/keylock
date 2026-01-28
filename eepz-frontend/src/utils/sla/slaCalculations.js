export const getComplianceRating = (percentage) => {
  const pct = Number(percentage) || 0;

  if (pct >= 95) return { rating: "Outstanding", color: "#24A148", icon: "🌟" };
  if (pct >= 85) return { rating: "Excellent", color: "#0F62FE", icon: "⭐" };
  if (pct >= 75) return { rating: "Good", color: "#F1C21B", icon: "" };
  if (pct >= 60) return { rating: "Fair", color: "#FF832B", icon: "⚠️" };
  return { rating: "Critical", color: "#DA1E28", icon: "❌" };
};

export const getComplianceSummary = (slaData) => {
  if (!Array.isArray(slaData) || !slaData?.length) {
    return {
      totalSLAs: 0,
      closedSLAs: 0,
      openSLAs: 0,
      onTimeSLAs: 0,
      breachedSLAs: 0,
      extendedSLAs: 0,
      autoClosedCount: 0,
      compliancePercentage: 0,
      rating: "No Data",
      summary: "No SLAs available",
    };
  }

  const closedSLAs = slaData?.filter?.((sla) => sla?.status === "Closed") ?? [];
  const openSLAs = slaData?.filter?.((sla) => sla?.status !== "Closed") ?? [];
  const autoClosedSLAs =
    closedSLAs?.filter?.((sla) => sla?.isAutoClosed === true) ?? [];

  const onTimeSLAs =
    closedSLAs?.filter?.(
      (sla) =>
        sla?.complianceStatus === "OnTime" ||
        sla?.complianceStatus === "On Time"
    )?.length ?? 0;

  const breachedSLAs =
    closedSLAs?.filter?.((sla) => sla?.complianceStatus === "Breached")
      ?.length ?? 0;

  const extendedSLAs =
    closedSLAs?.filter?.((sla) => sla?.complianceStatus === "Extended")
      ?.length ?? 0;

  const compliancePercentage =
    closedSLAs?.length > 0
      ? ((onTimeSLAs / closedSLAs.length) * 100).toFixed(1)
      : "0";

  const { rating, color, icon } = getComplianceRating(compliancePercentage);

  return {
    totalSLAs: slaData?.length ?? 0,
    closedSLAs: closedSLAs?.length ?? 0,
    openSLAs: openSLAs?.length ?? 0,
    onTimeSLAs,
    breachedSLAs,
    extendedSLAs,
    autoClosedCount: autoClosedSLAs?.length ?? 0,
    compliancePercentage: parseFloat(compliancePercentage) || 0,
    rating,
    color,
    icon,
    summary: `${onTimeSLAs}/${closedSLAs.length} Closed SLAs On Time (${compliancePercentage}%)`,
    autoClosureInfo:
      (autoClosedSLAs?.length ?? 0) > 0
        ? `${autoClosedSLAs.length} auto-closed (${breachedSLAs} breached)`
        : "No auto-closures",
  };
};

export const calculateCompliancePercentage = (slaData) => {
  if (typeof slaData === "number" && typeof arguments?.[1] === "number") {
    const onTimeSLAs = slaData;
    const totalSLAs = arguments?.[1];

    if (!totalSLAs) return 0;

    return ((onTimeSLAs / totalSLAs) * 100).toFixed(1);
  }

  if (!Array.isArray(slaData)) {
    console.warn("Invalid input for compliance calculation");
    return 0;
  }

  const closedSLAs = slaData?.filter?.((sla) => sla?.status === "Closed") ?? [];

  if (!closedSLAs?.length) {
    console.warn("No closed SLAs found for compliance calculation");
    return 0;
  }

  const onTimeClosedSLAs =
    closedSLAs?.filter?.(
      (sla) =>
        sla?.complianceStatus === "OnTime" ||
        sla?.complianceStatus === "On Time"
    )?.length ?? 0;

  const percentage = ((onTimeClosedSLAs / closedSLAs.length) * 100).toFixed(1);

  return percentage;
};

export const calculateDaysUntilDeadline = (deadline) => {
  const now = new Date();
  const deadlineDate = deadline ? new Date(deadline) : null;

  if (!deadlineDate || Number.isNaN(deadlineDate.getTime())) return 0;

  return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
};

export const calculateDepartmentCompliance = (slaData, departmentId) => {
  if (!Array.isArray(slaData) || !departmentId) {
    return null;
  }

  const departmentSLAs =
    slaData?.filter?.((sla) => sla?.departmentId === departmentId) ?? [];

  const departmentClosedSLAs =
    departmentSLAs?.filter?.((sla) => sla?.status === "Closed") ?? [];

  const autoClosedSLAs =
    departmentClosedSLAs?.filter?.((sla) => sla?.isAutoClosed === true) ?? [];

  if (!departmentClosedSLAs?.length) {
    return {
      departmentId,
      totalSLAs: departmentSLAs?.length ?? 0,
      closedSLAs: 0,
      openSLAs:
        departmentSLAs?.filter?.((sla) => sla?.status !== "Closed")?.length ??
        0,
      onTimeSLAs: 0,
      autoClosedCount: 0,
      compliancePercentage: 0,
      message: "No closed SLAs for this department",
    };
  }

  const onTimeSLAs =
    departmentClosedSLAs?.filter?.(
      (sla) =>
        sla?.complianceStatus === "OnTime" ||
        sla?.complianceStatus === "On Time"
    )?.length ?? 0;

  const breachedSLAs =
    departmentClosedSLAs?.filter?.(
      (sla) => sla?.complianceStatus === "Breached"
    )?.length ?? 0;

  const compliancePercentage = (
    (onTimeSLAs / departmentClosedSLAs.length) *
    100
  ).toFixed(1);

  return {
    departmentId,
    totalSLAs: departmentSLAs?.length ?? 0,
    closedSLAs: departmentClosedSLAs?.length ?? 0,
    openSLAs:
      departmentSLAs?.filter?.((sla) => sla?.status !== "Closed")?.length ?? 0,
    onTimeSLAs,
    breachedSLAs,
    autoClosedCount: autoClosedSLAs?.length ?? 0,
    compliancePercentage: parseFloat(compliancePercentage) || 0,
    rating: getComplianceRating(compliancePercentage)?.rating,
    autoClosurePercentage: (
      ((autoClosedSLAs?.length ?? 0) / departmentClosedSLAs.length) *
      100
    ).toFixed(1),
  };
};

export const calculateAllDepartmentsCompliance = (slaData) => {
  if (!Array.isArray(slaData) || !slaData?.length) {
    return [];
  }

  const departments = [
    ...new Set(slaData?.map?.((sla) => sla?.departmentId)),
  ].filter(Boolean);

  return (
    departments
      ?.map?.((deptId) => calculateDepartmentCompliance(slaData, deptId))
      ?.filter?.((result) => result !== null)
      ?.sort?.(
        (a, b) =>
          (b?.compliancePercentage ?? 0) - (a?.compliancePercentage ?? 0)
      ) ?? []
  );
};

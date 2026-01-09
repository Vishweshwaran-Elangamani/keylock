import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import PolicyManagement from "./compliance/PolicyManagement";
import CareerGoals from "./compliance/CareerGoals";
import ComplianceIssues from "./compliance/ComplianceIssues";
import PeriodAllocationManagement from "./compliance/PeriodAllocationManagement";
import Breadcrumb from "../../../components/common/Breadcrumb";
import "../../../styles/hr_operations/hr/HROperations.css";
const HROperations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("hr-operations");
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/policies")) return "policies";
    if (path.includes("/career-goals")) return "career-goals";
    if (path.includes("/compliance")) return "compliance";
    if (path.includes("/period-allocations")) return "period-allocations";
    return "policies";
  };
  const [activeTab, setActiveTab] = useState(getActiveTab());
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);
  const tabs = [
    { key: "policies", label: "Policies", path: "/hr/operations/policies" },
    {
      key: "career-goals",
      label: "Career Goals",
      path: "/hr/operations/career-goals",
    },
    {
      key: "compliance",
      label: "Compliance",
      path: "/hr/operations/compliance",
    },
    {
      key: "period-allocations",
      label: "Budget Allocations",
      path: "/hr/operations/period-allocations",
    },
  ];
  const handleTabChange = (tab) => {
    setActiveTab(tab.key);
    navigate(tab.path);
  };
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };
  const getCurrentTabLabel = () => {
    const currentTab = tabs.find((tab) => tab.key === activeTab);
    return currentTab ? currentTab.label : "Policies";
  };
  return (
    <div className="hr-operations-container">
      <Breadcrumb
        items={[
          {
            label: "HR Operations",
            path: "/hr/operations/dashboard",
          },
          {
            label: getCurrentTabLabel(),
          },
        ]}
      />
      {activeSection === "internal-opportunities" ? (
        <div className="coming-soon-container">
          <div className="coming-soon-icon">
            <i className="bi bi-briefcase"></i>
          </div>
          <h3 className="coming-soon-title">
            Internal Opportunities - Coming Soon
          </h3>
          <p className="coming-soon-subtitle">
            View and manage internal job postings, transfers, and career
            opportunities
          </p>
        </div>
      ) : (
        <>
          <div className="tab-navigation-bar-hrop">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-button-hr ${
                  activeTab === tab.key ? "active" : ""
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="tab-content-hr">
            <Routes>
              <Route path="policies" element={<PolicyManagement />} />
              <Route path="career-goals" element={<CareerGoals />} />
              <Route path="compliance" element={<ComplianceIssues />} />
              <Route
                path="period-allocations"
                element={<PeriodAllocationManagement />}
              />
              <Route path="*" element={<PolicyManagement />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
};
export default HROperations;

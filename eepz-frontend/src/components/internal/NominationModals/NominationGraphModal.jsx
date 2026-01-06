import { useState, useEffect } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import nominationService from "../../../services/internal/nominationService";
import { toast } from "sonner";
import "../../../styles/internal/NominationGraphModal.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SOLID_COLORS = [
  "#27235C", // Total Nominations - Dark Blue
  "#10b981", // Approved - Green
  "#f59e0b", // Pending - Orange
  "#ef4444", // Rejected - Red
];

const NominationGraphModal = ({ show, onHide }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    if (show) {
      fetchAnalytics();
    }
  }, [show]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const response = await nominationService.getMyNominationAnalytics();

    if (response.success) {
      setAnalytics(response.data);
      setChartKey((prev) => prev + 1);
    } else {
      toast.error("Failed to load analytics");
    }
    setLoading(false);
  };

  const getChartData = () => {
    if (!analytics) return null;

    const values = [
      analytics.totalNominations,
      analytics.approved,
      analytics.pending,
      analytics.rejected,
    ];

    if (chartType === "line") {
      return {
        labels: ["Total Nominations", "Approved", "Pending", "Rejected"],
        datasets: [
          {
            label: "Nomination Statistics",
            data: values,
            borderColor: "#27235C",
            backgroundColor: "rgba(39,35,92,0.09)",
            borderWidth: 3,
            pointBackgroundColor: SOLID_COLORS,
            pointBorderColor: SOLID_COLORS,
            pointRadius: 7,
            pointHoverRadius: 10,
            tension: 0.4,
            fill: false,
          },
        ],
      };
    }

    return {
      labels: ["Total Nominations", "Approved", "Pending", "Rejected"],
      datasets: [
        {
          label: "Nomination Statistics",
          data: values,
          backgroundColor: SOLID_COLORS,
          borderColor: "#ffffff",
          borderWidth: 0,
          spacing: 0,
          borderRadius: 0,
        },
      ],
    };
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "My Nomination Statistics",
        font: { size: 16, weight: 600 },
        color: "#27235C",
        padding: { top: 8, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "#27235C",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#fff",
        borderWidth: 1,
      },
    },
  };

  const barOptions = {
    ...commonOptions,
    plugins: { ...commonOptions.plugins, legend: { display: false } },
    scales: {
      x: {
        ticks: { color: "#27235C", font: { weight: 600, size: 11 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#27235C", stepSize: 1, font: { weight: 600, size: 11 } },
        grid: { color: "#f4f4f4" },
      },
    },
  };

  const pieOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: { weight: 600, size: 11 },
          color: "#27235C",
          padding: 12,
        },
      },
    },
  };

  const lineOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#27235C", font: { weight: 600, size: 11 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#27235C", stepSize: 1, font: { weight: 600, size: 11 } },
        grid: { color: "#f4f4f4" },
      },
    },
  };

  if (!show) return null;

  return (
    <>
      <div className="ngm-backdrop" onClick={onHide} />

      <div className="ngm-modal-wrapper">
        <div className="ngm-modal-dialog">
          {/* Modal Header */}
          <div className="ngm-modal-header">
            <div className="ngm-header-title">
              <i className="bi bi-bar-chart-fill"></i>
              Nomination Analytics
            </div>
            <button
              onClick={onHide}
              className="ngm-close-button"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Modal Body */}
          <div className="ngm-modal-body">
            {loading && !analytics ? (
              <div className="ngm-loading">
                <div className="ngm-spinner" />
                <p className="ngm-loading-text">Loading analytics...</p>
              </div>
            ) : analytics ? (
              <>
                {/* Chart Type Selector */}
                <div className="ngm-chart-selector">
                  <button
                    onClick={() => setChartType("bar")}
                    className={`ngm-chart-btn ${
                      chartType === "bar" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-bar-chart-fill"></i>
                    Bar Chart
                  </button>

                  <button
                    onClick={() => setChartType("pie")}
                    className={`ngm-chart-btn ${
                      chartType === "pie" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-pie-chart-fill"></i>
                    Pie Chart
                  </button>

                  <button
                    onClick={() => setChartType("line")}
                    className={`ngm-chart-btn ${
                      chartType === "line" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-graph-up"></i>
                    Line Graph
                  </button>
                </div>

                {/* Chart Container */}
                <div className="ngm-chart-container">
                  {chartType === "bar" && (
                    <Bar
                      key={chartKey}
                      data={getChartData()}
                      options={barOptions}
                    />
                  )}
                  {chartType === "pie" && (
                    <Pie
                      key={chartKey}
                      data={getChartData()}
                      options={pieOptions}
                    />
                  )}
                  {chartType === "line" && (
                    <Line
                      key={chartKey}
                      data={getChartData()}
                      options={lineOptions}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="ngm-empty-state">
                <i className="bi bi-inbox ngm-empty-icon"></i>
                <p className="ngm-empty-text">No analytics data available</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="ngm-modal-footer">
            <button type="button" onClick={onHide} className="ngm-btn-close">
              <i className="bi bi-x-circle"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NominationGraphModal;

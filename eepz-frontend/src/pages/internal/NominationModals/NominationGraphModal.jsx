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
import toastr from "toastr";
import "../../../styles/internal/GraphModal.css";

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
  "#27235C", // Total Nominations - Blue
  "#04c000", // Approved - Green
  "#9D247D", // Pending - Purple
  "#dd7176", // Rejected - Red
];

const NominationGraphModal = ({ show, onHide }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    if (show) fetchAnalytics();
  }, [show]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const response = await nominationService.getMyNominationAnalytics();
    if (response.success) setAnalytics(response.data);
    else toastr.error("Failed to load analytics");
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

    // For Line: single dataset (connect all points), color each point, line blue
    if (chartType === "line") {
      return {
        labels: ["Total Nominations", "Approved", "Pending", "Rejected"],
        datasets: [
          {
            label: "Nomination Statistics",
            data: values,
            borderColor: "#27235C", // Solid blue line
            backgroundColor: "rgba(39,35,92,0.09)",
            borderWidth: 3,
            pointBackgroundColor: SOLID_COLORS, // Each point colored
            pointBorderColor: SOLID_COLORS,
            pointRadius: 7,
            pointHoverRadius: 10,
            tension: 0.4,
            fill: false,
          },
        ],
      };
    }

    // Bar & Pie (default)
    return {
      labels: ["Total Nominations", "Approved", "Pending", "Rejected"],
      datasets: [
        {
          label: "Nomination Statistics",
          data: values,
          backgroundColor: SOLID_COLORS,
          borderColor: SOLID_COLORS,
          borderWidth: 2,
          borderRadius: 8,
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
        font: { size: 18, weight: 600 },
        color: "#27235C",
        padding: { top: 10, bottom: 30 },
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
        ticks: { color: "#27235C", font: { weight: 600 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#27235C", stepSize: 1, font: { weight: 600 } },
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
          font: { weight: 600 },
          color: "#27235C",
          padding: 18,
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
        ticks: { color: "#27235C", font: { weight: 600 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#27235C", stepSize: 1, font: { weight: 600 } },
        grid: { color: "#f4f4f4" },
      },
    },
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom" onClick={onHide}></div>
      <div className="modal-wrapper-custom graph-modal">
        <div className="modal-dialog-custom modal-dialog-large">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-bar-chart-fill"></i>
                Nomination Analytics
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Loading analytics...</p>
                </div>
              ) : analytics ? (
                <>
                  <div className="chart-type-selector">
                    <button
                      className={`chart-type-btn ${
                        chartType === "bar" ? "active" : ""
                      }`}
                      onClick={() => setChartType("bar")}
                    >
                      <i className="bi bi-bar-chart-fill"></i>
                      Bar Chart
                    </button>
                    <button
                      className={`chart-type-btn ${
                        chartType === "pie" ? "active" : ""
                      }`}
                      onClick={() => setChartType("pie")}
                    >
                      <i className="bi bi-pie-chart-fill"></i>
                      Pie Chart
                    </button>
                    <button
                      className={`chart-type-btn ${
                        chartType === "line" ? "active" : ""
                      }`}
                      onClick={() => setChartType("line")}
                    >
                      <i className="bi bi-graph-up"></i>
                      Line Graph
                    </button>
                  </div>
                  <div className="chart-container">
                    {chartType === "bar" && (
                      <Bar data={getChartData()} options={barOptions} />
                    )}
                    {chartType === "pie" && (
                      <Pie data={getChartData()} options={pieOptions} />
                    )}
                    {chartType === "line" && (
                      <Line data={getChartData()} options={lineOptions} />
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <i className="bi bi-inbox"></i>
                  <p>No analytics data available</p>
                </div>
              )}
            </div>
            <div className="modal-footer-custom">
              <button type="button" className="btn-cancel" onClick={onHide}>
                <i className="bi bi-x-circle"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NominationGraphModal;

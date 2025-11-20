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
    else toast.error("Failed to load analytics");
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
      {/* Custom Backdrop with Blur Effect */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(39, 35, 92, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={onHide}
      />

      {/* Modal Wrapper */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}
      >
        {/* Modal Dialog - Large Size for Charts */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header - Navy Blue Theme */}
          <div
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-bar-chart-fill"></i>
              Nomination Analytics
            </div>
            <button
              onClick={onHide}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Modal Body */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#ffffff',
              maxHeight: 'calc(90vh - 140px)'
            }}
          >
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#27235C',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginBottom: '16px'
                  }}
                />
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  Loading analytics...
                </p>
              </div>
            ) : analytics ? (
              <>
                {/* Chart Type Selector */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    onClick={() => setChartType("bar")}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: chartType === "bar" ? '2px solid #27235C' : '1px solid #cbd5e1',
                      background: chartType === "bar" ? '#27235C' : '#ffffff',
                      color: chartType === "bar" ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (chartType !== "bar") {
                        e.target.style.borderColor = '#27235C';
                        e.target.style.color = '#27235C';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (chartType !== "bar") {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.color = '#334155';
                      }
                    }}
                  >
                    <i className="bi bi-bar-chart-fill"></i>
                    Bar Chart
                  </button>

                  <button
                    onClick={() => setChartType("pie")}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: chartType === "pie" ? '2px solid #27235C' : '1px solid #cbd5e1',
                      background: chartType === "pie" ? '#27235C' : '#ffffff',
                      color: chartType === "pie" ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (chartType !== "pie") {
                        e.target.style.borderColor = '#27235C';
                        e.target.style.color = '#27235C';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (chartType !== "pie") {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.color = '#334155';
                      }
                    }}
                  >
                    <i className="bi bi-pie-chart-fill"></i>
                    Pie Chart
                  </button>

                  <button
                    onClick={() => setChartType("line")}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: chartType === "line" ? '2px solid #27235C' : '1px solid #cbd5e1',
                      background: chartType === "line" ? '#27235C' : '#ffffff',
                      color: chartType === "line" ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (chartType !== "line") {
                        e.target.style.borderColor = '#27235C';
                        e.target.style.color = '#27235C';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (chartType !== "line") {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.color = '#334155';
                      }
                    }}
                  >
                    <i className="bi bi-graph-up"></i>
                    Line Graph
                  </button>
                </div>

                {/* Chart Container */}
                <div
                  style={{
                    height: '400px',
                    position: 'relative',
                    padding: '20px',
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
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
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  textAlign: 'center'
                }}
              >
                <i 
                  className="bi bi-inbox" 
                  style={{ 
                    fontSize: '64px', 
                    color: '#cbd5e1',
                    marginBottom: '16px'
                  }}
                ></i>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  No analytics data available
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onHide}
              style={{
                background: '#6c757d',
                borderColor: '#6c757d',
                color: '#ffffff',
                fontWeight: '600',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#5a6268';
                e.target.style.borderColor = '#5a6268';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#6c757d';
                e.target.style.borderColor = '#6c757d';
              }}
            >
              <i className="bi bi-x-circle"></i>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default NominationGraphModal;

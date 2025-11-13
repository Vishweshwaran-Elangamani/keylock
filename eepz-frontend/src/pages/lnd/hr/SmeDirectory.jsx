import { useState, useEffect } from "react";
import { Award, Search, ChevronUp, ChevronDown, Filter } from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";

const SmeDirectory = () => {
  const [smes, setSmes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchSmes();
  }, [currentPage, searchTerm]);

  const fetchSmes = async () => {
    try {
      setLoading(true);
      const response = await lndService.getAllActiveSmes(
        currentPage,
        searchTerm,
        10
      );

      if (response.data.success) {
        setSmes(response.data.data.items);
        setPagination({
          totalCount: response.data.data.totalCount,
          pageNumber: response.data.data.pageNumber,
          pageSize: response.data.data.pageSize,
          totalPages: response.data.data.totalPages,
          hasPreviousPage: response.data.data.hasPreviousPage,
          hasNextPage: response.data.data.hasNextPage,
        });
      }
    } catch (error) {
      console.error("Failed to fetch SMEs:", error);
      toast.error("Failed to load SMEs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Learning & Development", path: "/hr/lnd/dashboard" },
          { label: "SME Directory" },
        ]}
      />

      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            marginBottom: "0.5rem",
            fontWeight: "700",
            color: "#212529",
          }}
        >
          SME Directory
        </h2>
        <p style={{ color: "#6c757d", fontSize: "0.9375rem", margin: 0 }}>
          View all Subject Matter Experts across the organization
        </p>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            gap: "0.5rem",
            maxWidth: "400px",
          }}
        >
          <div style={{ position: "relative", flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Search by SME name or skill... (Press Enter)"
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              style={{
                padding: "0.625rem 1rem",
                paddingRight: "2.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: "0.875rem",
                outline: "none",
                width: "100%",
              }}
            />
            <button
              type="submit"
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6c757d",
              }}
              title="Search"
            >
              <Search size={18} />
            </button>
          </div>
        </form>
      </div>

      {smes.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No SMEs Found"
          message={
            searchTerm
              ? "No SMEs match your search criteria."
              : "No active SMEs in the organization."
          }
        />
      ) : (
        <>
          <div style={{ minHeight: "60vh" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr",
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.875rem",
                  padding: "1rem 1.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em",
                }}
              >
                <div style={{ textAlign: "left" }}>SME Name</div>
                <div style={{ textAlign: "left" }}>Skill</div>
                <div style={{ textAlign: "left" }}>Department</div>
                <div style={{ textAlign: "left" }}>Approved Date</div>
              </div>

              {smes.map((sme, idx) => (
                <div
                  key={sme.smeId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    color: "#212529",
                    padding: "1rem 1.5rem",
                    borderBottom:
                      idx < smes.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: "#fff",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "0.9rem",
                        }}
                      >
                        {sme.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>
                        {sme.employeeName}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "left",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Award size={16} color="#198754" />
                    {sme.skillName}
                  </div>
                  <div style={{ textAlign: "left", color: "#6b7280" }}>
                    {sme.departmentName || "-"}
                  </div>
                  <div style={{ textAlign: "left", color: "#6b7280" }}>
                    {sme.approvedDate
                      ? new Date(sme.approvedDate).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SmeDirectory;

import { useState, useEffect } from "react";
import { Award, Search, ChevronUp, ChevronDown, Filter, Download } from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { toast } from "sonner";


const SmeDirectory = () => {
  const [smes, setSmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);


  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);


  useEffect(() => {
    fetchSmes();
  }, [currentPage, itemsPerPage, searchTerm]);


  const fetchSmes = async () => {
    try {
      setLoading(true);
      const response = await lndService.getAllActiveSmes(
        currentPage,
        searchTerm,
        itemsPerPage
      );


      if (response.data.success) {
        setSmes(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch SMEs:", error);
      toast.error("Failed to load SMEs");
    } finally {
      setLoading(false);
    }
  };


  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      toast.loading("Preparing Excel export...");
      
      const response = await lndService.exportAllActiveSmes(searchTerm);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const filename = `SMEDirectory_${timestamp}.xlsx`;
      
      downloadFile(response.data, filename);
      
      toast.dismiss();
      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.dismiss();
      toast.error("Failed to export SME directory to Excel");
    } finally {
      setExporting(false);
    }
  };


  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };


  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };


  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
  };


  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  if (loading && smes.length === 0) {
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
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "LnD Dashboard", path: "/lnd/dashboard", icon: "" },
          { label: "SME Directory" },
        ]}
      />


      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by SME name or skill..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              style={{ minHeight: "35.7px" }}
            />
            {searchTerm ? (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancelSearch}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSearchSubmit}
              >
                <i className="bi bi-search me-1"></i>
                Search
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleExportToExcel}
          disabled={exporting || smes.length === 0}
          className="btn btn-success"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {exporting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Export to Excel
            </>
          )}
        </button>
      </div>


      {smes.length === 0 && !loading ? (
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
          <div
            style={{
              minHeight: "65vh",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr",
                  background: "rgb(39, 35, 92)",
                  borderBottom: "2px solid #abb4c5ff",
                  fontWeight: 600,
                  color: "white",
                  fontSize: "14px",
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
                    {sme.departmentName || "None"}
                  </div>
                  <div style={{ textAlign: "left", color: "#6b7280" }}>
                    {sme.approvedDate
                      ? new Date(sme.approvedDate).toLocaleDateString()
                      : "None"}
                  </div>
                </div>
              ))}
            </div>
          </div>


          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </>
      )}
    </div>
  );
};


export default SmeDirectory;

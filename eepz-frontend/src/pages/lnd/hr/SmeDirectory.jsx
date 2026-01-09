import { useState, useEffect } from "react";
import {
  Award,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  Download,
} from "lucide-react";
import Breadcrumb from "../../../components/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import styles from "../../../styles/lnd/pages/hr/SmeDirectory.module.css";
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
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
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
      <div className={styles.loadingContainer}>
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
          { label: "LnD Dashboard", path: "/hr/lnd/dashboard", icon: "" },
          { label: "SME Directory" },
        ]}
      />
      <div className={styles.actionBar}>
        <div className={styles.searchWrapper}>
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${styles.searchInput}`}
              placeholder="Search by SME name or skill..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
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
          className={`${styles.exportButton}`}
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
            className={`${styles.tableContainer} ${
              loading ? styles.tableContainerLoading : ""
            }`}
          >
            <div className={styles.tableWrapper}>
              <div className={`${styles.tableHeader} ${styles.gridLayout}`}>
                <div className={styles.cellLeft}>SME Name</div>
                <div className={styles.cellLeft}>Skill</div>
                <div className={styles.cellLeft}>Department</div>
                <div className={styles.cellLeft}>Approved Date</div>
              </div>
              {smes.map((sme, idx) => (
                <div
                  key={sme.smeId}
                  className={`${styles.tableRow} ${styles.gridLayout} ${
                    idx < smes.length - 1 ? styles.tableRowBorder : ""
                  }`}
                >
                  <div className={styles.cellLeft}>
                    <div className={styles.nameContainer}>
                      <span className={styles.nameText}>
                        {sme.employeeName}
                      </span>
                    </div>
                  </div>
                  <div className={styles.skillContainer}>
                    <Award size={16} color="#198754" />
                    {sme.skillName}
                  </div>
                  <div className={styles.grayText}>
                    {sme.departmentName || "None"}
                  </div>
                  <div className={styles.grayText}>
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

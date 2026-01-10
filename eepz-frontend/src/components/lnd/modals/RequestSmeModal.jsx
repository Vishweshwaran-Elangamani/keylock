import { useState, useEffect } from "react";
import { X, Users, AlertCircle, Calendar } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/RequestSmeModal.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

const RequestSmeModal = ({ employeeId, skillId, onClose, onSuccess }) => {
  const [availableSmes, setAvailableSmes] = useState([]);
  const [selectedSmeId, setSelectedSmeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSmes, setFetchingSmes] = useState(true);

  useEffect(() => {
    fetchAvailableSmes();
  }, []);

  const fetchAvailableSmes = async () => {
    try {
      setFetchingSmes(true);

      const response = await lndService.getAvailableSmes({
        skillId: skillId,
        pageNumber: 1,
        searchTerm: "",
        pageSize: 10,
      });

      if (response.data.success) {
        setAvailableSmes(response.data.data.items);
      }
    } catch (error) {
      toast.error(LND_TOASTS.FAILED_TO_LOAD_SMES);
    } finally {
      setFetchingSmes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSmeId) {
      toast.error(LND_TOASTS.SELECT_SME_MESSAGE);
      return;
    }

    try {
      setLoading(true);

      const data = {
        skillId: skillId,
        mentorEmployeeId: selectedSmeId,
        menteeEmployeeId: employeeId,
        deadline: deadline || null,
      };

      const response = await lndService.requestSmeAssignment(data);

      if (response.data.success) {
        onSuccess();
      } else {
        toast.error(response.data.message || LND_TOASTS.FAILED_TO_REQUEST_SME);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || LND_TOASTS.FAILED_TO_REQUEST_SME
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitEnabled =
    !loading && availableSmes.length > 0 && selectedSmeId && deadline;

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (fetchingSmes) {
    return (
      <div className={styles.loadingBackdrop} onClick={onClose}>
        <div className={styles.loadingModal}>
          <div
            className={`spinner-border text-primary ${styles.loadingSpinner}`}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className={styles.loadingText}>Loading available SMEs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h5 className={styles.headerTitle}>Request SME Assignment</h5>
            <button
              type="button"
              onClick={onClose}
              className={`btn-close-white ${styles.btnClose}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "red";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "white";
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.body}>
              {availableSmes.length === 0 ? (
                <div className={styles.noSmesContainer}>
                  <Users
                    size={48}
                    color="#856404"
                    className={styles.noSmesIcon}
                  />
                  <p className={styles.noSmesTitle}>No Available SMEs</p>
                  <p className={styles.noSmesText}>
                    All SMEs for this skill are currently at maximum capacity (3
                    assignments). Please try again later.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className={styles.smesLabel}>
                      Available SMEs ({availableSmes.length})
                    </label>
                    <div className={styles.smesList}>
                      {availableSmes.map((sme) => (
                        <div
                          key={sme.employeeId}
                          className={
                            selectedSmeId === sme.employeeId
                              ? `${styles.smeItem} ${styles.smeItemSelected}`
                              : `${styles.smeItem} ${styles.smeItemUnselected}`
                          }
                          onClick={() => setSelectedSmeId(sme.employeeId)}
                        >
                          <div className={styles.smeContent}>
                            <div className={styles.smeInfo}>
                              <p className={styles.smeName}>
                                {sme.employeeName}
                              </p>
                              <p className={styles.smeAssignments}>
                                Current Assignments: {sme.inProgressAssignments}
                                /3
                              </p>
                            </div>
                            <input
                              type="radio"
                              name="smeSelection"
                              checked={selectedSmeId === sme.employeeId}
                              onChange={() => setSelectedSmeId(sme.employeeId)}
                              className={styles.smeRadio}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.deadlineField}>
                    <label className={styles.deadlineLabel}>
                      <Calendar size={16} />
                      Deadline <span className={styles.required}> *</span>
                    </label>
                    <input
                      type="date"
                      value={deadline || ""}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={getMinDate()}
                      required
                      className={styles.dateInput}
                    />
                  </div>
                </>
              )}
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                className={`btn btn-secondary ${styles.btnCancel}`}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`
                ${styles.btnSubmit}
                ${isSubmitEnabled ? styles.btnSubmitEnabled : ""}
              `}
                disabled={!isSubmitEnabled}
              >
                {loading ? (
                  <>
                    <span
                      className={`spinner-border spinner-border-sm ${styles.loadingSpinner}`}
                      role="status"
                    />
                    Requesting...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RequestSmeModal;

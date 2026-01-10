import { toast } from "sonner";
import { GOAL_TOASTS } from "../../../constants/goals/goalToasts";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  showToast = true,
  toastMessage = null,
  toastType = "success",
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();

      if (showToast) {
        const message = toastMessage || `${confirmText} successful!`;

        switch (toastType) {
          case "success":
            toast.success(message, { duration: 3000 });
            break;
          case "error":
            toast.error(message, { duration: 3000 });
            break;
          case "warning":
            toast.warning(message, { duration: 3000 });
            break;
          case "info":
            toast.info(message, { duration: 3000 });
            break;
          default:
            toast.success(message, { duration: 3000 });
        }
      }

      onClose();
    } catch (error) {
      toast.error(GOAL_TOASTS.ACTION_FAILED, {
        description: error.message || GOAL_TOASTS.ERROR_OCCURED_WHILE_EXECUTION,
        duration: 4000,
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        className="modal show d-block"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          animation: "fadeIn 0.2s ease-in-out",
        }}
        onClick={handleClose}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: "400px",
              minHeight: "200px",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <div
              className="modal-header"
              style={{
                backgroundColor: "rgb(39, 35, 92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h5 className="modal-title" style={{ color: "white" }}>
                {title}
              </h5>
              <button
                type="button"
                className="btn-close-white"
                onClick={handleClose}
                style={{
                  border: "none",
                  width: "36px",
                  backgroundColor: "transparent",
                  height: "36px",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
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
            <div
              className="modal-body"
              style={{
                padding: "2rem",
              }}
            >
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant}`}
                onClick={handleConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;

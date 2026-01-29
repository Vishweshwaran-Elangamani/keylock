import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import EmployeeProfileService from "../../../../services/auth/EmployeeProfileService";
import "../../../../styles/common/ProfilePhotoUploadModal.css";
function ProfilePhotoUploadModal({ onClose, onPhotoUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const validateFile = (file) => {
    if (!file) return { valid: false, error: "No file selected" };
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: "Invalid file type" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: "File size exceeds 5MB" };
    }
    return { valid: true };
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };
  const processFile = (file) => {
    if (!file) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setPosition({ x: 0, y: 0 });
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };
  const handleMouseDown = (e) => {
    if (!preview) return;
    setDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };
  const handleMouseUp = () => {
    setDragging(false);
  };
  const handleTouchStart = (e) => {
    if (!preview) return;
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };
  const handleTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };
  const handleTouchEnd = () => {
    setDragging(false);
  };
  const getCroppedImage = async () => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const size = 300;
      canvas.width = size;
      canvas.height = size;
      const img = new Image();
      img.onload = () => {
        const containerSize = 160;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const scale = Math.max(
          containerSize / img.width,
          containerSize / img.height
        );
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (containerSize - scaledWidth) / 2 + position.x;
        const offsetY = (containerSize - scaledHeight) / 2 + position.y;
        const outputScale = size / containerSize;
        ctx.drawImage(
          img,
          offsetX * outputScale,
          offsetY * outputScale,
          scaledWidth * outputScale,
          scaledHeight * outputScale
        );
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.9
        );
      };
      img.src = preview;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImage();
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: "image/jpeg",
      });
      const formData = new FormData();
      formData.append("ProfilePhoto", croppedFile);
      toast.loading("Uploading photo...");
      const response = await EmployeeProfileService.updateProfilePhoto(
        formData
      );
      toast.dismiss();
      if (response.success) {
        toast.success("Profile photo updated successfully!");
        if (response.data?.profilePhotoBase64) {
          const imageUrl = `data:image/jpeg;base64,${response.data.profilePhotoBase64}`;
          onPhotoUpdate(imageUrl);
        }
        setTimeout(() => onClose(), 500);
      } else {
        toast.error(response.message || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.dismiss();
      toast.error("An error occurred while uploading photo");
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  return (
    <>
      <div className="ppum-backdrop" onClick={onClose} />
      <div className="ppum-modal-container">
        <div className="ppum-modal-dialog">
          <div className="ppum-modal-header">
            <div className="ppum-header-title">
              <i className="bi bi-camera-fill"></i>
              Add Profile Picture
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="ppum-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="ppum-modal-body">
              {preview ? (
                <div className="ppum-preview-section">
                  <div
                    className={`ppum-preview-container ${
                      dragging ? "dragging" : "draggable"
                    }`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      ref={imageRef}
                      src={preview}
                      alt="Preview"
                      draggable={false}
                      className="ppum-preview-image"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                      }}
                    />
                  </div>
                  <p className="ppum-drag-instruction">
                    <i className="bi bi-hand-index"></i> Drag to reposition
                  </p>
                  <p className="ppum-file-name">{selectedFile?.name}</p>
                  <p className="ppum-file-size">
                    {(selectedFile?.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div
                  className={`ppum-upload-area ${
                    dragActive ? "drag-active" : ""
                  } ${uploading ? "disabled" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label
                    htmlFor="photo-upload"
                    className={`ppum-upload-label ${
                      uploading ? "disabled" : ""
                    }`}
                  >
                    <i className="bi bi-cloud-upload ppum-upload-icon"></i>
                    <span className="ppum-upload-text">
                      Choose Image or Drag & Drop
                    </span>
                    <span className="ppum-upload-hint">
                      JPEG, PNG, GIF, WEBP (Max 5MB)
                    </span>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="ppum-upload-input"
                  />
                </div>
              )}
              <div className="ppum-info-box">
                <i className="bi bi-info-circle"></i>
                <small>
                  Image will be automatically optimized for best performance
                </small>
              </div>
            </div>
            <div className="ppum-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="ppum-btn-cancel"
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="ppum-btn-upload"
              >
                {uploading ? (
                  <>
                    <span className="ppum-spinner" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload"></i> Upload Photo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
export default ProfilePhotoUploadModal;

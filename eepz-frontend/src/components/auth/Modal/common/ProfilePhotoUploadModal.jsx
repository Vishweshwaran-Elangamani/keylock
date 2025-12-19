import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import EmployeeProfileService from "../../../../services/auth/EmployeeProfileService";

function ProfilePhotoUploadModal({ onClose, onPhotoUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Image positioning states
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

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
    setPosition({ x: 0, y: 0 }); // Reset position
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

  // ========================
  // IMAGE REPOSITIONING
  // ========================
  const handleMouseDown = (e) => {
    if (!preview) return;
    setDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
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
      y: touch.clientY - position.y
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

  // ========================
  // CROP AND UPLOAD
  // ========================
  const getCroppedImage = async () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const size = 300; // Output size
      canvas.width = size;
      canvas.height = size;

      const img = new Image();
      img.onload = () => {
        const containerSize = 160; // Preview container size
        
        // Draw circular clipped image
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Calculate scale to fill circle
        const scale = Math.max(
          containerSize / img.width,
          containerSize / img.height
        );
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Calculate centered position with offset
        const offsetX = (containerSize - scaledWidth) / 2 + position.x;
        const offsetY = (containerSize - scaledHeight) / 2 + position.y;

        // Scale up for output
        const outputScale = size / containerSize;
        
        ctx.drawImage(
          img,
          offsetX * outputScale,
          offsetY * outputScale,
          scaledWidth * outputScale,
          scaledHeight * outputScale
        );

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
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
        type: 'image/jpeg'
      });

      const formData = new FormData();
      formData.append("ProfilePhoto", croppedFile);

      toast.loading("Uploading photo...");
      const response = await EmployeeProfileService.updateProfilePhoto(formData);

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
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "420px",
          zIndex: 1050,
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "12px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="bi bi-camera-fill"></i>
              Add Profile Picture
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "20px 15px", background: "#fff", textAlign: "center" }}>
              
              {/* Preview Section with Drag */}
              {preview ? (
                <div style={{ marginBottom: 16 }}>
                  {/* Circular Image Preview - Draggable */}
                  <div 
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: "50%",
                      overflow: "hidden",
                      margin: "0 auto 12px",
                      border: "4px solid #27235C",
                      boxShadow: "0 4px 12px rgba(39,35,92,0.2)",
                      position: "relative",
                      cursor: dragging ? "grabbing" : "grab",
                      userSelect: "none",
                    }}
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
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  {/* Drag Instruction */}
                  <p style={{
                    fontSize: 11,
                    color: "#64748b",
                    margin: "0 0 8px 0",
                  }}>
                    <i className="bi bi-hand-index"></i> Drag to reposition
                  </p>

                  {/* File Info */}
                  <p style={{
                    fontSize: 13,
                    color: "#334155",
                    margin: "4px 0",
                    fontWeight: 500,
                    wordBreak: "break-word",
                  }}>
                    {selectedFile?.name}
                  </p>
                  <p style={{
                    fontSize: 12,
                    color: "#64748b",
                    margin: 0,
                  }}>
                    {(selectedFile?.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                /* Upload Area */
                <div 
                  style={{
                    border: dragActive ? "3px dashed #27235C" : "3px dashed #cbd5e1",
                    borderRadius: 12,
                    padding: "30px 20px",
                    background: dragActive ? "#f8f9fa" : "#f9fafb",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label 
                    htmlFor="photo-upload" 
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      cursor: uploading ? "not-allowed" : "pointer",
                    }}
                  >
                    <i 
                      className="bi bi-cloud-upload" 
                      style={{ fontSize: 42, color: "#27235C" }}
                    ></i>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                      Choose Image or Drag & Drop
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      JPEG, PNG, GIF, WEBP (Max 5MB)
                    </span>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                </div>
              )}

              {/* Info */}
              <div style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: 6,
                fontSize: 11,
                padding: "6px 8px",
                gap: 6,
                marginTop: 12,
              }}>
                <i className="bi bi-info-circle"></i>
                <small>Image will be automatically optimized for best performance</small>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{
              padding: "10px 15px",
              borderTop: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  if (!uploading) e.target.style.background = "#5a6268";
                }}
                onMouseLeave={e => {
                  if (!uploading) e.target.style.background = "#6c757d";
                }}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                style={{
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                  cursor: (!selectedFile || uploading) ? "not-allowed" : "pointer",
                  opacity: (!selectedFile || uploading) ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  if (selectedFile && !uploading) e.target.style.opacity = 0.93;
                }}
                onMouseLeave={e => {
                  if (selectedFile && !uploading) e.target.style.opacity = 1;
                }}
              >
                {uploading ? (
                  <>
                    <span style={{
                      width: 14, height: 14,
                      border: "2px solid #fff",
                      borderTop: "2px solid #E01950",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }} />
                    Uploading...
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);}}`}</style>
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

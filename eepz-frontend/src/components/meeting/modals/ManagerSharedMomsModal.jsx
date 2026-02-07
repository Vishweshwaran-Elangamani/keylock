import React, { useEffect, useState } from "react";
import momService from "../../../services/meeting/momService";
import toastr from "toastr";
import MomDetailsView from "./MomDetailsView";
import { Inbox, Eye, Calendar, Users, AlertCircle } from "lucide-react";

import "../../../styles/mom/modals/ManagerSharedMomModal.css";
 
const ManagerSharedMomsModal = ({ onClose }) => {
  const [sharedWithMeMoms, setSharedWithMeMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMom, setSelectedMom] = useState(null);
  const [error, setError] = useState(null);
 
  const get = (obj, ...keys) =>
    keys.reduce((v, k) => v ?? obj?.[k], null);
 
  useEffect(() => {
    loadSharedMoms();
  }, []);
 
  const loadSharedMoms = async () => {
    try {
      setLoading(true);
      const res = await momService.getMomsSharedWithMe();
      const rows = res?.data || res?.Data || res || [];
 
      const enriched = await Promise.all(
        rows.map(async (row) => {
          try {
            const momId = get(row, "momId", "MomId", "momID", "MOMID");
            if (!momId) return row;
 
            const momRes = await momService.getMomById(momId);
            const fullMom = momRes?.data || momRes?.Data || momRes;
 
            return { ...row, fullMom };
          } catch {
            return row;
          }
        })
      );
 
      setSharedWithMeMoms(enriched);
    } catch {
      setError("Failed to load shared MOMs");
      toastr.error("Failed to load shared MOMs");
    } finally {
      setLoading(false);
    }
  };
 
  const handleViewMom = async (momId) => {
    try {
      const res = await momService.getMomById(momId);
      setSelectedMom(res?.data || res?.Data || res);
    } catch {
      toastr.error("Failed to load MOM details");
    }
  };
 
  const formatDate = (d) =>
    !d ? "N/A" : isNaN(new Date(d)) ? "N/A" : new Date(d).toLocaleDateString();
 
  return (
    <>
      <div className="mgr-smm-overlay" onClick={onClose}>
        <div className="mgr-smm-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="mgr-smm-content">
 
            {/* HEADER */}
            <div className="mgr-smm-header">
              <div className="mgr-smm-header-top">
                <h5 className="mgr-smm-title">Shared MOMs</h5>
                <button className="mgr-smm-x" onClick={onClose}>✕</button>
              </div>
              <div className="mgr-smm-tabs">
                <button className="mgr-smm-tab active">Shared With Me</button>
              </div>
            </div>
 
            <div className="mgr-smm-body">
              {error && (
                <div className="alert alert-danger m-3 d-flex align-items-center gap-2">
                  <AlertCircle size={20} /> {error}
                </div>
              )}
 
              {loading ? (
                <div className="text-center py-5">Loading...</div>
              ) : sharedWithMeMoms.length === 0 ? (
                <div className="text-center py-5">
                  <Inbox size={48} className="text-muted mb-3" />
                  <h6 className="fw-semibold text-muted">No MOMs shared</h6>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table mgr-smm-table">
                    <thead className="mgr-smm-thead">
                      <tr>
                        <th>Meeting Title</th>
                        <th>Type</th>
                        <th>Meeting Date</th>
                        <th>Shared By</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedWithMeMoms.map((mom, i) => {
                        const momId = get(mom, "momId", "MomId", "momID");
 
                        const meetingDate = get(
                          mom,
                          "meetingDate",
                          "MeetingDate",
                          mom.fullMom
                        );
 
                        const sharedBy =
                          get(
                            mom,
                            "sharedByEmployeeName",
                            "SubmittedByEmployeeName"
                          ) ||
                          get(
                            mom.fullMom,
                            "createdByName",
                            "organizerName"
                          ) ||
                          "Unknown";
 
                        return (
                          <tr key={i} className="mgr-smm-row">
                            <td className="mgr-smm-td mgr-smm-td-clickable" onClick={() => handleViewMom(momId)}>
                              <div className="mgr-smm-title-cell">
                                {get(mom, "meetingTitle", "MeetingTitle") ||
                                  get(mom.fullMom, "meetingTitle", "MeetingTitle") ||
                                  "Untitled"}
                              </div>
                              <small className="mgr-smm-subtext">
                                <Calendar size={12} /> {formatDate(meetingDate)}
                              </small>
                            </td>
 
                            <td className="mgr-smm-td">
                              <span className="mgr-smm-type-pill">
                                {get(mom, "meetingType", "MeetingType") ||
                                  get(mom.fullMom, "meetingType", "MeetingType") ||
                                  "Other"}
                              </span>
                            </td>
 
                            <td className="mgr-smm-td">{formatDate(meetingDate)}</td>
 
                            <td className="mgr-smm-td">
                              <Users size={14} className="me-1" />
                              {sharedBy}
                            </td>
 
                            <td className="mgr-smm-td text-center">
                              <button
                                className="mgr-smm-view-btn btn btn-sm"
                                onClick={() => handleViewMom(momId)}
                              >
                                <Eye size={14} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
 
            <div className="mgr-smm-footer">
              <button className="mgr-smm-close-btn btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
 
      {selectedMom && (
        <MomDetailsView mom={selectedMom} onClose={() => setSelectedMom(null)} />
      )}
    </>
  );
};
 
export default ManagerSharedMomsModal;
 
 
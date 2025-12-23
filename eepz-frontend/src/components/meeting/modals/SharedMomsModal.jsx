// SharedMomsModal.jsx
import React, { useState, useEffect } from 'react';
import momService from '../../../services/meeting/momService';
import toastr from 'toastr';
import MomDetailsView from './MomDetailsView';

const PRIMARY = '#27235C'; // primary blue

const SharedMomsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('sharedByMe');
  const [sharedByMeMoms, setSharedByMeMoms] = useState([]);
  const [sharedWithMeMoms, setSharedWithMeMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMom, setSelectedMom] = useState(null);

  useEffect(() => {
    loadSharedMoms();
  }, [activeTab]);

  const loadSharedMoms = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sharedByMe') {
        const response = await momService.getMomsSharedByMe();
        const rows = response.data || [];

        const withDetails = await Promise.all(
          rows.map(async (row) => {
            try {
              const momRes = await momService.getMomById(row.momId);
              return {
                ...row,
                fullMom: momRes.data || null,
              };
            } catch (e) {
              console.error(
                'Failed to load full MOM for sharedByMe row',
                row.momId,
                e
              );
              return { ...row, fullMom: null };
            }
          })
        );

        setSharedByMeMoms(withDetails);
      } else {
        const response = await momService.getMomsSharedWithMe();
        setSharedWithMeMoms(response.data || []);
      }
    } catch (error) {
      toastr.error('Failed to load shared MOMs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMom = async (momId) => {
    try {
      const response = await momService.getMomById(momId);
      setSelectedMom(response.data);
    } catch (error) {
      toastr.error('Failed to load MOM details');
      console.error(error);
    }
  };

  const currentMoms =
    activeTab === 'sharedByMe' ? sharedByMeMoms : sharedWithMeMoms;

  const getMeetingType = (row) => {
    const src =
      activeTab === 'sharedByMe'
        ? row.fullMom || row
        : row;

    return (
      src.meetingType ||
      src.MeetingType ||
      src.mom?.meetingType ||
      src.mom?.MeetingType ||
      src.Mom?.meetingType ||
      src.Mom?.MeetingType ||
      ''
    );
  };

  return (
    <>
      {/* MAIN SHARED MOMs MODAL */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          backgroundColor: 'rgba(15, 23, 42, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          style={{
            margin: 0,
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content border-0 shadow-lg"
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              maxWidth: '800px',
              marginLeft: '50px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* HEADER */}
            <div
              className="modal-header border-0"
              style={{
                backgroundColor: PRIMARY,
                padding: '1.5rem',
                textAlign: 'left',
              }}
            >
              <div className="w-100" style={{ textAlign: 'left' }}>
                <h5
                  className="modal-title fw-bold mb-3"
                  style={{
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    textAlign: 'left',
                  }}
                >
                  Shared MOMs
                </h5>

                {/* Tabs */}
                <ul className="nav nav-pills">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === 'sharedByMe' ? 'active' : ''
                      }`}
                      onClick={() => setActiveTab('sharedByMe')}
                      style={{
                        backgroundColor:
                          activeTab === 'sharedByMe'
                            ? '#D84796'
                            : 'rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        transition: 'all 0.2s',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: activeTab === 'sharedByMe' ? 600 : 400,
                      }}
                    >
                      <i className="bi bi-share me-2" />
                      Shared By Me
                    </button>
                  </li>
                  <li className="nav-item ms-2">
                    <button
                      className={`nav-link ${
                        activeTab === 'sharedWithMe' ? 'active' : ''
                      }`}
                      onClick={() => setActiveTab('sharedWithMe')}
                      style={{
                        backgroundColor:
                          activeTab === 'sharedWithMe'
                            ? '#D84796'
                            : 'rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        transition: 'all 0.2s',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: activeTab === 'sharedWithMe' ? 600 : 400,
                      }}
                    >
                      <i className="bi bi-inbox me-2" />
                      Shared With Me
                    </button>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* BODY */}
            <div
              className="modal-body p-0"
              style={{
                textAlign: 'left',
                maxHeight: 'calc(90vh - 170px)',
                overflowY: 'auto',
              }}
            >
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Loading shared MOMs...</p>
                </div>
              ) : currentMoms.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    className="mb-3"
                    style={{ fontSize: '3.5rem', opacity: 0.3 }}
                  >
                    <i className="bi bi-inbox" />
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">
                    No {activeTab === 'sharedByMe' ? 'shared' : 'received'} MOMs
                    found
                  </h6>
                  <p className="text-muted small">
                    {activeTab === 'sharedByMe'
                      ? "You haven't shared any MOMs yet"
                      : 'No MOMs have been shared with you'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead
                      style={{
                        backgroundColor: '#f8f9fa',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      <tr style={{ textAlign: 'left' }}>
                        <th
                          className="px-4 py-3 fw-semibold"
                          style={{ textAlign: 'left' }}
                        >
                          Meeting Title
                        </th>
                        <th
                          className="px-4 py-3 fw-semibold"
                          style={{ textAlign: 'left' }}
                        >
                          Type
                        </th>
                        <th
                          className="px-4 py-3 fw-semibold"
                          style={{ textAlign: 'left' }}
                        >
                          Date
                        </th>
                        <th
                          className="px-4 py-3 fw-semibold"
                          style={{ textAlign: 'left' }}
                        >
                          {activeTab === 'sharedByMe'
                            ? 'Shared With'
                            : 'Shared By'}
                        </th>
                        <th className="px-4 py-3 fw-semibold text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMoms.map((mom, index) => {
                        const meetingType = getMeetingType(mom);
                        return (
                          <tr
                            key={`shared-mom-${activeTab}-${mom.momId}-${index}`}
                            style={{
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor = '#f8f9fa')
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'transparent')
                            }
                          >
                            <td
                              className="px-4 py-3"
                              style={{ textAlign: 'left' }}
                              onClick={() => handleViewMom(mom.momId)}
                            >
                              <div
                                className="fw-semibold"
                                style={{ textAlign: 'left' }}
                              >
                                {mom.meetingTitle}
                              </div>
                              {mom.meetingDate && (
                                <small
                                  className="text-muted"
                                  style={{ textAlign: 'left' }}
                                >
                                  <i className="bi bi-calendar3 me-1" />
                                  {new Date(
                                    mom.meetingDate
                                  ).toLocaleDateString()}
                                </small>
                              )}
                            </td>
                            <td
                              className="px-4 py-3"
                              style={{ textAlign: 'left' }}
                            >
                              <span className="badge bg-primary-subtle text-primary">
                                {meetingType || 'N/A'}
                              </span>
                            </td>
                            <td
                              className="px-4 py-3"
                              style={{ textAlign: 'left' }}
                            >
                              {activeTab === 'sharedByMe'
                                ? mom.sharedAt
                                  ? new Date(
                                      mom.sharedAt
                                    ).toLocaleDateString()
                                  : 'N/A'
                                : mom.meetingDate
                                ? new Date(
                                    mom.meetingDate
                                  ).toLocaleDateString()
                                : mom.sharedAt
                                ? new Date(
                                    mom.sharedAt
                                  ).toLocaleDateString()
                                : 'N/A'}
                            </td>
                            <td
                              className="px-4 py-3"
                              style={{ textAlign: 'left' }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-person-circle text-muted" />
                                <span style={{ textAlign: 'left' }}>
                                  {activeTab === 'sharedByMe'
                                    ? mom.sharedWithEmployeeName || 'Unknown'
                                    : mom.sharedByEmployeeName ||
                                      mom.submittedByEmployeeName ||
                                      'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                className="btn btn-sm d-flex align-items-center gap-1 mx-auto"
                                onClick={() => handleViewMom(mom.momId)}
                                style={{
                                  borderRadius: '8px',
                                  border: '1px solid #d1d5db',
                                  color: '#27235C',
                                  backgroundColor: '#ffffff',
                                  fontWeight: 500,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    '#27235C';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    '#ffffff';
                                  e.currentTarget.style.color = '#27235C';
                                }}
                              >
                                <i className="bi bi-eye" />
                                View
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

            {/* FOOTER */}
            <div
              className="modal-footer border-0"
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#f8f9fa',
                textAlign: 'left',
              }}
            >
              <span
                className="text-muted small me-auto"
                style={{ textAlign: 'left' }}
              >
                Showing {currentMoms.length}{' '}
                {activeTab === 'sharedByMe' ? 'shared' : 'received'} MOM
                {currentMoms.length !== 1 ? 's' : ''}
              </span>
              <button
                className="btn btn-secondary px-4"
                onClick={onClose}
                style={{ borderRadius: '8px', padding: '0.5rem 1.5rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested details modal */}
      {selectedMom && (
        <MomDetailsView
          mom={selectedMom}
          onClose={() => setSelectedMom(null)}
        />
      )}

      <style>{`
        .modal.show.d-block {
          display: flex !important;
        }
      `}</style>
    </>
  );
};

export default SharedMomsModal;

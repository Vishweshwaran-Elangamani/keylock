// src/components/Meeting/SharedMomsModal.jsx
import React, { useState, useEffect } from 'react';
import momService from '../../../services/meeting/momService';
import toastr from 'toastr';
import MomDetailsView from './MomDetailsView';

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
        setSharedByMeMoms(response.data || []);
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

  const currentMoms = activeTab === 'sharedByMe' ? sharedByMeMoms : sharedWithMeMoms;

  return (
    <>
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose}
      >
        <div 
          className="modal-dialog modal-dialog-scrollable modal-xl modal-dialog-centered" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            {/* ✅ UPDATED: Dark purple header with white text */}
            <div 
              className="modal-header border-0" 
              style={{ 
                backgroundColor: '#3C3668',
                padding: '1.5rem',
                textAlign: 'left'
              }}
            >
              <div className="w-100" style={{ textAlign: 'left' }}>
                <h5 className="modal-title fw-bold mb-3" style={{ color: 'white', fontSize: '1.25rem', textAlign: 'left' }}>
                  Shared MOMs
                </h5>
                {/* ✅ UPDATED: Tab navigation with updated styling */}
                <ul className="nav nav-pills">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'sharedByMe' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('sharedByMe')}
                      style={{ 
                        backgroundColor: activeTab === 'sharedByMe' ? '#D84796' : 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        transition: 'all 0.2s',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: activeTab === 'sharedByMe' ? 600 : 400
                      }}
                    >
                      <i className="bi bi-share me-2"></i>Shared By Me
                    </button>
                  </li>
                  <li className="nav-item ms-2">
                    <button 
                      className={`nav-link ${activeTab === 'sharedWithMe' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('sharedWithMe')}
                      style={{ 
                        backgroundColor: activeTab === 'sharedWithMe' ? '#D84796' : 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        transition: 'all 0.2s',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: activeTab === 'sharedWithMe' ? 600 : 400
                      }}
                    >
                      <i className="bi bi-inbox me-2"></i>Shared With Me
                    </button>
                  </li>
                </ul>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            </div>

            {/* ✅ UPDATED: Body with left-aligned content */}
            <div className="modal-body p-0" style={{ textAlign: 'left' }}>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Loading shared MOMs...</p>
                </div>
              ) : currentMoms.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3" style={{ fontSize: '3.5rem', opacity: 0.3 }}>
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">No {activeTab === 'sharedByMe' ? 'shared' : 'received'} MOMs found</h6>
                  <p className="text-muted small">
                    {activeTab === 'sharedByMe' 
                      ? 'You haven\'t shared any MOMs yet' 
                      : 'No MOMs have been shared with you'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    {/* ✅ UPDATED: Left-aligned table headers */}
                    <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ textAlign: 'left' }}>
                        <th className="px-4 py-3 fw-semibold" style={{ textAlign: 'left' }}>Meeting Title</th>
                        <th className="px-4 py-3 fw-semibold" style={{ textAlign: 'left' }}>Type</th>
                        <th className="px-4 py-3 fw-semibold" style={{ textAlign: 'left' }}>Date</th>
                        <th className="px-4 py-3 fw-semibold" style={{ textAlign: 'left' }}>
                          {activeTab === 'sharedByMe' ? 'Shared With' : 'Shared By'}
                        </th>
                        <th className="px-4 py-3 fw-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    {/* ✅ UPDATED: Left-aligned table body */}
                    <tbody>
                      {currentMoms.map((mom, index) => (
                        <tr 
                          key={`shared-mom-${activeTab}-${mom.momId}-${index}`}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td className="px-4 py-3" style={{ textAlign: 'left' }} onClick={() => handleViewMom(mom.momId)}>
                            <div className="fw-semibold" style={{ textAlign: 'left' }}>{mom.meetingTitle}</div>
                            {mom.meetingDate && (
                              <small className="text-muted" style={{ textAlign: 'left' }}>
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date(mom.meetingDate).toLocaleDateString()}
                              </small>
                            )}
                          </td>
                          <td className="px-4 py-3" style={{ textAlign: 'left' }}>
                            <span className="badge bg-primary-subtle text-primary">
                              {mom.meetingType || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3" style={{ textAlign: 'left' }}>
                            {activeTab === 'sharedByMe' 
                              ? (mom.sharedAt ? new Date(mom.sharedAt).toLocaleDateString() : 'N/A')
                              : (mom.meetingDate ? new Date(mom.meetingDate).toLocaleDateString() : mom.sharedAt ? new Date(mom.sharedAt).toLocaleDateString() : 'N/A')}
                          </td>
                          <td className="px-4 py-3" style={{ textAlign: 'left' }}>
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-person-circle text-muted"></i>
                              <span style={{ textAlign: 'left' }}>
                                {activeTab === 'sharedByMe' 
                                  ? (mom.sharedWithEmployeeName || 'Unknown')
                                  : (mom.sharedByEmployeeName || mom.submittedByEmployeeName || 'Unknown')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mx-auto" 
                              onClick={() => handleViewMom(mom.momId)}
                              style={{ borderRadius: '8px' }}
                            >
                              <i className="bi bi-eye"></i> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ✅ UPDATED: Footer with consistent styling */}
            <div 
              className="modal-footer border-0" 
              style={{ 
                padding: '1rem 2rem', 
                backgroundColor: '#f8f9fa',
                textAlign: 'left'
              }}
            >
              <span className="text-muted small me-auto" style={{ textAlign: 'left' }}>
                Showing {currentMoms.length} {activeTab === 'sharedByMe' ? 'shared' : 'received'} MOM{currentMoms.length !== 1 ? 's' : ''}
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

      {/* ✅ UNCHANGED: Nested MOM Details Modal */}
      {selectedMom && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060, backdropFilter: 'blur(6px)' }} 
          onClick={() => setSelectedMom(null)}
        >
          <div 
            className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered" 
            onClick={(e) => e.stopPropagation()}
          >
            <MomDetailsView mom={selectedMom} onClose={() => setSelectedMom(null)} />
          </div>
        </div>
      )}
    </>
  );
};

export default SharedMomsModal;

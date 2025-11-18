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
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
            <div className="modal-header border-0" style={{ padding: '1.5rem' }}>
              <div className="w-100">
                <h5 className="modal-title fw-bold mb-3">Shared MOMs</h5>
                <ul className="nav nav-pills">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'sharedByMe' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('sharedByMe')}
                      style={{ 
                        backgroundColor: activeTab === 'sharedByMe' ? '#5046e5' : 'transparent', 
                        color: activeTab === 'sharedByMe' ? 'white' : '#6c757d',
                        transition: 'all 0.2s'
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
                        backgroundColor: activeTab === 'sharedWithMe' ? '#5046e5' : 'transparent', 
                        color: activeTab === 'sharedWithMe' ? 'white' : '#6c757d',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className="bi bi-inbox me-2"></i>Shared With Me
                    </button>
                  </li>
                </ul>
              </div>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body p-0">
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
                    <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th className="px-4 py-3 fw-semibold">Meeting Title</th>
                        <th className="px-4 py-3 fw-semibold">Type</th>
                        <th className="px-4 py-3 fw-semibold">Date</th>
                        <th className="px-4 py-3 fw-semibold">
                          {activeTab === 'sharedByMe' ? 'Shared With' : 'Shared By'}
                        </th>
                        <th className="px-4 py-3 fw-semibold text-center">Actions</th>
                      </tr>
                    </thead>
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
                          <td className="px-4 py-3" onClick={() => handleViewMom(mom.momId)}>
                            <div className="fw-semibold">{mom.meetingTitle}</div>
                            {mom.meetingDate && (
                              <small className="text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date(mom.meetingDate).toLocaleDateString()}
                              </small>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-primary-subtle text-primary">
                              {mom.meetingType || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {activeTab === 'sharedByMe' 
                              ? (mom.sharedAt ? new Date(mom.sharedAt).toLocaleDateString() : 'N/A')
                              : (mom.meetingDate ? new Date(mom.meetingDate).toLocaleDateString() : mom.sharedAt ? new Date(mom.sharedAt).toLocaleDateString() : 'N/A')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-person-circle text-muted"></i>
                              {activeTab === 'sharedByMe' 
                                ? (mom.sharedWithEmployeeName || 'Unknown')
                                : (mom.sharedByEmployeeName || mom.submittedByEmployeeName || 'Unknown')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mx-auto" 
                              onClick={() => handleViewMom(mom.momId)}
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
            <div className="modal-footer border-0 bg-light" style={{ padding: '1rem 1.5rem' }}>
              <span className="text-muted small me-auto">
                Showing {currentMoms.length} {activeTab === 'sharedByMe' ? 'shared' : 'received'} MOM{currentMoms.length !== 1 ? 's' : ''}
              </span>
              <button className="btn btn-secondary px-4" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>

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

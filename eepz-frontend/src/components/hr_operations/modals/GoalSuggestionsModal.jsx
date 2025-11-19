import { Modal, Spinner, CloseButton } from "react-bootstrap";

const GoalSuggestionsModal = ({ 
  show, 
  onHide, 
  goalSuggestions, 
  loadingSuggestions 
}) => {
  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
      {show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(39, 35, 92, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1040,
            transition: 'all 0.3s ease'
          }}
          onClick={onHide}
        />
      )}

      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        centered
        backdrop={false}
        style={{ zIndex: 1050 }}
      >
        <div style={{
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          border: 'none'
        }}>
          {/* HEADER with White Close Button */}
          <div 
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <div 
              style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '4px',
                color: '#ffffff'
              }}
            >
              <span>Goal Suggestions for</span>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '400',
                color: '#e0e7ff',
                fontStyle: 'italic'
              }}>
                {goalSuggestions?.email}
              </span>
            </div>
            <CloseButton 
              onClick={onHide}
              variant="white"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: 1
              }}
            />
          </div>
          
          {/* BODY */}
          <Modal.Body 
            style={{ 
              padding: '20px', 
              background: '#ffffff',
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 140px)',
              border: 'none',
              minHeight: '200px'
            }}
          >
            {loadingSuggestions ? (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <Spinner 
                  animation="border" 
                  style={{ 
                    color: '#27235C',
                    width: '3rem',
                    height: '3rem'
                  }}
                />
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '14px',
                  margin: 0
                }}>
                  Loading suggestions...
                </p>
              </div>
            ) : (
              <ul 
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {goalSuggestions &&
                  goalSuggestions.suggestions.map((g, idx) => (
                    <li 
                      key={idx} 
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 35, 92, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Header */}
                      <div 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <span 
                          style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#1e293b',
                            flex: 1
                          }}
                        >
                          {g.goalTitle}
                        </span>
                        <span 
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3'
                          }}
                        >
                          {g.goalType}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <div 
                        style={{
                          fontSize: '13px',
                          color: '#64748b',
                          lineHeight: '1.6',
                          marginBottom: '12px'
                        }}
                      >
                        {g.goalDescription}
                      </div>
                      
                      {/* Meta Information */}
                      <div 
                        style={{
                          display: 'flex',
                          gap: '16px',
                          fontSize: '12px',
                          color: '#475569',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Priority: 
                          <strong 
                            style={{
                              color: g.priority === 'High' ? '#dc2626' : 
                                     g.priority === 'Medium' ? '#ea580c' : '#16a34a',
                              fontWeight: '600'
                            }}
                          >
                            {g.priority}
                          </strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Duration: 
                          <strong style={{ color: '#1e293b', fontWeight: '600' }}>
                            {g.estimatedDuration}
                          </strong>
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </Modal.Body>
        </div>
      </Modal>
    </>
  );
};

export default GoalSuggestionsModal;

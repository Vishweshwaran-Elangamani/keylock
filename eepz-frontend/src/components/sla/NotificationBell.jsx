// src/components/sla/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle } from 'lucide-react';
import slaService from '../../services/slaService';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await slaService.getNotifications(user.empId, true);
      
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await slaService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await Promise.all(notifications.map(n => slaService.markNotificationAsRead(n.notificationId)));
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Reminder':
        return <AlertCircle size={16} color="#E2B93B" />;
      case 'AutoClosure':
        return <AlertCircle size={16} color="#E01950" />;
      case 'Escalation':
        return <AlertCircle size={16} color="#0F62FE" />;
      default:
        return <Bell size={16} color="#6B7280" />;
    }
  };

  return (
    <div className="position-relative">
      {/* Bell Icon */}
      <button
        className="btn btn-light position-relative rounded-circle p-2"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ width: '40px', height: '40px' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100" 
            style={{ zIndex: 1040 }}
            onClick={() => setShowDropdown(false)}
          />
          <div 
            className="position-absolute end-0 mt-2 bg-white rounded shadow-lg"
            style={{ 
              width: '400px', 
              maxHeight: '500px',
              zIndex: 1050,
              borderRadius: '12px'
            }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h6 className="mb-0 fw-semibold">Notifications</h6>
              <div className="d-flex gap-2">
                {notifications.length > 0 && (
                  <button
                    className="btn btn-sm btn-link text-decoration-none p-0"
                    onClick={markAllAsRead}
                    disabled={loading}
                  >
                    <Check size={16} /> Mark all read
                  </button>
                )}
                <button
                  className="btn btn-sm btn-link text-decoration-none p-0"
                  onClick={() => setShowDropdown(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="text-center py-5">
                  <Bell size={48} className="text-muted mb-3" />
                  <p className="text-muted mb-0">No new notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.notificationId}
                    className="border-bottom p-3 position-relative"
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div className="d-flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notificationType)}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold mb-1 small">{notification.subject}</div>
                        <p className="mb-2 small text-muted" style={{ fontSize: '0.813rem' }}>
                          {notification.message}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {new Date(notification.sentAt).toLocaleDateString()}
                          </small>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.notificationId);
                            }}
                            style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                          >
                            Mark as read
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-top text-center">
                <button className="btn btn-sm btn-link text-decoration-none">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

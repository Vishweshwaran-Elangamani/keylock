import React, { useState, useEffect } from "react";
import { Bell, X, Check, AlertCircle } from "lucide-react";
import slaService from "../../services/slaService";
import "../../styles/sla/components/NotificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await slaService.getNotifications(user.empId, true);

      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await slaService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await Promise.all(
        notifications.map((n) =>
          slaService.markNotificationAsRead(n.notificationId)
        )
      );
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "Reminder":
        return <AlertCircle size={16} className="nb-icon nb-icon-reminder" />;
      case "AutoClosure":
        return <AlertCircle size={16} className="nb-icon nb-icon-autoclosure" />;
      case "Escalation":
        return <AlertCircle size={16} className="nb-icon nb-icon-escalation" />;
      default:
        return <Bell size={16} className="nb-icon nb-icon-default" />;
    }
  };

  return (
    <div className="nb-scope">
      <button
        type="button"
        className="nb-bell-btn"
        onClick={() => setShowDropdown((p) => !p)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="nb-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="nb-backdrop"
            onClick={() => setShowDropdown(false)}
          />

          <div className="nb-dropdown">
            <div className="nb-header">
              <h6 className="nb-title">Notifications</h6>

              <div className="nb-header-actions">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="nb-link-btn"
                    onClick={markAllAsRead}
                    disabled={loading}
                  >
                    <Check size={16} />
                    Mark all read
                  </button>
                )}

                <button
                  type="button"
                  className="nb-link-btn"
                  onClick={() => setShowDropdown(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="nb-list">
              {notifications.length === 0 ? (
                <div className="nb-empty">
                  <Bell size={48} className="nb-empty-icon" />
                  <p className="nb-empty-text">No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className="nb-item"
                  >
                    <div className="nb-item-inner">
                      <div className="nb-item-icon">
                        {getNotificationIcon(notification.notificationType)}
                      </div>

                      <div className="nb-item-body">
                        <div className="nb-item-subject">
                          {notification.subject}
                        </div>

                        <p className="nb-item-message">
                          {notification.message}
                        </p>

                        <div className="nb-item-footer">
                          <small className="nb-item-date">
                            {new Date(notification.sentAt).toLocaleDateString()}
                          </small>

                          <button
                            type="button"
                            className="nb-mark-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.notificationId);
                            }}
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

            {notifications.length > 0 && (
              <div className="nb-footer">
                <button type="button" className="nb-link-btn">
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

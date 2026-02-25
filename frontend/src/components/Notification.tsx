import React, { useState } from 'react';
import { useNotification, type NotificationItem } from '../context/NotificationContext';
import '../assets/notification.css';

const Notification: React.FC = () => {
  const { notifications, removeNotification } = useNotification();
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-bell';
    }
  };

  const getTypeTitle = (type: NotificationItem['type'], customTitle?: string) => {
    if (customTitle) return customTitle;
    switch (type) {
      case 'success': return 'Success!';
      case 'error': return 'Error!';
      case 'warning': return 'Warning!';
      case 'info': return 'Info';
      default: return 'Notification';
    }
  };

  const handleClose = (notification: NotificationItem) => {
    setExitingIds(prev => new Set(prev).add(notification.id));
    setTimeout(() => {
      removeNotification(notification.id);
      setExitingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
      if (notification.onClose) {
        notification.onClose();
      }
    }, 300); // Match animation duration
  };

  // Group notifications by position
  const notificationsByPosition = notifications.reduce((acc, notification) => {
    const position = notification.position;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  // If no notifications, don't render anything
  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {Object.entries(notificationsByPosition).map(([position, positionNotifications]) => (
        <div
          key={position}
          className={`notification-container ${position.replace('-', '-')}`}
          style={getContainerStyle(position)}
        >
          {positionNotifications.map((notification, index) => {
            const isExiting = exitingIds.has(notification.id);
            const isStacked = positionNotifications.length > 3 && index > 0;
            
            return (
              <div
                key={notification.id}
                className={`notification ${notification.type} ${isExiting ? 'exit' : ''} ${isStacked ? 'stacked' : ''} ${notification.className || ''}`}
                style={getNotificationStyle(notification, index)}
              >
                {/* Progress Bar for auto-dismiss */}
                {notification.duration > 0 && (
                  <div className="notification-progress">
                    <div
                      className="notification-progress-bar"
                      style={{
                        width: isExiting ? '0%' : '100%',
                        transition: isExiting ? 'none' : `width ${notification.duration}ms linear`
                      }}
                    />
                  </div>
                )}

                <div className="notification-header">
                  <div className="notification-title">
                    <div className="notification-icon">
                      <i className={notification.customIcon || getTypeIcon(notification.type)}></i>
                    </div>
                    <span className="notification-title-text">
                      {getTypeTitle(notification.type, notification.title)}
                    </span>
                  </div>
                  
                  {notification.showCloseButton && (
                    <button
                      className="notification-close"
                      onClick={() => handleClose(notification)}
                      aria-label="Close notification"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>

                <div className={`notification-content ${notification.imageUrl ? 'with-image' : ''}`}>
                  {notification.imageUrl && (
                    <div className="notification-image">
                      <img src={notification.imageUrl} alt="Notification" />
                    </div>
                  )}
                  
                  <div>
                    {typeof notification.message === 'string' ? (
                      <p>{notification.message}</p>
                    ) : (
                      notification.message
                    )}
                    
                    {notification.listItems && notification.listItems.length > 0 && (
                      <ul className="notification-list">
                        {notification.listItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {(notification.action || notification.secondaryAction) && (
                  <div className="notification-actions">
                  {notification.action && (
                      <button
                        className={`notification-btn notification-btn-${notification.action.variant || 'primary'}`}
                        onClick={() => {
                          notification.action!.onClick();
                          handleClose(notification);
                        }}
                      >
                        {notification.action.label}
                      </button>
                    )}
                    
                    {notification.secondaryAction && (
                      <button
                        className={`notification-btn notification-btn-${notification.secondaryAction.variant || 'secondary'}`}
                        onClick={() => {
                          notification.secondaryAction!.onClick();
                          handleClose(notification);
                        }}
                      >
                        {notification.secondaryAction.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};

// Helper function to get container style based on position
const getContainerStyle = (position: string): React.CSSProperties => {
  const styles: Record<string, React.CSSProperties> = {
    'top-right': { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
    'top-left': { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
    'bottom-right': { bottom: '20px', right: '20px', left: 'auto', top: 'auto' },
    'bottom-left': { bottom: '20px', left: '20px', right: 'auto', top: 'auto' },
    'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto' },
    'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)', right: 'auto', top: 'auto' },
  };
  
  return styles[position] || styles['top-right'];
};

// Helper function to get notification style
const getNotificationStyle = (notification: NotificationItem, index: number): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    zIndex: 1000 - index,
  };
  
  return baseStyle;
};

export default Notification;
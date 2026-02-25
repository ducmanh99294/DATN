import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import Notification from '../components/Notification';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface NotificationOptions {
  id?: string;
  title?: string;
  message: string;
  type?: NotificationType;
  duration?: number; // milliseconds, 0 = never auto-close
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showCloseButton?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  onClose?: () => void;
  imageUrl?: string;
  listItems?: string[];
  customIcon?: string;
  className?: string;
}

export interface NotificationItem extends NotificationOptions {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  success: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
  error: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
  warning: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
  info: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showNotification = useCallback((options: NotificationOptions): string => {
    const id = options.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: NotificationItem = {
      id,
      type: options.type || 'default',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 5000, // Default 5 seconds
      position: options.position || 'top-right',
      showCloseButton: options.showCloseButton ?? true,
      action: options.action,
      secondaryAction: options.secondaryAction,
      onClose: options.onClose,
      imageUrl: options.imageUrl,
      listItems: options.listItems,
      customIcon: options.customIcon,
      className: options.className,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove if duration is set
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
        if (newNotification.onClose) {
          newNotification.onClose();
        }
      }, newNotification.duration);
    }

    return id;
  }, [removeNotification]);

  // Convenience methods
  const success = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'success',
      title: title || 'Success!',
      message,
      ...options,
    });
  }, [showNotification]);

  const error = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'error',
      title: title || 'Error!',
      message,
      ...options,
    });
  }, [showNotification]);

  const warning = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'warning',
      title: title || 'Warning!',
      message,
      ...options,
    });
  }, [showNotification]);

  const info = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'info',
      title: title || 'Info',
      message,
      ...options,
    });
  }, [showNotification]);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification />
    </NotificationContext.Provider>
  );
};
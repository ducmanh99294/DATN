import { useNotification, type NotificationOptions } from '../context/NotificationContext';

export const useNotify = () => {
  const notification = useNotification();

  return {
    // Basic show method
    show: (options: NotificationOptions) => notification.showNotification(options),
    
    // Convenience methods
    success: (message: string, title?: string, options?: Partial<NotificationOptions>) => 
      notification.success(message, title, options),
    
    error: (message: string, title?: string, options?: Partial<NotificationOptions>) => 
      notification.error(message, title, options),
    
    warning: (message: string, title?: string, options?: Partial<NotificationOptions>) => 
      notification.warning(message, title, options),
    
    info: (message: string, title?: string, options?: Partial<NotificationOptions>) => 
      notification.info(message, title, options),
    
    // Remove methods
    remove: (id: string) => notification.removeNotification(id),
    clearAll: () => notification.clearAllNotifications(),
    
    // Quick alert replacement
    alert: (message: string, title?: string) => 
      notification.info(message, title || 'Alert', { duration: 4000 }),
    
    // Confirmation dialog style
    confirm: (message: string, onConfirm: () => void, onCancel?: () => void, title?: string) => {
      const id = notification.showNotification({
        type: 'warning',
        title: title || 'Confirmation',
        message,
        duration: 0, // No auto-close
        action: {
          label: 'Confirm',
          onClick: onConfirm,
          variant: 'primary'
        },
        secondaryAction: onCancel ? {
          label: 'Cancel',
          onClick: onCancel,
          variant: 'secondary'
        } : undefined
      });
      return id;
    },
    
    // Loading notification
    loading: (message: string, title?: string) => 
      notification.showNotification({
        type: 'info',
        title: title || 'Loading...',
        message,
        duration: 0, // No auto-close
        customIcon: 'fas fa-spinner fa-spin'
      }),
    
    // Update existing notification
    update: (id: string, options: Partial<NotificationOptions>) => {
      notification.removeNotification(id);
      return notification.showNotification({...options, message: options.message || '', id });
    }
  };
};
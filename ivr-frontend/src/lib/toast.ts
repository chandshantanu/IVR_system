/**
 * Toast notification utilities
 * Simple toast notification system without external dependencies
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

class ToastManager {
  private container: HTMLElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 400px;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private getToastStyles(type: ToastType): string {
    const baseStyles = `
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
      display: flex;
      align-items: start;
      gap: 0.75rem;
      min-width: 300px;
    `;

    const typeStyles: Record<ToastType, string> = {
      success: 'background-color: #10b981; color: white;',
      error: 'background-color: #ef4444; color: white;',
      warning: 'background-color: #f59e0b; color: white;',
      info: 'background-color: #3b82f6; color: white;',
    };

    return baseStyles + typeStyles[type];
  }

  private getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type];
  }

  show(options: ToastOptions) {
    const container = this.ensureContainer();
    const {
      title,
      message,
      type = 'info',
      duration = 5000,
    } = options;

    const toast = document.createElement('div');
    toast.style.cssText = this.getToastStyles(type);

    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 1.25rem;
      font-weight: bold;
      flex-shrink: 0;
    `;
    icon.textContent = this.getIcon(type);

    const content = document.createElement('div');
    content.style.cssText = 'flex: 1;';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight: 600; margin-bottom: 0.25rem;';
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    const messageEl = document.createElement('div');
    messageEl.style.cssText = 'font-size: 0.875rem;';
    messageEl.textContent = message;
    content.appendChild(messageEl);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: inherit;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => (closeBtn.style.opacity = '1');
    closeBtn.onmouseout = () => (closeBtn.style.opacity = '0.7');
    closeBtn.onclick = () => this.remove(toast);

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  private remove(toast: HTMLElement) {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message: string, title?: string) {
    return this.show({ message, title, type: 'success' });
  }

  error(message: string, title?: string) {
    return this.show({ message, title, type: 'error' });
  }

  warning(message: string, title?: string) {
    return this.show({ message, title, type: 'warning' });
  }

  info(message: string, title?: string) {
    return this.show({ message, title, type: 'info' });
  }
}

// Add keyframe animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export const toast = new ToastManager();

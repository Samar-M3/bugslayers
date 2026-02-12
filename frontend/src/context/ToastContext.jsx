import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import '../styles/Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolverRef = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  }, []);

  const confirmAction = useCallback((options = {}) => {
    const {
      title = 'Please Confirm',
      message = 'Are you sure you want to continue?',
      confirmText = 'OK',
      cancelText = 'Cancel',
      intent = 'danger',
    } = options;

    setConfirmState({ title, message, confirmText, cancelText, intent });
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const resolveConfirm = useCallback((value) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }
    setConfirmState(null);
  }, []);

  const value = useMemo(() => ({ showToast, confirmAction }), [showToast, confirmAction]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-viewport">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="confirm-backdrop" onClick={() => resolveConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmState.title}</h3>
            <p>{confirmState.message}</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => resolveConfirm(false)}>
                {confirmState.cancelText}
              </button>
              <button className={`confirm-ok ${confirmState.intent}`} onClick={() => resolveConfirm(true)}>
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};


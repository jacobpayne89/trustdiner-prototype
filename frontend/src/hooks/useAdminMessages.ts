import { useState, useEffect, useCallback } from 'react';

export interface AdminMessage {
  type: 'success' | 'error';
  text: string;
}

export function useAdminMessages() {
  const [message, setMessage] = useState<AdminMessage | null>(null);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showSuccess = useCallback((text: string) => {
    setMessage({ type: 'success', text });
  }, []);

  const showError = useCallback((text: string) => {
    setMessage({ type: 'error', text });
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    showSuccess,
    showError,
    clearMessage,
  };
}


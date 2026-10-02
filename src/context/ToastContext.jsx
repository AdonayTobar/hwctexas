// src/context/ToastContext.jsx
import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-2rem)] px-5 py-3 rounded-2xl shadow-2xl text-white font-semibold text-sm pop text-center bg-slate-800 animate-fade-up">
                    {toast}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
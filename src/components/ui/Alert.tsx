import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    onClose: () => void;
    duration?: number;
}

export function Alert({ type, title, message, onClose, duration = 4000 }: AlertProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-6 h-6" />,
        error: <XCircle className="w-6 h-6" />,
        warning: <AlertCircle className="w-6 h-6" />,
        info: <Info className="w-6 h-6" />
    };

    const styles = {
        success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-green-900',
        error: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 text-red-900',
        warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 text-amber-900',
        info: 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 text-blue-900'
    };

    const iconColors = {
        success: 'text-green-600',
        error: 'text-red-600',
        warning: 'text-amber-600',
        info: 'text-blue-600'
    };

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            <div
                className={`
                    pointer-events-auto relative max-w-sm w-[320px] p-5 rounded-2xl border-2 shadow-2xl
                    ${styles[type]}
                    ${isVisible ? 'animate-in slide-in-from-right-8 duration-300' : 'animate-out fade-out slide-out-to-right-8 duration-200'}
                `}
            >
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${iconColors[type]}`}>
                        {icons[type]}
                    </div>
                    <div className="flex-1 pt-0.5">
                        <h3 className="text-lg font-black uppercase tracking-wider mb-1">
                            {title}
                        </h3>
                        {message && (
                            <p className="text-sm opacity-80 leading-relaxed">
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-3xl overflow-hidden">
                    <div
                        className={`h-full ${type === 'success' ? 'bg-green-600' :
                            type === 'error' ? 'bg-red-600' :
                                type === 'warning' ? 'bg-amber-600' :
                                    'bg-blue-600'
                            }`}
                        style={{
                            animation: `shrink ${duration}ms linear forwards`
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}

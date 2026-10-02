// src/components/ReportChoiceModal.jsx
import { useI18n } from '../i18n/LanguageContext';

export default function ReportChoiceModal({ isOpen, onClose, onChooseServ, onChoosePos }) {
    const { t } = useI18n();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-sm pop p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <h3 className="font-extrabold text-lg leading-tight">{t('prop.btnGenerarReporte')}</h3>
                    <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl transition">✕</button>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => { onChooseServ(); onClose(); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition active:scale-95"
                    >
                        ✅ {t('prop.btnRegistrarServ')}
                    </button>
                    <button
                        onClick={() => { onChoosePos(); onClose(); }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition active:scale-95"
                    >
                        ⏩ {t('jorn.btnPospTitle')}
                    </button>
                </div>
            </div>
        </div>
    );
}
// src/components/SuspenderModal.jsx
import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function SuspenderModal({ isOpen, onClose, propId, profile }) {
    const { t } = useI18n();
    const { props, crews, crearReportePropiedad, actualizarPropiedad } = useData();
    const { showToast } = useToast();

    const [motivo, setMotivo] = useState('');
    const p = props.find(x => x.id === propId);

    useEffect(() => {
        if (isOpen) setMotivo('');
    }, [isOpen]);

    if (!isOpen || !p) return null;

    const handleSave = async () => {
        if (!motivo.trim()) return showToast(t('err.escribeMotivo'));

        try {
            const crewId = crews.find(c => c.nombre === p.cuadrilla)?.id || null;
            await crearReportePropiedad(p.id, `SUSPENSIÓN: ${motivo.trim()}`, crewId, profile.nombre);
            await actualizarPropiedad(p.id, 'Suspendida');
            onClose();
            showToast(t('toast.propSuspendida'));
        } catch (err) {
            console.error(err);
            showToast(t('err.suspender'));
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md pop max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 min-w-0">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 min-w-0">
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-lg leading-tight">{t('susp.titulo')}</h3>
                        <p className="text-xs text-slate-500 truncate min-w-0">{p.nombre}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl transition">✕</button>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('susp.motivo')}</label>
                    <textarea rows="4" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder={t('susp.motivoPh')} className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"></textarea>
                    <p className="text-[11px] text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{t('susp.aviso')}</p>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition">{t('comun.cancelar')}</button>
                    <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl shadow transition active:scale-95">{t('susp.btn')}</button>
                </div>
            </div>
        </div>
    );
}
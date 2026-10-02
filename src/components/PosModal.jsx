// src/components/PosModal.jsx
import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';
import { fechaISO } from '../lib/helpers';

export default function PosModal({ isOpen, onClose, propId, jourId, profile }) {
    const { t } = useI18n();
    const { props, posponerServicio } = useData();
    const { showToast } = useToast();

    const [fecha, setFecha] = useState('');
    const [motivo, setMotivo] = useState('');

    const p = props.find(x => x.id === propId);

    useEffect(() => {
        if (isOpen) {
            const d = new Date(); d.setDate(d.getDate() + 1);
            setFecha(fechaISO(d));
            setMotivo('');
        }
    }, [isOpen]);

    if (!isOpen || !p) return null;

    const handleSave = async () => {
        if (!fecha) return showToast(t('err.indicaFecha'));
        if (!motivo.trim()) return showToast(t('err.escribeMotivo'));

        try {
            if (jourId) {
                // Si viene de una jornada, usamos la función con jornada
                await posponerServicio(p.id, jourId, fecha, motivo.trim(), profile.nombre);
            } else {
                // Si no hay jornada, creamos un registro directo en la tabla de servicios
                const crewObj = crews.find(c => c.nombre === p.cuadrilla);
                await crearReportePropiedad(p.id, `POSPUESTO PARA ${fecha}: ${motivo.trim()}`, crewObj?.id || null, profile.nombre);
            }
            onClose();
            showToast(t('toast.pospuesto'));
        } catch (err) {
            console.error(err);
            showToast(t('err.posponer'));
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md pop max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="font-extrabold text-lg leading-tight">{t('pos.modal.titulo')}</h3>
                        <p className="text-xs text-slate-500 truncate">{p.nombre} · {p.id}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl transition">✕</button>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('pos.modal.seRealizara')}</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition" />
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('pos.modal.motivo')}</label>
                    <textarea rows="3" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder={t('pos.modal.motivoPh')} className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition">{t('comun.cancelar')}</button>
                    <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl shadow transition active:scale-95">{t('pos.modal.btn')}</button>
                </div>
            </div>
        </div>
    );
}
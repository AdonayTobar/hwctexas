// src/components/ServModal.jsx
import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';
import { fechaISO } from '../lib/helpers';

export default function ServModal({ isOpen, onClose, propId, jourId, profile }) {
    const { t } = useI18n();
    const { props, crews, registrarServicio } = useData();
    const { showToast } = useToast();

    const [fecha, setFecha] = useState(fechaISO(new Date()));
    const [estado, setEstado] = useState('Completado');
    const [notas, setNotas] = useState('');
    const [crewId, setCrewId] = useState('');

    const p = props.find(x => x.id === propId);

    useEffect(() => {
        if (isOpen && p) {
            setFecha(fechaISO(new Date()));
            setEstado('Completado');
            setNotas('');
            setCrewId(crews.find(c => c.nombre === p.cuadrilla)?.id || '');
        }
    }, [isOpen, propId]);

    if (!isOpen || !p) return null;

    const handleSave = async () => {
        if (!fecha) return showToast(t('err.selFecha2'));

        const newServData = {
            property_id: p.id,
            fecha,
            status: estado,
            crew_id: crewId || null,
            notas: notas.trim(),
            por: profile.nombre
            // Sin 'ts', Supabase lo hace automático
        };

        try {
            await registrarServicio(newServData, jourId);
            onClose();
            showToast(t('toast.servOk')); // Notificación profesional
        } catch (err) {
            console.error(err);
            showToast(t('err.registrarServ'));
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md pop max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="font-extrabold text-lg leading-tight">{t('serv.modal.titulo')}</h3>
                        <p className="text-xs text-slate-500 truncate">{p.nombre} · {p.id}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl transition">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('serv.modal.fecha')}</label>
                        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('serv.modal.resultado')}</label>
                        <select value={estado} onChange={e => setEstado(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition">
                            <option value="Completado">{t('estadoServ.Completado')}</option>
                            <option value="No asistió">{t('estadoServ.No asistió')}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('serv.modal.cuadrilla')}</label>
                    <select value={crewId} onChange={e => setCrewId(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        <option value="">{t('comun.sinCuadrillaOp')}</option>
                        {crews.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('serv.modal.notas')}</label>
                    <textarea rows="3" value={notas} onChange={e => setNotas(e.target.value)} placeholder={t('serv.modal.notasPh')} className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition">{t('comun.cancelar')}</button>
                    <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition active:scale-95">{t('serv.modal.guardar')}</button>
                </div>
            </div>
        </div>
    );
}
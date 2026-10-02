// src/components/AssignCrewModal.jsx
import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';
import { fechaISO } from '../lib/helpers';

export default function AssignCrewModal({ isOpen, onClose, propId, profile }) {
    const { t, tf } = useI18n();
    const { props, crews, asignarCuadrillaPropiedad, asignarCuadrillaFecha } = useData();
    const { showToast } = useToast();

    const [tipo, setTipo] = useState('perm');
    const [fecha, setFecha] = useState(fechaISO(new Date(Date.now() + 86400000)));
    const [search, setSearch] = useState('');
    const [selectedCrew, setSelectedCrew] = useState(null);

    const p = props.find(x => x.id === propId);

    useEffect(() => {
        if (isOpen && p) {
            setTipo('perm');
            setFecha(fechaISO(new Date(Date.now() + 86400000)));
            setSearch('');
            setSelectedCrew(p.crew_id || null);
        }
    }, [isOpen, propId]);

    if (!isOpen || !p) return null;

    const filteredCrews = crews.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()));

    const handleSave = async () => {
        try {
            if (tipo === 'perm') {
                await asignarCuadrillaPropiedad(p.id, selectedCrew);
                showToast(t('toast.cuaPerm'));
            } else {
                if (!selectedCrew) return showToast(t('err.selCuadrilla'));
                if (!fecha) return showToast(t('err.selFecha2'));
                await asignarCuadrillaFecha(p.id, selectedCrew, fecha);
                showToast(tf('toast.asignadaRutaFecha', { fecha }));
            }
            onClose();
        } catch (err) {
            console.error(err);
            showToast(t('err.guardarNube'));
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md pop max-h-[92vh] overflow-y-auto min-w-0">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6 sticky top-0 bg-white z-10 min-w-0">
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-lg leading-tight">{t('asig.titulo')}</h3>
                        <p className="text-xs text-slate-500 truncate min-w-0">{p.nombre}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl transition">✕</button>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setTipo('perm')} className={`py-2 rounded-lg font-bold text-sm transition ${tipo === 'perm' ? 'bg-white text-sky-600 shadow' : 'text-slate-500'}`}>{t('asig.perm')}</button>
                        <button onClick={() => setTipo('hoy')} className={`py-2 rounded-lg font-bold text-sm transition ${tipo === 'hoy' ? 'bg-white text-sky-600 shadow' : 'text-slate-500'}`}>{t('asig.hoy')}</button>
                    </div>

                    {tipo === 'perm' ? (
                        <div className="text-[11px] text-slate-500 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">{t('asig.permAviso')}</div>
                    ) : (
                        <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 space-y-2">
                            <span dangerouslySetInnerHTML={{ __html: t('asig.hoyAviso') }} />
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="inp mt-1" />
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 tracking-wide">{t('asig.buscarLabel')}</label>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('comun.buscarPh')} className="inp mt-1" />
                        <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                            <button onClick={() => setSelectedCrew(null)} className={`w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-400 italic ${selectedCrew === null ? 'bg-sky-50 font-bold text-sky-700' : ''}`}>{t('comun.sinAsignarOp')}</button>
                            {filteredCrews.map(c => (
                                <button key={c.id} onClick={() => setSelectedCrew(c.id)} className={`w-full text-left px-3 py-2 flex items-center gap-2 transition ${selectedCrew === c.id ? 'bg-sky-50 font-bold text-sky-700' : 'hover:bg-sky-50 text-slate-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> {c.nombre}
                                </button>
                            ))}
                            {filteredCrews.length === 0 && <p className="text-center text-slate-400 text-sm p-3">{t('comun.sinResultados')}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition">{t('comun.cancelar')}</button>
                        <button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition active:scale-95">{t('comun.guardar')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
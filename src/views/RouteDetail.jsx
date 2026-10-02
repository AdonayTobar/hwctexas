// src/views/RouteDetail.jsx
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { progresoJornada, puedeOperarJornada, puedeEditarJornada } from '../lib/helpers';
import ServModal from '../components/ServModal';
import PosModal from '../components/PosModal';

const PALETA = {
    'Azul': { bar: 'bg-sky-500', chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
    'Negro': { bar: 'bg-slate-800', chip: 'bg-slate-900 text-white', dot: 'bg-slate-900' },
    'Morado': { bar: 'bg-violet-500', chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
    'Amarillo': { bar: 'bg-amber-400', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
    'Gris': { bar: 'bg-slate-500', chip: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
    'Teal': { bar: 'bg-teal-500', chip: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
    'Indigo': { bar: 'bg-indigo-500', chip: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
    'Rosa': { bar: 'bg-rose-500', chip: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
    'Verde': { bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
};

export default function RouteDetail({ profile, journeyId, navigate }) {
    const { t, tf, td } = useI18n();
    const { props, crews, jornadas, jornadasVirtuales } = useData();

    const [showServ, setShowServ] = useState(false);
    const [showPos, setShowPos] = useState(false);
    const [activeProp, setActiveProp] = useState(null);

    // Buscamos la jornada en el estado (incluye las virtuales)
    const j = useMemo(() => [...jornadas, ...jornadasVirtuales].find(x => x.id === journeyId), [jornadas, jornadasVirtuales, journeyId]);

    if (!j) {
        return (
            <div className="p-10 text-center">
                <p className="text-4xl mb-2">🚫</p>
                <p className="font-bold">{t('jorn.noEncontrada')}</p>
                <button onClick={() => navigate('rutas')} className="mt-3 text-sm font-semibold text-sky-600 hover:underline">{t('jorn.volverListado')}</button>
            </div>
        );
    }

    const pr = progresoJornada(j);
    const crew = crews.find(c => c.nombre === j.cuadrilla);
    const s = PALETA[crew?.color] || { bar: 'bg-slate-300', chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
    const pctT = pr.total ? Math.round((pr.hechas + pr.posp) / pr.total * 100) : 0;

    const puedeEd = puedeEditarJornada(j, profile);
    const puedeOp = puedeOperarJornada(j, profile);

    const openServ = (propId) => { setActiveProp(propId); setShowServ(true); };
    const openPos = (propId) => { setActiveProp(propId); setShowPos(true); };

    return (
        <div className="anim space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <h1 className="text-xl lg:text-2xl font-extrabold leading-tight">{j.nombre || tf('dash.jornadaDe', { cua: j.cuadrilla })}</h1>
                    <p className="text-sm text-slate-500 mt-0.5 capitalize">
                        {j.fechaFin && j.fechaFin !== j.fecha ? `${j.fecha} → ${j.fechaFin}` : j.fecha}
                    </p>
                </div>
                <div className="shrink-0">
                    {j.cuadrilla ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.chip}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>{j.cuadrilla}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-amber-600">⚠️ Sin cuadrilla</span>
                    )}
                </div>
            </div>

            {/* Creada por */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400 ml-auto">{tf('jorn.creadaPor', { nombre: j.creadaPor, rol: td('rol', j.creadaPorRol) })}</span>
            </div>

            {/* Progreso */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                    <p className="font-extrabold">
                        {tf('jorn.progreso', { h: pr.hechas, t: pr.total })}
                        {pr.posp ? tf('jorn.conPospuestas', { n: pr.posp }) : ''}
                        {pr.pend ? tf('jorn.conPendientes', { n: pr.pend }) : ''}
                    </p>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.chip}`}>{pctT}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${pctT}%` }}></div>
                </div>
            </div>

            {/* Items (Propiedades) */}
            <div className="space-y-2">
                {j.items.length === 0 ? (
                    <p className="text-sm text-slate-400 p-4 text-center bg-white rounded-xl border border-slate-100">{t('jorn.sinProps')}</p>
                ) : (
                    j.items.map(it => {
                        const p = props.find(x => x.id === it.propId);
                        return (
                            <div key={it.propId} className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 border border-slate-100 rounded-xl bg-white">
                                <div
                                    className="min-w-0 flex-1 cursor-pointer"
                                    onClick={() => navigate('propiedad_detalle', it.propId)}
                                >
                                    <p className="text-sm font-bold truncate">{p ? p.nombre : it.propId + ' ' + t('comun.eliminada')}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        {p && <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.servicio === 'Porter' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>{p.servicio}</span>}
                                        {p && <span className="text-[10px] text-slate-400">{p.ciudad}</span>}
                                    </div>
                                    {it.estado === 'Pospuesto' && it.pospMotivo && (
                                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5">💬 {it.pospMotivo}</p>
                                    )}
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2 shrink-0 justify-end sm:justify-start">
                                    {it.estado === 'Pendiente' && puedeOp ? (
                                        <>
                                            <button onClick={() => openServ(it.propId)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition active:scale-95">{t('jorn.btnRegistrar')}</button>
                                            <button onClick={() => openPos(it.propId)} title={t('jorn.btnPospTitle')} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition active:scale-95">⏩</button>
                                        </>
                                    ) : (
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${it.estado === 'Hecho' ? 'bg-emerald-100 text-emerald-700' :
                                            it.estado === 'Pospuesto' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {it.estado === 'Hecho' ? '✓' : it.estado === 'Pospuesto' ? '⏩' : '✕'} {t('estadoServ.' + it.estado)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modales */}
            <ServModal isOpen={showServ} onClose={() => setShowServ(false)} propId={activeProp} jourId={j.id} profile={profile} />
            <PosModal isOpen={showPos} onClose={() => setShowPos(false)} propId={activeProp} jourId={j.id} profile={profile} />

        </div>
    );
}
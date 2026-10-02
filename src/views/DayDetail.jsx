// src/views/DayDetail.jsx
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { fechaISO, datosDelDia } from '../lib/helpers';

const PALETA = {
    'Azul': { chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
    'Negro': { chip: 'bg-slate-900 text-white', dot: 'bg-slate-900' },
    'Morado': { chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
    'Amarillo': { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
    'Gris': { chip: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
    'Teal': { chip: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
    'Indigo': { chip: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
    'Rosa': { chip: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
    'Verde': { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
};

export default function DayDetail({ profile, navigate }) {
    const { t, tf } = useI18n();
    const { props, crews, jornadas, servicios } = useData();

    const [search, setSearch] = useState('');
    const [showPending, setShowPending] = useState(true);
    const [showDone, setShowDone] = useState(true);
    const [showPostponed, setShowPostponed] = useState(true);

    const iso = fechaISO(new Date());
    const cuaFiltro = (profile?.rol === 'Trabajador' || profile?.rol === 'Supervisor') ? profile.cuadrilla : '';
    const dd = useMemo(() => datosDelDia(iso, cuaFiltro, props, jornadas, servicios), [iso, cuaFiltro, props, jornadas, servicios]);

    const filterFn = (p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.cuadrilla && p.cuadrilla.toLowerCase().includes(q));
    };

    const pendientes = dd.pendientes.filter(filterFn);
    const hechas = dd.hechas.filter(filterFn);
    const pospuestas = dd.pospuestas.filter(filterFn);

    const renderPropCard = (p, isDone, isPostponed = false) => {
        const crewColor = PALETA[crews.find(c => c.nombre === p.cuadrilla)?.color] || { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
        const sv = isDone ? dd.svHoy.filter(s => s.propId === p.id).pop() : null;

        return (
            <div
                key={p.id}
                onClick={() => navigate('propiedad_detalle', p.id)}
                className={`w-full text-left border rounded-xl p-3 transition hover:border-sky-300 hover:bg-sky-50/50 min-w-0 cursor-pointer ${p.cuadrilla ? 'border-slate-100 bg-white' : 'border-amber-300 bg-amber-50/50'}`}
            >
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <p className="text-sm font-bold truncate text-sky-700 hover:underline min-w-0">
                        {p.nombre}
                    </p>
                    {p.cuadrilla ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${crewColor.chip}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${crewColor.dot}`}></span>{p.cuadrilla}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-amber-600 shrink-0">{t('dia.sinCuadrillaWarn')}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.servicio === 'Porter' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>{p.servicio}</span>
                    <span className="text-[10px] text-slate-400">{p.ciudad}</span>
                    {isDone && sv && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sv.estado === 'Completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {sv.estado === 'Completado' ? '✓' : '✕'} {t('estadoServ.' + sv.estado)}
                        </span>
                    )}
                    {isPostponed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">⏩ {t('estadoServ.Pospuesto')}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="anim space-y-5 min-w-0">
            <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold capitalize">📅 {new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long' })}</h1>
                <p className="text-slate-500 text-sm mt-1">
                    {cuaFiltro ? tf('dia.cuadrilla', { cua: cuaFiltro }) : t('dia.todasCuadrillas')} · {tf('dia.nProgramadas', { n: dd.programadas.length })}
                </p>
            </div>

            {/* Barra de progreso y contadores */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden min-w-0">
                        <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${dd.pct}%` }}></div>
                    </div>
                    <span className="text-lg font-extrabold shrink-0">{dd.pct}%</span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap text-xs font-bold">
                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">{tf('dash.nHechas', { n: dd.hechas.length })}</span>
                    <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">{tf('dash.nPendientes', { n: dd.pendientes.length })}</span>
                    <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">{tf('dia.nPospuestas', { n: dd.pospuestas.length })}</span>
                </div>
            </div>

            {/* Buscador */}
            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Buscar propiedad o cuadrilla..."
                className="w-full min-w-0 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition"
            />

            <div className="grid lg:grid-cols-2 gap-5 min-w-0">
                {/* Panel Pendientes */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 min-w-0">
                    <div className="flex items-center justify-between cursor-pointer mb-3" onClick={() => setShowPending(!showPending)}>
                        <h3 className="font-extrabold">{t('dia.pendientesPanel')} <span className="text-xs font-medium text-slate-400">({pendientes.length})</span></h3>
                        <span className="text-slate-400 text-sm">{showPending ? '▲' : '▼'}</span>
                    </div>
                    {showPending && (
                        <div className="space-y-2 min-w-0">
                            {pendientes.length === 0 ? (
                                <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center font-semibold">{t('dia.todoCompletado')}</p>
                            ) : (
                                pendientes.map(p => renderPropCard(p, false))
                            )}
                        </div>
                    )}
                </div>

                {/* Panel Pospuestas */}
                {pospuestas.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 min-w-0">
                        <div className="flex items-center justify-between cursor-pointer mb-3" onClick={() => setShowPostponed(!showPostponed)}>
                            <h3 className="font-extrabold">⏩ Pospuestas <span className="text-xs font-medium text-slate-400">({pospuestas.length})</span></h3>
                            <span className="text-slate-400 text-sm">{showPostponed ? '▲' : '▼'}</span>
                        </div>
                        {showPostponed && (
                            <div className="space-y-2 min-w-0">
                                {pospuestas.map(p => renderPropCard(p, false, true))}
                            </div>
                        )}
                    </div>
                )}

                {/* Panel Hechas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 min-w-0">
                    <div className="flex items-center justify-between cursor-pointer mb-3" onClick={() => setShowDone(!showDone)}>
                        <h3 className="font-extrabold">{t('dia.hechasPanel')} <span className="text-xs font-medium text-slate-400">({hechas.length})</span></h3>
                        <span className="text-slate-400 text-sm">{showDone ? '▲' : '▼'}</span>
                    </div>
                    {showDone && (
                        <div className="space-y-2 min-w-0">
                            {hechas.length === 0 ? (
                                <p className="text-sm text-slate-400 p-4 text-center">{t('dia.sinServiciosHoy')}</p>
                            ) : (
                                hechas.map(p => renderPropCard(p, true))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
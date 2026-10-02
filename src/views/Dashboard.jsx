// src/views/Dashboard.jsx
import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { fechaISO, calcMensual, fmtMon, datosDelDia, propTieneServicio } from '../lib/helpers';

export default function Dashboard({ profile, navigate }) {
    const { t, tf, td } = useI18n();
    const { props, jornadas, servicios, getPendientesRep } = useData();

    const hoy = fechaISO(new Date());
    const act = props.filter(p => p.estado === 'Activa');
    const costo = act.reduce((a, p) => a + calcMensual(p), 0);

    // Calcular jornadas de hoy (incluyendo las virtuales que el sistema generaría)
    const jHoy = useMemo(() => {
        const crewsConServicio = new Set();
        props.forEach(p => {
            if (p.estado === 'Activa' && p.cuadrilla && propTieneServicio(p, hoy, jornadas)) {
                crewsConServicio.add(p.cuadrilla);
            }
        });
        jornadas.forEach(j => {
            if (j.fecha === hoy) crewsConServicio.add(j.cuadrilla);
        });
        return Array.from(crewsConServicio);
    }, [props, jornadas, hoy]);

    const cuaFiltro = (profile?.rol === 'Trabajador' || profile?.rol === 'Supervisor') ? profile.cuadrilla : '';
    const dd = datosDelDia(hoy, cuaFiltro, props, jornadas, servicios);
    const pend = profile ? getPendientesRep(profile.nombre) : 0;

    const porCiudad = {};
    props.forEach(p => { porCiudad[p.ciudad] = (porCiudad[p.ciudad] || 0) + 1; });
    const entradas = Object.entries(porCiudad).sort((a, b) => b[1] - a[1]);
    const maxC = Math.max(...entradas.map(e => e[1]), 1);
    const colores = ['bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500'];

    const nP = props.filter(p => String(p.servicio).indexOf('Porter') >= 0).length;
    const pct = props.length ? Math.round(nP / props.length * 100) : 0;

    return (
        <div className="anim space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold">{t('nav.dashboard')}</h1>
                <p className="text-slate-500 text-sm mt-1">{tf('dash.hola', { nombre: profile?.nombre, rol: td('rol', profile?.rol) })}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-5">
                <div className="rounded-2xl p-4 lg:p-5 shadow-sm text-white bg-gradient-to-br from-sky-500 to-cyan-600 relative overflow-hidden">
                    <span className="absolute -right-2 -top-3 text-6xl opacity-15 select-none">🏢</span>
                    <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-white/80">{t('dash.stat.props')}</p>
                    <p className="text-2xl lg:text-3xl font-extrabold mt-1">{props.length}</p>
                </div>
                <div className="rounded-2xl p-4 lg:p-5 shadow-sm text-white bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden">
                    <span className="absolute -right-2 -top-3 text-6xl opacity-15 select-none">✅</span>
                    <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-white/80">{t('dash.stat.activas')}</p>
                    <p className="text-2xl lg:text-3xl font-extrabold mt-1">{act.length}</p>
                </div>
                <div className="rounded-2xl p-4 lg:p-5 shadow-sm text-white bg-gradient-to-br from-indigo-500 to-violet-600 relative overflow-hidden">
                    <span className="absolute -right-2 -top-3 text-6xl opacity-15 select-none">💰</span>
                    <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-white/80">{t('dash.stat.costo')}</p>
                    <p className="text-2xl lg:text-3xl font-extrabold mt-1">{fmtMon(costo)}</p>
                </div>
                <button onClick={() => navigate('rutas')} className="rounded-2xl p-4 lg:p-5 shadow-sm text-white bg-gradient-to-br from-fuchsia-500 to-purple-600 relative overflow-hidden text-left hover:scale-[1.02] transition">
                    <span className="absolute -right-2 -top-3 text-6xl opacity-15 select-none">🗺️</span>
                    <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-white/80">{t('dash.stat.jornadasHoy')}</p>
                    <p className="text-2xl lg:text-3xl font-extrabold mt-1">{jHoy.length}</p>
                </button>
            </div>

            {/* Banner de Reportes Pendientes */}
            {pend > 0 ? (
                <button onClick={() => navigate('reportes')} className="w-full flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 text-left hover:bg-amber-100 transition">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-amber-800">{tf('dash.repPend', { n: pend })}</p>
                        <p className="text-xs text-amber-600">{t('dash.repPendClic')}</p>
                    </div>
                    <span className="text-amber-400 font-bold">→</span>
                </button>
            ) : (
                <div className="w-full flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                    <span className="text-2xl">✅</span>
                    <p className="font-semibold text-emerald-700 text-sm">{t('dash.repAlDia')}</p>
                </div>
            )}

            {/* Resumen del día */}
            <button onClick={() => navigate('dia_detalle')} className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 hover:shadow-md hover:border-sky-300 transition group">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div>
                        <h3 className="font-extrabold">{t('dash.resumenHoy')} <span className="text-xs font-medium text-slate-400">{hoy}</span></h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{tf('dash.programadasN', { n: dd.programadas.length })} {cuaFiltro && `· ${cuaFiltro}`}</p>
                    </div>
                    <span className="text-xs font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition">{t('dash.verDetalle')}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${dd.pct}%` }}></div>
                    </div>
                    <span className="text-sm font-extrabold shrink-0">{dd.hechas.length}/{dd.programadas.length}</span>
                    <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full shrink-0">{dd.pct}%</span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap text-[11px] font-bold">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{tf('dash.nHechas', { n: dd.hechas.length })}</span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{tf('dash.nPendientes', { n: dd.pendientes.length })}</span>
                </div>
            </button>

            {/* Props por ciudad y Porter vs Sweep */}
            <div className="grid lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
                    <h3 className="font-extrabold mb-4">{t('dash.porCiudad')}</h3>
                    {entradas.map((e, i) => (
                        <button
                            key={e[0]}
                            onClick={() => navigate('propiedades', e[0])}
                            className="w-full flex items-center gap-3 mb-3 group text-left"
                        >
                            <p className="w-24 sm:w-32 shrink-0 text-xs font-semibold text-slate-600 truncate group-hover:text-sky-700 transition">{e[0]}</p>
                            <div className="flex-1 min-w-0 h-6 bg-slate-100 rounded-lg overflow-hidden">
                                <div className={`h-full ${colores[i % colores.length]} rounded-lg flex items-center justify-end pr-2 transition-all duration-500 group-hover:brightness-110`} style={{ width: `${Math.round(e[1] / maxC * 100)}%` }}>
                                    <span className="text-[11px] font-bold text-white">{e[1]}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
                    <h3 className="font-extrabold mb-4">{t('dash.porterVsSweep')}</h3>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="relative w-28 sm:w-32 h-28 sm:h-32 rounded-full shrink-0" style={{ background: `conic-gradient(#8b5cf6 0% ${pct}%, #f59e0b ${pct}% 100%)` }}>
                            <div className="absolute inset-2 sm:inset-2.5 bg-white rounded-full flex flex-col items-center justify-center">
                                <p className="text-2xl font-extrabold">{props.length}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{t('dash.total')}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm min-w-0">
                            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-violet-500 shrink-0"></span><b>{nP}</b> Porter</p>
                            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span><b>{props.length - nP}</b> Sweep</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
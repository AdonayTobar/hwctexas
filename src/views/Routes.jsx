// src/views/Routes.jsx
import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { fechaISO, inicioDeSemanaISO, progresoJornada, puedeVerJornada, sincronizarRutasAutomaticas } from '../lib/helpers';

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

export default function Routes({ profile, navigate }) {
    const { t, tf } = useI18n();
    const { props, crews, jornadas: jornadasDB, jornadasVirtuales, setJornadasVirtuales } = useData();

    const [periodo, setPeriodo] = useState('hoy');
    const [cuadrillaFiltro, setCuadrillaFiltro] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const todasJornadas = useMemo(() => sincronizarRutasAutomaticas(periodo, props, jornadasDB, t), [periodo, props, jornadasDB, t]);

    // Guardamos las virtuales en el contexto para que el detalle las encuentre
    useEffect(() => {
        const virtuales = todasJornadas.filter(j => /^J-\d+$/.test(j.id));
        setJornadasVirtuales(virtuales);
    }, [todasJornadas]);

    const arrFiltrado = useMemo(() => {
        let arr = todasJornadas.filter(j => puedeVerJornada(j, profile));
        if (cuadrillaFiltro) arr = arr.filter(j => j.cuadrilla === cuadrillaFiltro);

        // Lógica del buscador dinámico
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            arr = arr.filter(j =>
                j.cuadrilla.toLowerCase().includes(q) ||
                (j.nombre && j.nombre.toLowerCase().includes(q))
            );
        }

        const hoy = fechaISO(new Date());
        if (periodo === 'hoy') arr = arr.filter(j => j.fecha === hoy);
        else if (periodo === 'semana') arr = arr.filter(j => inicioDeSemanaISO(j.fecha) === inicioDeSemanaISO(hoy));

        // Sort estable: Primero por fecha, luego por nombre de cuadrilla (alfabético)
        return arr.sort((a, b) => {
            if (a.fecha < b.fecha) return -1;
            if (a.fecha > b.fecha) return 1;
            return (a.cuadrilla || '').localeCompare(b.cuadrilla || '');
        });
    }, [todasJornadas, cuadrillaFiltro, searchQuery, periodo, profile]);

    return (
        <div className="anim space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold">{t('nav.jornadas')}</h1>
                    <p className="text-slate-500 text-sm mt-1">{tf('jorn.nJornadas', { n: arrFiltrado.length, s: arrFiltrado.length === 1 ? '' : 's' })}</p>
                </div>
                <button className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition active:scale-95 text-sm">
                    {t('jorn.nueva')}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                {/* NUEVO: Buscador dinámico */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar por cuadrilla..."
                    className="w-full min-w-0 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition"
                />

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Botones de periodo */}
                    {['hoy', 'semana', 'todas'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriodo(p)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${periodo === p ? 'bg-sky-600 text-white border-sky-600' : 'border-slate-200 text-slate-600 hover:border-sky-300'}`}
                        >
                            {p === 'hoy' ? t('comun.hoy') : p === 'semana' ? t('jorn.filtroSemana') : t('jorn.filtroTodas')}
                        </button>
                    ))}

                    <select
                        value={cuadrillaFiltro}
                        onChange={e => setCuadrillaFiltro(e.target.value)}
                        className="ml-auto border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="">{t('comun.filtroTodaCuadrilla')}</option>
                        {crews.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                </div>
            </div>

            {arrFiltrado.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-100">
                    <p className="text-4xl mb-2">🗺️</p>
                    <p className="font-bold text-slate-500">{t('jorn.sinEnPeriodo')}</p>
                    <button className="mt-3 text-sm font-bold text-sky-600 hover:underline">{t('jorn.crearManual')}</button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {arrFiltrado.map(j => {
                        const pr = progresoJornada(j);
                        const crew = crews.find(c => c.nombre === j.cuadrilla);
                        const s = PALETA[crew?.color] || { bar: 'bg-slate-300', chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
                        const pct = pr.total ? Math.round(pr.hechas / pr.total * 100) : 0;

                        return (
                            <div
                                key={j.id}
                                onClick={() => navigate('ruta_detalle', j.id)}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{j.nombre || tf('dash.jornadaDe', { cua: j.cuadrilla })}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
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

                                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${s.bar} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                                </div>

                                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 gap-2 min-w-0">
                                    <span className="shrink-0">
                                        {tf('dash.xDeYHechas', { h: pr.hechas, t: pr.total })}
                                        {pr.posp ? ' · ' + tf('dash.pospAbrev', { n: pr.posp }) : ''}
                                    </span>
                                    <span className="truncate min-w-0 text-right">{tf('jorn.por', { nombre: j.creadaPor })}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
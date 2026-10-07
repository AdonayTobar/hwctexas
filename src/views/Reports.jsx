// src/views/Reports.jsx
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';
import { fechaISO, inicioDeSemanaISO } from '../lib/helpers';
import DeleteReportModal from '../components/DeleteReportModal';

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

// Función mágica para quitar acentos y mayúsculas
const normalizeStr = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Reports({ profile, navigate }) {
    const { t, tf } = useI18n();
    const { props, crews, servicios, esReporte, estaLeido, getPendientesRep, marcarLeido, marcarTodosLeidos } = useData();
    const { showToast } = useToast();

    const [showDelModal, setShowDelModal] = useState(false);
    const [activeReport, setActiveReport] = useState(null);
    const [search, setSearch] = useState('');

    const [filtros, setFiltros] = useState({ periodo: 'hoy', cuadrilla: '', estadoF: '', lectura: 'todos' });

    const arrFiltrado = useMemo(() => {
        const hoy = fechaISO(new Date());
        const lim = filtros.periodo === 'hoy' ? hoy :
            filtros.periodo === 'semana' ? inicioDeSemanaISO(hoy) :
                filtros.periodo === 'mes' ? hoy.slice(0, 7) : '';

        let arr = servicios.filter(s => esReporte(s));
        if (lim) arr = arr.filter(s => filtros.periodo === 'mes' ? s.fecha.slice(0, 7) === lim : s.fecha >= lim);
        if (filtros.cuadrilla) arr = arr.filter(s => s.cuadrilla === filtros.cuadrilla);
        if (filtros.estadoF) arr = arr.filter(s => s.estado === filtros.estadoF);
        if (filtros.lectura === 'pendientes') arr = arr.filter(s => !estaLeido(s, profile?.nombre));
        else if (filtros.lectura === 'leidos') arr = arr.filter(s => estaLeido(s, profile?.nombre));

        // Lógica del buscador dinámico (ignora acentos y mayúsculas)
        if (search) {
            const q = normalizeStr(search);
            arr = arr.filter(s => {
                const p = props.find(x => x.id === s.propId);
                const propName = normalizeStr(p?.nombre);
                const propId = normalizeStr(p?.id);
                const notes = normalizeStr(s.notas);
                const creator = normalizeStr(s.por);
                const status = normalizeStr(s.estado);
                const crewName = normalizeStr(s.cuadrilla);

                return propName.includes(q) || propId.includes(q) || notes.includes(q) || creator.includes(q) || status.includes(q) || crewName.includes(q);
            });
        }

        return arr.sort((a, b) => {
            const aLeido = estaLeido(a, profile?.nombre);
            const bLeido = estaLeido(b, profile?.nombre);
            if (aLeido !== bLeido) return aLeido ? 1 : -1;
            return b.ts - a.ts;
        });
    }, [servicios, filtros, profile, search, props]);

    const pendientes = getPendientesRep(profile?.nombre);

    const handleMarcarTodos = () => {
        const ids = arrFiltrado.filter(s => !estaLeido(s, profile?.nombre)).map(s => s.id);
        if (ids.length === 0) return;
        marcarTodosLeidos(ids);
        showToast(tf('toast.repLeidos', { n: ids.length, s: ids.length === 1 ? '' : 's' }));
    };

    return (
        <div className="anim space-y-4 min-w-0">
            <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold">{t('rep.titulo')}</h1>
                <p className="text-slate-500 text-sm mt-1" dangerouslySetInnerHTML={{
                    __html: tf('rep.resumen', {
                        n: arrFiltrado.length, s1: arrFiltrado.length === 1 ? '' : 's',
                        p: pendientes, s2: pendientes === 1 ? '' : 's'
                    })
                }} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3 min-w-0">
                <div className="flex flex-wrap gap-2">
                    {['hoy', 'semana', 'mes', 'todo'].map(p => (
                        <button
                            key={p}
                            onClick={() => setFiltros({ ...filtros, periodo: p })}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${filtros.periodo === p ? 'bg-sky-600 text-white border-sky-600' : 'border-slate-200 text-slate-600 hover:border-sky-300'}`}
                        >
                            {p === 'hoy' ? t('comun.hoy') : p === 'semana' ? t('jorn.filtroSemana') : p === 'mes' ? t('rep.esteMes') : t('rep.todoHistorial')}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                    <select value={filtros.cuadrilla} onChange={e => setFiltros({ ...filtros, cuadrilla: e.target.value })} className="inp bg-white">
                        <option value="">{t('comun.filtroTodaCuadrilla')}</option>
                        {crews.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                    <select value={filtros.estadoF} onChange={e => setFiltros({ ...filtros, estadoF: e.target.value })} className="inp bg-white">
                        <option value="">{t('comun.filtroTodoResultado')}</option>
                        <option value="Completado">{t('estadoServ.Completado')}</option>
                        <option value="No asistió">{t('estadoServ.No asistió')}</option>
                        <option value="Reporte">{t('estadoServ.Reporte')}</option>
                    </select>
                    <select value={filtros.lectura} onChange={e => setFiltros({ ...filtros, lectura: e.target.value })} className="inp bg-white">
                        <option value="todos">{t('rep.todos')}</option>
                        <option value="pendientes">{t('rep.pendLeer')}</option>
                        <option value="leidos">{t('rep.leidos')}</option>
                    </select>
                </div>

                {/* Buscador dinámico */}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('rep.buscarPh')}
                    className="w-full min-w-0 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition"
                />

                {filtros.lectura !== 'leidos' && arrFiltrado.some(s => !estaLeido(s, profile?.nombre)) && (
                    <button onClick={handleMarcarTodos} className="w-full bg-sky-50 border border-sky-200 text-sky-700 font-bold text-sm py-2.5 rounded-xl hover:bg-sky-100 transition">
                        {tf('rep.marcarTodos', { n: arrFiltrado.filter(s => !estaLeido(s, profile?.nombre)).length })}
                    </button>
                )}
            </div>

            {arrFiltrado.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <p className="text-4xl mb-2">🎉</p>
                    <p className="font-bold text-slate-500">{t('rep.nadaAqui')}</p>
                    <p className="text-sm text-slate-400 mt-1">{t('rep.sinReportes')}</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-3 min-w-0">
                    {arrFiltrado.map(s => {
                        const p = props.find(x => x.id === s.propId);
                        const crew = crews.find(c => c.nombre === s.cuadrilla);
                        const crewColor = PALETA[crew?.color] || { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
                        const leido = estaLeido(s, profile?.nombre);

                        return (
                            <div key={s.id} className={`bg-white rounded-2xl border p-4 min-w-0 transition ${leido ? 'opacity-60 border-slate-100' : 'border-rose-300 shadow-md'}`}>
                                <div className="flex items-start justify-between gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <button onClick={() => navigate('propiedad_detalle', s.propId)} className="font-bold text-sm hover:text-sky-700 text-left truncate block max-w-full">
                                            {p ? p.nombre : s.propId + ' (eliminada)'}
                                        </button>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {s.fecha} · {new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {tf('rep.porUsuario', { nombre: s.por })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.estado === 'Completado' ? 'bg-emerald-100 text-emerald-700' :
                                                s.estado === 'Pospuesto' ? 'bg-amber-100 text-amber-700' :
                                                    s.estado === 'Reporte' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {s.estado === 'Completado' ? '✓' : s.estado === 'Pospuesto' ? '⏩' : s.estado === 'Reporte' ? '📝' : '✕'} {t('estadoServ.' + s.estado)}
                                        </span>
                                        {profile?.rol === 'Admin' && (
                                            <button
                                                onClick={() => { setActiveReport(s.id); setShowDelModal(true); }}
                                                title={t('rep.eliminarTitle')}
                                                className="text-slate-300 hover:text-rose-600 text-sm font-bold p-1 rounded-lg hover:bg-rose-50 transition"
                                            >🗑️</button>
                                        )}
                                    </div>
                                </div>

                                {s.notas && (
                                    <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mt-2">💬 {s.notas}</p>
                                )}

                                <div className="flex items-center justify-between mt-2 gap-2 flex-wrap min-w-0">
                                    {s.cuadrilla ? (
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${crewColor.chip}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${crewColor.dot}`}></span>{s.cuadrilla}
                                        </span>
                                    ) : <span />}

                                    {leido ? (
                                        <span className="text-[11px] font-bold text-emerald-600 shrink-0">{t('rep.leido')}</span>
                                    ) : (
                                        <button onClick={() => marcarLeido(s.id)} className="text-[11px] font-bold bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition active:scale-95 shrink-0">
                                            {t('rep.marcarLeido')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Eliminar Reporte */}
            <DeleteReportModal
                isOpen={showDelModal}
                onClose={() => setShowDelModal(false)}
                reportId={activeReport}
                profile={profile}
            />
        </div>
    );
}
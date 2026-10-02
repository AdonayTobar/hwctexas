// src/views/CrewDetail.jsx
import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';
import { fechaISO, progresoJornada, tieneServicioEseDia } from '../lib/helpers';
import DeleteCrewModal from '../components/DeleteCrewModal';
import PropertyCard from '../components/PropertyCard';

const PALETA = {
    'Azul': { grad: 'from-sky-500 to-sky-600', chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
    'Negro': { grad: 'from-slate-800 to-slate-950', chip: 'bg-slate-900 text-white', dot: 'bg-slate-900' },
    'Morado': { grad: 'from-violet-500 to-purple-600', chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
    'Amarillo': { grad: 'from-amber-400 to-amber-500', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
    'Gris': { grad: 'from-slate-500 to-slate-600', chip: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
    'Teal': { grad: 'from-teal-500 to-teal-600', chip: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
    'Indigo': { grad: 'from-indigo-500 to-indigo-600', chip: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
    'Rosa': { grad: 'from-rose-500 to-rose-600', chip: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
    'Verde': { grad: 'from-emerald-500 to-teal-600', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
};

export default function CrewDetail({ profile, crewId, navigate }) {
    const { t, tf, locale } = useI18n();
    const { crews, props, jornadas, jornadasVirtuales, setJornadasVirtuales } = useData();
    const { showToast } = useToast();

    const [showDelModal, setShowDelModal] = useState(false);
    const [fechaSel, setFechaSel] = useState(fechaISO(new Date()));

    const c = useMemo(() => crews.find(x => x.id === crewId), [crews, crewId]);

    useEffect(() => {
        if (!c) return;
        const exists = [...jornadas, ...jornadasVirtuales].find(x => x.cuadrilla === c.nombre && x.fecha === fechaSel);
        if (!exists) {
            const propsHoy = props.filter(p => p.cuadrilla === c.nombre && p.estado === 'Activa' && tieneServicioEseDia(p, fechaSel));
            if (propsHoy.length > 0) {
                const maxId = [...jornadas, ...jornadasVirtuales].reduce((max, x) => {
                    const m = /^J-(\d+)$/.exec(x.id);
                    return m ? Math.max(max, +m[1]) : max;
                }, 0);

                const j = {
                    id: 'J-' + String(maxId + 1).padStart(4, '0'),
                    cuadrilla: c.nombre, fecha: fechaSel, fechaFin: '',
                    nombre: c.nombre,
                    notas: t('jorn.notasAuto') || 'Generada por el sistema',
                    creadaPor: 'Sistema', creadaPorRol: 'Admin Oro',
                    items: propsHoy.map(p => ({ propId: p.id, estado: 'Pendiente', servId: null, pospFecha: '', pospMotivo: '', pospPor: '' })),
                    ts: Date.now()
                };
                setJornadasVirtuales(prev => [...prev, j]);
            }
        }
    }, [fechaSel, c, jornadas, jornadasVirtuales, props, setJornadasVirtuales, t]);

    if (!c) {
        return (
            <div className="p-10 text-center">
                <p className="text-4xl mb-2">🚫</p>
                <p className="font-bold">{t('crew.noEncontrada')}</p>
                <button onClick={() => navigate('cuadrillas')} className="mt-3 text-sm font-semibold text-sky-600 hover:underline">{t('comun.volver')}</button>
            </div>
        );
    }

    const esAdmin = profile?.rol === 'Admin';
    const s = PALETA[c.color] || { grad: 'from-slate-400 to-slate-500', chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
    const listP = props.filter(p => p.cuadrilla === c.nombre);

    const jornadaDelDia = [...jornadas, ...jornadasVirtuales].find(x => x.cuadrilla === c.nombre && x.fecha === fechaSel);

    return (
        <div className="anim space-y-5 min-w-0">
            <div className="rounded-2xl shadow-sm overflow-hidden bg-white border border-slate-100 min-w-0">
                <div className={`h-14 bg-gradient-to-r ${s.grad}`}></div>
                <div className="p-5 -mt-7">
                    <div className="flex items-end gap-4 flex-wrap">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.grad} text-white flex items-center justify-center font-extrabold text-lg shadow-lg ring-4 ring-white`}>
                            {c.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-extrabold truncate">{c.nombre}</h1>
                            <p className="text-sm text-slate-500 truncate">{c.responsable || '—'} · {c.ciudad}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {esAdmin && (
                                <>
                                    <button onClick={() => navigate('cuadrilla_form', c.id)} className="border border-slate-200 hover:border-sky-400 text-sm font-bold px-4 py-2.5 rounded-xl transition">{t('comun.editar')}</button>
                                    <button onClick={() => setShowDelModal(true)} className="border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold px-4 py-2.5 rounded-xl transition">🗑</button>
                                </>
                            )}
                        </div>
                    </div>
                    {c.telefono && <p className="text-sm mt-3">📞 <a href={`tel:${c.telefono}`} className="text-sky-600 font-semibold hover:underline">{c.telefono}</a></p>}
                    {c.notas && <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mt-2">📝 {c.notas}</p>}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5 min-w-0">

                {/* Panel de Jornadas con Calendario */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 min-w-0">
                    <h3 className="font-extrabold mb-3">{t('nav.jornadas')}</h3>

                    <div className="mb-4">
                        <label className="lbl">{t('crew.selFecha')}</label>
                        <input
                            type="date"
                            value={fechaSel}
                            onChange={e => setFechaSel(e.target.value)}
                            className="inp mt-1"
                        />
                    </div>

                    {jornadaDelDia ? (
                        <button
                            onClick={() => navigate('ruta_detalle', jornadaDelDia.id)}
                            className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-sky-300 transition cursor-pointer min-w-0"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{jornadaDelDia.nombre}</p>
                                    <p className="text-[11px] text-slate-400 capitalize">{new Date(fechaSel + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                                </div>
                                <div className="shrink-0">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.chip}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>{jornadaDelDia.cuadrilla}
                                    </span>
                                </div>
                            </div>

                            {(() => {
                                const pr = progresoJornada(jornadaDelDia);
                                const pct = pr.total ? Math.round(pr.hechas / pr.total * 100) : 0;
                                return (
                                    <>
                                        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${s.dot} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 gap-2 min-w-0">
                                            <span className="shrink-0">{tf('dash.xDeYHechas', { h: pr.hechas, t: pr.total })}</span>
                                            <span className="truncate min-w-0 text-right">{t('jorn.por', { nombre: jornadaDelDia.creadaPor })}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </button>
                    ) : (
                        <div className="p-4 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-100">
                            {t('crew.sinJornadaFecha')}
                        </div>
                    )}
                </div>

                {/* Panel de Propiedades Asignadas */}
                {/* Panel de Propiedades Asignadas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 min-w-0">
                    <h3 className="font-extrabold mb-3">{tf('crew.propsAsignadas', { n: listP.length })}</h3>
                    <div className="space-y-3 min-w-0">
                        {listP.length ? listP.map(p => (
                            <PropertyCard key={p.id} p={p} crew={c} esAdmin={esAdmin} navigate={navigate} />
                        )) : <p className="text-sm text-slate-400 p-4">{t('crew.sinProps')}</p>}
                    </div>
                </div>

            </div>

            <DeleteCrewModal isOpen={showDelModal} onClose={() => setShowDelModal(false)} crewId={c.id} profile={profile} navigate={navigate} />
        </div>
    );
}
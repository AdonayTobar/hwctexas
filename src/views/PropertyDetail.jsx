// src/views/PropertyDetail.jsx
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { calcMensual, fmtMon, fechaISO, propTieneServicio } from '../lib/helpers';
import ReportChoiceModal from '../components/ReportChoiceModal';
import ReportModal from '../components/ReportModal';
import SuspenderModal from '../components/SuspenderModal';
import ServModal from '../components/ServModal';
import PosModal from '../components/PosModal';
import AssignCrewModal from '../components/AssignCrewModal';
import DeletePropertyModal from '../components/DeletePropertyModal';
import { useToast } from '../context/ToastContext';
import Breadcrumb from '../components/Breadcrumb';

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

export default function PropertyDetail({ profile, propertyId, navigate }) {
    const { t, tf, td, locale } = useI18n();
    const { props, crews, jornadas, servicios, actualizarPropiedad } = useData();
    const { showToast } = useToast();

    const [calMes, setCalMes] = useState(new Date().getMonth());
    const [calAno, setCalAno] = useState(new Date().getFullYear());

    // Estados de modales
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showRepModal, setShowRepModal] = useState(false);
    const [showSuspModal, setShowSuspModal] = useState(false);
    const [showServModal, setShowServModal] = useState(false);
    const [showPosModal, setShowPosModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDelModal, setShowDelModal] = useState(false);

    // Estado para el mes del historial
    const [histMes, setHistMes] = useState(new Date().getMonth());
    const [histAno, setHistAno] = useState(new Date().getFullYear());

    const p = useMemo(() => props.find(x => x.id === propertyId), [props, propertyId]);

    if (!p) {
        return (
            <div className="p-10 text-center">
                <p className="text-4xl mb-2">🚫</p>
                <p className="font-bold">{t('prop.noEncontrada')}</p>
                <button onClick={() => navigate('propiedades')} className="mt-3 text-sm font-semibold text-sky-600 hover:underline">{t('prop.volverListado')}</button>
            </div>
        );
    }

    const esAdmin = profile?.rol === 'Admin';
    const crewColor = PALETA[crews.find(c => c.nombre === p.cuadrilla)?.color] || { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };

    // Próximos servicios
    const prox = [];
    let d = new Date(), g = 0;
    while (prox.length < 4 && g < 365) {
        d.setDate(d.getDate() + 1); g++;
        if (propTieneServicio(p, fechaISO(d), jornadas)) prox.push(new Date(d));
    }

    // Lógica del mini-calendario
    const primerDia = new Date(calAno, calMes, 1);
    const ultimoDia = new Date(calAno, calMes + 1, 0);
    const startDay = (primerDia.getDay() + 6) % 7;
    const daysInMonth = ultimoDia.getDate();
    const diasArray = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    const cambiarMes = (dir) => {
        let nuevoMes = calMes + dir;
        let nuevoAno = calAno;
        if (nuevoMes < 0) { nuevoMes = 11; nuevoAno--; }
        else if (nuevoMes > 11) { nuevoMes = 0; nuevoAno++; }
        setCalMes(nuevoMes);
        setCalAno(nuevoAno);
    };

    // Historial filtrado por mes
    const cambiarHistMes = (dir) => {
        let m = histMes + dir;
        let a = histAno;
        if (m < 0) { m = 11; a--; }
        else if (m > 11) { m = 0; a++; }
        setHistMes(m);
        setHistAno(a);
    };

    const historialMes = servicios
        .filter(s => s.propId === p.id)
        .filter(s => {
            const fecha = new Date(s.fecha + 'T00:00:00');
            return fecha.getMonth() === histMes && fecha.getFullYear() === histAno;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return (
        <div className="anim space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <h1 className="text-xl lg:text-2xl font-extrabold leading-tight">{p.nombre}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{tf('prop.alta', { fecha: p.fecha })}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${p.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>● {t('estadoProp.' + p.estado)}</span>
            </div>
            {/* Migas de pan */}
            <Breadcrumb items={[
                { label: t('comun.inicio'), onClick: () => navigate('dashboard') },
                { label: t('nav.propiedades'), onClick: () => navigate('propiedades') },
                { label: p.nombre }
            ]} />

            {/* Notas de la propiedad */}
            {p.notas && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 min-w-0">
                    📝 {p.notas}
                </div>
            )}

            {/* Chips y Botones de Acción */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setShowChoiceModal(true)}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow transition active:scale-95"
                >
                    {t('prop.btnGenerarReporte')}
                </button>

                <button
                    onClick={() => setShowAssignModal(true)}
                    className="border border-slate-200 hover:border-sky-400 text-sm font-bold px-4 py-2.5 rounded-xl transition"
                >
                    {t('prop.btnAsignarCua')}
                </button>

                {esAdmin && (
                    <>
                        <button
                            onClick={() => navigate('propiedad_form', p.id)}
                            className="border border-slate-200 hover:border-sky-400 text-sm font-bold px-4 py-2.5 rounded-xl transition"
                        >
                            {t('comun.editar')}
                        </button>

                        {p.estado === 'Activa' ? (
                            <button
                                onClick={() => setShowSuspModal(true)}
                                className="border border-slate-200 hover:border-amber-400 text-sm font-bold px-4 py-2.5 rounded-xl transition"
                            >
                                {t('prop.btnSuspender')}
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    await actualizarPropiedad(p.id, 'Activa');
                                    showToast(t('toast.propReactivada'));
                                }}
                                className="border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-sm font-bold px-4 py-2.5 rounded-xl transition"
                            >
                                {t('prop.btnReactivar')}
                            </button>
                        )}

                        <button
                            onClick={() => setShowDelModal(true)}
                            className="border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold px-4 py-2.5 rounded-xl transition"
                        >
                            🗑
                        </button>
                    </>
                )}
            </div>

            {/* Grid de Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('prop.lblCiudad')}</p><p className="text-sm font-semibold mt-0.5">{p.ciudad}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('prop.lblContratista')}</p><p className="text-sm font-semibold mt-0.5">{p.contratista || '—'}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('prop.lblCiclo')}</p><p className="text-sm font-semibold mt-0.5">{td('ciclo', p.ciclo || p.frecuenciaTipo || '')}</p></div>
                {esAdmin && (
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('prop.lblCosto')}</p><p className="text-sm font-semibold mt-0.5 text-emerald-600">{fmtMon(calcMensual(p))}</p></div>
                )}

                {/* Días programados (LMXJVSD) */}
                <div className="col-span-2 sm:col-span-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{t('prop.lblDiasProgramados')}</p>
                    <div className="flex gap-1">
                        {diasArray.map(d => (
                            <span key={d} className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[10px] font-bold ${String(p.dias || '').indexOf(d) >= 0 ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-300'}`}>{d}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Programación y Próximos */}
            <div className="grid lg:grid-cols-2 gap-5">
                {/* Mini Calendario */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-extrabold text-sm">{t('prop.programacion')}</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => cambiarMes(-1)} className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold flex items-center justify-center text-xs">←</button>
                            <span className="text-xs font-bold capitalize">{new Date(calAno, calMes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => cambiarMes(1)} className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold flex items-center justify-center text-xs">→</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {diasArray.map(d => <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="h-7 bg-slate-50 rounded-md"></div>)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const iso = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const hasServ = propTieneServicio(p, iso, jornadas);
                            return <div key={day} className={`h-7 flex items-center justify-center rounded-md text-[10px] font-bold ${hasServ ? 'bg-sky-500 text-white shadow' : 'bg-slate-50 text-slate-500'}`}>{day}</div>
                        })}
                    </div>
                </div>

                {/* Próximos servicios */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
                    <h3 className="font-extrabold mb-3">{t('prop.proximos')}</h3>
                    {prox.length > 0 ? prox.map((d, i) => {
                        const l = 'LMXJVSD'[(d.getDay() + 6) % 7];
                        return (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2 justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">{l}</span>
                                    <span className="text-sm font-semibold capitalize">{d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                                </div>
                            </div>
                        );
                    }) : <p className="text-sm text-slate-400 p-4">{t('prop.defineDias')}</p>}
                </div>
            </div>

            {/* Historial de Servicios y Reportes (Por Mes) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                    <h3 className="font-extrabold">{t('prop.historial')}</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => cambiarHistMes(-1)} className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold flex items-center justify-center text-xs">←</button>
                        <span className="text-xs font-bold capitalize min-w-[120px] text-center">{new Date(histAno, histMes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => cambiarHistMes(1)} className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold flex items-center justify-center text-xs">→</button>
                    </div>
                </div>
                <div className="space-y-2 min-w-0">
                    {historialMes.length === 0 ? (
                        <p className="text-sm text-slate-400 p-4 text-center">{t('prop.histVacio')}</p>
                    ) : (
                        historialMes.map(s => (
                            <div key={s.id} className={`border rounded-xl p-3 min-w-0 ${s.estado === 'Completado' ? 'border-emerald-100 bg-emerald-50/30' :
                                s.estado === 'Pospuesto' ? 'border-amber-100 bg-amber-50/30' :
                                    s.estado === 'Reporte' ? 'border-sky-100 bg-sky-50/30' :
                                        'border-slate-100 bg-white'
                                }`}>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-bold text-slate-500">{s.fecha}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.estado === 'Completado' ? 'bg-emerald-100 text-emerald-700' :
                                        s.estado === 'Pospuesto' ? 'bg-amber-100 text-amber-700' :
                                            s.estado === 'Reporte' ? 'bg-sky-100 text-sky-700' :
                                                'bg-rose-100 text-rose-700'
                                        }`}>
                                        {s.estado === 'Completado' ? '✓ ' : s.estado === 'Pospuesto' ? '⏩ ' : s.estado === 'Reporte' ? '📝 ' : '✕ '}
                                        {t('estadoServ.' + s.estado) || s.estado}
                                    </span>
                                </div>
                                {s.notas && (
                                    <p className="text-sm text-slate-700 mt-1 bg-white/50 rounded-lg px-2 py-1.5 border border-slate-100 break-words">
                                        💬 {s.notas}
                                    </p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-1">Por {s.por} {s.cuadrilla ? `· ${s.cuadrilla}` : ''}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modales */}
            <ReportChoiceModal
                isOpen={showChoiceModal}
                onClose={() => setShowChoiceModal(false)}
                onChooseServ={() => setShowServModal(true)}
                onChoosePos={() => setShowPosModal(true)}
            />
            <ServModal isOpen={showServModal} onClose={() => setShowServModal(false)} propId={p.id} jourId={null} profile={profile} />
            <PosModal isOpen={showPosModal} onClose={() => setShowPosModal(false)} propId={p.id} jourId={null} profile={profile} />
            <ReportModal isOpen={showRepModal} onClose={() => setShowRepModal(false)} propId={p.id} profile={profile} />
            <SuspenderModal isOpen={showSuspModal} onClose={() => setShowSuspModal(false)} propId={p.id} profile={profile} />
            <AssignCrewModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} propId={p.id} profile={profile} />
            <DeletePropertyModal isOpen={showDelModal} onClose={() => setShowDelModal(false)} propId={p.id} profile={profile} navigate={navigate} />
        </div>
    );
}
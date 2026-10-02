// src/views/PropertyForm.jsx
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';
import { calcMensual, fmtMon, fechaISO } from '../lib/helpers';
import Breadcrumb from '../components/Breadcrumb';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const SEM_FILAS = [
    ['1', 'sem.1'], ['2', 'sem.2'], ['3', 'sem.3'], ['4', 'sem.4'], ['U', 'sem.ult']
];

export default function PropertyForm({ profile, propertyId, navigate }) {
    const { t, tf, td } = useI18n();
    const { props, crews, guardarPropiedad } = useData();
    const { showToast } = useToast();

    const p = useMemo(() => props.find(x => x.id === propertyId), [props, propertyId]);

    const [form, setForm] = useState({
        nombre: p?.nombre || '',
        servicio: p?.servicio || 'Sweep',
        ciudad: p?.ciudad || 'Austin',
        contratista: p?.contratista || '',
        crew_id: p?.crew_id || null,
        dias: p?.dias || '',
        frecuenciaTipo: p?.frecuenciaTipo || 'Semanal',
        diasMensual: p?.diasMensual || [],
        diasMensualFechas: p?.diasMensualFechas || [],
        estado: p?.estado || 'Activa',
        costoTipo: p?.costoTipo || 'Por mes',
        costoMonto: p?.costoMonto || '',
        visitasMes: p?.visitasMes || '',
        gate: p?.gate || '',
        dump: p?.dump || '',
        notas: p?.notas || ''
    });

    const [fechasInput, setFechasInput] = useState((p?.diasMensualFechas || []).join(', '));
    const [crewSearch, setCrewSearch] = useState(() => crews.find(c => c.id === p?.crew_id)?.nombre || '');
    const filteredCrews = crews.filter(c => c.nombre.toLowerCase().includes(crewSearch.toLowerCase()));

    const ciudades = ['Austin', 'Houston', 'Dallas', 'College Station', 'San Antonio', 'Beaumont'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleDia = (d) => {
        setForm(prev => {
            const dias = prev.dias || '';
            return { ...prev, dias: dias.includes(d) ? dias.replace(d, '') : dias + d };
        });
    };

    const toggleMensualDia = (val) => {
        setForm(prev => {
            const arr = prev.diasMensual.includes(val) ? prev.diasMensual.filter(x => x !== val) : [...prev.diasMensual, val];
            return { ...prev, diasMensual: arr };
        });
    };

    const handleFechasChange = (e) => {
        const val = e.target.value;
        setFechasInput(val);
        const arr = val.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v) && v >= 1 && v <= 31);
        setForm(prev => ({ ...prev, diasMensualFechas: arr }));
    };

    const handleSave = async () => {
        try {
            const newId = await guardarPropiedad(form, propertyId);
            showToast(t('toast.propGuardada'));
            navigate('propiedad_detalle', newId || propertyId);
        } catch (err) {
            console.error(err);
            showToast(t('err.guardarProp'));
        }
    };

    return (
        <div className="anim max-w-2xl space-y-4 min-w-0">
            <h2 className="font-extrabold text-lg">{p ? t('prop.formEditar') : t('prop.formNueva')}</h2>

            <Breadcrumb items={[
                { label: t('comun.inicio'), onClick: () => navigate('dashboard') },
                { label: t('nav.propiedades'), onClick: () => navigate('propiedades') },
                { label: p ? tf('prop.crumbEditar', { nombre: p.nombre }) : t('prop.crumbNueva') }
            ]} />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-5">

                <div>
                    <label className="lbl">{t('prop.fNombre')}</label>
                    <input name="nombre" value={form.nombre} onChange={handleChange} placeholder={t('prop.fNombrePh')} className="inp" />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="lbl">{t('prop.fServicio')}</label>
                        <select name="servicio" value={form.servicio} onChange={handleChange} className="inp bg-white">
                            <option>Sweep</option>
                            <option>Porter</option>
                        </select>
                    </div>
                    <div>
                        <label className="lbl">{t('prop.fCiudad')}</label>
                        <select name="ciudad" value={form.ciudad} onChange={handleChange} className="inp bg-white">
                            {ciudades.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Buscador dinámico de Cuadrilla */}
                <div className="sm:col-span-2">
                    <label className="lbl">{t('prop.fCuadrilla')}</label>
                    <input
                        type="text"
                        value={crewSearch}
                        onChange={(e) => {
                            setCrewSearch(e.target.value);
                            setForm(prev => ({ ...prev, crew_id: null }));
                        }}
                        placeholder={t('comun.buscarPh')}
                        className="inp mt-1"
                    />
                    <div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                        <button
                            type="button"
                            onClick={() => { setForm(prev => ({ ...prev, crew_id: null })); setCrewSearch(''); }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-400 italic"
                        >{t('comun.sinAsignarOp')}</button>
                        {filteredCrews.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => { setForm(prev => ({ ...prev, crew_id: c.id })); setCrewSearch(c.nombre); }}
                                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition ${form.crew_id === c.id ? 'bg-sky-50 font-bold text-sky-700' : 'hover:bg-sky-50 text-slate-600'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span> {c.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="lbl">{t('prop.fContratista')}</label>
                        <input name="contratista" value={form.contratista} onChange={handleChange} placeholder="HWC" className="inp" />
                    </div>
                </div>

                {/* Frecuencia */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
                        {['Semanal', 'Mensual', 'Mensual Fecha'].map(tipo => (
                            <button
                                key={tipo}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, frecuenciaTipo: tipo }))}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${form.frecuenciaTipo === tipo ? 'bg-sky-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {t('frec.' + tipo)}
                            </button>
                        ))}
                    </div>

                    {form.frecuenciaTipo === 'Semanal' && (
                        <div>
                            <label className="lbl">{t('prop.selDias')}</label>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                {DIAS.map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => toggleDia(d)}
                                        className={`flex w-9 h-9 items-center justify-center rounded-full font-bold text-sm transition ${form.dias.includes(d) ? 'bg-sky-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
                                    >{d}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {form.frecuenciaTipo === 'Mensual' && (
                        <div>
                            <label className="lbl">{t('prop.selSemanas')}</label>
                            <div className="mt-2 overflow-x-auto pb-1">
                                <table className="w-full text-center border-separate" style={{ borderSpacing: 4 }}>
                                    <thead>
                                        <tr>
                                            <th className="w-12"></th>
                                            {DIAS.map(d => <th key={d} className="text-[11px] font-bold text-slate-400 w-10">{d}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SEM_FILAS.map(([val, key]) => (
                                            <tr key={val}>
                                                <td className="text-[11px] font-bold text-slate-400 text-right pr-2 align-middle">{t(key)}</td>
                                                {DIAS.map(d => {
                                                    const clave = val + '-' + d;
                                                    const activo = form.diasMensual.includes(clave);
                                                    return (
                                                        <td key={clave}>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMensualDia(clave)}
                                                                className={`w-10 h-10 rounded-xl font-bold text-sm transition ${activo ? 'bg-sky-500 text-white shadow' : 'bg-white text-slate-300 border border-slate-200 hover:border-sky-400'}`}
                                                            >{d}</button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2">{t('prop.matrizAyuda')}</p>
                        </div>
                    )}

                    {form.frecuenciaTipo === 'Mensual Fecha' && (
                        <div>
                            <label className="lbl">{t('prop.selFechas')}</label>
                            <input
                                value={fechasInput}
                                onChange={handleFechasChange}
                                placeholder={t('prop.selFechasPh')}
                                className="inp mt-2"
                            />
                            <p className="text-[11px] text-slate-500 mt-2">{t('prop.fechasAyuda')}</p>
                        </div>
                    )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="lbl">{t('prop.fEstado')}</label>
                        <select name="estado" value={form.estado} onChange={handleChange} className="inp bg-white">
                            <option value="Activa">{t('estadoProp.Activa')}</option>
                            <option value="Suspendida">{t('estadoProp.Suspendida')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="lbl">{t('prop.fCostoTipo')}</label>
                        <select name="costoTipo" value={form.costoTipo} onChange={handleChange} className="inp bg-white">
                            <option value="Por mes">{t('costoTipo.Por mes')}</option>
                            <option value="Por semana">{t('costoTipo.Por semana')}</option>
                            <option value="Por vez">{t('costoTipo.Por vez')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="lbl">{t('prop.fMonto')}</label>
                        <input name="costoMonto" type="number" value={form.costoMonto} onChange={handleChange} className="inp" />
                    </div>
                    <div>
                        <label className="lbl">{t('prop.fVisitasMes')}</label>
                        <input name="visitasMes" type="number" value={form.visitasMes} onChange={handleChange} className="inp" />
                    </div>
                </div>

                <p className="text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    {t('prop.costoEstimado')} <b className="text-emerald-700">{fmtMon(calcMensual(form))}</b>
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="lbl">{t('prop.fGate')}</label>
                        <input name="gate" value={form.gate} onChange={handleChange} className="inp" />
                    </div>
                    <div>
                        <label className="lbl">{t('prop.fDump')}</label>
                        <input name="dump" value={form.dump} onChange={handleChange} className="inp" />
                    </div>
                </div>

                <div>
                    <label className="lbl">{t('comun.notas')}</label>
                    <textarea name="notas" rows="2" value={form.notas} onChange={handleChange} className="inp resize-none"></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => window.history.back()} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition">{t('comun.cancelar')}</button>
                    <button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition active:scale-95">{t('comun.guardar')}</button>
                </div>
            </div>
        </div>
    );
}
// src/views/Export.jsx
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';
import * as XLSX from 'xlsx';
import { formatFrequency } from '../lib/helpers';

export default function Export({ profile, navigate }) {
    const { t } = useI18n();
    const { props, crews, servicios } = useData();
    const { showToast } = useToast();

    const [tipo, setTipo] = useState('general');
    const [propSel, setPropSel] = useState('');
    const [cuadSel, setCoadSel] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const handleExport = () => {
        if (desde && hasta && desde > hasta) {
            return showToast(t('exp.errFechas'));
        }

        // Filtrar servicios
        let servs = servicios.filter(s => {
            if (desde && s.fecha < desde) return false;
            if (hasta && s.fecha > hasta) return false;
            if (tipo === 'prop') {
                const p = props.find(x => x.id === s.propId);
                if (!p || p.nombre !== propSel) return false;
            }
            if (tipo === 'cuad' && s.cuadrilla !== cuadSel) return false;
            return true;
        });

        if (servs.length === 0) return showToast(t('exp.vacio'));

        // Mapear a un formato limpio y en inglés
        const mappedData = servs.map(s => {
            const p = props.find(x => x.id === s.propId) || {};
            return {
                "Date": s.fecha,
                "Property": p.nombre || "Unknown",
                "City": p.ciudad || "Unknown",
                "Service": p.servicio || "N/A",
                "Crew": s.cuadrilla || "Unassigned",
                "Status": s.estado,
                "Notes": s.notas || "",
                "Logged By": s.por || "System"
            };
        });

        // Agrupar por ciudad
        const grouped = {};
        mappedData.forEach(row => {
            const city = row.City || "Other";
            if (!grouped[city]) grouped[city] = [];
            grouped[city].push(row);
        });

        // Crear el libro de Excel
        const wb = XLSX.utils.book_new();

        // Crear una hoja por cada ciudad
        Object.keys(grouped).sort().forEach(city => {
            // Ordenar por fecha ascendente dentro de la hoja
            const rows = grouped[city].sort((a, b) => a.Date < b.Date ? -1 : 1);
            const ws = XLSX.utils.json_to_sheet(rows);

            // Anchos de columna profesionales
            ws['!cols'] = [
                { wch: 12 }, // Date
                { wch: 35 }, // Property
                { wch: 15 }, // City
                { wch: 10 }, // Service
                { wch: 20 }, // Crew
                { wch: 15 }, // Status
                { wch: 45 }, // Notes
                { wch: 15 }  // Logged By
            ];

            // Nombre de la hoja (máx 31 caracteres, sin caracteres especiales)
            let sheetName = city.substring(0, 28).replace(/[^a-zA-Z0-9 ]/g, '').trim();
            if (!sheetName) sheetName = "Data";

            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        // Agregar una hoja de "Catálogo de Propiedades" al final
        const propsFiltered = props.filter(p => {
            if (tipo === 'prop') return p.nombre === propSel;
            if (tipo === 'cuad') return p.cuadrilla === cuadSel;
            return true;
        });

        const propsData = propsFiltered.map(p => ({
            "Property ID": p.id,
            "Name": p.nombre,
            "City": p.ciudad,
            "Service": p.servicio,
            "Crew": p.cuadrilla || "Unassigned",
            "Cycle Type": p.frecuenciaTipo || 'Semanal',
            "Schedule Details": formatFrequency(p), // <-- Aquí usamos la función mágica
            "Status": p.estado
        }));

        const wsProps = XLSX.utils.json_to_sheet(propsData);
        wsProps['!cols'] = [
            { wch: 15 }, // ID
            { wch: 35 }, // Name
            { wch: 15 }, // City
            { wch: 10 }, // Service
            { wch: 20 }, // Crew
            { wch: 15 }, // Cycle Type
            { wch: 35 }, // Schedule Details (más ancha)
            { wch: 10 }  // Status
        ];
        XLSX.utils.book_append_sheet(wb, wsProps, "Properties Catalog");

        // Generar el archivo
        const fileName = `HWC_Report_${desde || 'Start'}_to_${hasta || 'End'}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showToast(t('exp.exito'));
    };

    return (
        <div className="anim max-w-2xl space-y-4 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-extrabold">{t('exp.titulo')}</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-5">

                {/* Tipo de Exportación */}
                <div>
                    <label className="lbl">{t('exp.tipo')}</label>
                    <div className="grid sm:grid-cols-3 gap-2 mt-1">
                        <button onClick={() => setTipo('general')} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${tipo === 'general' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'}`}>{t('exp.general')}</button>
                        <button onClick={() => setTipo('prop')} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${tipo === 'prop' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'}`}>{t('exp.prop')}</button>
                        <button onClick={() => setTipo('cuad')} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${tipo === 'cuad' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'}`}>{t('exp.cuad')}</button>
                    </div>
                </div>

                {/* Buscador dinámico de Propiedad */}
                {tipo === 'prop' && (
                    <div>
                        <label className="lbl">{t('exp.lblProp')}</label>
                        <input
                            list="props-list"
                            value={propSel}
                            onChange={e => setPropSel(e.target.value)}
                            placeholder="🔍 Type to search..."
                            className="inp mt-1"
                        />
                        <datalist id="props-list">
                            {props.map(p => <option key={p.id} value={p.nombre}>{p.id} · {p.ciudad}</option>)}
                        </datalist>
                    </div>
                )}

                {/* Buscador dinámico de Cuadrilla */}
                {tipo === 'cuad' && (
                    <div>
                        <label className="lbl">{t('exp.lblCuad')}</label>
                        <input
                            list="crews-list"
                            value={cuadSel}
                            onChange={e => setCoadSel(e.target.value)}
                            placeholder="🔍 Type to search..."
                            className="inp mt-1"
                        />
                        <datalist id="crews-list">
                            {crews.map(c => <option key={c.id} value={c.nombre}>{c.ciudad}</option>)}
                        </datalist>
                    </div>
                )}

                {/* Fechas */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="lbl">{t('exp.desde')}</label>
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="inp mt-1" />
                    </div>
                    <div>
                        <label className="lbl">{t('exp.hasta')}</label>
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="inp mt-1" />
                    </div>
                </div>

                {/* Botón Descargar */}
                <button onClick={handleExport} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow transition active:scale-95">
                    {t('exp.descargar')}
                </button>
            </div>
        </div>
    );
}
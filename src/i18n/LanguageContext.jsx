// src/i18n/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { translations, domainDict } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        try {
            const saved = localStorage.getItem('hwc_idioma');
            if (saved === 'es' || saved === 'en') return saved;
        } catch (e) { }
        const navLang = (navigator.language || 'es').toLowerCase();
        return navLang.startsWith('en') ? 'en' : 'es';
    });

    useEffect(() => {
        try { localStorage.setItem('hwc_idioma', lang); } catch (e) { }
        document.documentElement.lang = lang;
    }, [lang]);

    const t = (key) => translations[lang][key] || translations.es[key] || key;

    const tf = (key, vars) => {
        let str = t(key);
        if (vars) {
            Object.keys(vars).forEach(k => {
                str = str.replace(new RegExp(`{${k}}`, 'g'), vars[k]);
            });
        }
        return str;
    };

    const td = (dict, val) => domainDict[lang][dict]?.[val] || val;

    // Nueva función para formatear fechas según el idioma
    const locale = lang === 'en' ? 'en-US' : 'es-MX';

    const changeLanguage = (newLang) => setLang(newLang);

    return (
        <LanguageContext.Provider value={{ lang, t, tf, td, changeLanguage, locale }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useI18n = () => useContext(LanguageContext);
// src/components/Breadcrumb.jsx
export default function Breadcrumb({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 flex-wrap min-w-0">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 min-w-0">
                    {index < items.length - 1 ? (
                        <>
                            <button
                                onClick={item.onClick}
                                className="hover:text-sky-600 font-semibold transition truncate"
                            >
                                {item.label}
                            </button>
                            <span className="text-slate-300">›</span>
                        </>
                    ) : (
                        <span className="text-slate-600 font-bold truncate">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}
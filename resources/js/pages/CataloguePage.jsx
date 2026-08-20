import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Search, Trash2, ImagePlus, Hash, Type, BadgeDollarSign, Award, Layers, RotateCcw,
} from 'lucide-react';
import api from '../lib/api';

const emptyFilters = {
    reference: '',
    name: '',
    price: '',
    brand: '',
    category: '',
};

const FILTER_FIELDS = [
    { key: 'reference', label: 'Réf', icon: Hash, hint: 'N° pièce' },
    { key: 'name', label: 'Désignation', icon: Type, hint: 'Pièce' },
    { key: 'price', label: 'Prix', icon: BadgeDollarSign, hint: 'MAD' },
    { key: 'brand', label: 'Marque', icon: Award, hint: 'OEM / Aftermarket' },
    { key: 'category', label: 'Catégorie', icon: Layers, hint: 'Famille' },
];

export default function CataloguePage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(emptyFilters);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        api.get('/catalog-products')
            .then((res) => setItems(res.data.data ?? []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (item) => {
        if (!window.confirm(`Retirer « ${item.name} » du catalogue ?`)) return;
        try {
            await api.delete(`/catalog-products/${item.id}`);
            load();
        } catch {
            setError('Suppression impossible');
        }
    };

    const filteredItems = useMemo(() => {
        const refQ = filters.reference.trim().toLowerCase();
        const nameQ = filters.name.trim().toLowerCase();
        const priceQ = filters.price.trim().toLowerCase();
        const brandQ = filters.brand.trim().toLowerCase();
        const catQ = filters.category.trim().toLowerCase();

        return items.filter((item) => {
            if (refQ) {
                const ref = `${item.reference || ''} ${item.article_id || ''}`.toLowerCase();
                if (!ref.includes(refQ)) return false;
            }
            if (nameQ && !(item.name || '').toLowerCase().includes(nameQ)) return false;
            if (brandQ && !(item.brand || '').toLowerCase().includes(brandQ)) return false;
            if (catQ && !(item.category || '').toLowerCase().includes(catQ)) return false;
            if (priceQ) {
                const priceStr = item.price != null ? String(item.price) : '';
                if (!priceStr.toLowerCase().includes(priceQ)) return false;
            }
            return true;
        });
    }, [items, filters]);

    const hasActiveFilters = Object.values(filters).some((v) => String(v).trim() !== '');

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Catalogue</h2>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-zinc-800 dark:border-zinc-700 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange to-transparent" />

                <div className="relative z-10 flex items-center justify-between gap-2 px-2.5 pt-1.5 pb-1 border-b border-white/10">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-orange text-white">
                            <Search className="w-3 h-3" strokeWidth={2.5} />
                        </span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-white truncate">
                            Recherche pièces
                        </span>
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => setFilters(emptyFilters)}
                            className="inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300 hover:text-brand-orange hover:bg-white/5 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    )}
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-2">
                    {FILTER_FIELDS.map(({ key, label, icon: Icon, hint }) => {
                        const active = String(filters[key] || '').trim() !== '';
                        return (
                            <label
                                key={key}
                                className={`group relative block min-w-0 rounded-lg border transition-all duration-200 ${
                                    active
                                        ? 'border-brand-orange bg-zinc-950'
                                        : 'border-zinc-700 bg-zinc-950 hover:border-brand-orange/60'
                                }`}
                            >
                                <span className="flex items-center gap-1 px-1.5 pt-1">
                                    <Icon
                                        className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-brand-orange' : 'text-orange-400'}`}
                                        strokeWidth={2.5}
                                    />
                                    <span className={`text-[11px] font-extrabold uppercase tracking-wide truncate leading-none ${
                                        active ? 'text-brand-orange' : 'text-white'
                                    }`}>
                                        {label}
                                    </span>
                                </span>
                                <input
                                    type="text"
                                    value={filters[key]}
                                    onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                                    placeholder={hint}
                                    className="w-full h-6 bg-transparent border-0 px-1.5 pb-1 pt-0 text-[11px] font-semibold tracking-wide text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0"
                                />
                            </label>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm border border-red-100 dark:border-red-800">{error}</div>
            )}

            {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : filteredItems.length ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col"
                        >
                            <div className="relative flex-1 bg-slate-100 dark:bg-slate-800">
                                {item.photo_url ? (
                                    <img src={item.photo_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                        <ImagePlus className="w-7 h-7" />
                                    </div>
                                )}
                                {item.description && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-1.5 pt-5 pb-1.5">
                                        <p className="text-[9px] leading-snug text-white/95 line-clamp-2">{item.description}</p>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    title="Retirer"
                                    onClick={() => handleDelete(item)}
                                    className="absolute top-1.5 right-1.5 z-10 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="px-1.5 py-1.5 space-y-0.5">
                                <p className="text-[9px] font-mono font-semibold text-brand-orange truncate">{item.reference || item.article_id}</p>
                                <p className="text-[11px] font-bold text-slate-800 dark:text-white line-clamp-1 leading-tight">{item.name}</p>
                                <div className="flex items-end justify-between gap-1 pt-0.5">
                                    <p className="text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
                                        {item.price != null && item.price !== ''
                                            ? `${Number(item.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD`
                                            : '—'}
                                    </p>
                                    <p className={`text-[9px] font-semibold tabular-nums shrink-0 ${
                                        Number(item.stock_actuel) <= 0
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {Number(item.stock_actuel ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })}
                                        {item.unit ? ` ${item.unit}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-12 text-center text-sm text-slate-500">
                    {items.length
                        ? 'Aucun résultat pour ces filtres'
                        : 'Aucune pièce catalogue — ajoutez-en via Config Catalogue'}
                </div>
            )}
        </div>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Plus, Search, Trash2, X, ImagePlus, Hash, Type, BadgeDollarSign, Award, Layers, RotateCcw,
} from 'lucide-react';
import api from '../lib/api';

const emptyForm = {
    product_id: '',
    search: '',
    category: '',
    brand: '',
    description: '',
    price: '',
    photo: null,
};

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
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [filters, setFilters] = useState(emptyFilters);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            api.get('/catalog-products'),
            api.get('/products', { params: { all: 1 } }),
        ])
            .then(([catalogRes, productsRes]) => {
                setItems(catalogRes.data.data ?? []);
                setProducts(productsRes.data.data ?? []);
            })
            .catch(() => {
                setItems([]);
                setProducts([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const catalogedIds = useMemo(
        () => new Set(items.map((i) => String(i.product_id))),
        [items],
    );

    /** Produits de la fiche produit pas encore au catalogue */
    const availableProducts = useMemo(() => {
        const q = form.search.trim().toLowerCase();
        return products
            .filter((p) => !catalogedIds.has(String(p.id)))
            .filter((p) => {
                if (!q) return true;
                return (
                    (p.reference || '').toLowerCase().includes(q)
                    || (p.article_id || '').toLowerCase().includes(q)
                    || (p.name || '').toLowerCase().includes(q)
                );
            })
            .slice(0, 12);
    }, [products, catalogedIds, form.search]);

    const selectedProduct = products.find((p) => String(p.id) === String(form.product_id));

    const openModal = () => {
        setForm(emptyForm);
        setPreview(null);
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setForm(emptyForm);
        setPreview(null);
        setError('');
    };

    const onPhotoChange = (file) => {
        setForm((f) => ({ ...f, photo: file || null }));
        if (preview) URL.revokeObjectURL(preview);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.product_id) {
            setError('Sélectionnez une référence depuis la fiche produit');
            return;
        }
        setSaving(true);
        try {
            const data = new FormData();
            data.append('product_id', form.product_id);
            data.append('category', form.category || '');
            data.append('brand', form.brand || '');
            data.append('description', form.description || '');
            if (form.price !== '') data.append('price', form.price);
            if (form.photo) data.append('photo', form.photo);
            await api.post('/catalog-products', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            closeModal();
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Impossible d\'ajouter au catalogue');
        } finally {
            setSaving(false);
        }
    };

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

    const cards = [...filteredItems, { id: 'add', isAdd: true }];
    const hasActiveFilters = Object.values(filters).some((v) => String(v).trim() !== '');

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Catalogue</h2>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 dark:border-zinc-700 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/70 to-transparent" />
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-brand-orange/10 blur-2xl pointer-events-none" />
                <div className="absolute -right-6 top-0 w-20 h-20 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

                <div className="relative flex items-center justify-between gap-2 px-2.5 pt-1.5 pb-1 border-b border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-orange/20 text-brand-orange ring-1 ring-brand-orange/30">
                            <Search className="w-3 h-3" strokeWidth={2.5} />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200/90 truncate">
                            Recherche pièces
                        </span>
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => setFilters(emptyFilters)}
                            className="inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 hover:text-brand-orange hover:bg-white/5 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    )}
                </div>

                <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-2">
                    {FILTER_FIELDS.map(({ key, label, icon: Icon, hint }) => {
                        const active = String(filters[key] || '').trim() !== '';
                        return (
                            <label
                                key={key}
                                className={`group relative block min-w-0 rounded-lg border transition-all duration-200 ${
                                    active
                                        ? 'border-brand-orange/50 bg-brand-orange/10 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.15)]'
                                        : 'border-white/10 bg-black/35 hover:border-orange-400/35 hover:bg-black/45'
                                }`}
                            >
                                <span className="flex items-center gap-1 px-1.5 pt-1">
                                    <Icon
                                        className={`w-3 h-3 shrink-0 ${active ? 'text-brand-orange' : 'text-zinc-500 group-hover:text-orange-300'}`}
                                        strokeWidth={2.25}
                                    />
                                    <span className={`text-[9px] font-bold uppercase tracking-[0.12em] truncate ${
                                        active ? 'text-brand-orange' : 'text-zinc-400 group-hover:text-zinc-200'
                                    }`}>
                                        {label}
                                    </span>
                                </span>
                                <input
                                    type="text"
                                    value={filters[key]}
                                    onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                                    placeholder={hint}
                                    className="w-full h-6 bg-transparent border-0 px-1.5 pb-1 pt-0 text-[11px] font-semibold tracking-wide text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                                />
                            </label>
                        );
                    })}
                </div>
            </div>

            {error && !modalOpen && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm border border-red-100 dark:border-red-800">{error}</div>
            )}

            {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                    {cards.map((item) => (
                        item.isAdd ? (
                            <button
                                key="add"
                                type="button"
                                onClick={openModal}
                                className="aspect-[3/4] rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100/70 dark:hover:bg-orange-900/30 transition-colors flex flex-col items-center justify-center gap-2 text-orange-600 dark:text-orange-400"
                            >
                                <span className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
                                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wide">Ajouter</span>
                            </button>
                        ) : (
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
                        )
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[94vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-zinc-950 to-orange-700 shrink-0">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wide">Ajouter au catalogue</h3>
                            <button type="button" onClick={closeModal} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm border border-red-100 dark:border-red-800">{error}</div>
                            )}

                            <div>
                                <label className="field-label">Importer réf. fiche produit</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={form.search}
                                        onChange={(e) => setForm((f) => ({ ...f, search: e.target.value, product_id: '' }))}
                                        placeholder="Rechercher par réf ou désignation…"
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm"
                                    />
                                </div>
                                {selectedProduct && (
                                    <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                        Sélectionné : {selectedProduct.reference} — {selectedProduct.name}
                                    </p>
                                )}
                                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                                    {availableProducts.length ? availableProducts.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setForm((f) => ({
                                                ...f,
                                                product_id: String(p.id),
                                                search: `${p.reference} — ${p.name}`,
                                            }))}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-orange-50 dark:hover:bg-slate-800 ${
                                                String(form.product_id) === String(p.id) ? 'bg-orange-50 dark:bg-orange-950/30' : ''
                                            }`}
                                        >
                                            <span className="font-mono font-semibold text-brand-orange">{p.reference}</span>
                                            <span className="text-slate-600 dark:text-slate-300"> — {p.name}</span>
                                        </button>
                                    )) : (
                                        <p className="px-3 py-4 text-center text-xs text-slate-400">
                                            Aucun produit disponible — créez-en d&apos;abord sur Fiche Produit
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="field-label">Catégorie</label>
                                    <input
                                        type="text"
                                        value={form.category}
                                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Marque</label>
                                    <input
                                        type="text"
                                        value={form.brand}
                                        onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="field-label">Description</label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="field-label">Prix (facultatif)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.price}
                                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                    placeholder="—"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="field-label">Photo du produit</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 file:font-semibold"
                                />
                                {preview && (
                                    <img src={preview} alt="Aperçu" className="mt-2 h-28 w-full object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                                )}
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={closeModal} className="btn-secondary text-sm flex-1">Annuler</button>
                                <button type="submit" disabled={saving} className="btn-primary text-sm flex-1">
                                    {saving ? 'Enregistrement…' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

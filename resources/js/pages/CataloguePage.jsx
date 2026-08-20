import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, X, ImagePlus } from 'lucide-react';
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

export default function CataloguePage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
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
            setError('Sélectionnez un produit en stock');
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

    const cards = [...items, { id: 'add', isAdd: true }];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => navigate('/stock/produits')} className="btn-secondary text-sm">
                    <ArrowLeft className="w-4 h-4" /> Fiche Produit
                </button>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catalogue produits</h2>
                    <p className="text-xs text-slate-500">Commercialisation des produits déjà en stock</p>
                </div>
            </div>

            {error && !modalOpen && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm border border-red-100 dark:border-red-800">{error}</div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="aspect-[4/5] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {cards.map((item) => (
                        item.isAdd ? (
                            <button
                                key="add"
                                type="button"
                                onClick={openModal}
                                className="aspect-[4/5] rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100/70 dark:hover:bg-orange-900/30 transition-colors flex flex-col items-center justify-center gap-3 text-orange-600 dark:text-orange-400"
                            >
                                <span className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <Plus className="w-8 h-8" strokeWidth={2.5} />
                                </span>
                                <span className="text-sm font-bold uppercase tracking-wide">Ajouter</span>
                            </button>
                        ) : (
                            <div
                                key={item.id}
                                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col"
                            >
                                <div className="relative flex-1 bg-slate-100 dark:bg-slate-800">
                                    {item.photo_url ? (
                                        <img src={item.photo_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                            <ImagePlus className="w-12 h-12" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        title="Retirer"
                                        onClick={() => handleDelete(item)}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="p-3 space-y-1">
                                    <p className="text-[10px] font-mono font-semibold text-brand-orange">{item.reference || item.article_id}</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</p>
                                    {(item.brand || item.category) && (
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {[item.brand, item.category].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                    <p className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                                        Qté :{' '}
                                        <span className={Number(item.quantity) <= 0 ? 'text-red-600 dark:text-red-400' : 'text-brand-navy dark:text-orange-400'}>
                                            {Number(item.quantity ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })}
                                        </span>
                                        {item.unit ? ` ${item.unit}` : ''}
                                    </p>
                                    {item.price != null && item.price !== '' && (
                                        <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {Number(item.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                                        </p>
                                    )}
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
                                <label className="field-label">Produit en stock (réf / désignation)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={form.search}
                                        onChange={(e) => setForm((f) => ({ ...f, search: e.target.value, product_id: '' }))}
                                        placeholder="Rechercher…"
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
                                        <p className="px-3 py-4 text-center text-xs text-slate-400">Aucun produit disponible</p>
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

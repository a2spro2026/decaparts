import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LayoutGrid, ImagePlus } from 'lucide-react';
import api from '../../lib/api';

export default function DashboardCatalogue() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/catalog-products')
            .then((res) => setItems(res.data.data ?? []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-xs font-bold tracking-[0.25em] text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                        Catalogue
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-brand-orange/60 via-brand-navy/30 to-transparent min-w-[40px]" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate('/stock/catalogue')}
                        className="btn-secondary text-xs px-3 py-1.5"
                        title="Ouvrir le catalogue"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Gérer
                    </button>
                    <button
                        type="button"
                        onClick={() => setVisible((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title={visible ? 'Masquer le catalogue' : 'Afficher le catalogue'}
                    >
                        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {visible ? 'Masquer' : 'Afficher'}
                    </button>
                </div>
            </div>

            {visible && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-gradient-to-r from-zinc-900 via-orange-700 to-slate-800 flex items-center justify-between">
                        <p className="text-xs font-bold text-white uppercase tracking-wide">Produits commercialisés</p>
                        <button
                            type="button"
                            onClick={() => setVisible(false)}
                            className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10"
                            title="Masquer"
                        >
                            <EyeOff className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="aspect-[4/5] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : items.length ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
                            {items.slice(0, 10).map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                >
                                    <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                                        {item.photo_url ? (
                                            <img src={item.photo_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                                <ImagePlus className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 space-y-0.5">
                                        <p className="text-[10px] font-mono font-semibold text-brand-orange truncate">{item.reference || item.article_id || '—'}</p>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</p>
                                        <p className="text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                                            Stock : {Number(item.stock_actuel ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })}
                                            {item.unit ? ` ${item.unit}` : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-10 text-center text-sm text-slate-400">
                            Aucun produit au catalogue —{' '}
                            <button type="button" onClick={() => navigate('/stock/catalogue')} className="text-brand-orange font-semibold hover:underline">
                                ajouter
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

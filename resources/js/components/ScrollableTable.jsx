import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ARROW_BTN =
    'flex w-full items-center justify-center py-1.5 text-slate-600 dark:text-slate-200 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800/80 hover:text-brand-orange disabled:opacity-40 disabled:pointer-events-none transition-colors';

/**
 * Zone tableau avec flèches haut / bas pour parcourir toutes les lignes.
 * @param {boolean} fill — occupe l'espace flex parent (max-height auto)
 */
export default function ScrollableTable({
    children,
    className = '',
    scrollClassName = '',
    maxHeight = 'min(420px, 55vh)',
    fill = false,
    step = 120,
}) {
    const scrollRef = useRef(null);
    const [canUp, setCanUp] = useState(false);
    const [canDown, setCanDown] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanUp(el.scrollTop > 4);
        setCanDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    }, []);

    useEffect(() => {
        updateScrollState();
        const el = scrollRef.current;
        if (!el) return undefined;
        const ro = new ResizeObserver(updateScrollState);
        ro.observe(el);
        return () => ro.disconnect();
    }, [children, updateScrollState]);

    const scroll = (direction) => {
        scrollRef.current?.scrollBy({ top: direction * step, behavior: 'smooth' });
    };

    return (
        <div className={`flex flex-col min-h-0 ${className}`}>
            <button
                type="button"
                title="Défiler vers le haut"
                onClick={() => scroll(-1)}
                disabled={!canUp}
                className={`${ARROW_BTN} border-b border-slate-200 dark:border-slate-700`}
            >
                <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className={`${fill ? 'flex-1 min-h-0' : ''} overflow-x-auto overflow-y-auto [scrollbar-width:thin] ${scrollClassName}`}
                style={fill ? undefined : { maxHeight }}
            >
                {children}
            </div>
            <button
                type="button"
                title="Défiler vers le bas"
                onClick={() => scroll(1)}
                disabled={!canDown}
                className={`${ARROW_BTN} border-t border-slate-200 dark:border-slate-700`}
            >
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
            </button>
        </div>
    );
}

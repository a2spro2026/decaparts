import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ARROW_BTN =
    'flex w-full items-center justify-center py-1.5 text-slate-600 dark:text-slate-200 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800/80 hover:text-brand-orange disabled:opacity-40 disabled:pointer-events-none transition-colors';

const DEFAULT_MAX_HEIGHT = 'min(360px, 48vh)';

/**
 * Zone scrollable avec flèches haut/bas.
 * Un seul `<table>` : en-tête sticky + corps — colonnes toujours alignées.
 */
export default function ScrollableTable({
    children,
    header = null,
    colgroup = null,
    tableClassName = '',
    className = '',
    scrollClassName = '',
    maxHeight = DEFAULT_MAX_HEIGHT,
    step = 120,
}) {
    const mergedTableClass = ['text-center', tableClassName].filter(Boolean).join(' ');
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
    }, [children, header, updateScrollState]);

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
                className={`scrollable-table-wrap overflow-x-auto overflow-y-auto [scrollbar-width:thin] ${scrollClassName}`}
                style={{ maxHeight }}
            >
                {header != null ? (
                    <table className={mergedTableClass}>
                        {colgroup}
                        {header}
                        {children}
                    </table>
                ) : (
                    children
                )}
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

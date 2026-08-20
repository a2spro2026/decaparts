import { Bell, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { NavbarBrand } from '../Logo';
import UserAvatar from '../UserAvatar';
import { getPageTitle } from '../../lib/pageMeta';

function SidebarToggle({ hidden, onToggle }) {
    const Icon = hidden ? PanelLeftOpen : PanelLeftClose;
    const label = hidden ? 'Afficher le menu latéral' : 'Masquer le menu latéral';

    return (
        <button
            type="button"
            onClick={onToggle}
            title={label}
            aria-label={label}
            aria-pressed={!hidden}
            className="sidebar-toggle-btn group relative hidden lg:inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
        >
            <span className="absolute inset-0 bg-gradient-to-br from-brand-navy via-slate-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-black" />
            <span className="absolute inset-[1px] rounded-[11px] bg-gradient-to-br from-white/10 to-transparent opacity-80" />
            <span className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-orange/50 via-amber-400/30 to-brand-orange/50 blur-[1px]" />
            <span className="absolute inset-[1.5px] rounded-[10px] bg-gradient-to-br from-slate-800 to-zinc-900 dark:from-zinc-900 dark:to-black" />
            <Icon
                className={`relative z-10 w-[18px] h-[18px] transition-all duration-300 ${
                    hidden
                        ? 'text-brand-orange drop-shadow-[0_0_8px_rgba(249,115,22,0.55)]'
                        : 'text-white/90 group-hover:text-brand-orange'
                }`}
                strokeWidth={2.25}
            />
            <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-brand-orange/70 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}

export default function Header({ onMenuClick, sidebarHidden = false, onSidebarToggle }) {
    const { dark, toggle } = useTheme();
    const { user } = useAuth();
    const { pathname } = useLocation();
    const pageTitle = getPageTitle(pathname);

    return (
        <header className="sticky top-0 z-50 navbar-header border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-orange/40 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 lg:px-6 py-2.5 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        aria-label="Ouvrir le menu"
                    >
                        <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    </button>
                    {onSidebarToggle && (
                        <SidebarToggle hidden={sidebarHidden} onToggle={onSidebarToggle} />
                    )}
                    <NavbarBrand pageTitle={pageTitle} />
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className="hidden lg:block text-sm text-slate-500 dark:text-slate-400 mr-1">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        type="button"
                        onClick={toggle}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Changer le thème"
                    >
                        {dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                    </button>
                    <button
                        type="button"
                        className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                    {user && (
                        <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-slate-200 dark:border-slate-700">
                            <div className="hidden sm:block text-right leading-tight">
                                <p className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                    {user.name || 'MR AHMED'}
                                </p>
                                <p className="text-[11px] font-semibold text-brand-orange whitespace-nowrap">
                                    {user.title || 'Directeur Général'}
                                </p>
                            </div>
                            <div className="p-0.5 rounded-full hover:ring-2 hover:ring-brand-orange/30 transition-all">
                                <UserAvatar user={user} size="lg" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

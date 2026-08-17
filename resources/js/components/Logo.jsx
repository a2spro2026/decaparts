import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const LOGO_SRC = '/images/decaparts-logo.png';

function BrandLogoMark({ className = 'h-11 w-auto max-w-[52px]' }) {
    return (
        <img
            src={LOGO_SRC}
            alt="DECA PARTS"
            className={`${className} object-contain drop-shadow-[0_2px_14px_rgba(249,115,22,0.35)] shrink-0`}
            draggable={false}
        />
    );
}

export default function Logo({ size = 'md', showText = true }) {
    const logoSize = { sm: 'h-8 max-w-[38px]', md: 'h-11 max-w-[52px]', lg: 'h-16 max-w-[72px]' }[size] || 'h-11 max-w-[52px]';

    return (
        <div className="flex items-center gap-3">
            <BrandLogoMark className={logoSize} />
            {showText && (
                <div className="font-bold text-lg leading-tight tracking-wide">
                    <span className="text-brand-navy dark:text-white">DECA</span>
                    <span className="text-brand-orange">PARTS</span>
                </div>
            )}
        </div>
    );
}

export function SidebarBrand({ pageTitle }) {
    return (
        <NavLink to="/" className="flex items-center gap-3 group">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="shrink-0">
                <BrandLogoMark className="h-12 w-auto max-w-[58px]" />
            </motion.div>
            <div className="min-w-0">
                <div className="font-bold text-lg leading-tight tracking-wide truncate">
                    DECA<span className="text-brand-orange">PARTS</span>
                </div>
                {pageTitle && (
                    <div className="text-[11px] text-orange-200/80 font-medium truncate mt-0.5">
                        {pageTitle}
                    </div>
                )}
            </div>
        </NavLink>
    );
}

export function NavbarBrand({ pageTitle }) {
    return (
        <div className="navbar-brand group flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <NavLink to="/">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="shrink-0">
                    <BrandLogoMark className="h-10 sm:h-11 w-auto max-w-[52px]" />
                </motion.div>
            </NavLink>

            <div className="min-w-0 hidden sm:block border-l border-slate-200 dark:border-zinc-700 pl-3">
                <div className="font-bold text-base sm:text-lg leading-tight tracking-wide truncate">
                    <span className="text-brand-navy dark:text-white">DECA</span>
                    <span className="text-brand-orange">PARTS</span>
                </div>
                {pageTitle && (
                    <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-300 truncate">
                        {pageTitle}
                    </div>
                )}
            </div>

            {pageTitle && (
                <div className="sm:hidden text-sm font-semibold text-slate-700 dark:text-zinc-200 truncate max-w-[140px]">
                    {pageTitle}
                </div>
            )}
        </div>
    );
}

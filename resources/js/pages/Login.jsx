import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ArrowRight, Shield, BadgeCheck, ChevronDown, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginBranding, LoginBrandLogo } from '../components/LoginBrand';

const STATUT_OPTIONS = [
    { value: 'Gerant', label: 'Gérant' },
    { value: 'Assistant', label: 'Assistant(e)' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Facturation', label: 'Facturation' },
];

const LOGIN_EMAIL_SUFFIX = '@decaparts.com';

function normalizeLogin(value) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}${LOGIN_EMAIL_SUFFIX}`;
}

// Champs readonly jusqu'à l'interaction : empêche l'autofill des navigateurs.
function unlockField(e) {
    e.currentTarget.readOnly = false;
}

function PasswordField({ value, onChange, showPassword, onToggle }) {
    const [focused, setFocused] = useState(false);
    const hasValue = value.length > 0;

    return (
        <div className="relative">
            <label htmlFor="password" className="field-label-form">
                Mot de passe
            </label>
            <motion.div
                animate={{
                    scale: focused ? 1.01 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative"
            >
                {/* Halo lumineux au focus */}
                <AnimatePresence>
                    {focused && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute -inset-1 rounded-xl bg-gradient-to-r from-brand-orange/25 via-black/40 to-orange-900/25 blur-md pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <div
                    className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        focused
                            ? 'border-brand-orange password-field-active bg-black/70'
                            : hasValue
                                ? 'border-orange-600/50 bg-black/50'
                                : 'border-zinc-700 bg-black/40'
                    }`}
                >
                    {/* Ligne de scan sécurité */}
                    {focused && (
                        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-orange to-transparent password-scan-line pointer-events-none z-10" />
                    )}

                    <Lock
                        className={`absolute left-3.5 top-1/2 w-4 h-4 pointer-events-none transition-colors duration-300 ${
                            focused ? 'password-lock-active' : 'text-zinc-500 -translate-y-1/2'
                        }`}
                    />

                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={value}
                        onChange={onChange}
                        readOnly
                        onPointerDown={unlockField}
                        onFocus={(e) => { unlockField(e); setFocused(true); }}
                        onBlur={() => setFocused(false)}
                        placeholder="Votre mot de passe"
                        required
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        className="relative z-[1] block w-full pl-11 pr-11 py-3 text-sm text-white bg-transparent outline-none placeholder:text-zinc-500"
                    />

                    <motion.button
                        type="button"
                        onClick={onToggle}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-[2] p-1 rounded-lg text-zinc-500 hover:text-brand-orange hover:bg-orange-950/40 transition-colors"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={showPassword ? 'hide' : 'show'}
                                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                transition={{ duration: 0.2 }}
                                className="block"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Indicateur force visuelle (points animés) */}
                <AnimatePresence>
                    {hasValue && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-1.5 mt-2 px-1"
                        >
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: value.length >= i * 2 ? 1 : 0.3 }}
                                    className={`h-1 flex-1 rounded-full origin-left transition-colors duration-300 ${
                                        value.length >= i * 3
                                            ? 'bg-gradient-to-r from-brand-orange to-amber-500'
                                            : value.length >= i * 2
                                                ? 'bg-amber-600/60'
                                                : 'bg-zinc-700'
                                    }`}
                                />
                            ))}
                            <span className="text-[10px] text-zinc-500 ml-1 shrink-0">
                                {focused ? 'Saisie sécurisée' : ''}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default function Login() {
    const [loginValue, setLoginValue] = useState('');
    const [password, setPassword] = useState('');
    const [statut, setStatut] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [statutFocused, setStatutFocused] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const clearFields = () => {
        setLoginValue('');
        setPassword('');
        setStatut('');
        setShowPassword(false);
    };

    useEffect(() => {
        clearFields();
        const onPageShow = () => {
            clearFields();
            setError('');
            setPanelOpen(false);
        };
        window.addEventListener('pageshow', onPageShow);
        return () => window.removeEventListener('pageshow', onPageShow);
    }, []);

    const togglePanel = () => {
        if (panelOpen) {
            clearFields();
            setError('');
        }
        setPanelOpen((open) => !open);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!loginValue.trim() || !password) {
            setError('Veuillez saisir le login et le mot de passe');
            return;
        }
        const credentials = { login: normalizeLogin(loginValue), password, statut };
        clearFields();
        setLoading(true);
        try {
            await login(credentials.login, credentials.password, credentials.statut);
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            const isHtml = typeof data === 'string' && data.includes('<!DOCTYPE html>');
            setError(
                data?.message
                || data?.errors?.login?.[0]
                || data?.errors?.statut?.[0]
                || data?.errors?.password?.[0]
                || (isHtml ? 'Erreur serveur : API indisponible. Relancez composer run dev.' : null)
                || err.message
                || 'Identifiants incorrects'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-black overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src="/images/login-bg-v3.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[20%_center]"
                />
            </div>

            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 group">
                <motion.button
                    type="button"
                    onClick={togglePanel}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label={panelOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
                    aria-pressed={panelOpen}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md ring-1 ring-orange-500/70 shadow-lg shadow-black/50 hover:bg-black/65 hover:ring-orange-400 transition-colors"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={panelOpen ? 'hide' : 'show'}
                            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                            className="block"
                        >
                            {panelOpen ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>
                <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {panelOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
                </span>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-end px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 pt-20 pb-16 min-h-0">
              <AnimatePresence>
                {panelOpen && (
                <motion.div
                    key="login-panel"
                    initial={{ opacity: 0, x: 40, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full max-w-[400px] shrink-0"
                >
                        <div className="lg:hidden mb-4">
                            <LoginBranding compact />
                        </div>

                        <div className="login-card-wrapper relative p-[2px] rounded-2xl login-card-border">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="relative login-card-shine login-card-glow login-panel bg-black/55 backdrop-blur-xl rounded-[14px] p-8 border border-white/10 overflow-hidden"
                            >
                                {/* Reflet coin */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/15 to-transparent rounded-bl-full pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-black/60 via-orange-950/20 to-transparent rounded-tr-full pointer-events-none" />

                                <div className="relative z-[2]">
                                    <motion.div
                                        className="text-center mb-6"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 }}
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.92 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2, type: 'spring', stiffness: 140 }}
                                            className="mb-4"
                                        >
                                            <LoginBrandLogo size="md" />
                                        </motion.div>
                                        <p className="text-zinc-300 text-sm font-medium">Connectez-vous à votre espace</p>
                                        <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />
                                    </motion.div>

                                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-lpignore="true" data-1p-ignore="true">
                                        <AnimatePresence>
                                            {error && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-2.5 rounded-lg bg-red-950/50 text-red-400 text-sm text-center border border-red-900/60"
                                                >
                                                    {error}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div>
                                            <label htmlFor="statut" className="field-label-form">
                                                Statut
                                            </label>
                                            <motion.div
                                                animate={{ scale: statutFocused ? 1.01 : 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className={`relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-black/40 ${
                                                    statutFocused
                                                        ? 'border-brand-orange shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                                                        : statut
                                                            ? 'border-orange-600/50'
                                                            : 'border-zinc-700'
                                                }`}
                                            >
                                                <BadgeCheck className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${statutFocused || statut ? 'text-brand-orange' : 'text-zinc-500'}`} />
                                                <select
                                                    id="statut"
                                                    autoComplete="off"
                                                    value={statut}
                                                    onChange={(e) => setStatut(e.target.value)}
                                                    onFocus={() => setStatutFocused(true)}
                                                    onBlur={() => setStatutFocused(false)}
                                                    className={`block w-full appearance-none pl-11 pr-10 py-3 text-sm bg-transparent outline-none cursor-pointer ${
                                                        statut ? 'text-white font-medium' : 'text-zinc-500'
                                                    }`}
                                                >
                                                    <option value="" disabled>Sélectionner un statut</option>
                                                    {STATUT_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                            </motion.div>
                                        </div>

                                        <div>
                                            <label htmlFor="login" className="field-label-form">
                                                Login
                                            </label>
                                            <motion.div
                                                animate={{ scale: emailFocused ? 1.01 : 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className={`relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-black/40 ${
                                                    emailFocused
                                                        ? 'border-brand-orange shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                                                        : 'border-zinc-700'
                                                }`}
                                            >
                                                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${emailFocused ? 'text-brand-orange' : 'text-zinc-500'}`} />
                                                <input
                                                    id="login"
                                                    type="text"
                                                    value={loginValue}
                                                    onChange={(e) => setLoginValue(e.target.value)}
                                                    readOnly
                                                    onPointerDown={unlockField}
                                                    onFocus={(e) => { unlockField(e); setEmailFocused(true); }}
                                                    onBlur={() => { setEmailFocused(false); setLoginValue((v) => normalizeLogin(v)); }}
                                                    placeholder={`identifiant${LOGIN_EMAIL_SUFFIX}`}
                                                    required
                                                    autoComplete="off"
                                                    autoCorrect="off"
                                                    autoCapitalize="off"
                                                    spellCheck={false}
                                                    data-lpignore="true"
                                                    data-1p-ignore="true"
                                                    className="block w-full pl-11 pr-3 py-3 text-sm text-white bg-transparent outline-none placeholder:text-zinc-500"
                                                />
                                            </motion.div>
                                        </div>

                                        <PasswordField
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            showPassword={showPassword}
                                            onToggle={() => setShowPassword(!showPassword)}
                                        />

                                        <motion.button
                                            type="submit"
                                            disabled={loading}
                                            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: '0 20px 40px rgba(249,115,22,0.35)' }}
                                            whileTap={{ scale: loading ? 1 : 0.98 }}
                                            className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-black via-zinc-900 to-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-black/40 ring-1 ring-orange-500/20 overflow-hidden group"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            <span className="relative flex items-center gap-2">
                                                {loading ? (
                                                    <>
                                                        <motion.span
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                                        />
                                                        Connexion...
                                                    </>
                                                ) : (
                                                    <>Se connecter <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                                )}
                                            </span>
                                        </motion.button>
                                    </form>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="mt-5 flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-black/80 to-zinc-900/90 text-xs text-zinc-400 border border-zinc-800"
                                    >
                                        <Shield className="w-4 h-4 text-brand-orange shrink-0" />
                                        Connexion sécurisée — vos données sont protégées.
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="absolute bottom-0 inset-x-0 z-20 border-t border-white/10 bg-gradient-to-t from-black/85 via-black/60 to-black/30 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-1 px-4 sm:px-8 py-2.5 text-xs text-zinc-300">
                    <p className="tracking-wide">
                        <span className="font-bold text-brand-orange">DECA PARTS / A2SPRO</span>
                        <span className="ml-2 text-zinc-400">© 2026 – Tous droits réservés</span>
                    </p>
                    <a href="tel:+212654329362" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Phone className="w-3.5 h-3.5 text-brand-orange" />
                        +212 6 54 32 93 62
                    </a>
                </div>
            </footer>
        </div>
    );
}

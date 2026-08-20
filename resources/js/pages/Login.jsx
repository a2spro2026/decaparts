import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ArrowRight, Shield, BadgeCheck, ChevronDown } from 'lucide-react';
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
                        name="decaparts-password"
                        type={showPassword ? 'text' : 'password'}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Votre mot de passe"
                        required
                        autoComplete="off"
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
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!statut) {
            setError('Veuillez sélectionner un statut');
            return;
        }
        if (!loginValue.trim() || !password) {
            setError('Veuillez saisir le login et le mot de passe');
            return;
        }
        setLoading(true);
        try {
            await login(normalizeLogin(loginValue), password, statut);
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
        <div className="relative min-h-screen flex flex-col bg-black">
            {/* Arrière-plan DECA PARTS — calée à gauche, hauteur pleine */}
            <div className="absolute inset-0 flex justify-start overflow-hidden">
                <img
                    src="/images/login-bg.png"
                    alt=""
                    className="h-full w-auto max-w-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/15 to-black/55 pointer-events-none" />
            </div>

            {/* Panneau connexion — aligné à droite */}
            <div className="relative z-10 flex flex-1 items-center justify-end px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 min-h-0">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.15, type: 'spring', stiffness: 120 }}
                    className="login-card-wrapper w-full max-w-[400px] shrink-0"
                >
                        {/* Branding mobile */}
                        <div className="lg:hidden mb-4">
                            <LoginBranding compact />
                        </div>

                        {/* Bordure animée */}
                        <div className="relative p-[2px] rounded-2xl login-card-border">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="relative login-card-shine login-card-glow login-panel bg-gradient-to-br from-zinc-950 via-neutral-950 to-black backdrop-blur-xl rounded-[14px] p-8 border border-zinc-800/90 overflow-hidden"
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
                                                    value={statut}
                                                    onChange={(e) => setStatut(e.target.value)}
                                                    onFocus={() => setStatutFocused(true)}
                                                    onBlur={() => setStatutFocused(false)}
                                                    required
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
                                                    name="decaparts-login"
                                                    type="text"
                                                    value={loginValue}
                                                    onChange={(e) => setLoginValue(e.target.value)}
                                                    onFocus={() => setEmailFocused(true)}
                                                    onBlur={() => setLoginValue((v) => normalizeLogin(v))}
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
            </div>

            {/* Pied de page A2SPRO */}
            <footer className="absolute bottom-0 inset-x-0 z-10 py-2 px-6 text-center pointer-events-none">
                <p className="text-xs text-white/50 tracking-wide">
                    Créé par{' '}
                    <span className="text-brand-orange font-bold tracking-wider">A2SPRO</span>
                    <span className="mx-2 text-white/30">—</span>
                    <span className="text-white/70 font-semibold">A2S</span>
                    <span className="mx-2 text-white/30">|</span>
                    Tous droits réservés
                </p>
            </footer>
        </div>
    );
}

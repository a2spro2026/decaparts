const LOGO_SRC = '/images/decaparts-logo.png';

export function LoginBrandLogo({ size = 'md' }) {
    const maxWidth = {
        sm: 'max-w-[150px]',
        md: 'max-w-[210px]',
        lg: 'max-w-[260px]',
    }[size] || 'max-w-[210px]';

    return (
        <div className={`mx-auto ${maxWidth}`}>
            <img
                src={LOGO_SRC}
                alt="DECA PARTS"
                className="w-full h-auto object-contain drop-shadow-[0_4px_24px_rgba(249,115,22,0.35)]"
                draggable={false}
            />
        </div>
    );
}

export function LoginBranding({ compact = false }) {
    return (
        <div className={compact ? 'text-center mb-4' : 'text-center'}>
            <LoginBrandLogo size={compact ? 'sm' : 'lg'} />
        </div>
    );
}

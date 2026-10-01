// La session vit dans sessionStorage : elle disparaît à la fermeture de l'onglet / du navigateur.
const KEYS = ['decaparts_token', 'decaparts_user', 'decaparts_statut'];

KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
});

export const authStorage = {
    get: (key) => {
        try { return sessionStorage.getItem(key); } catch { return null; }
    },
    set: (key, value) => {
        try { sessionStorage.setItem(key, value); } catch {}
    },
    remove: (key) => {
        try { sessionStorage.removeItem(key); } catch {}
    },
    clear: () => KEYS.forEach((key) => {
        try { sessionStorage.removeItem(key); } catch {}
    }),
};

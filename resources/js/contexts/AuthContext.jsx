import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { authStorage } from '../lib/authStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!!authStorage.get('decaparts_token'));

    useEffect(() => {
        if (authStorage.get('decaparts_token')) {
            api.get('/user')
                .then((r) => {
                    const savedStatut = authStorage.get('decaparts_statut');
                    const statutLabels = {
                        Gerant: 'Gérant',
                        Assistant: 'Assistant(e)',
                        Commercial: 'Commercial',
                        Facturation: 'Facturation',
                    };
                    const user = {
                        ...r.data,
                        ...(savedStatut ? {
                            statut: savedStatut,
                            statut_label: statutLabels[savedStatut] || savedStatut,
                            title: statutLabels[savedStatut] || r.data.title,
                        } : {}),
                    };
                    setUser(user);
                    authStorage.set('decaparts_user', JSON.stringify(user));
                })
                .catch(() => {
                    authStorage.clear();
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (loginValue, password, statut) => {
        const { data } = await api.post('/login', { login: loginValue, password, statut });
        if (!data?.token || !data?.user) {
            throw new Error('Réponse de connexion invalide.');
        }
        authStorage.set('decaparts_token', data.token);
        authStorage.set('decaparts_user', JSON.stringify(data.user));
        if (data.user.statut) authStorage.set('decaparts_statut', data.user.statut);
        else authStorage.remove('decaparts_statut');
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api.post('/logout'); } catch {}
        authStorage.clear();
        setUser(null);
    };

    const can = (permission) => user?.is_admin || user?.permissions?.includes(permission);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, can }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'MC2 Legal' && password === 'MC2 Legal 26') {
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/dashboard');
        } else {
            setError('Credenciales incorrectas');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg-color)',
            padding: 'clamp(1rem, 3vw, 2rem)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: 'clamp(1.5rem, 4vw, 2rem)',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(1.5rem, 3vw, 2rem)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 className="text-gradient" style={{
                        fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem'
                    }}>
                        MC2 Legal
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Panel de Control IA</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 2vw, 1.5rem)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)', color: 'var(--text-secondary)' }}>Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 'clamp(0.6rem, 1.5vw, 0.75rem)',
                                borderRadius: '8px',
                                background: '#1a1a1a',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Nombre de usuario"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)', color: 'var(--text-secondary)' }}>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 'clamp(0.6rem, 1.5vw, 0.75rem)',
                                borderRadius: '8px',
                                background: '#1a1a1a',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{ color: 'var(--danger-color)', fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="bg-gradient"
                        style={{
                            width: '100%',
                            padding: 'clamp(0.6rem, 1.5vw, 0.75rem)',
                            borderRadius: '8px',
                            border: 'none',
                            color: 'white',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                            fontWeight: '600',
                            marginTop: 'clamp(0.5rem, 1.5vw, 1rem)',
                            cursor: 'pointer'
                        }}
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

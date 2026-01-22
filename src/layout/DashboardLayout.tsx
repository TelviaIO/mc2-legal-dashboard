import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(5, 5, 5, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <h2 className="text-gradient" style={{
                        margin: 0,
                        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                        fontWeight: 700,
                        wordBreak: 'break-word'
                    }}>
                        Llamadas con IA de MC2 Legal
                    </h2>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        padding: '0.4rem 1rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Salir
                </button>
            </header>

            <main style={{
                flex: 1,
                padding: 'clamp(1rem, 3vw, 2rem)',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {children}
            </main>

            <footer style={{
                padding: 'clamp(1rem, 3vw, 2rem)',
                textAlign: 'center',
                fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-color)',
                marginTop: 'auto'
            }}>
                Desarrollado por <a href="https://telvia.io" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Telvia.io</a>
            </footer>
        </div>
    );
};

export default DashboardLayout;

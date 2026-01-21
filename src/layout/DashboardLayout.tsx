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
                padding: '1.5rem 2rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(5, 5, 5, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div>
                    <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                        Llamadas con IA de MC2 Legal
                    </h2>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.9rem',
                        padding: '0.4rem 1rem',
                        color: 'var(--text-secondary)'
                    }}
                >
                    Salir
                </button>
            </header>

            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {children}
            </main>

            <footer style={{
                padding: '2rem',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-color)',
                marginTop: 'auto'
            }}>
                Desarrollado con <span style={{ color: '#ef4444' }}>♥</span> <a href="https://telvia.io" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Telvia.io</a>
            </footer>
        </div>
    );
};

export default DashboardLayout;

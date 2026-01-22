import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layout/DashboardLayout';

interface Agent {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
}

const Agents: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [callStatus, setCallStatus] = useState<string>('');
    const uvClientRef = useRef<any>(null);

    // Agent data - currently only one agent
    const agents: Agent[] = [
        {
            id: '36b1efef-2ffa-4a92-9c02-af3d2d0689d3',
            name: 'Agente de Cobranza',
            description: 'Agente especializado en gestión de deudas y cobros',
            status: 'active'
        }
    ];

    useEffect(() => {
        // Load Ultravox SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/ultravox-client@latest/dist/ultravox-client.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            if (uvClientRef.current) {
                uvClientRef.current.disconnect();
            }
        };
    }, []);

    const startCall = async () => {
        if (!selectedAgent) return;

        try {
            setCallStatus('Iniciando llamada...');

            // Initialize Ultravox client
            const UltravoxSession = (window as any).UltravoxSession;
            const client = new UltravoxSession();
            uvClientRef.current = client;

            // Set up event listeners
            client.addEventListener('status', (event: any) => {
                setCallStatus(`Estado: ${event.state}`);
                if (event.state === 'disconnected') {
                    setIsCallActive(false);
                }
            });

            client.addEventListener('transcripts', (event: any) => {
                console.log('Transcript:', event);
            });

            // Join call with agent
            await client.joinCall({
                callId: selectedAgent.id,
                clientVersion: '1.0.0'
            });

            setIsCallActive(true);
            setCallStatus('Llamada activa');
        } catch (error) {
            console.error('Error starting call:', error);
            setCallStatus('Error al iniciar llamada');
            setIsCallActive(false);
        }
    };

    const endCall = () => {
        if (uvClientRef.current) {
            uvClientRef.current.disconnect();
            uvClientRef.current = null;
        }
        setIsCallActive(false);
        setCallStatus('');
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        Mis Agentes Telvia
                    </h2>
                    <a
                        href="/"
                        style={{
                            background: '#333',
                            color: 'white',
                            border: '1px solid #444',
                            padding: '0.5rem 1.2rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Volver al Panel
                    </a>
                </div>

                {/* Agents Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {agents.map(agent => (
                        <div
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            style={{
                                background: selectedAgent?.id === agent.id ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: selectedAgent?.id === agent.id ? '1px solid #8e2de2' : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {selectedAgent?.id === agent.id && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '4px',
                                    background: 'var(--primary-gradient)'
                                }} />
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{agent.name}</h3>
                                <span style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    background: agent.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                                    color: agent.status === 'active' ? '#4caf50' : '#9e9e9e',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                }}>
                                    {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {agent.description}
                            </p>

                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                                ID: {agent.id.substring(0, 8)}...
                            </div>
                        </div>
                    ))}
                </div>

                {/* Playground Section */}
                {selectedAgent && (
                    <div style={{
                        background: 'var(--card-bg)',
                        padding: '2rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Probar Agente: {selectedAgent.name}
                        </h3>

                        <div style={{
                            background: '#1a1a1a',
                            padding: '2rem',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem',
                            minHeight: '300px',
                            justifyContent: 'center'
                        }}>
                            {!isCallActive ? (
                                <>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: 'var(--primary-gradient)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2.5rem',
                                        color: 'white'
                                    }}>
                                        🎙️
                                    </div>

                                    <div style={{ textAlign: 'center' }}>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                            Listo para iniciar
                                        </h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            Haz clic en el botón para probar el agente
                                        </p>
                                    </div>

                                    <button
                                        onClick={startCall}
                                        className="bg-gradient"
                                        style={{
                                            padding: '1rem 2rem',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            minWidth: '200px'
                                        }}
                                    >
                                        Iniciar Llamada
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: 'rgba(76, 175, 80, 0.2)',
                                        border: '3px solid #4caf50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2.5rem',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        🎙️
                                    </div>

                                    <div style={{ textAlign: 'center' }}>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#4caf50' }}>
                                            Llamada en curso
                                        </h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {callStatus}
                                        </p>
                                    </div>

                                    <button
                                        onClick={endCall}
                                        style={{
                                            background: '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            padding: '1rem 2rem',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            minWidth: '200px'
                                        }}
                                    >
                                        Finalizar Llamada
                                    </button>
                                </>
                            )}
                        </div>

                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: '#111',
                            borderRadius: '8px',
                            border: '1px solid #333'
                        }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>Información</h4>
                            <ul style={{ fontSize: '0.85rem', color: '#666', paddingLeft: '1.2rem', margin: 0 }}>
                                <li>El agente está disponible 24/7 para realizar llamadas</li>
                                <li>Puedes probar el agente directamente desde aquí</li>
                                <li>Las llamadas de prueba no se registran en el sistema</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.8;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Agents;

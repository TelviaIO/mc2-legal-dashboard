import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { UltravoxSession } from 'ultravox-client';
import { createCall } from '../lib/ultravox';

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
    const uvSessionRef = useRef<UltravoxSession | null>(null);

    // Agent data - currently only one agent
    const agents: Agent[] = [
        {
            id: '36b1efef-2ffa-4a92-9c02-af3d2d0689d3',
            name: 'Agente Outbound V1',
            description: 'Agente especializado en gestión de deudas y cobros',
            status: 'active'
        }
    ];

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (uvSessionRef.current) {
                uvSessionRef.current.leaveCall();
            }
        };
    }, []);

    const startCall = async () => {
        if (!selectedAgent) return;

        try {
            setCallStatus('Iniciando llamada...');
            setIsCallActive(true);

            // Step 1: Create call and get joinUrl
            console.log('Creating call for agent:', selectedAgent.id);
            const joinUrl = await createCall({
                agentId: selectedAgent.id
            });
            console.log('Got joinUrl:', joinUrl);

            // Step 2: Initialize Ultravox session
            const session = new UltravoxSession();
            uvSessionRef.current = session;

            // Step 3: Set up event listeners
            session.addEventListener('status', (event: any) => {
                console.log('Status event:', event);
                const statusMap: Record<string, string> = {
                    'disconnected': 'Desconectado',
                    'disconnecting': 'Desconectando...',
                    'idle': 'Inactivo',
                    'listening': 'Escuchando...',
                    'thinking': 'Pensando...',
                    'speaking': 'Hablando...'
                };
                setCallStatus(statusMap[event.state] || event.state);

                if (event.state === 'disconnected') {
                    setIsCallActive(false);
                    setCallStatus('');
                }
            });

            session.addEventListener('transcripts', (event: any) => {
                console.log('Transcript:', event);
            });

            session.addEventListener('error', (event: any) => {
                console.error('Session error:', event);
                setCallStatus('Error en la sesión');
                setIsCallActive(false);
            });

            // Step 4: Join the call
            console.log('Joining call...');
            await session.joinCall(joinUrl);
            console.log('Call joined successfully');

            setCallStatus('Conectado - Puedes empezar a hablar');
        } catch (error) {
            console.error('Error starting call:', error);
            setCallStatus(`Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
            setIsCallActive(false);
        }
    };

    const endCall = () => {
        if (uvSessionRef.current) {
            console.log('Ending call...');
            uvSessionRef.current.leaveCall();
            uvSessionRef.current = null;
        }
        setIsCallActive(false);
        setCallStatus('');
    };

    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = (index: number, url?: string) => {
        if (!url) {
            console.warn('Audio URL not configured');
            return;
        }

        if (playingIndex === index) {
            audioRef.current?.pause();
            setPlayingIndex(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play().catch(console.error);
                setPlayingIndex(index);
            }
        }
    };

    const handleAudioEnded = () => {
        setPlayingIndex(null);
    };

    return (
        <DashboardLayout>
            {/* Hidden Audio Element */}
            <audio ref={audioRef} onEnded={handleAudioEnded} style={{ display: 'none' }} />

            <div style={{ display: 'grid', gap: 'clamp(1rem, 3vw, 2rem)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 700, margin: 0 }}>
                        Mis Agentes Telvia
                    </h2>
                    <a
                        href="/"
                        style={{
                            background: '#333',
                            color: 'white',
                            border: '1px solid #444',
                            padding: 'clamp(0.4rem, 2vw, 0.5rem) clamp(0.8rem, 3vw, 1.2rem)',
                            borderRadius: '8px',
                            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Volver al Panel
                    </a>
                </div>

                {/* Agents Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 'clamp(1rem, 2vw, 1.5rem)' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 350px)', gap: '2rem', alignItems: 'start' }}>
                        <div style={{
                            background: 'var(--card-bg)',
                            padding: 'clamp(1rem, 3vw, 2rem)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 600, marginBottom: 'clamp(1rem, 2vw, 1.5rem)' }}>
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
                                </ul>
                            </div>
                        </div>

                        {/* Voices Section */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            height: '100%'
                        }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>🔊</span> Voces Disponibles (Mujer ES)
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { name: 'Carolina', provider: 'ElevenLabs', description: 'Cálida y natural', color: '#8e2de2', url: '/audio/carolina.wav' },
                                    { name: 'Chrysia', provider: 'Ultravox', description: 'Profesional y clara', color: '#4facfe', url: '/audio/chrysia.wav' },
                                    { name: 'Flavia', provider: 'Ultravox', description: 'Enérgica y cercana', color: '#00f2fe', url: '/audio/flavia.wav' },
                                    { name: 'Monika', provider: 'Ultravox', description: 'Suave y sofisticada', color: '#fa709a', url: '/audio/monika.wav' },
                                    { name: 'Victor', provider: 'Ultravox', description: 'Voz masculina profesional', color: '#43e97b', url: '/audio/victor.wav' }

                                ].map((voice, index) => (
                                    <div key={index} style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'transform 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.8rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>{voice.name}</h4>
                                                <span style={{ fontSize: '0.75rem', color: '#888' }}>{voice.provider}</span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.1)',
                                                color: '#aaa'
                                            }}>
                                                ES-ES
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '0.8rem', color: '#bbb', margin: 0, fontStyle: 'italic' }}>
                                            "{voice.description}"
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '0.5rem',
                                            borderRadius: '8px'
                                        }}>
                                            <button
                                                onClick={() => togglePlay(index, voice.url)}
                                                style={{
                                                    background: voice.color,
                                                    border: 'none',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    color: 'white'
                                                }}>
                                                {playingIndex === index ? '⏸' : '▶'}
                                            </button>
                                            <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                                                <div style={{
                                                    width: playingIndex === index ? '100%' : '0%',
                                                    height: '100%',
                                                    background: voice.color,
                                                    borderRadius: '2px',
                                                    transition: playingIndex === index ? 'width 10s linear' : 'none'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#666' }}>{playingIndex === index ? '0:10' : '0:00'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                .text-gradient {
                    background: linear-gradient(135deg, #fff 0%, #888 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .bg-gradient {
                    background: var(--primary-gradient);
                    color: white;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .bg-gradient:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(142, 45, 226, 0.3);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Agents;

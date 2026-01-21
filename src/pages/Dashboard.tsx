import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import { mockCalls, mockStats, mockChartData } from '../data/mockData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Types
interface Call {
    id: string;
    created_at: string;
    t_duration: string;
    t_status: 'completed' | 'missed' | 'voicemail';
    n_cost: number;
    t_recording_url: string;
}

interface ChartDataPoint {
    name: string;
    calls: number;
    answered: number;
}

const KPICard = ({ title, value, type = 'text' }: { title: string, value: string | number, type?: 'money' | 'text' }) => (
    <div style={{
        background: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h3>
        <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>
            {type === 'money' ? `${typeof value === 'number' ? value.toFixed(2) : value}€` : value}
        </p>
    </div>
);

const AudioPlayer = ({ url }: { url: string }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!url) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => setPlaying(false);
        }

        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setPlaying(!playing);
    };

    if (!url) return <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No disponible</span>;

    return (
        <button
            onClick={togglePlay}
            style={{
                padding: '0.3rem 0.8rem',
                fontSize: '0.8rem',
                background: playing ? 'var(--primary-gradient)' : '#2a2a2a',
                border: 'none'
            }}
        >
            {playing ? 'Pausar' : 'Reproducir'}
        </button>
    );
};

const Dashboard: React.FC = () => {
    const [feedback, setFeedback] = useState('');
    const [calls, setCalls] = useState<Call[]>([]);
    const [stats, setStats] = useState({ totalCalls: 0, answeredCalls: 0, totalCost: 0 });
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('calls')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    // Process Real Data
                    // Map to internal format if needed, but we can use db columns directly if we update UI to use them
                    setCalls(data as Call[]);

                    // Calculate Stats
                    const totalCalls = data.length;
                    const answeredCalls = data.filter(c => c.t_status === 'completed').length;
                    const totalCost = data.reduce((acc, curr) => acc + (curr.n_cost || 0), 0);
                    setStats({ totalCalls, answeredCalls, totalCost });

                    // Calculate Chart Data (Simplified logic: Group by day, assume recent data)
                    // For now, we will just use mock chart data if not enough real data, 
                    // or we can build a proper aggregation function. 
                    // Let's stick to mockChartData for the graph in this MVP step unless we have real timestamps clustering.
                    setChartData(mockChartData);
                } else {
                    // Fallback to Mock Data
                    loadMockData();
                }
            } catch (err) {
                console.error('Error fetching data, using mocks:', err);
                loadMockData();
            } finally {
                setLoading(false);
            }
        };

        const loadMockData = () => {
            // Transform Mock Data to align with DB schema for Types
            const mappedMockCalls = mockCalls.map(c => ({
                id: c.id,
                created_at: c.date, // Note: Mock date format isn't ISO, might need parsing for real usage
                t_duration: c.duration,
                t_status: c.status,
                n_cost: c.cost,
                t_recording_url: c.recordingUrl
            } as Call));

            setCalls(mappedMockCalls);
            setStats(mockStats);
            setChartData(mockChartData);
        };

        fetchData();
    }, []);

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Mensaje enviado a la agencia (Simulación)');
        setFeedback('');
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'grid', gap: '2rem' }}>

                {/* KPI Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <KPICard title="Llamadas Totales" value={loading ? '...' : stats.totalCalls} />
                    <KPICard title="Llamadas Contestadas" value={loading ? '...' : stats.answeredCalls} />
                    <KPICard title="Gasto" value={loading ? '...' : stats.totalCost} type="money" />
                </div>

                {/* Chart Section */}
                <div style={{
                    background: 'var(--card-bg)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    minHeight: '300px'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Rendimiento Semanal</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8e2de2" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8e2de2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="calls"
                                    stroke="#8e2de2"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCalls)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Call History Section */}
                <div style={{
                    background: 'var(--card-bg)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Historial de Llamadas</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', fontWeight: 500 }}>Fecha</th>
                                    <th style={{ padding: '1rem', fontWeight: 500 }}>ID</th>
                                    <th style={{ padding: '1rem', fontWeight: 500 }}>Duración</th>
                                    <th style={{ padding: '1rem', fontWeight: 500 }}>Estado</th>
                                    <th style={{ padding: '1rem', fontWeight: 500 }}>Coste</th>
                                    <th style={{ padding: '1rem', fontWeight: 500 }}>Grabación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calls.map(call => (
                                    <tr key={call.id} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {/* Simple date formatting */}
                                            {new Date(call.created_at).toLocaleString('es-ES', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            }) === 'Invalid Date' ? call.created_at : new Date(call.created_at).toLocaleString('es-ES', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#c4b5fd' }}>{call.id.slice(0, 8)}...</td>
                                        <td style={{ padding: '1rem' }}>{call.t_duration}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '4px',
                                                background: call.t_status === 'completed' ? 'rgba(16, 185, 129, 0.1)' :
                                                    call.t_status === 'missed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: call.t_status === 'completed' ? '#10b981' :
                                                    call.t_status === 'missed' ? '#ef4444' : '#f59e0b',
                                                fontSize: '0.8rem'
                                            }}>
                                                {call.t_status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{call.n_cost}€</td>
                                        <td style={{ padding: '1rem' }}>
                                            <AudioPlayer url={call.t_recording_url} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feedback Section */}
                <div style={{
                    background: 'var(--card-bg)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Feedback para la Agencia</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        ¿Algo que mejorar en el agente? Envíanos tus comentarios directamente.
                    </p>
                    <form onSubmit={handleFeedbackSubmit}>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Escribe tu mensaje aquí..."
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '1rem',
                                borderRadius: '8px',
                                background: '#1a1a1a',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                marginBottom: '1rem'
                            }}
                        />
                        <button type="submit" className="bg-gradient">Enviar Mensaje</button>
                    </form>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Dashboard;

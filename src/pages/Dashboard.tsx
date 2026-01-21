import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import { mockCalls } from '../data/mockData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Types
interface Call {
    id: string;
    created_at: string;
    t_duration: string;
    t_status: 'completed' | 'missed' | 'voicemail';
    n_cost: number;
    t_recording_url: string;
    // New Columns
    phone_number?: string;
    agent_id?: string;
    t_summary?: string;
    outcome?: 'no_reconoce_deuda' | 'no_localizado' | 'acepta_pagar' | 'acepta_pagar_parte' | 'enfadado' | 'cuelga_antes' | string;
}

interface Message {
    id: string;
    sender: 'user' | 'agency';
    text: string;
    created_at: string;
    author_name?: string;
}

interface Document {
    id: string;
    name: string;
    url: string;
    created_at: string;
}

type TimeFilter = 'day' | 'week' | 'month' | 'custom';
type MetricType = 'calls' | 'answered' | 'cost' | 'no_reconoce_deuda' | 'no_localizado' | 'acepta_pagar' | 'acepta_pagar_parte' | 'enfadado' | 'cuelga_antes';

// Components

const KPICard = ({
    title,
    value,
    subValue,
    type = 'text',
    isActive,
    onClick
}: {
    title: string,
    value: string | number,
    subValue?: string,
    type?: 'money' | 'text',
    isActive: boolean,
    onClick: () => void
}) => (
    <div
        onClick={onClick}
        style={{
            background: isActive ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: isActive ? '1px solid #8e2de2' : '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        {isActive && (
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'var(--primary-gradient)'
            }} />
        )}
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h3>
        <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>
            {type === 'money' ? `${typeof value === 'number' ? value.toFixed(2) : value}€` : value}
        </p>
        {subValue && (
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>
                {subValue}
            </p>
        )}
    </div>
);

const AudioPlayer = ({ url }: { url: string }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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
                border: 'none',
                borderRadius: '20px'
            }}
        >
            {playing ? 'Pausar' : 'Reproducir'}
        </button>
    );
};

// Chat Component (Advanced with Author Name, Edit, Delete, Persistence Fix)
const ChatSection = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [authorName, setAuthorName] = useState(() => localStorage.getItem('chat_author_name') || '');
    const [editingId, setEditingId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (authorName) {
            localStorage.setItem('chat_author_name', authorName);
        }
    }, [authorName]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data as Message[]);
        }
        setLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const text = input.trim();
        setInput('');

        if (editingId) {
            // Edit Mode
            setEditingId(null);

            setMessages(prev => prev.map(m => m.id === editingId ? { ...m, text } : m));

            const { error } = await supabase
                .from('messages')
                .update({ text })
                .eq('id', editingId);

            if (error) {
                console.error('Error updating:', error);
                fetchMessages();
            }
        } else {
            // Send Mode
            const tempId = Date.now().toString();
            const currentAuthor = authorName || 'Usuario';

            const optimisticMsg: Message = {
                id: tempId,
                sender: 'user',
                text,
                created_at: new Date().toISOString(),
                author_name: currentAuthor
            };
            setMessages(prev => [...prev, optimisticMsg]);

            const { data, error } = await supabase
                .from('messages')
                .insert([{ sender: 'user', text, author_name: currentAuthor }])
                .select();

            if (error) {
                console.error('Error sending message:', error);
                setMessages(prev => prev.filter(m => m.id !== tempId));
            } else if (data && data.length > 0) {
                setMessages(prev => prev.map(m => m.id === tempId ? (data[0] as Message) : m));
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Borrar mensaje?')) return;

        setMessages(prev => prev.filter(m => m.id !== id));

        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) {
            console.error('Error deleting:', error);
            fetchMessages();
        }
    };

    const startEdit = (msg: Message) => {
        setInput(msg.text);
        setEditingId(msg.id);
    };

    const cancelEdit = () => {
        setInput('');
        setEditingId(null);
    };

    return (
        <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            height: '500px',
            overflow: 'hidden'
        }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: '#1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Feedback Equipo</h3>
                <input
                    placeholder="Tu Nombre"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    style={{
                        background: '#333', border: 'none', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', width: '120px'
                    }}
                />
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading && messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>Cargando...</p>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#888' }}>{msg.author_name || (msg.sender === 'user' ? 'Usuario' : 'Agencia')}</span>
                                <span style={{ fontSize: '0.7rem', color: '#555' }}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div style={{
                                background: msg.sender === 'user' ? 'var(--primary-gradient)' : '#2a2a2a',
                                color: 'white',
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                borderBottomLeftRadius: msg.sender === 'agency' ? '2px' : '12px',
                                fontSize: '0.9rem',
                                position: 'relative'
                            }}>
                                <p>{msg.text}</p>
                            </div>

                            {msg.sender === 'user' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', opacity: 0.6 }}>
                                    <button onClick={() => startEdit(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.8rem' }}>✎</button>
                                    <button onClick={() => handleDelete(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: '0.8rem' }}>🗑️</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {editingId && (
                    <button type="button" onClick={cancelEdit} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
                )}
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={editingId ? "Editando mensaje..." : "Escribe un mensaje..."}
                    style={{
                        flex: 1,
                        padding: '0.8rem',
                        borderRadius: '8px',
                        background: '#0a0a0a',
                        border: '1px solid var(--border-color)',
                        color: 'white',
                        outline: 'none'
                    }}
                />
                <button type="submit" className="bg-gradient" style={{ borderRadius: '8px' }}>{editingId ? 'Actualizar' : 'Enviar'}</button>
            </form>
        </div>
    );
};

// Documents Component
const DocumentsSection = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [newDocUrl, setNewDocUrl] = useState('');

    const fetchDocs = async () => {
        const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
        if (data) setDocuments(data as Document[]);
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDocName.trim() || !newDocUrl.trim()) return;

        const { error } = await supabase.from('documents').insert([
            { name: newDocName, url: newDocUrl }
        ]);

        if (error) {
            console.error('Error saving document:', error);
        } else {
            setNewDocName('');
            setNewDocUrl('');
            setIsAdding(false);
            fetchDocs();
        }
    };

    return (
        <div style={{
            background: 'var(--card-bg)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            height: '500px', // Match Chat height
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Documentos Importantes</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', flex: 1 }}>
                {documents.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>No hay documentos disponibles.</p>
                ) : (
                    documents.map(doc => (
                        <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '1rem',
                            background: '#1a1a1a',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            textDecoration: 'none',
                            color: 'white',
                            transition: 'background 0.2s'
                        }}>
                            <div style={{ width: '30px', height: '30px', background: 'var(--primary-gradient)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>PDF</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{doc.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </a>
                    ))
                )}
            </div>

            {isAdding ? (
                <form onSubmit={handleSave} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                    <input
                        placeholder="Nombre (ej. Guía)"
                        value={newDocName}
                        onChange={e => setNewDocName(e.target.value)}
                        style={{ padding: '0.6rem', borderRadius: '6px', background: '#0a0a0a', border: '1px solid #333', color: 'white', fontSize: '0.9rem' }}
                        autoFocus
                    />
                    <input
                        placeholder="URL (https://...)"
                        value={newDocUrl}
                        onChange={e => setNewDocUrl(e.target.value)}
                        style={{ padding: '0.6rem', borderRadius: '6px', background: '#0a0a0a', border: '1px solid #333', color: 'white', fontSize: '0.9rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="bg-gradient" style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.9rem' }}>Guardar</button>
                        <button type="button" onClick={() => setIsAdding(false)} style={{ flex: 1, background: '#333', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.9rem' }}>Cancelar</button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    style={{
                        marginTop: '1rem',
                        background: 'transparent',
                        border: '1px dashed var(--text-secondary)',
                        color: 'var(--text-secondary)',
                        padding: '1rem',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    + Añadir enlace a documento
                </button>
            )}
        </div>
    );
};


const Dashboard: React.FC = () => {
    // Data State
    const [allCalls, setAllCalls] = useState<Call[]>([]);
    const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);


    // Filter State
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // UI State
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('calls');

    // Load Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await supabase
                    .from('calls')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data && data.length > 0) {
                    setAllCalls(data as Call[]);
                } else {
                    // Transform Mock Data
                    const mappedMockCalls = mockCalls.map(c => ({
                        id: c.id,
                        created_at: new Date().toISOString(), // Use recent date for mock
                        t_duration: c.duration,
                        t_status: c.status,
                        n_cost: c.cost,
                        t_recording_url: c.recordingUrl
                    } as Call));
                    setAllCalls(mappedMockCalls);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    useEffect(() => {
        const now = new Date();
        let start = new Date();

        if (timeFilter === 'day') {
            start.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'week') {
            start.setDate(now.getDate() - 7);
        } else if (timeFilter === 'month') {
            start.setMonth(now.getMonth() - 1);
        } else if (timeFilter === 'custom' && customStart) {
            start = new Date(customStart);
        }

        const filtered = allCalls.filter(c => {
            const callDate = new Date(c.created_at);
            if (timeFilter === 'custom' && customEnd) {
                const end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
                return callDate >= start && callDate <= end;
            }
            return callDate >= start;
        });

        setFilteredCalls(filtered);
    }, [allCalls, timeFilter, customStart, customEnd]);

    // KPIs & Chart Data Calculation
    const stats = useMemo(() => {
        const totalCalls = filteredCalls.length;
        const answeredCalls = filteredCalls.filter(c => c.t_status === 'completed').length;
        const totalCost = filteredCalls.reduce((acc, curr) => acc + (curr.n_cost || 0), 0);

        // Outcome KPIs
        const noReconoce = filteredCalls.filter(c => c.outcome === 'no_reconoce_deuda').length;
        const noLocalizado = filteredCalls.filter(c => c.outcome === 'no_localizado').length;
        const aceptaPagar = filteredCalls.filter(c => c.outcome === 'acepta_pagar').length;
        const pagoParcial = filteredCalls.filter(c => c.outcome === 'acepta_pagar_parte').length;
        const enfadado = filteredCalls.filter(c => c.outcome === 'enfadado').length;
        const cuelgaAntes = filteredCalls.filter(c => c.outcome === 'cuelga_antes').length;

        return { totalCalls, answeredCalls, totalCost, noReconoce, noLocalizado, aceptaPagar, pagoParcial, enfadado, cuelgaAntes };
    }, [filteredCalls]);

    const chartData = useMemo(() => {
        // Group by Day (or Hour if 'day' filter)
        const grouped: Record<string, number> = {};

        filteredCalls.forEach(call => {
            const d = new Date(call.created_at);
            let key = d.toLocaleDateString(); // Default Day
            if (timeFilter === 'day') key = d.getHours() + ':00'; // Hourly for Day

            let val = 0;
            if (selectedMetric === 'calls') val = 1;
            else if (selectedMetric === 'answered') val = call.t_status === 'completed' ? 1 : 0;
            else if (selectedMetric === 'cost') val = call.n_cost || 0;
            else if (selectedMetric === 'no_reconoce_deuda') val = call.outcome === 'no_reconoce_deuda' ? 1 : 0;
            else if (selectedMetric === 'no_localizado') val = call.outcome === 'no_localizado' ? 1 : 0;
            else if (selectedMetric === 'acepta_pagar') val = call.outcome === 'acepta_pagar' ? 1 : 0;
            else if (selectedMetric === 'acepta_pagar_parte') val = call.outcome === 'acepta_pagar_parte' ? 1 : 0;
            else if (selectedMetric === 'enfadado') val = call.outcome === 'enfadado' ? 1 : 0;
            else if (selectedMetric === 'cuelga_antes') val = call.outcome === 'cuelga_antes' ? 1 : 0;

            if (val > 0) {
                grouped[key] = (grouped[key] || 0) + val;
            }
        });

        // Ensure we don't return sparse data if we want a continuous line? 
        // For now, let's just return what we have mapped.
        // Recharts handles missing points ok usually, or needed filling.
        // Let's stick to the existing simple pattern.

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [filteredCalls, selectedMetric, timeFilter]);


    // Helper for chart title
    const getChartTitle = () => {
        const titles: Record<MetricType, string> = {
            calls: 'Volumen de Llamadas',
            answered: 'Llamadas Contestadas',
            cost: 'Gasto Total',
            no_reconoce_deuda: 'No Reconoce Deuda',
            no_localizado: 'No Localizado',
            acepta_pagar: 'Acepta Pagar',
            acepta_pagar_parte: 'Pago Parcial',
            enfadado: 'Clientes Enfadados',
            cuelga_antes: 'Cuelga Antes de Tiempo'
        };
        return titles[selectedMetric] || 'Datos';
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'grid', gap: '2rem' }}>

                {/* Header & Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Panel de Control</h2>

                    <div style={{ display: 'flex', gap: '0.5rem', background: '#1a1a1a', padding: '0.3rem', borderRadius: '8px' }}>
                        {(['day', 'week', 'month', 'custom'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                style={{
                                    background: timeFilter === f ? 'var(--primary-gradient)' : 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {f === 'day' ? 'Hoy' : f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Personalizado'}
                            </button>
                        ))}
                    </div>
                </div>

                {timeFilter === 'custom' && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '-1rem' }}>
                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', background: '#111', border: '1px solid #333', color: 'white' }} />
                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', background: '#111', border: '1px solid #333', color: 'white' }} />
                    </div>
                )}

                {/* KPI Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <KPICard
                        title="Llamadas Totales"
                        value={stats.totalCalls}
                        isActive={selectedMetric === 'calls'}
                        onClick={() => setSelectedMetric('calls')}
                    />
                    <KPICard
                        title="Llamadas Contestadas"
                        value={stats.answeredCalls}
                        subValue={`${stats.totalCalls > 0 ? ((stats.answeredCalls / stats.totalCalls) * 100).toFixed(0) : 0}% de retención`}
                        isActive={selectedMetric === 'answered'}
                        onClick={() => setSelectedMetric('answered')}
                    />
                    <KPICard
                        title="Gasto"
                        value={stats.totalCost}
                        type="money"
                        isActive={selectedMetric === 'cost'}
                        onClick={() => setSelectedMetric('cost')}
                    />
                </div>

                {/* Outcome KPIs */}
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '-0.5rem' }}>Resultados de Gestión</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div onClick={() => setSelectedMetric('no_reconoce_deuda')} style={{ cursor: 'pointer', background: selectedMetric === 'no_reconoce_deuda' ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: selectedMetric === 'no_reconoce_deuda' ? '1px solid #8e2de2' : '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        {selectedMetric === 'no_reconoce_deuda' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--primary-gradient)' }} />}
                        <p style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>No reconoce la deuda</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.noReconoce}</p>
                    </div>
                    <div onClick={() => setSelectedMetric('no_localizado')} style={{ cursor: 'pointer', background: selectedMetric === 'no_localizado' ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: selectedMetric === 'no_localizado' ? '1px solid #8e2de2' : '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        {selectedMetric === 'no_localizado' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--primary-gradient)' }} />}
                        <p style={{ fontSize: '0.8rem', color: '#adb5bd' }}>No localizado</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.noLocalizado}</p>
                    </div>
                    <div onClick={() => setSelectedMetric('acepta_pagar')} style={{ cursor: 'pointer', background: selectedMetric === 'acepta_pagar' ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: selectedMetric === 'acepta_pagar' ? '1px solid #8e2de2' : '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        {selectedMetric === 'acepta_pagar' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--primary-gradient)' }} />}
                        <p style={{ fontSize: '0.8rem', color: '#51cf66' }}>Acepta pagar</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.aceptaPagar}</p>
                    </div>
                    <div onClick={() => setSelectedMetric('acepta_pagar_parte')} style={{ cursor: 'pointer', background: selectedMetric === 'acepta_pagar_parte' ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: selectedMetric === 'acepta_pagar_parte' ? '1px solid #8e2de2' : '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        {selectedMetric === 'acepta_pagar_parte' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--primary-gradient)' }} />}
                        <p style={{ fontSize: '0.8rem', color: '#fcc419' }}>Pago parcial</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.pagoParcial}</p>
                    </div>
                    <div onClick={() => setSelectedMetric('enfadado')} style={{ cursor: 'pointer', background: selectedMetric === 'enfadado' ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: selectedMetric === 'enfadado' ? '1px solid #8e2de2' : '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        {selectedMetric === 'enfadado' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--primary-gradient)' }} />}
                        <p style={{ fontSize: '0.8rem', color: '#fa5252' }}>Enfadado</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.enfadado}</p>
                    </div>
                    <div onClick={() => setSelectedMetric('cuelga_antes')} style={{ cursor: 'pointer', background: selectedMetric === 'cuelga_antes' ? 'linear-gradient(145deg, #1e1e1e, #121212)' : 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: selectedMetric === 'cuelga_antes' ? '1px solid #8e2de2' : '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        {selectedMetric === 'cuelga_antes' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--primary-gradient)' }} />}
                        <p style={{ fontSize: '0.8rem', color: '#ffec99' }}>Cuelga antes</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.cuelgaAntes}</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div style={{
                    background: 'var(--card-bg)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    minHeight: '350px'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                        Gráfica de: {getChartTitle()}
                    </h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                                    dataKey="value"
                                    stroke="#8e2de2"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Advanced Section: Docs + Chat */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                    <ChatSection />
                    <DocumentsSection />
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
                                {filteredCalls.map(call => (
                                    <tr key={call.id} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {new Date(call.created_at).toLocaleString('es-ES', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#c4b5fd' }}>{call.id.slice(0, 8)}...</td>
                                        <td style={{ padding: '1rem' }}>{call.t_duration}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '12px',
                                                background: call.t_status === 'completed' ? 'rgba(76, 209, 55, 0.2)' :
                                                    call.t_status === 'missed' ? 'rgba(232, 65, 24, 0.2)' : 'rgba(251, 197, 49, 0.2)',
                                                color: call.t_status === 'completed' ? '#4cd137' :
                                                    call.t_status === 'missed' ? '#e84118' : '#fbc531',
                                                fontSize: '0.8rem'
                                            }}>
                                                {call.t_status === 'completed' ? 'Completada' : call.t_status === 'missed' ? 'Perdida' : 'Buzón'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{call.n_cost ? `${call.n_cost.toFixed(2)}€` : '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <AudioPlayer url={call.t_recording_url} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;

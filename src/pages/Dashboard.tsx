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

interface Task {
    id: string;
    text: string;
    category: 'mc2' | 'telvia';
    created_at: string;
}

type TimeFilter = 'day' | 'week' | 'month' | 'custom';
type MetricType = 'calls' | 'answered' | 'cost' | 'recovered_debt' | 'no_reconoce_deuda' | 'no_localizado' | 'acepta_pagar' | 'acepta_pagar_parte' | 'enfadado' | 'cuelga_antes';

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
    if (!url) return <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No disponible</span>;

    // Convert Google Drive URLs to direct download format
    const getDirectUrl = (driveUrl: string) => {
        // Handle different Google Drive URL formats
        // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        // Format 2: https://drive.google.com/open?id=FILE_ID
        // Convert to: https://drive.google.com/uc?export=download&id=FILE_ID

        let fileId = '';

        // Try to extract file ID from various formats
        const match1 = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        const match2 = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (match1) {
            fileId = match1[1];
        } else if (match2) {
            fileId = match2[1];
        }

        // If it's a Google Drive URL, convert it
        if (fileId && driveUrl.includes('drive.google.com')) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }

        // If it's already a direct URL or not from Drive, return as is
        return driveUrl;
    };

    const directUrl = getDirectUrl(url);

    return (
        <audio
            controls
            src={directUrl}
            style={{ height: '30px', maxWidth: '200px' }}
            preload="metadata"
        />
    );
};

// Chat Component (Advanced with Author Name, Edit, Delete, Persistence Fix)
const ChatSection = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [authorName, setAuthorName] = useState(() => localStorage.getItem('chat_author_name') || '');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

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
        // Scroll to bottom of container only, avoiding window scroll
        if (messagesContainerRef.current) {
            const { scrollHeight, clientHeight } = messagesContainerRef.current;
            messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
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

    const performDelete = async (id: string) => {
        setConfirmDeleteId(null);
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
        setConfirmDeleteId(null); // Clear delete state if editing
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

            <div ref={messagesContainerRef} style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                    {confirmDeleteId === msg.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#333', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#ccc' }}>¿Borrar?</span>
                                            <button onClick={() => performDelete(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: '0.75rem', fontWeight: 'bold' }}>Sí</button>
                                            <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '0.75rem' }}>No</button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.8rem' }}>Editar</button>
                                            <button onClick={() => setConfirmDeleteId(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: '0.8rem' }}>Borrar</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
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

// Documents Component (Updated with Inline Delete)
const DocumentsSection = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [newDocUrl, setNewDocUrl] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

    const performDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(null);

        setDocuments(prev => prev.filter(d => d.id !== id));
        const { error } = await supabase.from('documents').delete().eq('id', id);

        if (error) {
            console.error('Error deleting doc:', error);
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
                        <div key={doc.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '1rem',
                            background: '#1a1a1a',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            transition: 'background 0.2s',
                            position: 'relative'
                        }}>
                            <a href={doc.url} target="_blank" rel="noreferrer" style={{
                                display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, textDecoration: 'none', color: 'white'
                            }}>
                                <div style={{ width: '30px', height: '30px', background: 'var(--primary-gradient)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>PDF</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{doc.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </a>

                            <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                {confirmDeleteId === doc.id ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', background: '#333', padding: '0.2rem 0.5rem', borderRadius: '4px', zIndex: 10 }}>
                                        <button onClick={(e) => performDelete(doc.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 'bold' }}>Sí</button>
                                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '0.8rem' }}>No</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => { e.preventDefault(); setConfirmDeleteId(doc.id); }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#ff6b6b',
                                            cursor: 'pointer',
                                            padding: '0.5rem',
                                            fontSize: '0.8rem',
                                            opacity: 0.7,
                                            zIndex: 10
                                        }}
                                        title="Eliminar documento"
                                    >
                                        Borrar
                                    </button>
                                )}
                            </div>
                        </div>
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

// Pending Tasks Component (New)
const PendingTasksSection = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [mc2Input, setMc2Input] = useState('');
    const [telviaInput, setTelviaInput] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const fetchTasks = async () => {
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
        if (data) setTasks(data as Task[]);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAdd = async (category: 'mc2' | 'telvia', text: string) => {
        if (!text.trim()) return;

        if (category === 'mc2') setMc2Input('');
        else setTelviaInput('');

        const { error } = await supabase.from('tasks').insert([{ text, category }]);
        if (error) console.error('Error adding task:', error);
        else fetchTasks();
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(null);
        setTasks(prev => prev.filter(t => t.id !== id));
        await supabase.from('tasks').delete().eq('id', id);
    };

    const renderColumn = (title: string, category: 'mc2' | 'telvia', inputVal: string, setInputVal: (s: string) => void) => (
        <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                {title}
            </h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {tasks.filter(t => t.category === category).map(task => (
                    <div key={task.id} style={{
                        background: '#252525', padding: '0.8rem', borderRadius: '6px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span>{task.text}</span>
                        {confirmDeleteId === task.id ? (
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button onClick={(e) => handleDelete(task.id, e)} style={{ border: 'none', background: 'none', color: '#ff6b6b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>Sí</button>
                                <button onClick={() => setConfirmDeleteId(null)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.75rem' }}>No</button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmDeleteId(task.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5, color: '#ccc', fontSize: '0.8rem' }}>Borrar</button>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Nueva tarea..."
                    style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', padding: '0.4rem', color: 'white', fontSize: '0.8rem' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd(category, inputVal)}
                />
                <button onClick={() => handleAdd(category, inputVal)} style={{ background: '#333', border: 'none', color: 'white', padding: '0 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>+</button>
            </div>
        </div>
    );

    return (
        <div style={{
            background: 'var(--card-bg)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
        }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Tareas Pendientes</h3>
            <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                {renderColumn('Pendiente MC2 Legal', 'mc2', mc2Input, setMc2Input)}
                {renderColumn('Pendiente Telvia', 'telvia', telviaInput, setTelviaInput)}
            </div>
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
        setVisibleRows(10); // Reset pagination on filter change
    }, [allCalls, timeFilter, customStart, customEnd]);

    // Pagination & Detail State
    const [visibleRows, setVisibleRows] = useState(10);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);

    const handleLoadMore = () => {
        setVisibleRows(prev => prev + 20);
    };

    const handleShowAll = () => {
        setVisibleRows(filteredCalls.length);
    };

    const handleExportCSV = () => {
        const headers = ['Fecha', 'Duración', 'Estado', 'Teléfono', 'Resultado', 'Coste', 'Grabación', 'Resumen'];
        const rows = filteredCalls.map(call => [
            new Date(call.created_at).toLocaleString(),
            call.t_duration,
            call.t_status === 'completed' ? 'Completada' : 'Perdida',
            call.phone_number || '-',
            call.outcome || '-',
            call.n_cost ? call.n_cost.toFixed(2) : '0.00',
            call.t_recording_url || '',
            call.t_summary || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(item => `"${item}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_llamadas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // KPIs & Chart Data Calculation
    const stats = useMemo(() => {
        const totalCalls = filteredCalls.length;
        const answeredCalls = filteredCalls.filter(c => c.t_status === 'completed').length;
        const totalCost = filteredCalls.reduce((acc, curr) => acc + (curr.n_cost || 0), 0);
        const totalRecovered = 0; // Placeholder as requested

        // Outcome KPIs
        const noReconoce = filteredCalls.filter(c => c.outcome === 'no_reconoce_deuda').length;
        const noLocalizado = filteredCalls.filter(c => c.outcome === 'no_localizado').length;
        const aceptaPagar = filteredCalls.filter(c => c.outcome === 'acepta_pagar').length;
        const pagoParcial = filteredCalls.filter(c => c.outcome === 'acepta_pagar_parte').length;
        const enfadado = filteredCalls.filter(c => c.outcome === 'enfadado').length;
        const cuelgaAntes = filteredCalls.filter(c => c.outcome === 'cuelga_antes').length;

        return { totalCalls, answeredCalls, totalCost, totalRecovered, noReconoce, noLocalizado, aceptaPagar, pagoParcial, enfadado, cuelgaAntes };
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
            else if (selectedMetric === 'recovered_debt') val = 0; // Placeholder
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

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [filteredCalls, selectedMetric, timeFilter]);


    // Helper for chart title
    const getChartTitle = () => {
        const titles: Record<MetricType, string> = {
            calls: 'Volumen de Llamadas',
            answered: 'Llamadas Contestadas',
            cost: 'Gasto Total',
            recovered_debt: 'Deuda Recuperada',
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
                    <KPICard
                        title="Deuda Recuperada"
                        value={stats.totalRecovered}
                        type="money"
                        isActive={selectedMetric === 'recovered_debt'}
                        onClick={() => setSelectedMetric('recovered_debt')}
                    />
                </div>

                {/* Outcome KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <KPICard title="No Reconoce" value={stats.noReconoce} isActive={selectedMetric === 'no_reconoce_deuda'} onClick={() => setSelectedMetric('no_reconoce_deuda')} />
                    <KPICard title="No Localizado" value={stats.noLocalizado} isActive={selectedMetric === 'no_localizado'} onClick={() => setSelectedMetric('no_localizado')} />
                    <KPICard title="Acepta Pagar" value={stats.aceptaPagar} isActive={selectedMetric === 'acepta_pagar'} onClick={() => setSelectedMetric('acepta_pagar')} />
                    <KPICard title="Pago Parcial" value={stats.pagoParcial} isActive={selectedMetric === 'acepta_pagar_parte'} onClick={() => setSelectedMetric('acepta_pagar_parte')} />
                    <KPICard title="Enfadado" value={stats.enfadado} isActive={selectedMetric === 'enfadado'} onClick={() => setSelectedMetric('enfadado')} />
                    <KPICard title="Cuelga Antes" value={stats.cuelgaAntes} isActive={selectedMetric === 'cuelga_antes'} onClick={() => setSelectedMetric('cuelga_antes')} />
                </div>

                {/* Chart Section */}
                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>{getChartTitle()}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8e2de2" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8e2de2" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: 'white' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8e2de2"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Bottom Section: Chat & Documents */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                    <ChatSection />
                    <DocumentsSection />
                </div>

                {/* Pending Tasks Section */}
                <PendingTasksSection />

                {/* Recent Calls Table */}
                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Llamadas Recientes</h3>
                        <button
                            onClick={handleExportCSV}
                            style={{
                                background: '#333',
                                border: '1px solid #444',
                                color: 'white',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            Exportar CSV
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', color: '#888', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Fecha</th>
                                    <th style={{ padding: '1rem' }}>Duración</th>
                                    <th style={{ padding: '1rem' }}>Estado</th>
                                    <th style={{ padding: '1rem' }}>Teléfono</th>
                                    <th style={{ padding: '1rem' }}>Resultado</th>
                                    <th style={{ padding: '1rem' }}>Coste</th>
                                    <th style={{ padding: '1rem' }}>Grabación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCalls.slice(0, visibleRows).map(call => (
                                    <tr
                                        key={call.id}
                                        onClick={() => setSelectedCall(call)}
                                        style={{ borderBottom: '1px solid #1a1a1a', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#1f1f1f'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem' }}>{new Date(call.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>{call.t_duration}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '12px',
                                                background: call.t_status === 'completed' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                color: call.t_status === 'completed' ? '#4caf50' : '#f44336',
                                                fontSize: '0.8rem'
                                            }}>
                                                {call.t_status === 'completed' ? 'Completada' : 'Perdida'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#ccc' }}>{call.phone_number || '-'}</td>
                                        <td style={{ padding: '1rem', color: '#ccc' }}>{call.outcome?.replace(/_/g, ' ') || '-'}</td>
                                        <td style={{ padding: '1rem' }}>{call.n_cost ? `${call.n_cost.toFixed(2)}€` : '0.00€'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <AudioPlayer url={call.t_recording_url} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {visibleRows < filteredCalls.length && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem' }}>
                            <button
                                onClick={handleLoadMore}
                                style={{
                                    background: 'var(--primary-gradient)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cargar más
                            </button>
                            <button
                                onClick={handleShowAll}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #444',
                                    color: '#ccc',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Ver todas
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal for Call Details */}
                {selectedCall && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }} onClick={() => setSelectedCall(null)}>
                        <div style={{
                            background: '#1a1a1a',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '600px',
                            width: '90%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Detalle de Llamada</h3>
                                <button onClick={() => setSelectedCall(null)} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Fecha</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(selectedCall.created_at).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Teléfono</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'white' }}>{selectedCall.phone_number || 'Desconocido'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Duración</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedCall.t_duration || '-'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Coste</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4caf50' }}>{selectedCall.n_cost ? `${selectedCall.n_cost.toFixed(2)}€` : '0.00€'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Resultado</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedCall.outcome?.replace(/_/g, ' ') || '-'}</div>
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem', display: 'block' }}>Resumen de la llamada</span>
                                <div style={{
                                    background: '#111',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    minHeight: '80px',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5',
                                    color: selectedCall.t_summary ? 'white' : '#666'
                                }}>
                                    {selectedCall.t_summary || "No hay resumen disponible para esta llamada."}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem', display: 'block' }}>Grabación</span>
                                <div style={{ background: '#222', padding: '0.8rem', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                                    <AudioPlayer url={selectedCall.t_recording_url} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;

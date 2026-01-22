import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Task {
    id: string;
    text: string;
    category: 'mc2' | 'telvia';
    created_at: string;
    completed_at: string;
}

const CompletedTasks: React.FC = () => {
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchCompletedTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false });

        if (!error && data) {
            setCompletedTasks(data as Task[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCompletedTasks();
    }, []);

    const handleDelete = async (id: string) => {
        setConfirmDeleteId(null);
        setCompletedTasks(prev => prev.filter(t => t.id !== id));

        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
            console.error('Error deleting task:', error);
            fetchCompletedTasks();
        }
    };

    const handleRestore = async (id: string) => {
        setCompletedTasks(prev => prev.filter(t => t.id !== id));

        const { error } = await supabase
            .from('tasks')
            .update({ completed_at: null })
            .eq('id', id);

        if (error) {
            console.error('Error restoring task:', error);
            fetchCompletedTasks();
        }
    };

    const renderTasksByCategory = (category: 'mc2' | 'telvia', title: string) => {
        const categoryTasks = completedTasks.filter(t => t.category === category);

        return (
            <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '8px', padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                    {title}
                </h4>
                {categoryTasks.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                        No hay tareas completadas
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {categoryTasks.map(task => (
                            <div key={task.id} style={{
                                background: '#252525',
                                padding: '1rem',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                border: '1px solid #333'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <span style={{ flex: 1, color: '#ccc' }}>{task.text}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleRestore(task.id)}
                                            style={{
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                color: '#4caf50',
                                                fontSize: '0.8rem',
                                                opacity: 0.7
                                            }}
                                        >
                                            Restaurar
                                        </button>
                                        {confirmDeleteId === task.id ? (
                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        color: '#ff6b6b',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Sí
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        color: '#ccc',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteId(task.id)}
                                                style={{
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer',
                                                    opacity: 0.5,
                                                    color: '#ccc',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Borrar
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    Completada: {new Date(task.completed_at).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'grid', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        Tareas Completadas
                    </h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: '#333',
                            border: '1px solid #444',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        ← Volver a Tareas Pendientes
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        Cargando tareas completadas...
                    </div>
                ) : (
                    <div style={{
                        background: 'var(--card-bg)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                    }}>
                        <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                            {renderTasksByCategory('mc2', 'MC2 Legal')}
                            {renderTasksByCategory('telvia', 'Telvia')}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CompletedTasks;

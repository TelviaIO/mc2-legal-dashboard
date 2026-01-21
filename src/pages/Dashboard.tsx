import React, { useState, useEffect, useMemo } from 'react';
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
    outcome?: 'no_reconoce_deuda' | 'no_localizado' | 'acepta_pagar' | 'acepta_pagar_parte' | 'enfadado' | 'cuelga_antes' | string;
}

interface Message {
    id: string;
    sender: 'user' | 'agency';
    text: string;
    created_at: string;
}

interface Document {
    id: string;
    name: string;
    url: string;
    created_at: string;
}

type TimeFilter = 'day' | 'week' | 'month' | 'custom';
type MetricType = 'calls' | 'answered' | 'cost' | 'no_reconoce_deuda' | 'no_localizado' | 'acepta_pagar' | 'acepta_pagar_parte' | 'enfadado' | 'cuelga_antes';

// Components... (unchanged)

// ... (Inside Dashboard component)

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

        </div>
    </DashboardLayout>
);
};

export default Dashboard;

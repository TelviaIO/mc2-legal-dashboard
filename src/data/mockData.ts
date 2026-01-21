export interface Call {
    id: string;
    date: string;
    duration: string;
    status: 'completed' | 'missed' | 'voicemail';
    cost: number;
    recordingUrl: string; // valid mp3 url or placeholder
}

export const mockCalls: Call[] = [
    { id: 'CALL-29384', date: '2023-10-25 14:30', duration: '2m 15s', status: 'completed', cost: 0.25, recordingUrl: 'https://www.soundhelix.com/examples/mp3/Soundhelix-Song-1.mp3' },
    { id: 'CALL-29385', date: '2023-10-25 15:45', duration: '0m 45s', status: 'missed', cost: 0.05, recordingUrl: '' },
    { id: 'CALL-29386', date: '2023-10-26 09:12', duration: '5m 02s', status: 'completed', cost: 0.60, recordingUrl: 'https://www.soundhelix.com/examples/mp3/Soundhelix-Song-1.mp3' },
    { id: 'CALL-29387', date: '2023-10-26 11:20', duration: '1m 30s', status: 'voicemail', cost: 0.15, recordingUrl: 'https://www.soundhelix.com/examples/mp3/Soundhelix-Song-1.mp3' },
    { id: 'CALL-29388', date: '2023-10-26 16:55', duration: '3m 10s', status: 'completed', cost: 0.40, recordingUrl: 'https://www.soundhelix.com/examples/mp3/Soundhelix-Song-1.mp3' },
];

export const mockStats = {
    totalCalls: 1240,
    answeredCalls: 985,
    totalCost: 154.20,
};

export const mockChartData = [
    { name: 'Lun', calls: 40, answered: 35 },
    { name: 'Mar', calls: 55, answered: 42 },
    { name: 'Mie', calls: 38, answered: 30 },
    { name: 'Jue', calls: 70, answered: 65 },
    { name: 'Vie', calls: 95, answered: 80 },
    { name: 'Sab', calls: 20, answered: 15 },
    { name: 'Dom', calls: 10, answered: 8 },
];

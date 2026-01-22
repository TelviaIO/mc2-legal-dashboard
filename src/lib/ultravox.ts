// Ultravox API helper
// Note: In production, this should be moved to a backend API endpoint

const API_KEY = import.meta.env.VITE_ULTRAVOX_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicHR1d2FscXVxZXllYWhzcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDQ5MDQsImV4cCI6MjA4NDU4MDkwNH0.Ts6R3rwM6sKXR8stiXvPNFuJxfwnkl8i5Zopm8RYBzg';

interface CreateCallParams {
    agentId: string;
}

export async function createCall(params: CreateCallParams): Promise<string> {
    try {
        console.log('API_KEY available:', API_KEY ? 'Yes (length: ' + API_KEY.length + ')' : 'No');
        console.log('API_KEY prefix:', API_KEY ? API_KEY.substring(0, 20) + '...' : 'None');
        console.log('Creating call for agent ID:', params.agentId);

        // Use agentId instead of systemPrompt - Ultravox expects the agent ID directly
        const requestBody = {
            agentId: params.agentId,
            languageHint: 'es'
        };

        console.log('Request body:', requestBody);

        const response = await fetch('https://api.ultravox.ai/api/calls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const callData = await response.json();
        console.log('Call created successfully:', callData);

        if (!callData.joinUrl) {
            throw new Error('No joinUrl received from API');
        }

        return callData.joinUrl;
    } catch (error) {
        console.error('Error creating call:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
}

// Ultravox API helper
// Calls go through our serverless function to keep API key secure

interface CreateCallParams {
    agentId: string;
}

export async function createCall(params: CreateCallParams): Promise<string> {
    try {
        console.log('=== Ultravox API Call Debug ===');
        console.log('Creating call for agent ID:', params.agentId);
        console.log('Using serverless function: /api/create-call');

        const response = await fetch('/api/create-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentId: params.agentId
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API Error Response:', errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
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

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Try both with and without VITE_ prefix
    const API_KEY = process.env.ULTRAVOX_API_KEY || process.env.VITE_ULTRAVOX_API_KEY;

    if (!API_KEY) {
        console.error('ULTRAVOX_API_KEY or VITE_ULTRAVOX_API_KEY is not set');
        return res.status(500).json({ error: 'Server configuration error: API key not found' });
    }

    const { agentId } = req.body;

    if (!agentId) {
        return res.status(400).json({ error: 'agentId is required' });
    }

    try {
        console.log('Creating call for agent:', agentId);
        console.log('API Key present:', !!API_KEY);
        console.log('API Key length:', API_KEY?.length);

        // agentId goes in the URL path
        const url = `https://api.ultravox.ai/api/agents/${agentId}/calls`;
        console.log('Request URL:', url);

        const requestBody = {};
        console.log('Request body:', JSON.stringify(requestBody));

        const response = await fetch(url, {
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
            console.error('Ultravox API error:', response.status, errorText);

            // Try to parse as JSON for better error details
            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = errorText;
            }

            return res.status(response.status).json({
                error: 'Failed to create call',
                details: errorDetails,
                status: response.status
            });
        }

        const callData = await response.json();
        console.log('Call created successfully:', callData.callId);

        return res.status(200).json(callData);
    } catch (error) {
        console.error('Error creating call:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

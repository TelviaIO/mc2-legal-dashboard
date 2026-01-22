import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const API_KEY = process.env.VITE_ULTRAVOX_API_KEY;

    if (!API_KEY) {
        console.error('VITE_ULTRAVOX_API_KEY is not set');
        return res.status(500).json({ error: 'Server configuration error: API key not found' });
    }

    const { agentId } = req.body;

    if (!agentId) {
        return res.status(400).json({ error: 'agentId is required' });
    }

    try {
        console.log('Creating call for agent:', agentId);

        const response = await fetch('https://api.ultravox.ai/api/calls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                agentId: agentId,
                languageHint: 'es'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ultravox API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to create call',
                details: errorText
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

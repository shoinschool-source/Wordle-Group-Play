export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Parse the prompt sent from your game
    const { prompt } = req.body;
    
    // 3. Grab the secret key from Vercel's Environment Variables
    const apiKey = process.env.GEMINI_API_KEY; 

    try {
        // 4. Send the request to Gemini 3.1 Flash-lite
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        
        // 5. Send the AI's response back to your game
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to contact AI' });
    }
}

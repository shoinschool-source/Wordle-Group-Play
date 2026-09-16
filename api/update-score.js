import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { roomPin, playerName, score, group } = body;

    if (!roomPin || !playerName) {
      return res.status(400).json({ error: 'Room PIN and player name are required' });
    }

    const playerRecord = {
      name: playerName,
      score: typeof score === 'number' ? score : 0,
      group: typeof group === 'number' ? group : 0,
      updatedAt: Date.now()
    };

    // Store inside Redis Hash for this room
    await redis.hset(`room:${roomPin}:players`, {
      [playerName]: JSON.stringify(playerRecord)
    });

    return res.status(200).json({ status: 'success', player: playerName, data: playerRecord });

  } catch (error) {
    console.error("Failed to update score:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

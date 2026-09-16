import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomPin, type } = req.query;

  if (!roomPin) {
    return res.status(400).json({ error: 'Room PIN is required' });
  }

  try {
    const roomData = await redis.hgetall(`room:${roomPin}:players`);

    if (!roomData || Object.keys(roomData).length === 0) {
      return res.status(200).json([]);
    }

    let playersList = [];
    const teams = {
      1: { name: "Team Red (Group 1)", score: 0, members: [] },
      2: { name: "Team Blue (Group 2)", score: 0, members: [] },
      3: { name: "Team Green (Group 3)", score: 0, members: [] },
      4: { name: "Team Yellow (Group 4)", score: 0, members: [] }
    };

    for (const [playerName, rawData] of Object.entries(roomData)) {
      let playerObj = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      playersList.push(playerObj);

      let groupNum = playerObj.group || 0;
      let score = playerObj.score || 0;

      if (groupNum >= 1 && groupNum <= 4) {
        teams[groupNum].score += score;
        teams[groupNum].members.push(playerObj);
      }
    }

    // If requested specifically for final team podium ranking
    if (type === 'teams') {
      const sortedTeams = Object.values(teams).sort((a, b) => b.score - a.score);
      return res.status(200).json(sortedTeams);
    }

    // Default response: returns all player objects for the QR lobby screen & team randomizer
    return res.status(200).json(playersList);

  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
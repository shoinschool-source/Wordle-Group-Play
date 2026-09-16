export default async function handler(req, res) {
    const { roomPin } = req.query;

    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!kvUrl || !kvToken) return res.status(500).json({ error: 'Database not connected' });

    try {
        // Fetch both player scores and group mappings concurrently[cite: 5]
        const [scoresRes, groupsRes] = await Promise.all([
            fetch(kvUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(["HGETALL", `room:${roomPin}`])
            }),
            fetch(kvUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(["HGETALL", `room:${roomPin}:groups`])
            })
        ]);
        
        const scoresData = await scoresRes.json();
        const groupsData = await groupsRes.json();

        let playerGroups = {};
        if (groupsData.result && Array.isArray(groupsData.result)) {
            for (let i = 0; i < groupsData.result.length; i += 2) {
                playerGroups[groupsData.result[i]] = groupsData.result[i+1];
            }
        }

        // Initialize the 4 teams
        let teams = {
            1: { teamId: 1, name: "Group 1 (Team Red)", score: 0, members: [] },
            2: { teamId: 2, name: "Group 2 (Team Blue)", score: 0, members: [] },
            3: { teamId: 3, name: "Group 3 (Team Green)", score: 0, members: [] },
            4: { teamId: 4, name: "Group 4 (Team Yellow)", score: 0, members: [] }
        };

        // Aggregate player scores into their respective teams[cite: 5]
        if (scoresData.result && Array.isArray(scoresData.result) && scoresData.result.length > 0) {
            for (let i = 0; i < scoresData.result.length; i += 2) {
                const playerName = scoresData.result[i];
                const score = parseInt(scoresData.result[i+1], 10) || 0;
                const assignedGroup = playerGroups[playerName] || 1;

                if (teams[assignedGroup]) {
                    teams[assignedGroup].score += score;
                    teams[assignedGroup].members.push({ name: playerName, score });
                }
            }
        }

        // Sort teams by highest total score first[cite: 5]
        let teamRanking = Object.values(teams).sort((a, b) => b.score - a.score);

        res.status(200).json(teamRanking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team leaderboard' });
    }
}
```[cite: 5]

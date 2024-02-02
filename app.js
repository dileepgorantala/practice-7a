const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const snakeToCamel = (info) => {
  return {
    playerId: info.player_id,
    playerName: info.player_name,
  };
};

//API 1
app.get("/players/", async (req, res) => {
  const playersDetails = `
    SELECT * FROM player_details ORDER BY player_id`;
  const dbRes = await db.all(playersDetails);
  res.send(dbRes.map((each) => snakeToCamel(each)));
});

//API 2
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const playerDetails = `
    SELECT player_id as playerId, player_name as playerName FROM player_details WHERE player_id=${playerId}`;
  const dbRes = await db.get(playerDetails);
  res.send(dbRes);
});

//API 3
app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const playerDetails = req.body;
  const { playerName } = playerDetails;
  const updatingPlayer = `
    UPDATE player_details SET
    player_name='${playerName}'`;
  const dbRes = await db.run(updatingPlayer);
  res.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const matchDetails = `
    SELECT match_id as matchId, match as match, year as year FROM match_details WHERE match_id=${matchId}`;
  const dbRes = await db.get(matchDetails);
  res.send(dbRes);
});

//API 5
app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;
  const playerMatches = `
    SELECT match_id as matchId, match as match, year as year FROM player_match_score NATURAL JOIN match_details 
    WHERE player_id=${playerId}`;
  const dbRes = await db.all(playerMatches);
  res.send(dbRes);
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(playersArray.map((eachPlayer) => snakeToCamel(eachPlayer)));
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;

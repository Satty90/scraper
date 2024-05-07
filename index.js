import * as cheerio from "cheerio";
import axios from "axios";
import fs from "fs";

const LEAGUE_PLAYERS = [];

const fetchHTML = async (url) => {
  const { data } = await axios.get(url);
  return data;
};

async function getPremierLeagueClubs() {
  const url = "https://www.premierleague.com/clubs";
  const clubRef = [];
  const $ = cheerio.load(await fetchHTML(url));
  $(".club-card-wrapper").each((i, el) => {
    const clubHref = $(el).find("a.club-card").attr("href");
    let clubId = clubHref.split("/");
    clubId.pop();

    clubRef.push(clubId.join("/"));
  });

  return clubRef;
}

function getClubPlayersFromURL(html) {
  const $ = cheerio.load(html);
  const team = $(".club-header__team-name").text();
  console.log(`Processing club ${team}...`);

  const clubPlayers = [];
  const cards = $(".stats-card");
  cards.each((i, el) => {
    const firstName = $(el).find(".stats-card__player-first").text();
    const lastName = $(el).find(".stats-card__player-last").text();
    const position = $(el).find(".stats-card__player-position").text();
    const kitNumber = $(el)
      .find(".stats-card__position-container .stats-card__squad-number")
      .text();
    const nationality = $(el).find(".stats-card__player-country").text();
    const has_error = $(el).find("img.statCardImg").data("error") == true;
    const playerId = !has_error
      ? $(el).find("img.statCardImg").prop("data-player")
      : "Photo-Missing";

    // TODO: Download image here

    clubPlayers.push({
      first_name: firstName,
      last_name: lastName,
      position: position,
      kit_number: kitNumber,
      nationality: nationality,
      image: `${playerId}.png`,
      team: team,
    });
  });

  return clubPlayers;
}

async function fetchPremierLeague() {
  const CLUB_IDS = await getPremierLeagueClubs();
  for (const clubReference of CLUB_IDS) {
    console.log(clubReference);
    const url = `https://www.premierleague.com/${clubReference}/squad?se=578`;

    const html = await fetchHTML(url);
    const getClubPlayers = getClubPlayersFromURL(html);
    LEAGUE_PLAYERS.push(...getClubPlayers);
  }
}

await fetchPremierLeague();

fs.writeFileSync(
  "premierLeaguePlayers.json",
  JSON.stringify(LEAGUE_PLAYERS, null, 2)
);

// scripts/update_congress_control.js
// Node 18+ (GitHub Actions uses this)
// Fetches official party counts and updates congress-control.json

const fs = require("fs");

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "unoppress-bot/1.0 (+github-actions)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

function pickInt(label, text) {
  // Matches e.g. "Republicans 218" "Democrats 214" "Independents 0" "Vacancies 3"
  const re = new RegExp(`${label}\\s+(\\d+)`, "i");
  const m = text.match(re);
  if (!m) throw new Error(`Could not parse "${label}" from source`);
  return parseInt(m[1], 10);
}

(async () => {
  // OFFICIAL SOURCES
  const HOUSE_URL = "https://clerk.house.gov/";
  const SENATE_URL = "https://www.senate.gov/senators/";

  const houseHtml = await fetchText(HOUSE_URL);
  const senateHtml = await fetchText(SENATE_URL);

  // House (Clerk prints these directly)
  const houseRep = pickInt("Republicans", houseHtml);
  const houseDem = pickInt("Democrats", houseHtml);
  const houseInd = pickInt("Independents", houseHtml);
  const houseVac = pickInt("Vacancies", houseHtml);

  // Senate (Senate.gov prints Party Division)
  // Lines appear like:
  // "Majority Party: Republicans (53 seats)"
  // "Minority Party: Democrats (45 seats)"
  // "Other Parties: Independents (2 seats)"
  const senRepMatch = senateHtml.match(/Republicans\s*\((\d+)\s*seats\)/i);
  const senDemMatch = senateHtml.match(/Democrats\s*\((\d+)\s*seats\)/i);
  const senIndMatch = senateHtml.match(/Independents\s*\((\d+)\s*seats\)/i);

  if (!senRepMatch || !senDemMatch || !senIndMatch) {
    throw new Error("Could not parse Senate party division from senate.gov page");
  }

  const senRep = parseInt(senRepMatch[1], 10);
  const senDem = parseInt(senDemMatch[1], 10);
  const senInd = parseInt(senIndMatch[1], 10);

  // Build output
  const today = new Date().toISOString().slice(0, 10);

  const out = {
    updated_at: today,
    house: {
      dem: houseDem,
      rep: houseRep,
      ind: houseInd,
      vacancies: houseVac,
      total: 435,
    },
    senate: {
      dem: senDem,
      rep: senRep,
      ind: senInd,
      total: 100,
    },
    sources: {
      house: HOUSE_URL,
      senate: SENATE_URL,
    },
  };

  fs.writeFileSync("congress-control.json", JSON.stringify(out, null, 2) + "\n");
  console.log("Updated congress-control.json:", out);
})();

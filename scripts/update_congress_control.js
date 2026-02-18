const https = require("https");
const fs = require("fs");

const HOUSE_URL = "https://www.house.gov/representatives";
const SENATE_URL = "https://www.senate.gov/senators/index.htm";

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function countMatches(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

(async () => {
  try {
    const houseHTML = await fetch(HOUSE_URL);
    const senateHTML = await fetch(SENATE_URL);

    const houseDem = countMatches(houseHTML, /Democrat/gi);
    const houseRep = countMatches(houseHTML, /Republican/gi);

    const senateDem = countMatches(senateHTML, /Democrat/gi);
    const senateRep = countMatches(senateHTML, /Republican/gi);
    const senateInd = countMatches(senateHTML, /Independent/gi);

    const result = {
      updated_at: new Date().toISOString(),
      house: {
        dem: houseDem,
        rep: houseRep,
        ind: 0,
        total: 435
      },
      senate: {
        dem: senateDem,
        rep: senateRep,
        ind: senateInd,
        total: 100
      }
    };

    fs.writeFileSync("congress-control.json", JSON.stringify(result, null, 2));
    console.log("Congress control updated successfully.");

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

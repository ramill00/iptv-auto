const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

puppeteer.use(StealthPlugin());

const CHANNELS = [
  { name: "Pink TV", url: "https://www.jagledam.com/Pink-1-uzivo-stream" },
  // You can add more later like:
  // { name: "RTS 1", url: "https://www.jagledam.com/RTS-1-uzivo-stream" }
];

async function scrapeChannel(channel) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  let streamUrl = null;

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes(".m3u8") && !streamUrl) {
      streamUrl = url;
      console.log(`🎯 ${channel.name}: ${url}`);
    }
  });

  try {
    await page.goto(channel.url, {
      waitUntil: "networkidle2",
      timeout: 90000
    });

    await page.waitForTimeout(20000); // let player load

    await browser.close();

    if (streamUrl) {
      return { name: channel.name, url: streamUrl };
    } else {
      console.log(`❌ No stream found for ${channel.name}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ Error for ${channel.name}:`, err.message);
    await browser.close();
    return null;
  }
}

(async () => {
  const result = [];

  for (const channel of CHANNELS) {
    const data = await scrapeChannel(channel);
    if (data) result.push(data);
  }

  fs.writeFileSync("channels.json", JSON.stringify({ channels: result }, null, 2));
  console.log("✅ Saved to channels.json");
})();

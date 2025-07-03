const { google } = require("googleapis");
const readline = require("readline");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Generate the URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // 🔁 gets refresh token
  scope: ["https://www.googleapis.com/auth/calendar"],
});

console.log("🔗 Authorize this app by visiting this URL:\n", authUrl);

// Step 2: Prompt user for code from browser
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\n📥 Enter the code from that page here: ", async (code) => {
  rl.close();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\nYour refresh token is:\n", tokens.refresh_token);
  } catch (err) {
    console.error("Error retrieving access token", err.message);
  }
});

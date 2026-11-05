const { google } = require("googleapis");

let _cachedClient = null;

async function getAuthClient() {
  if (_cachedClient) return _cachedClient;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
      project_id: process.env.GOOGLE_PROJECT_ID,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  _cachedClient = await auth.getClient();
  return _cachedClient;
}

async function getDriveClient() {
  const client = await getAuthClient();
  return google.drive({ version: "v3", auth: client });
}

async function getSheetsClient() {
  const client = await getAuthClient();
  return google.sheets({ version: "v4", auth: client });
}

module.exports = { getAuthClient, getDriveClient, getSheetsClient };
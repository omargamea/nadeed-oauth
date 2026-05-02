export default async function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;

  if (!clientId) {
    res.status(500).send("Missing OAUTH_GITHUB_CLIENT_ID");
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const origin = `${protocol}://${host}`;

  const siteId = req.query.site_id || "nadeed.vercel.app";
  const provider = req.query.provider || "github";

  const state = Buffer.from(
    JSON.stringify({
      provider,
      site_id: siteId
    })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/callback`,
    scope: "repo,user",
    state
  });

  res.writeHead(302, {
    Location: `https://github.com/login/oauth/authorize?${params.toString()}`
  });

  res.end();
}

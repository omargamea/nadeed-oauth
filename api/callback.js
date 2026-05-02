export default async function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const code = req.query.code;

  if (!clientId || !clientSecret) {
    res.status(500).send("Missing GitHub OAuth environment variables");
    return;
  }

  if (!code) {
    res.status(400).send("Missing OAuth code");
    return;
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      res.status(401).send("GitHub OAuth failed: " + JSON.stringify(tokenData));
      return;
    }

    const messageWithProvider = "authorization:github:success:" + JSON.stringify({
      token: tokenData.access_token,
      provider: "github"
    });

    const messageTokenOnly = "authorization:github:success:" + JSON.stringify({
      token: tokenData.access_token
    });

    const lt = String.fromCharCode(60);
    const gt = String.fromCharCode(62);

    const html = [
      `${lt}!doctype html${gt}`,
      `${lt}html${gt}`,
      `${lt}head${gt}`,
      `${lt}meta charset="utf-8" /${gt}`,
      `${lt}title${gt}NADEED OAuth${lt}/title${gt}`,
      `${lt}/head${gt}`,
      `${lt}body${gt}`,
      `${lt}p id="status"${gt}Authentication completed. Sending login to NADEED CMS...${lt}/p${gt}`,
      `${lt}script${gt}`,
      `(function () {`,
      `  var messageWithProvider = ${JSON.stringify(messageWithProvider)};`,
      `  var messageTokenOnly = ${JSON.stringify(messageTokenOnly)};`,
      `  var statusEl = document.getElementById("status");`,
      `  var attempts = 0;`,
      ``,
      `  function setStatus(text) {`,
      `    if (statusEl) {`,
      `      statusEl.textContent = text;`,
      `    }`,
      `  }`,
      ``,
      `  function sendAll() {`,
      `    if (!window.opener) {`,
      `      setStatus("Authentication completed, but the CMS window was not found. Close this window and open /admin again.");`,
      `      return;`,
      `    }`,
      ``,
      `    try {`,
      `      window.opener.postMessage(messageWithProvider, "*");`,
      `      window.opener.postMessage(messageTokenOnly, "*");`,
      `      window.opener.postMessage("authorizing:github", "*");`,
      `      setStatus("Authentication sent to NADEED CMS. If the dashboard opens, close this window.");`,
      `    } catch (error) {`,
      `      setStatus("Authentication completed, but sending the login message failed.");`,
      `    }`,
      `  }`,
      ``,
      `  function loop() {`,
      `    attempts = attempts + 1;`,
      `    sendAll();`,
      `    if (attempts < 30) {`,
      `      setTimeout(loop, 300);`,
      `    } else {`,
      `      setStatus("Authentication was sent. If NADEED CMS did not open, close this window and try Login again.");`,
      `    }`,
      `  }`,
      ``,
      `  window.addEventListener("message", function () {`,
      `    sendAll();`,
      `  }, false);`,
      ``,
      `  loop();`,
      `})();`,
      `${lt}/script${gt}`,
      `${lt}/body${gt}`,
      `${lt}/html${gt}`
    ].join("\n");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send("OAuth callback error: " + error.message);
  }
}

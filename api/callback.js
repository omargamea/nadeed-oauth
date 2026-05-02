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

    const message = "authorization:github:success:" + JSON.stringify({
      token: tokenData.access_token,
      provider: "github"
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
      `${lt}p id="status"${gt}Authentication completed. Returning to NADEED CMS...${lt}/p${gt}`,
      `${lt}script${gt}`,
      `(function () {`,
      `  var message = ${JSON.stringify(message)};`,
      `  var statusEl = document.getElementById("status");`,
      ``,
      `  function setStatus(text) {`,
      `    if (statusEl) {`,
      `      statusEl.textContent = text;`,
      `    }`,
      `  }`,
      ``,
      `  function sendMessage(origin) {`,
      `    if (!window.opener) {`,
      `      setStatus("Authentication completed, but the CMS window was not found. Close this window and open /admin again.");`,
      `      return false;`,
      `    }`,
      ``,
      `    try {`,
      `      window.opener.postMessage(message, origin || "*");`,
      `      return true;`,
      `    } catch (error) {`,
      `      try {`,
      `        window.opener.postMessage(message, "*");`,
      `        return true;`,
      `      } catch (innerError) {`,
      `        return false;`,
      `      }`,
      `    }`,
      `  }`,
      ``,
      `  window.addEventListener("message", function (event) {`,
      `    var origin = "*";`,
      `    if (event) {`,
      `      if (event.origin) {`,
      `        origin = event.origin;`,
      `      }`,
      `    }`,
      `    sendMessage(origin);`,
      `    setStatus("Authentication sent to NADEED CMS. Closing...");`,
      `    setTimeout(function () { window.close(); }, 800);`,
      `  }, false);`,
      ``,
      `  if (window.opener) {`,
      `    window.opener.postMessage("authorizing:github", "*");`,
      `    setStatus("Authentication completed. Waiting for NADEED CMS...");`,
      `  } else {`,
      `    setStatus("Authentication completed, but this window was not opened by NADEED CMS.");`,
      `  }`,
      ``,
      `  setTimeout(function () {`,
      `    sendMessage("*");`,
      `  }, 1000);`,
      ``,
      `  setTimeout(function () {`,
      `    sendMessage("*");`,
      `  }, 2000);`,
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


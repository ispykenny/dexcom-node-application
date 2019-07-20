const express = require("express");
const router = express.Router();
require("dotenv/config");
let qs = require("querystring");
let http = require("https");
let clientid = process.env.CLIENT_ID;
let clientsecret = process.env.CLIENT_SECRET;


router.get("/", (req, res, next) => {
  let refreshtoken = req.query.refreshtoken;

  let options = {
    method: "POST",
    hostname: "api.dexcom.com",
    port: null,
    path: "/v2/oauth2/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache"
    }
  };

  let requ = http.request(options, ress => {
    let chunks = [];

    ress.on("data", chunk => {
      chunks.push(chunk);
    });

    ress.on("end", () => {
      let body = Buffer.concat(chunks);
      let accessToken = JSON.parse(body.toString()).access_token;
      let refreshToken = JSON.parse(body.toString()).refresh_token;
      res.redirect(
        `/is_loggedin?authUser=${accessToken}&refreshtoken=${refreshToken}`
      );
    });
  });

  requ.write(
    qs.stringify({
      client_secret: clientsecret,
      client_id: clientid,
      refresh_token: refreshtoken,
      grant_type: "refresh_token",
      redirect_uri: "https://dex-hub.herokuapp.com/code"
    })
  );

  requ.end();
});

module.exports = router;
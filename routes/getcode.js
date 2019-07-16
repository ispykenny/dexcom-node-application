const express = require("express");
const router = express.Router();
require("dotenv/config");
let qs = require("querystring");
let http = require("https");
let clientid = process.env.CLIENT_ID;
let clientsecret = process.env.CLIENT_SECRET;


router.get("/", (req, res, next) => {
  console.log(req.query.code);
  let responseCode = req.query.code;
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

    ress.on("data", function(chunk) {
      chunks.push(chunk);
    });

    ress.on("end", () => {
      let body = Buffer.concat(chunks);
      console.log("here", JSON.parse(body.toString()));
      let accessToken = JSON.parse(body.toString()).access_token;
      let refreshToken = JSON.parse(body.toString()).refresh_token;
      res.redirect(
        `/access_token?accesstoken=${accessToken}&refreshtoken=${refreshToken}`
      );
    });
  });

  requ.write(
    qs.stringify({
      client_secret: clientsecret,
      client_id: clientid,
      code: responseCode,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:5000/code"
    })
  );
  requ.end();
});


module.exports = router;
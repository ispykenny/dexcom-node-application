// https://developer.dexcom.com/

require("dotenv/config");
let axios = require("axios");
const express = require("express");
const app = express();
let PORT = 5000 || process.env.PORT;
let qs = require("querystring");
let http = require("https");
let moment = require("moment");
let currentDate;
let currentTime;
let getCurrentEl;
let clientid = process.env.CLIENT_ID;
let clientsecret = process.env.CLIENT_SECRET;
let hypoRisk = "";
let lowsugar;
let highsugar;
let median;

app.set("view engine", "ejs");

app.get("/", (req, res, next) => {
  console.log("here");
  res.render("pages/index");
});

app.get("/code", (req, res, next) => {
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

app.get("/access_token", (req, res, next) => {
  let accesstoken = req.query.accesstoken;
  let refreshtoken = req.query.refreshtoken;
  console.log(
    "access-token: ",
    req.query.accesstoken + "refresh-token: " + req.query.refreshtoken
  );
  let previousDate = moment()
    .subtract(30, "days")
    .format("Y-MM-DDT");
  currentDate = moment().format("Y-MM-DDT");
  currentTime = moment()
    .add(4, "hours")
    .format("kk:mm:ss");
  let stringUrl =
    "/v2/users/self/egvs?startDate=" + previousDate + currentTime + "&endDate=";

  getCurrentEl = `${stringUrl}${currentDate}${currentTime}`;

  let optionss = {
    method: "POST",
    hostname: "api.dexcom.com",
    port: null,
    path: "/v2/users/self/statistics?startDate=2019-07-01&endDate=2019-07-15",
    headers: {
      authorization: `Bearer ${accesstoken}`,
      "content-type": "application/json"
    }
  };

  let areq = http.request(optionss, raseq => {
    let chunkes = [];

    raseq.on("data", chunk => {
      chunkes.push(chunk);
    });

    raseq.on("end", () => {
      // averages
      let bodye = Buffer.concat(chunkes);
      hypoRisk = JSON.parse(bodye.toString()).hypoglycemiaRisk;
      lowsugar = JSON.parse(bodye.toString()).min;
      highsugar = JSON.parse(bodye.toString()).max;
      median = JSON.parse(bodye.toString()).median;
      console.log(JSON.parse(bodye.toString()));
    });
  });

  areq.write(
    JSON.stringify({
      targetRanges: [
        {
          name: "day",
          startTime: "06:00:00",
          endTime: "22:00:00",
          egvRanges: [
            { name: "urgentLow", bound: 55 },
            { name: "low", bound: 70 },
            { name: "high", bound: 180 }
          ]
        },
        {
          name: "night",
          startTime: "22:00:00",
          endTime: "06:00:00",
          egvRanges: [
            { name: "urgentLow", bound: 55 },
            { name: "low", bound: 80 },
            { name: "high", bound: 200 }
          ]
        }
      ]
    })
  );
  areq.end();

  let options = {
    method: "GET",
    hostname: "api.dexcom.com",
    port: null,
    path: `${getCurrentEl}`,
    headers: {
      authorization: `Bearer ${accesstoken}`
    }
  };

  let requ = http.request(options, ress => {
    let chunks = [];

    ress.on("data", chunk => {
      chunks.push(chunk);
    });

    ress.on("end", () => {
      let body = Buffer.concat(chunks);
      console.log(ress.statusCode);
      console.log(currentTime);
      console.log("YAY", hypoRisk);
      if (ress.statusCode === 200) {
        let readingValueds = [];

        let readings = JSON.parse(body.toString()).egvs;
        for (let i = 0; i < readings.length; i++) {
          readingValueds.push(readings[i].value);
        }

        // get average reading
        let average =
          readingValueds.reduce((a, b) => a + b, 0) / readingValueds.length;

        // render to page
        res.render("pages/page", {
          values: JSON.parse(body.toString()),
          lowsugar: lowsugar,
          highsugar: highsugar,
          sugarsum: median,
          hyporisk: hypoRisk
        });
      } else {
        res.redirect(`/refresh?refreshtoken=${refreshtoken}`);
      }
    });
  });

  requ.end();
});

app.get("/refresh", (req, res, next) => {
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
      console.log("it worked!!");
      let body = Buffer.concat(chunks);
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
      refresh_token: refreshtoken,
      grant_type: "refresh_token",
      redirect_uri: "http://localhost:5000/code"
    })
  );

  requ.end();
});

app.listen(PORT, () => {
  console.log(`listening on port number: ${PORT}`);
});

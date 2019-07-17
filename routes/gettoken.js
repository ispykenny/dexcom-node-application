require("dotenv/config");
const express = require("express");
const router = express.Router();
let http = require("https");
let moment = require("moment");

let hypoRisk = "";
let lowsugar = "";
let highsugar = "";
let median = "";
let currentDate;
let currentTime = "";
let getCurrentEl = "";

router.get("/", (req, res, next) => {
  
  let accesstoken = req.query.accesstoken;
  let refreshtoken = req.query.refreshtoken;
  console.log(
    "access-token: ",
    req.query.accesstoken + "refresh-token: " + req.query.refreshtoken
  );
  let ogdates = moment().format("Y-MM-DD");
  let olderDates = moment().subtract(1, 'days').format("Y-MM-DD")
  console.log(`/v2/users/self/statistics?startDate=${olderDates}&endDate=${ogdates}`)
  let previousDate = moment()
    .subtract(24, "hours")
    .format("Y-MM-DDT");
  currentDate = moment().format("Y-MM-DDT");
  currentTime = moment().format("kk:mm:ss");
  console.log(currentTime)
  let stringUrl =
    "/v2/users/self/egvs?startDate=" + previousDate + currentTime + "&endDate=";

  getCurrentEl = `${stringUrl}${currentDate}${currentTime}`;

  let optionss = {
    method: "POST",
    hostname: "api.dexcom.com",
    port: null,
    path: `/v2/users/self/statistics?startDate=${olderDates}&endDate=${ogdates}`,
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

      if (ress.statusCode === 200) {

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

module.exports = router;
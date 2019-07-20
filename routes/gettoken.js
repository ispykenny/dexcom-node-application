require("dotenv/config");
const express = require("express");
const router = express.Router();
let http = require("https");
let moment = require("moment");

let hypoRisk = "";
let lowsugar = "";
let highsugar = "";
let mediane = "";
let currentDate;
let currentTime = "";
let getCurrentEl = "";
let daysViewing = "";
let belowRange = "";
let inRange = "";
let aboveRange = "";
let estA1c = "";
let cleanA1c = "";
router.get("/", (req, res, next) => {
  let accesstoken = req.query.authUser;
  let refreshtoken = req.query.refreshtoken;
  let dateRequested = req.query.startDate;
  let dates;

  if(dateRequested) {
    dates = dateRequested
  } else {
    dates = 1;
  }

  if(dateRequested <= 1) {
    daysViewing = "You are viewing the past day"
  } else if(dateRequested >= 1) {
    daysViewing = `You are viewing the past ${dateRequested} days`
  }
  
  // console.log(
  //   "access-token: ",
  //   req.query.accesstoken + "refresh-token: " + req.query.refreshtoken
  // );

  let ogdates = moment().format("Y-MM-DD");
  let olderDates = moment().subtract(dates, 'days').format("Y-MM-DD")
  let previousDate = moment().subtract(dates, "days").format("Y-MM-DDT");
  currentDate = moment().format("Y-MM-DDT");
  currentTime = moment().format("kk:mm:ss");
  let stringUrl =  "/v2/users/self/egvs?startDate=" + previousDate + currentTime + "&endDate=";

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
      
      let bodye = Buffer.concat(chunkes);
      // console.log(JSON.parse(bodye.toString()))
      const {hypoglycemiaRisk, min, max, median , percentBelowRange, percentWithinRange, percentAboveRange} = JSON.parse(bodye.toString())
     
      // total values
      hypoRisk = hypoglycemiaRisk != null ? hypoglycemiaRisk  : "not available";
      lowsugar = min;
      highsugar = max;
      mediane = median;
      belowRange = percentBelowRange.toFixed(1)+'%';
      inRange =  percentWithinRange.toFixed(1)+'%';
      aboveRange = percentAboveRange.toFixed(1)+'%';
      estA1c =  (46.7 + mediane) / 28.7
      cleanA1c = estA1c.toFixed(1)
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
        console.log(lowsugar, highsugar,mediane,hypoRisk)
        // render to page
        res.render("pages/page", {
          values: JSON.parse(body.toString()),
          lowsugar: lowsugar,
          highsugar: highsugar,
          sugarsum: mediane,
          daysViewingEl: daysViewing,
          hyporisk: hypoRisk,
          belowRange: belowRange,
          inRange: inRange,
          aboveRange: aboveRange,
          estA1c: cleanA1c
        });
      } else {
        res.redirect(`/refresh?refreshtoken=${refreshtoken}`);
      }
    });
  });

  requ.end();
});

module.exports = router;
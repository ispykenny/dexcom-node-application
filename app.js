// https://developer.dexcom.com/
const express = require("express");
const app = express();
const PORT =  process.env.PORT || 5000;
const codeRoute = require('./routes/getcode');
const getToken = require('./routes/gettoken');
const getRefresh = require('./routes/refreshtoken');


app.set("view engine", "ejs");
app.get("/", (req, res, next) => {
  res.render("pages/index");
});
app.use('/code', codeRoute);
app.use('/access_token', getToken)
app.use('/refresh', getRefresh)
app.listen(PORT, () => {
  console.log(`listening on port number: ${PORT}`);
});

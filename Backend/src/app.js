const express = require("express");
const errorHandler   = require("./middleware/HandleError");
const app = express();
const path = require("path");
const router = require("./routes");
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.get("/", (req, res) => {
  res.send("api is runnning");
});

app.use("/api/v1", router);
app.use(errorHandler);

module.exports = app;

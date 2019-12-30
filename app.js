/** Cash App express application. */


const express = require("express");
const app = express();
const cors = require("cors");

const ExpressError = require("./expressError")
const usersRoutes = require("./routes/users");
const transactionsRoutes = require("./routes/transactions");
const authRoutes = require("./routes/auth");


app.use(express.json());
app.use(cors());
app.use("/users", usersRoutes);
app.use("/transactions", transactionsRoutes);
app.use("/", authRoutes);

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;

/** Routes for users. */


const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();


/** GET / => list of users.
 *
 * =>  {users: [{username, first_name, last_name, wallet, photo_url, bio},
 *              {username, first_name, last_name, wallet, photo_url, bio},
 *              ...]
 *     }
 * */

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
          `SELECT username, first_name, last_name, wallet, photo_url, bio
           FROM users 
           ORDER BY username`
    );

    return res.json({"users": result.rows});
  }

  catch (err) {
    return next(err);
  }
});


/** GET /[username] => detail on company
 *
 * =>  {user: {username,
 *             first_name,
 *             last_name,
 *             wallet,
 *             photo_url,
 *             bio,
 *             invoices: [id, ...]}}
 *
 * */

router.get("/:username", async function (req, res, next) {
  try {
    let username = req.params.username;

    const userResult = await db.query(
      `SELECT username, first_name, last_name, wallet, photo_url, bio
        FROM users
        WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      throw new ExpressError(`No such user: ${username}`, 404)
    }

    const receivedResult = await db.query(
      `SELECT id, sender, receiver, amt, paid_date
        FROM transactions
        WHERE receiver = $1`,
      [username]
    );

    const sentResult = await db.query(
      `SELECT id, sender, receiver, amt, paid_date
       FROM transactions
       WHERE sender = $1`,
      [username]
    );

    const user = userResult.rows[0];
    const receivedPayments = receivedResult.rows;
    const sentPayments = sentResult.rows;

    user.received_payments = receivedPayments.map(trns => {
      return {
        id: trns.id,
        sender: trns.sender,
        receiver: trns.receiver,
        amt: trns.amt,
        paid_date: trns.paid_date
      }
    });
    user.sent_payments = sentPayments.map(trns => {
      return {
        id: trns.id,
        sender: trns.sender,
        receiver: trns.receiver,
        amt: trns.amt,
        paid_date: trns.paid_date
      }
    });

    return res.json({"user": user});
  }

  catch (err) {
    return next(err);
  }
});


/** POST / => add new company
 *
 * {name, descrip}  =>  {company: {username, name, descrip}}
 *
 * */

router.post("/", async function (req, res, next) {
  try {
    let {username, first_name, last_name} = req.body;
    let lowerUsername = username.toLowercase();

    const result = await db.query(
          `INSERT INTO users (username, first_name, last_name) 
           VALUES ($1, $2, $3) 
           RETURNING username, first_name, last_name`,
        [lowerUsername, first_name, last_name]);

    return res.status(201).json({"user": result.rows[0]});
  }

  catch (err) {
    return next(err);
  }
});


/** PUT /[username] => update user
 *
 * {first_name, last_name}  =>  {user: {username, first_name, last_name}}
 *
 * */

router.put("/:username", async function (req, res, next) {
  try {
    let {username, first_name, last_name} = req.body;

    const result = await db.query(
          `UPDATE users
           SET first_name=$1, last_name=$2
           WHERE username = $3
           RETURNING username, first_name, last_name`,
        [first_name, last_name, username]);

    if (result.rows.length === 0) {
      throw new ExpressError(`No such user: ${username}`, 404)
    } else {
      return res.json({"user": result.rows[0]});
    }
  }

  catch (err) {
    return next(err);
  }

});


/** DELETE /[username] => delete user
 *
 * => {status: "deleted"}
 *
 */

router.delete("/:username", async function (req, res, next) {
  try {
    let username = req.params.username;

    const result = await db.query(
          `DELETE FROM users
           WHERE username=$1
           RETURNING username`,
        [username]);

    if (result.rows.length == 0) {
      throw new ExpressError(`No such user: ${username}`, 404)
    } else {
      return res.json({"status": "deleted"});
    }
  }

  catch (err) {
    return next(err);
  }
});


module.exports = router;
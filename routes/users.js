/** Routes for users. */

const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError")
const db = require("../db");

const { ensureCorrectUser, authRequired } = require("../middleware/auth");

const User = require("../models/user");
const jsonschema = require('jsonschema');

const usersSchema = require("../schemas/usersSchema");

const createToken = require("../helpers/createToken");



/** GET / => list of users.
 *
 * =>  {users: [{username, first_name, last_name, wallet, photo_url, bio},
 *              {username, first_name, last_name, wallet, photo_url, bio},
 *              ...]
 *     }
 * */

router.get("/", authRequired, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
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

router.get("/:username", authRequired, async function (req, res, next) {
  try {
    const user = await User.findOne(req.params.username);
    return res.json({ user });
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
  delete req.body._token;
  const validUser = jsonschema.validate(req.body, usersSchema)
  if (!validUser.valid) {
    let listOfErrors = validUser.errors.map(error => error.stack);
    let error = new ExpressError(listOfErrors, 400);
    return next(error)
  }
  try {
    const newUser = await User.register(req.body);
    const token = createToken(newUser);
    return res.status(201).json({ token });
  }
  catch (e) {
    return next(e);
  }
});


/** PATCH /[handle] {userData} => {user: updatedUser} */

router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
  try {
    if ("username" in req.body || "is_admin" in req.body || "wallet" in req.body) {
      return next({ status: 400, message: "Not allowed" });
    }

    // const validation = validate(req.body, userUpdateSchema);
    // if (!validation.valid) {
    //   return next({
    //     status:400,
    //     message: validation.errors.map(e => e.stack)
    //   });
    // }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
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

router.delete("/:username", ensureCorrectUser, async function (req, res, next) {
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
      return res.json({ "status": "deleted" });
    }
  }

  catch (err) {
    return next(err);
  }
});


module.exports = router;
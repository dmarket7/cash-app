const db = require("../db");
const bcrypt = require("bcrypt");
const partialUpdate = require("../helpers/partialUpdate");

const BCRYPT_WORK_FACTOR = 10;


/** Related functions for users. */

class User {

  /** authenticate user with username, password. Returns user or throws err. */

  static async authenticate(data) {
    // try to find the user first
    const result = await db.query(
        `SELECT username, 
                password, 
                first_name, 
                last_name, 
                is_admin
          FROM users 
          WHERE username = $1`,
        [data.username]
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(data.password, user.password);
      if (isValid) {
        return user;
      }
    }

    const invalidPass = new Error("Invalid Credentials");
    invalidPass.status = 401;
    throw invalidPass;
  }

  /** Register user with data. Returns new user data. */

  static async register(data) {
    const duplicateCheck = await db.query(
        `SELECT username 
            FROM users 
            WHERE username = $1`,
        [data.username]
    );

    if (duplicateCheck.rows[0]) {
      const err = new Error(
          `There already exists a user with username '${data.username}`);
      err.status = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
        `INSERT INTO users 
            (username, password, first_name, last_name) 
          VALUES ($1, $2, $3, $4) 
          RETURNING username, password, first_name, last_name, wallet, photo_url`,
        [
          data.username,
          hashedPassword,
          data.first_name,
          data.last_name
        ]);

    return result.rows[0];
  }

  /** Find all users. */

  static async findAll() {
    const result = await db.query(
        `SELECT username, first_name, last_name
          FROM users
          ORDER BY username`);

    return result.rows;
  }

  /** Given a username, return data about user. */

  static async findOne(username) {
    const userRes = await db.query(
        `SELECT username, first_name, last_name, wallet, photo_url, bio 
            FROM users 
            WHERE username = $1`,
        [username]);

    const user = userRes.rows[0];

    if (!user) {
      const error = new Error(`There exists no user '${username}'`);
      error.status = 404;   // 404 NOT FOUND
      throw error;
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

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Return data for changed user.
   *
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    let {query, values} = partialUpdate(
        "users",
        data,
        "username",
        username
    );

    const result = await db.query(query, values);
    const user = result.rows[0];

    if (!user) {
      let notFound = new Error(`There exists no user '${username}`);
      notFound.status = 404;
      throw notFound;
    }

    delete user.password;
    delete user.is_admin;

    return result.rows[0];
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
      let result = await db.query(
              `DELETE FROM users 
                WHERE username = $1
                RETURNING username`,
              [username]);

    if (result.rows.length === 0) {
      let notFound = new Error(`There exists no user '${username}'`);
      notFound.status = 404;
      throw notFound;
    }
  }
}


module.exports = User;

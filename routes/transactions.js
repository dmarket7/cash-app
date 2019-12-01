/** Routes for transactions. */


const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();


/** GET / => list of transactions.
 *
 * =>  {transactions: [{id, sender, receiver, amt, paid_date}, ...]}
 *
 * */

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, sender, receiver, amt, paid_date
           FROM transactions 
           ORDER BY id`
    );

    return res.json({ "transactions": result.rows });
  }

  catch (err) {
    return next(err);
  }
});


/** GET /[id] => detail on invoice
 *
 * =>  {transaction: {id,
 *                    sender,
 *                    receiver,
 *                    amt,
 *                    paid_date
 *                   }
 *     }
 * */

router.get("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;

    const result = await db.query(
      `SELECT id, 
              sender,
              receiver, 
              amt, 
              paid_date
      FROM transactions
      WHERE id = $1`,
      [id]);

    if (result.rows.length === 0) {
      throw new ExpressError(`No such transaction: ${id}`, 404);
    }

    const data = result.rows[0];
    const transaction = {
      id: data.id,
      sender: data.sender,
      receiver: data.receiver,
      amt: data.amt,
      paid_date: data.paid_date
    };

    return res.json({ "transaction": transaction });
  }

  catch (err) {
    return next(err);
  }
});


/** POST / => add new transaction
 *
 * {sender, receiver, amt}  =>  {id, sender, receiver, amt, paid_date}
 *
 * */

router.post("/", async function (req, res, next) {
  try {
    let { sender, receiver, amt } = req.body;

    const senderQuery = await db.query(
      `SELECT username, first_name, last_name, wallet
       FROM users 
       WHERE username = $1`,
      [sender]
    );

    const receiverQuery = await db.query(
      `SELECT username, first_name, last_name, wallet
       FROM users 
       WHERE username = $1`,
      [receiver]
    );

    if (senderQuery.rows.length === 0) {
      throw new ExpressError(`Sender does not exist: ${sender}`, 404)
    }
    if (receiverQuery.rows.length === 0) {
      throw new ExpressError(`Receiver does not exist: ${receiver}`, 404)
    }
    if (senderQuery.rows[0].wallet < amt) {
      throw new ExpressError(`Sorry not enough funds for user: ${sender}`, 404);
    }

    const newSenderWallet = senderQuery.rows[0].wallet - amt;
    const newReceiverWallet = receiverQuery.rows[0].wallet + amt;

    const updateSender = await db.query(
      `UPDATE users
        SET wallet=$1
        WHERE username = $2
        RETURNING username, first_name, last_name, wallet`,
      [newSenderWallet, sender]);

    const updateReceiver = await db.query(
      `UPDATE users
        SET wallet=$1
        WHERE username = $2
        RETURNING username, first_name, last_name, wallet`,
      [newReceiverWallet, receiver]);

    const result = await db.query(
      `INSERT INTO transactions (sender, receiver, amt) 
           VALUES ($1, $2, $3) 
           RETURNING id, sender, receiver, amt, paid_date`,
      [sender, receiver, amt]);

    return res.json({ "transaction": result.rows[0],
                      "sender": updateSender.rows[0],
                      "receiver": updateReceiver.rows[0]
                    });
  }

  catch (err) {
    return next(err);
  }
});

module.exports = router;
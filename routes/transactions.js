/** Routes for transactions. */


const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

const router = new express.Router();

const { ensureCorrectUser, authRequired } = require("../middleware/auth");

const Transaction = require("../models/transaction");
const User = require("../models/user");


/** GET / => list of transactions.
 *
 * =>  {transactions: [{id, sender, receiver, amt, paid_date}, ...]}
 *
 * */

router.get("/", authRequired, async function (req, res, next) {
  try {
    const transactions = await Transaction.findAll();
    return res.json({ transactions });
  }

  catch (err) {
    return next(err);
  }
});


/** GET /[id] => detail on transaction
 *
 * =>  {transaction: {id,
 *                    sender,
 *                    receiver,
 *                    amt,
 *                    paid_date
 *                   }
 *     }
 * */

router.get("/:id", authRequired, async function (req, res, next) {
  try {
    let id = req.params.id;
    const transaction = await Transaction.findOne(id);
    return res.json({ transaction });
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

router.post("/", authRequired, async function (req, res, next) {
  try {
    let { sender, receiver, amt } = req.body;

    const senderQuery = await User.findOne(sender);
    const receiverQuery = await User.findOne(receiver);

    // Check for input errors
    if (sender === receiver) {
      throw new ExpressError(`Sorry you can't send funds to same user: ${sender}`, 404)
    }
    if (req.username !== sender) {
      throw new ExpressError(`Sorry you cannot send funds from another user's account.`, 404)
    }
    if (!senderQuery) {
      throw new ExpressError(`Sender does not exist: ${sender}`, 404)
    }
    if (!receiverQuery) {
      throw new ExpressError(`Receiver does not exist: ${receiver}`, 404)
    }
    if (senderQuery.wallet < amt) {
      throw new ExpressError(`Sorry not enough funds for user: ${sender}`, 404);
    }

    const newSenderWallet = parseFloat(senderQuery.wallet) - amt;
    const newReceiverWallet = parseFloat(receiverQuery.wallet) + amt;

    const updateSender = await User.update(sender, { wallet: newSenderWallet });
    const updateReceiver = await User.update(receiver, { wallet: newReceiverWallet });

    const transaction = await Transaction.create({ sender, receiver, amt });

    return res.json({
      transaction,
      "sender": updateSender,
      "receiver": updateReceiver
    });
  }

  catch (err) {
    return next(err);
  }
});

module.exports = router;
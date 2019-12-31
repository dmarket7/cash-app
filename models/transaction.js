const db = require("../db");

/** Related functions for transactions. */

class Transaction {

  /** Find all transactions (can filter on terms in data). */

  static async findAll() {
    const result = await db.query(
      `SELECT id, sender, receiver, amt, paid_date
           FROM transactions 
           ORDER BY id`
    );

    return result.rows;
  }

  /** Given a transaction id, return data about transaction. */

  static async findOne(id) {
    const result = await db.query(
        `SELECT id, sender, receiver, amt, paid_date 
             FROM transactions 
             WHERE id = $1`,
        [id]);

    const transaction = result.rows[0];

    if (!transaction) {
      const error = new Error(`There exists no transaction #${id}`);
      error.status = 404;   // 404 NOT FOUND
      throw error;
    }

    return transaction;
  }

  /** Create a transaction (from data), update db, return new transaction data. */

  static async create(data) {
    const result = await db.query(
      `INSERT INTO transactions (sender, receiver, amt) 
        VALUES ($1, $2, $3) 
        RETURNING id, sender, receiver, amt, paid_date`,
      [data.sender, data.receiver, data.amt]
    );

    return result.rows[0];
  }

}


module.exports = Transaction;
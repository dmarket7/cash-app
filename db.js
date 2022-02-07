/** Database setup for CashApp. */


const { Client } = require("pg");
const { DB_URI } = require("./config");

const client = new Client({
  connectionString: DB_URI,
  options: { 
    dialect: "postgres",
    native: true,
    ssl: true, 
    dialectOptions: {
      ssl: true
    }
  }
});

client.connect();


module.exports = client;
/** Database setup for CashApp. */


const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql:///cashapp"
});

client.connect();


module.exports = client;
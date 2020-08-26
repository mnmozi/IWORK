const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  user: "root",
  database: "play",
  password: "playpassword",
  port: 3306,
});

module.exports = pool.promise();

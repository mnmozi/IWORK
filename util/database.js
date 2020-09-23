const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST, // || "127.0.0.1",
  user: process.env.DATABASE_USER, // || "root",
  database: process.env.MYSQL_DATABASE, // || "play",
  password: process.env.MYSQL_ROOT_PASSWORD, // || "playpassword",
  port: process.env.MYSQL_PORT, // || 3306,
});

module.exports = pool.promise();

const mysql = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({

    connectionLimit: 100,
    host: process.env.HOST,
    user:process.env.DB_USER,
    password:process.env.PASSWORD,
    database: process.env.DATABASE,
});

module.exports = pool;
// index.js
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session"); // Added for session handling
const bcrypt = require("bcrypt"); // Added for password hashing

const app = express();
const path = require("path");

const port = 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: "admin",
    database: "test",
    port: 5432,
  },
});

app.get("/", (req, res) => {
  knex
    .select()
    .from("test")
    .then((test) => {
      res.render("displayTest", { myTest: test });
    });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

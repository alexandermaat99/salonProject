// index.js
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session"); // Added for session handling
const bcrypt = require("bcrypt"); // Added for password hashing

const app = express();
const path = require("path");

// Serve static files from the public folder

app.use(express.static("public", { extensions: false }));
app.use("/public", express.static(__dirname + "/public"));

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(
  session({
    secret: "thisisthesecretkey", // Replace with your own secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Use 'true' in a production environment with HTTPS
  })
);

// conect to database
const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "admin",
    database: process.env.RDS_DB_NAME || "testing",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

// Authentication middleware
function checkAuthentication(req, res, next) {
  console.log("Session data:", req.session); // Debugging line
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Admin check middleware
function checkAdmin(req, res, next) {
  console.log("Admin check for user ID:", req.session.userId); // Debugging line
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(403).send("Access denied");
  }
}

// dynamic port binding
const PORT = process.env.PORT || 3000;

// Route to render the index.ejs file
app.get("/", (req, res) => {
  res.render("index");
});

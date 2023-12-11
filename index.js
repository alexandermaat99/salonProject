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

//connect to database
const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: "admin",
    database: "salon2",
    port: 5432,
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
const PORT = 3000;

// Route to render the index.ejs file
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/testing", (req, res) => {
  res.render("testing");
});

// port response
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/login", (req, res) => {
  const error = "";
  res.render("login", { error }); // Render the login form
});

// POST login route
// POST login route modified for session handling
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  email = email.toUpperCase(); // Convert email to uppercase

  try {
    const user = await knex("stylists").where({ email }).first();

    if (!user) {
      // User not found
      const error = "Invalid credentials";
      return res.render("login", { error });
    }

    const passwordMatch = user.password === password;

    if (passwordMatch) {
      // Authentication successful
      req.session.userId = user.id;
      req.session.isAdmin = user.admin;

      if (user.admin) {
        // Redirect to admin.ejs for admin users
        return res.redirect("/admin");
      } else {
        // Redirect to user_home.ejs for non-admin users
        return res.redirect("/stylist");
      }
    } else {
      // Incorrect password
      const error = "Invalid credentials";
      return res.render("login", { error });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

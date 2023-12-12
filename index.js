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
    secret: "thisisthenewsecretkey", // Replace with your own secret
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

function checkAuthentication(req, res, next) {
  if (req.session && req.session.userId) {
    // User is authenticated
    next();
  } else {
    // User is not authenticated, redirect to login page
    res.redirect("/login");
  }
}

// Admin check middleware
function checkAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    // User is an admin
    next();
  } else {
    // User is not an admin, send access denied response
    res.status(403).send("Access denied");
  }
}

// dynamic port binding
const PORT = 3000;

// Route to render the index.ejs file
app.get("/", (req, res) => {
  res.render("index");
});

// app.get("/testing", (req, res) => {
//   res.render("testing");
// });

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

    const passwordMatch = user.password === password; // Replace this with bcrypt comparison if you're hashing passwords

    if (passwordMatch) {
      // Authentication successful
      req.session.userId = user.id;
      req.session.isAdmin = user.admin;

      // Save the session before redirecting
      req.session.save((err) => {
        if (err) {
          // Handle error
          console.error(err);
          res.status(500).send("Error saving session.");
        } else {
          // Redirect based on user role
          if (user.admin) {
            res.redirect("/admin");
          } else {
            res.redirect("/stylist");
          }
        }
      });
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

app.get("/admin", async (req, res) => {
  if (req.session.isAdmin) {
    try {
      const stylists = await knex.select("*").from("stylists");
      res.render("admin", { stylists: stylists });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching stylists");
    }
  } else {
    res.status(403).send("Access denied");
  }
});

app.post("/add-stylist", async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    await knex("stylists").insert({
      stylFName: firstName,
      stylLName: lastName,
    });
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding stylist");
  }
});

// Route to render the admin.ejs file
app.get("/testing", async (req, res) => {
  try {
    const stylists = await knex.select("*").from("stylists");
    const services = await knex.select("*").from("services");

    // Render the EJS template and pass the stylists and services data
    res.render("testing", { stylists: stylists, services: services });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

//form submission
app.post("/submit-form", async (req, res) => {
  try {
    // Begin transaction
    await knex.transaction(async (trx) => {
      // Extract styleID and servicesID from req.body
      const { styleID, servicesID } = req.body;

      // Insert into 'surveyResponse' table
      const [responseIdObject] = await trx("surveyResponse")
        .insert({
          cusFName: req.body.cusFName,
          cusLName: req.body.cusLName,
          cusEmail: req.body.cusEmail,
          cusTel: req.body.cusTel,
          dateLastServ: req.body.dateLastServ,
          timeCreated: new Date(),
          permColor: req.body.permColor,
          medCond: req.body.medCond,
          styleID: styleID, // Use extracted value
          servicesID: servicesID, // Use extracted value
        })
        .returning("resID");

      const resID = responseIdObject.resID; // Extract the integer value from the object

      // Insert into 'hairDescription_link' table for each selected hair description
      const selectedHair = req.body.hairDescription || [];
      for (const hairID of selectedHair) {
        await trx("hairDescription_link").insert({
          resID: resID, // This should now be an integer
          hairID: hairID,
        });
      }
    });

    // Send a success response
    res.send("Form submitted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing your request");
  }
});

app.post(
  "/deleteUser/:id",
  checkAuthentication,
  checkAdmin,

  async (req, res) => {
    try {
      await knex("stylists").where("styleID", req.params.id).del();
      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting user");
    }
  }
);

// Route to display the form for editing an existing stylist
app.get("/editUser/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const stylist = await knex("stylists").where("id", id).first();

    if (!stylist) {
      return res.status(404).send("Stylist not found");
    }

    res.render("edit-stylist", { stylist }); // You already have 'edit-stylist.ejs'
  } catch (error) {
    console.error("Failed to find stylist:", error);
    res.status(500).send("Failed to find stylist.");
  }
});

// Route to handle the updating of a stylist's information
app.post("/editUser/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, stylTel, password, admin } = req.body;

  try {
    await knex("stylists")
      .where("id", id)
      .update({
        stylFName: firstName,
        stylLName: lastName,
        email: email,
        stylTel: stylTel,
        password: password, // You should hash the password before saving
        admin: admin === "on", // or however you are determining admin status
      });

    res.redirect("/admin");
  } catch (error) {
    console.error("Failed to update stylist:", error);
    res.status(500).send("Failed to update stylist.");
  }
});
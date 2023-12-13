// index.js
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session"); // Added for session handling
const flash = require("connect-flash");
const bcrypt = require("bcrypt"); // Added for password hashing

const app = express();
const path = require("path");

// Serve static files from the public folder

app.use(express.static("public", { extensions: false }));
app.use("/public", express.static(__dirname + "/public"));
app.use(flash());

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
    password: "Ramsbasketball22",
    database: "salon2",
    port: 5432,
  },
});

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
    // User is not an admin, send access denied response
    res.status(403).send("Access denied");
  }
}

// dynamic port binding
const PORT = process.env.PORT || 3000;

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

// Route to render the login.ejs file
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

    const passwordMatch = user.password === password;

    if (passwordMatch) {
      // Authentication successful
      req.session.userId = user.styleID;
      req.session.isAdmin = user.admin;

      if (user.admin) {
        // Redirect to admin_home.ejs for admin users
        return res.redirect("/admin");
      } else {
        // Redirect to user_home.ejs for non-admin users
        return res.redirect("/testing");
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

// POST to delete a user
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

// POST login route modified for session handling
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // ... existing login logic ...
  if (passwordMatch) {
    // Set session details on successful login
    req.session.userId = user.id;
    req.session.isAdmin = user.admin; // Assuming 'admin' is a boolean in your user table
    res.redirect("/testing");
  } else {
    // ... handle failed login ...
  }
});

// GET route to admin page
app.get("/admin", checkAdmin, checkAuthentication, async (req, res) => {
  if (req.session.isAdmin) {
    try {
      // Assuming the user's ID is stored in req.session.userId
      const userId = req.session.userId;

      // Fetch stylFName of the logged-in user from the database
      const user = await knex("stylists")
        .select("stylFName")
        .where({ styleID: userId }) // Replace 'id' with the appropriate column name for user ID
        .first();

      if (user) {
        const stylFName = user.stylFName;
        const stylists = await knex.select("*").from("stylists");

        res.render("admin", {
          stylists: stylists,
          stylFName: stylFName,
          messages: {
            success: req.flash("success"),
            error: req.flash("error"),
          },
        });
      } else {
        res.status(404).send("User not found in the database");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching user data");
    }
  } else {
    res.status(403).send("Access denied");
  }
});

// //POST to add a stylist
// app.post("/add-stylist", checkAdmin, checkAuthentication, async (req, res) => {
//   try {
//     const { firstName, lastName } = req.body;
//     await knex("stylists").insert({
//       stylFName: firstName,
//       stylLName: lastName,
//     });
//     res.redirect("/admin");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error adding stylist");
//   }
// });

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

// POST Route to handle the updating of a stylist's information
app.post(
  "/editUser/:styleID",
  checkAdmin,
  checkAuthentication,
  async (req, res) => {
    const styleID = req.params.styleID;
    let { stylFName, stylLName, stylTel, email, calLink, admin } = req.body;

    stylFName = stylFName.toUpperCase(); // Convert to uppercase
    stylLName = stylLName.toUpperCase(); // Convert to uppercase
    email = email.toUpperCase(); // Convert to uppercase

    // Handle the absence of the 'admin' checkbox
    const isAdmin = admin === "true"; // If 'admin' is present and equals "true", set isAdmin to true. Otherwise, false.

    try {
      // Logic to update the stylist's details in the database
      await knex("stylists").where("styleID", styleID).update({
        stylFName: stylFName,
        stylLName: stylLName,
        stylTel: stylTel,
        email: email,
        calLink: calLink,
        admin: isAdmin, // Use the isAdmin variable here
      });

      req.flash("success", "Stylist updated successfully!");
      res.redirect("/admin"); // Redirect after successful update
    } catch (error) {
      console.error(error);
      req.flash("error", "Server error occurred while updating stylist");
      res.redirect("/admin"); // Redirect also in case of an error
    }
  }
);

// GET route to add stylist
app.get("/addStylist", checkAdmin, checkAuthentication, (req, res) => {
  // Ensure only authorized users can access this page
  // For example, you could use your checkAdmin middleware here

  res.render("addStylist"); // Render the form for adding a new stylist
});

// POST route to add stylist
app.post("/addStylist", checkAdmin, checkAuthentication, async (req, res) => {
  let { stylFName, stylLName, email, stylTel, password, admin } = req.body;
  stylFName = stylFName.toUpperCase(); // Convert to uppercase
  stylLName = stylLName.toUpperCase(); // Convert to uppercase
  email = email.toUpperCase(); // Convert to uppercase

  try {
    // Check if email already exists
    const existingUser = await knex("stylists").where("email", email).first();
    if (existingUser) {
      // Email already in use by another account
      // Redirect to the emailError page
      return res.render("emailError");
    }

    // Add the user to the database
    const newUser = await knex("stylists")
      .insert({ stylFName, stylLName, email, stylTel, password, admin }) // Hash password before storing
      .returning("*");

    res.redirect("/admin");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error adding user");
  }
});

// GET route to delete editing stylist
app.get(
  "/editStylist/:styleID",
  checkAdmin,
  checkAuthentication,
  async (req, res) => {
    const styleID = req.params.styleID;

    try {
      // Fetch the stylist details from the database using the styleID
      const stylist = await knex("stylists").where("styleID", styleID).first();

      if (stylist) {
        res.render("editStylist", { stylist });
      } else {
        res.status(404).send("Stylist not found");
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send("Server error occurred while fetching stylist details");
    }
  }
);

// POST route to editing stylist
app.post(
  "/editStylist/:styleID",
  checkAdmin,
  checkAuthentication,
  async (req, res) => {
    const styleID = req.params.styleID;
    let { stylFName, stylLName, stylTel, email, calLink } = req.body;
    stylFName = stylFName.toUpperCase();
    stylLName = stylLName.toUpperCase();
    email = email.toUpperCase();

    // Check if 'admin' checkbox was checked
    const isAdmin = !!req.body.admin; // Will be true if 'admin' is present, false otherwise

    try {
      await knex("stylists").where("styleID", styleID).update({
        stylFName,
        stylLName,
        stylTel,
        email,
        calLink,
        admin: isAdmin,
      });

      // Redirect back to the /admin page after successful update
      res.redirect("/admin");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating stylist");
    }
  }
);
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    // Redirect to the login page after destroying the session
    res.redirect("/login");
  });
});

// Add this route in your index.js file
app.get("/stylist/:id", checkAuthentication, async (req, res) => {
  const stylistId = req.params.id;

  try {
    // Retrieve client information based on stylistId
    const clients = await knex("surveyResponse")
      .where("styleID", stylistId)
      .select("*");

    // Render a page with client information
    res.render("stylist", { clients, stylistId });
  } catch (error) {
    console.error("Failed to retrieve client information:", error);
    res.status(500).send("Failed to retrieve client information.");
  }
});

// Add this route in your index.js file
app.get("/clientInfo", checkAuthentication, async (req, res) => {
  const stylistId = req.query.stylistId;
  const resId = req.query.resId;

  try {
    // Retrieve client information based on resId
    const client = await knex("surveyResponse")
      .where("resID", resId)
      .first();

    // Render a page with the client's surveyResponse details
    res.render("clientInfo", { client, stylistId });
  } catch (error) {
    console.error("Failed to retrieve client information:", error);
    res.status(500).send("Failed to retrieve client information.");
  }
});


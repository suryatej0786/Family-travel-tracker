import express from "express";
import pg from "pg";
import bodyParser from "body-parser";

const app = express();

const db = new pg.Client({
  user: "postgres",
  password: "sriphani111327",
  host: "localhost",
  port: 5432,
  database: "traveltracker_db",
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});

let visited_states = [];
let placeholdermssg = "";
let userarray = [];
let currentuserid=1;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  userarray.length = 0;
  const no_users_query = 'SELECT username,id FROM users_table';
  const users_table_result = await db.query(no_users_query);
  users_table_result.rows.forEach((user) => {
    userarray.push(user);
    // console.log(userarray);
    // console.log(users_table_result.rows);
  });

  try {
    const final_result = await db.query('SELECT state_code FROM count_visit_table WHERE visited LIKE $1', ['yes']);
    visited_states = final_result.rows.map(obj => obj.state_code.trim());
    console.log('Updated visited states:', visited_states);
    res.render("sample.ejs", { visited_states, placeholdermssg, userarray });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

app.post("/submit", async (req, res) => {
  let { data, actionn } = req.body;

  // Ensure data and userdata are trimmed and lowercased
  data = data.trim().toLowerCase();
  // userdata = userdata.trim().toLowerCase();

  console.log(`Action: ${actionn}, Data: ${data}`);

  // if (!data && actionn !== 'adduser') {
  //   placeholdermssg = "Please enter a state name!";
  //   res.render("sample.ejs", { visited_states, placeholdermssg, userarray });
  //   return;
  // }

  try {
    if (actionn === 'submitt') {
      const query = 'UPDATE count_visit_table SET visited = $1 WHERE state LIKE $2';
      const result = await db.query(query, ['yes', `${data}%`]);

      if (result.rowCount === 0) {
        placeholdermssg = `State entered not found or already visited.`;
      }

    } else if (actionn === 'delete') {
      const deleteQuery = 'UPDATE count_visit_table SET visited = $1 WHERE state LIKE $2';
      const result = await db.query(deleteQuery, ['no', `${data}%`]);

      if (result.rowCount === 0) {
        placeholdermssg = `State entered not found or already marked as not visited.`;
      }

    } 

    // Fetch updated state_codes where visited = 'yes'
    const final_result = await db.query('SELECT state_code FROM count_visit_table WHERE visited = $1', ['yes']);
    visited_states = final_result.rows.map(obj => obj.state_code.trim());
    console.log('Updated visited states:', visited_states);

    // res.render("sample.ejs", { visited_states, placeholdermssg, userarray });

  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error processing data');
  }
  // res.redirect("/");
  res.redirect('/');
});


app.post("/usersubmit",async (req,res)=>
{
  let { actionn, userdata } = req.body;

  // Ensure data and userdata are trimmed and lowercased
  // data = data.trim().toLowerCase();
  userdata = userdata.trim().toLowerCase();
  if (userdata !== '') { // Check if userdata is not empty
    const newUserQuery = 'INSERT INTO users_table(username) VALUES ($1)';
    console.log(`Inserting new user: ${userdata}`); // Log the user being inserted

    const newUserResult = await db.query(newUserQuery, [userdata]);

    if (newUserResult.rowCount === 1) {
      console.log(`User ${userdata} added successfully.`);
      userarray.push({ username: userdata }); // Update userarray with new username
      placeholdermssg = "User added successfully.";
    } else {
      placeholdermssg = `Failed to add user ${userdata}.`;
    }
  } else {
    placeholdermssg = "Please enter a valid username.";
  }
  // res.render("sample.ejs", { visited_states, placeholdermssg, userarray });
res.redirect('/');
})

app.listen(3000, (err) => {
  if (err) {
    console.error('Error starting the server:', err);
  } else {
    console.log("The server is up and running on port 3000");
  }
});

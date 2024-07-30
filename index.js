require("dotenv").config();
const mysql = require("mysql");
const express = require("express");
const app = express();
const cors = require("cors");
const he = require("he");

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cors());

// Configure the connection to your AWS RDS MySQL instance
const connection = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to database");
});

app.get("/", (req, res) => {
  res.send("Custom querying");
});

app.post("/FetchData", (req, res) => {
  let query = req.body.query;
  //check for query
  console.log(query)
  if (!query) {
    return res.send('Query is required');
  }
  //Function to decode the query
  function base64Decode(encoded) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let binaryStr = "";

    // Remove padding if present
    encoded = encoded.replace(/=+$/, "");

    // Convert Base64 characters back to binary data
    for (let i = 0; i < encoded.length; i++) {
      const index = chars.indexOf(encoded[i]);
      if (index !== -1) {
        binaryStr += index.toString(2).padStart(6, "0");
      }
    }

    // Split the binary string into 8-bit chunks and convert to characters
    let decoded = "";
    for (let i = 0; i < binaryStr.length; i += 8) {
      const byte = binaryStr.substring(i, i + 8);
      if (byte.length === 8) {
        decoded += String.fromCharCode(parseInt(byte, 2));
      }
    }

    return decoded;
  }
  encodequery = base64Decode(query);
  // console.log( "\n\n" + encodequery)
  // Remove /n from the query
  let sanitizedQuery = encodequery.replace(/\n/g, " ");
  sanitizedQuery = sanitizedQuery.replace(/Table7/g, '`test(1)`');
   console.log(  "\n\n" + sanitizedQuery);
// Function to determine the type of SQL query
function getQueryType(query) {
  const trimmedQuery = query.trim().toUpperCase();
  if (trimmedQuery.startsWith('SELECT')) {
    return 'SELECT';
  } else if (trimmedQuery.startsWith('INSERT')) {
    return 'INSERT';
  } else if (trimmedQuery.startsWith('UPDATE')) {
    return 'UPDATE';
  } else if (trimmedQuery.startsWith('DELETE')) {
    return 'DELETE';
  } else if (trimmedQuery.startsWith('DROP')) {
    return 'DROP';
  } else {
    return 'OTHER';
  }
}
  // restict delete data
  const queryType = getQueryType(sanitizedQuery);
  if (queryType === 'DELETE' || queryType === 'DROP') {
    return res.send('DELETE and DROP operations are not allowed');
  }else{
    connection.query(sanitizedQuery, (error, results, fields) => {
      if (error) {
        console.error("Error executing query:", error);
        res.send("No Data");
      } else {
        // console.log( "\n\n" +JSON.stringify(results))
        res.send(results);
      }
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3014;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

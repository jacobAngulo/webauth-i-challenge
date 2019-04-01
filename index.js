require("dotenv").config();
const express = require("express");

const db = require("./data/knexConfig");

const port = process.env.PORT || 4000;

const server = express();

server.get("/", (req, res) => {
  res.send('welcome to the "/"');
});

server.get("/api/users", async (req, res) => {
  try {
    const users = db("users");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
});



server.listen(port, () => {
  console.log(`server up and listening on localhost:${port}`);
});

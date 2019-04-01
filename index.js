require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("./data/knexConfig");

const port = process.env.PORT || 4000;

const server = express();

server.use(express.json());

server.get("/", (req, res) => {
  res.send('welcome to the "/"');
});

server.post("/api/register", async (req, res) => {
  console.log("req.body: ", req.body);
  const user = req.body;
  if (user.username && user.password) {
    const hash = bcrypt.hashSync(user.password, 4);
    user.password = hash;
    try {
      console.log(user);
      const id = await db("users").insert(user);
      try {
        const user = await db("users")
          .where({ id: id })
          .first();
        res.status(203).json(user);
      } catch (error) {
        res.status(500).json(error);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json({ message: "please fill out required fields" });
  }
});

server.post("/api/login", async (req, res) => {
  if (req.body.username && req.body.password) {
    const { username, password } = req.body;
    try {
      const user = await db("users")
        .where({ username: username })
        .first();
      console.log("user: ", user, "\npassword: ", password);
      console.log(bcrypt.compareSync(password, user.password));
      if (bcrypt.compareSync(password, user.password)) {
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: "Invalid Credentials" });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json({ message: "please fill out required fields" });
  }
});

server.get("/api/users", restricted, async (req, res) => {
  try {
    const users = await db("users");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
});

async function restricted(req, res, next) {
  const { username, password } = req.headers;
  try {
    const user = await db("users")
      .where({ username: username })
      .first();
    console.log(user);
    if (bcrypt.compareSync(password, user.password)) {
      next();
    } else {
      res.status(401).json({ message: "You shall not pass!!" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
}

server.listen(port, () => {
  console.log(`server up and listening on localhost:${port}`);
});

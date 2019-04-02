require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const session = require("express-session");
const KnexSessionStore = require("connect-session-knex")(session);
const cors = require("cors");

const db = require("./data/knexConfig");

const port = process.env.PORT || 4000;

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.use(
  session({
    name: "notsession",
    secret: "nobody tosses a dwarf!",
    cookie: {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true
    },
    resave: false,
    saveUninitialized: false,
    store: new KnexSessionStore({
      knex: db,
      tablename: "sessions",
      sidfieldname: "sid",
      createtable: true,
      clearInterval: 1000 * 60 * 30
    })
  })
);

server.get("/", (req, res) => {
  res.send("welcome to the /");
});

server.post("/api/register", async (req, res) => {
  const user = req.body;
  if (user.username && user.password) {
    const hash = bcrypt.hashSync(user.password, 4);
    user.password = hash;
    try {
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
    db("users")
      .where({ username: username })
      .first()
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
          req.session.user = user;
          res.status(200).json({
            message: `Welcome ${user.username}!`
          });
        } else {
          res.status(401).json({ message: "Invalid Credentials" });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
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
  try {
    // if this throws, please don't crash my app
    if (req && req.session && req.session.user) {
      next();
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "you broke it!" });
  }
}

server.listen(port, () => {
  console.log(`server up and listening on localhost:${port}`);
});

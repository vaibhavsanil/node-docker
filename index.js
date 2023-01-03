const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const cors = require("cors");
let RedisStore = require("connect-redis")(session);
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  SESSION_SECRET,
  REDIS_URL,
  REDIS_PORT,
} = require("./config/config");

// 172.22.0.3

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

let redisClient = redis.createClient({
  legacyMode: true,
  // host: "redis",
  // port: REDIS_PORT,
  url: "redis://redis:6379",
});

redisClient
  .connect()
  .then(() => {
    console.log("The Redis is connected !!!");
  })
  .catch((e) => {
    console.log(e);
  });

const app = express();

app.use(express.json());

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully Connected to DB");
    })
    .catch((e) => {
      console.log(e);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

app.enable("trust proxy");
app.use(cors({}));
// Creating Sessions
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 60000,
    },
  })
);

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
  res.send("<h2>Hi THere!!! Vaibhav Sanil </h2>");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Port Listening on port ${port}`));

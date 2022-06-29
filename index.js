const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8000;
const socketIo = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const bodyParser=require("body-parser")

//models
const User = require("./models/user");
const Chat = require("./models/chat");

//initialize server
const server = http.createServer(app);

//create server with express
const io = socketIo(server);

//enabling json parser
app.use(bodyParser.json());

//connect to the database
mongoose.connect("mongodb://localhost/one_2_one_chat_app");
//acquire the connection
const db = mongoose.connection;
//error
db.on("error", console.error.bind(console, "error connecting to database"));
//up and running
db.once("open", function () {
  console.log("sucessfully connected to database");
});

//create user
app.post("/create-user", function (req, res) {
  user.create(
    {
      username: req.body.username,
      password: req.body.password,
    },
    function (err, newUser) {
      if (err) {
        console.log("error in creating user");
        return;
      }
      console.log("new user created");
      return res.redirect("back");
    }
  );
});

//get the token if user exist
app.post("/api/login", (req, res) => {
  //check if user exist
  user.findById(_id).then((user) => {
    if (!user) {
      // user couldn't be found
      return res.json({
        message: "user not found",
      });
    }
    //user found now create the jwt token
    jwt.sign({ user: user }, "secretkey", { expiresIn: "1h" }, (err, token) => {
      res.json({
        token: token,
      });
    });
  });
});

// check whether the request has a valid JWT access token

function verifyToken(req, res, next) {
  //get auth header value
  const bearerHeader = req.headers["authorization"];
  //check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    //split at the space
    const bearer = bearerHeader.split(" ");
    //set the token
    req.token = bearer[1];
    //next middleware
    next();
  } else {
    //forbidden
    res.sendStatus(403);
  }
}
//new chat message
app.post("/chats", verifyToken, (req, res) => {
  const query = Chat.findOne({
    $or: [
      {
        reciever: req.body.reciever,
        sender: req.body.sender,
      },
      {
        reciever: req.body.sender,
        sender: req.body.reciever,
      },
    ],
  });
  query
    .exec()
    .then((data) => {
      if (data === null) {
        const chat = new Chat({
          sender: req.body.sender,
          reciever: req.body.reciever,
          messages: req.body.messages,
        });
        chat
          .save()
          .then((data) => {
            res.json(data);
          })
          .catch((error) => {
            res.json(error);
          });
      } else {
        const updateChat = Chat.updateOne(
          {
            $or: [
              { reciever: req.body.reciever, sender: req.body.sender },
              { reciever: req.body.sender, sender: req.body.reciever },
            ],
          },
          { $set: { messages: req.body.messages } }
        );
        updateChat
          .exec()
          .then((data) => {
            res.json(data);
          })
          .catch((error) => {
            res.json(error);
          });
      }
    })
    .catch((error) => {
      res.json(error);
    });
});
//Chat messages getter API
app.get("/chats/:sender/:reciever", verifyToken, (req, res) => {
  const chat = Chat.findOne({
    $or: [
      { reciever: req.params.reciever, sender: req.params.sender },
      { reciever: req.params.sender, sender: req.params.reciever },
    ],
  });

  chat.exec().then((data) => {
    if (data === null) {
      res.json([]);
    } else {
      res.json(data.messages);
    }
  });
});

//Chatrooms getter API
app.get("/chats/:userId", verifyToken, (req, res) => {
  const chat = Chat.find({
    $or: [{ reciever: req.params.userId }, { sender: req.params.userId }],
  });

  chat.exec().then((data) => {
    if (data.length === 0) {
      res.json([]);
    } else {
      res.json(data);
    }
  });
});

//New Broadcast Messages API
app.post("/broadcast", verifyToken, (req, res) => {
  const broadcast = new Broadcast(req.body);

  broadcast
    .save()
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.json(error);
    });
});

//Broadcast Message getter API
app.get("/broadcast", verifyToken, (req, res) => {
  const chat = Broadcast.find();

  chat.exec().then((data) => {
    if (data === null) {
      res.json(data);
    } else {
      res.json(data);
    }
  });
});

//socket declaration
var clients = []; //connected clients
io.on("connection", (socket) => {
  console.log("new user connected");
  socket.on("storeUserInfo", function (data) {
    //store new user in db
    var userInfo = new Object();
    userInfo.userId = socket.id;
    users.push(userInfo);
    user.save(done);
  });
});

//messages socket
const chatSocket = io.of("/chatsocket");
chatSocket.on("connection", function (socket) {
  //on new message
  socket.on("newMessage", (data) => {
    socket.broadcast.emit("incomingMessage", "reload");
  });
});

//let server listen
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});

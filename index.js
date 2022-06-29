var express = require("express");
var app = express();
var path = require("path");
var session = require("express-session");
var assert = require("assert");
var socketIo = require("socket.io");
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get("/chatroom", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/chatroom.html"));
});

app.get("/main", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/main.html"));
});
app.get("/signup", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/signup.html"));
});

app.post("/signup", function (req, res) {
  MongoClient.connect(url, async function (err, client) {
    assert.equal(null, err);
    const db = client.db(dbName);
    const collection = db.collection("users");
    collection.insertOne(req.body.user, function (err, result) {
      assert.equal(null, err);
      console.log("Signup registered");
    });
    app.users = await collection
      .find({
        first: req.body.user.first,
        last: req.body.user.last,
        email: req.body.user.email,
        password: req.body.user.password,
      })
      .toArray()
      .then((docs) => {
        return docs;
      });

    res.redirect("/login");
  });
});

app.get("/login", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/login.html"));
});

app.post("/login", function (req, res) {
  MongoClient.connect(url, async function (err, client) {
    assert.equal(null, err);
    const db = client.db(dbName);
    const collection = db.collection("users");
    app.user = await collection
      .findOne({ email: req.body.user.email, password: req.body.user.password })
      .then((doc) => {
        if (!doc)
          return res.send("<p>User not found. Go back and try again</p>");
        return doc;
      });
    res.redirect("/main");
  });
});

app.get("/messages", function (req, res) {
  var MongoClient = require("mongodb").MongoClient;
  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo
      .collection("messages")
      .find()
      .toArray(function (err, result) {
        if (err) throw err;
        res.send(result);
        db.close();
      });
  });
});

var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
const dbName = "one_2_one_chat_app";

const server = app.listen(3000);

var io = socketIo.listen(server);

io.sockets.on("connection", function (socket) {
  socket.on("join", function () {
    MongoClient.connect(url, async function (err, client) {
      assert.equal(null, err);
      const db = client.db(dbName);
      const collection = db.collection("users");
      await collection.findOne({ _id: app.user._id }).then((doc) => {
        socket.nickname = doc.first;
        socket.email = doc.email;
        socket.broadcast.emit(
          "announcement",
          doc.first + " joined the chatroom."
        );
      });
    });
  });
  socket.on("text", function (msg, callback) {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db(dbName);
      var myobj = { name: socket.nickname, email: socket.email, comment: msg };
      dbo.collection("messages").insertOne(myobj, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    socket.broadcast.emit("text", socket.nickname, msg);
    callback(Date().toString());
  });
});

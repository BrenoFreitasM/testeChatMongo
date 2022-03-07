const express = require("express")();
const cors = require("cors");
const http = require("http").createServer(express);
const io = require("socket.io")(http);
const { MongoClient } = require("mongodb");


const client = new MongoClient("mongodb+srv://tempuser:tempuser123@cluster0.gxwtp.mongodb.net/gamedev?retryWrites=true&w=majority");

//express.use(cors());
express.use(function(req, res, next){
	res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

var collection;

io.on("connection", (socket) => {
  socket.on("join", async (gameId) => {
    try {
      let result = await collection.findOne({ "_id": gameId });
      if (!result) {
        await collection.insertOne({ "_id": gameId, messages: [] });
      }
      socket.join(gameId);
      socket.emit("joined", gameId);
      socket.activeRoom = gameId;
    } catch (e) {
      console.error(e);
    }
  });
  socket.on("message", (message) => {
    collection.updateOne({ "_id": socket.activeRoom }, {
      "$push" : {
        "messages": message
      }
    });
    io.to(socket.activeRoom).emit("message",message);
  });
});

express.get("/chats", async (request, response) => {
  try {
    let result = await collection.findOne({"_id": request.query.room });
    response.send(result);
  } catch (e) {
    response.status(500).send({ message: e.message });
  }
});

http.listen(3000, async () => {
  try {
    await client.connect();
    collection = client.db("gamedev").collection("chats");
    console.log("Listening on port :%s...", http.address().port);
  } catch (e) {
    console.error(e);
  }
});
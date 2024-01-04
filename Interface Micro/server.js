const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const express = require("express");

const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const httpPort = 3000;

    // !HTTP SERVER
app.use(express.json())
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});


io.on("connection", (socket) => {
  console.log("connected");
  socket.on("disconnect", function () {
    console.log("disconnected");
  });
});


server.listen(httpPort, () => {
  console.log("listening on *:", httpPort);
});


const port = new SerialPort({
  path: "COM3", // port aktif
  baudRate: 9600, //jalur komunikasi api
});

    // !parsing - ubah format data
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    // !get data from arduino
parser.on("data", (data) => {
    const lines = data.split('\n');
    const jsonData = {};

    lines.forEach((data) => {
      const match = data.match(/(.+): (.+)/);
      if (match) {
        const key = match[1].trim();
        const rowvalue = match[2].trim();
        const value = parseFloat(rowvalue)
        jsonData[key] = value;
      }
    });
    console.log(jsonData)
    io.emit('data', { data : jsonData });
    
});



app.post("/arduinoApi", (req, res) => {
  const data = req.body.data;

  // ?direct arduino serial access
  port.write(data, (err) => {
    if (err) {
      console.error("data write error:", err);
      res.status(500).json({ error: "data write error" });
    }
    console.log('data send to arduino: ', data)
    res.end();
  });
});
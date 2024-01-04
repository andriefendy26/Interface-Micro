//mengimport beberapa modul
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const express = require("express");

//menginitialisasi Express
const app = express();

//membuat server HTTP menggunakan express
const http = require("http");
const server = http.createServer(app);

//membuat server Socket.io menggunakan HTTP
const { Server } = require("socket.io");
const io = new Server(server);

//menentukan port untuk server http
const httpPort = 3000;

// !HTTP SERVER
app.use(express.json())//mengkonfig app express untuk menggunakan JSON parsing

//menentukan route yang akan mengirimkan data ke html
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//mengkoneksikan ke modul socket.io  fungsinya agar saluran komunikasi bisa berjalan secara realtime
io.on("connection", (socket) => {
  console.log("connected");// ketika koneksi berhasil akan muncul ke terminal ("connected")
  socket.on("disconnect", function () {
    console.log("disconnected"); // ketika koneksi terputus akan muncul ke terminal ("Disconected")
  });
});

//Memulai server Http pada port yang sudah di tentukan
server.listen(httpPort, () => { 
  console.log("listening on *:", httpPort);
});


const port = new SerialPort({
  path: "COM3", // port yang aktif
  baudRate: 9600, //jalur komunikasi api
});

// parsing data mengubah data yang di terima menjadi baris baris
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// mendapatkan data dari arduino
parser.on("data", (data) => {
    const lines = data.split('\n'); //menginisialkan data yang di spli
    const jsonData = {}; // object kosong untuk menampung data yang di split

    //parse tiap baris data dari arduino
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
    io.emit('data', { data : jsonData }); //mengirimkan data ke socket.io yang terhubung
    
});


//menangani permintaan post dari root("/arduinoApi") 
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
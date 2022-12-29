import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer"; 

import helmet from "helmet";
import morgan from "morgan";
import cloudinary from "cloudinary";

import fs from "fs";

import roomRoutes from "./routes/userroom.js";


import { createServer } from 'http';
import { Server } from 'socket.io';


import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";



import User from "./models/User.js";
import Room from "./models/Roomparam.js";


import path from "path";
import { fileURLToPath } from "url";



/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url); // This grab file url when using import instead
const __dirname = path.dirname(__filename);

dotenv.config(); // to use .env files

const app = express(); // invoke express application
app.use(express.json()); 
app.use(helmet()); //security
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));// for parsing json data from client
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true })); // for parsing form (input) data from client
app.use(cors({
  origin: ["http://localhost:3000", "https://e-gamenchat-room.onrender.com"]
}));//add values in prouction enviorment
app.use("/assets", express.static(path.join(__dirname, "public/assets"))); // local storage directory
//app.use(express.static(__dirname));

var serverstate = 0;





const server = createServer(app); 
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://e-gamenchat-room.onrender.com"]
    
  }
});

// Socket io server section..........................

io.use((socket, next) => {
    if(socket.handshake.query && socket.handshake.query.token){
        jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return next(new Error('authentication error'));
            socket.decoded = decoded;
            next();
        })
    }
    else{
        next(new Error('authentication error'));
    }

}).on('connection', (socket) => {
   // connection is now authenticated to receive further events
  

   socket.on('send-msg', (string, room) =>{
    
    socket.to(room).emit('rec-msg', string) // to all clents
    
  })

  socket.on('send-dice', (string, room) =>{
    
    socket.to(room).emit('rec-dice', string) // to all clents
    
  })

  socket.on('game-status', (string, room) =>{
    updatewinner(string);
    socket.to(room).emit('rec-status', string) // to all clents
    
  })


  socket.on('join-room', (room) =>{
    socket.join(room)
    
  })
  
})

const updatewinner = async(string) => {
   
  const user = await User.findOne({ username: string });
  if(user){
    user.wins = user.wins + 1;
    if(user.wins < 5 && user.wins > 0){
    user.rank = 1;//Bronze
    }
    if(user.wins > 4 && user.wins < 10){
      user.rank = 2;//Silver
    }
    if(user.wins > 9 ){
        user.rank = 3;//Gold
    }

    user.save();
  }

}




/* FILE STORAGE */
const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "public/assets");//path.join(__dirname, '/uploads/')
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },

}); // this is from github from multer





const upload = multer({ storage }); // 'upload' - save uploaded file to your local storage 

// cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploads = (file,folder) => {
// new Promise
  return new Promise  ((resolve) => {

      cloudinary.uploader.upload(file, (result) => {
          resolve ({url: result.url, id: result.public_id})
         //resolve(url= result.url)
      }, {

          resource_type: "auto",
          folder: folder

      })

  })


}



/* ROUTES */


app.use("/room", roomRoutes);

app.post("/register", upload.single('gamerimg'), async (req, res) => { // verifyToken,

  try {
    const {username,email,password,} = req.body;

    const usery = await User.findOne({ email: email });
    if (usery) return res.status(400).json({ msg: "Email already exist. " });
    const useri = await User.findOne({ username: username });
    if (useri) return res.status(400).json({ msg: "username already exist. " });

  const uploader = async (path) => await uploads(path, "gamerimg")
   const urls = []
   const files = req.file
   
   const {path} = files
   const newPath = await uploader(path)
   urls.push(newPath)
   fs.unlinkSync(path)

   
   //console.log(urls[0].url)



  const salt = await bcrypt.genSalt(); // salt password using bcrypt
  const passwordHash = await bcrypt.hash(password, salt); // hash password using bcrpt

    

    const newUser = new User({ // created a new post
      username,
      email,
      bio: " ",
      password: passwordHash,
      picturePath: urls[0].url,
      wins: 0,
      matches: 0,
      rank: 0,
      extras: [],
    });

    await newUser.save(); // save all updates 'Post'

    const user = await User.find(); // get the user details
    res.status(200).json(user);


   console.log("image uploaded")

  } catch (err) {
    res.status(409).json({ message: err.message });
   // console.log("here is the error")
   // console.log(err)
  }

});// (path of route, middleware, middleware, controller) // on posts we have img  |createPost|

app.post("/login", async (req, res) => {

    try {
  
      const { email, password } = req.body;
      const user = await User.findOne({ email: email });
      if (!user) return res.status(400).json({ msg: "User does not exist. " }); // check if user is there
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " }); // check if hash password is found 
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET); //sign jwt , process.env.JWT_SECRET is a secert string we add
      delete user.password; // delete the password from user input
      user.matches = user.matches + 1;
      // logic for creating unique room for 2 player joining 

      if(serverstate == 0){ // check if the server is restarted, then update some values
        const roomonstart = await Room.findById("63a58d6c0ed1a217326344a8");

        if(roomonstart.twousercount == 1){ 
        
          roomonstart.twousercount=0 
          roomonstart.roomcount = roomonstart.roomcount + 1;
        
        }
        await roomonstart.save();
      }
      
      serverstate++
      const roomy = await Room.findById("63a58d6c0ed1a217326344a8");
     
      
      roomy.twousercount = roomy.twousercount + 1;

      if( roomy.twousercount < 3){ //if even 
        
        user.extras = [`room${roomy.roomcount}`,]

        if(roomy.twousercount == 2){ 

          roomy.twousercount=0 
          roomy.roomcount = roomy.roomcount + 1;

        }

      }
      
      await roomy.save();

      await user.save();
      res.status(200).json({ token, user }); // send back the jwt token with user data as json back to client
  
    } catch (err) {
      res.status(500).json({ error: err.message });
     // console.log(err.message)
    }
  
  });



/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(PORT,  () => {
      console.log(`Server Port: ${PORT}`)

    const roomonstart = Room.findById("63a58d6c0ed1a217326344a8");

   if(roomonstart.twousercount == 1){ 
  
    roomonstart.twousercount=0 
    roomonstart.roomcount = roomonstart.roomcount + 1;
   // console.log("room set")
  }
    
    });

   
  })
  .catch((error) => console.log(`Mongodb did not connect:${error} `));


 
  
 

  
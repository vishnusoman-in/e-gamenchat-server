import User from "../models/User.js";


export const getroomusers = async (req, res) => {
    try {
  
      const { roomname } = req.params;
      const users = await User.find({extras:roomname });
      if (!users) return res.status(400).json({ msg: "users does not exist. " });
      
      res.status(200).json(users);
  
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  };
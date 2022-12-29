import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    roomcount: {
      type: Number,
      default:0,
      
      
    },
    twousercount: {
        type: Number,
        default:0,
        
    },
    extra1: {
      type: String,
      default:" "
      
    },
    extra2: {
      type: String,
      default:" "
    },
    name: {
        type: String,
        default:"room"
      },  
    extras: {
      type: Array,
      default: [],
    },
  
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", RoomSchema);
export default Room;

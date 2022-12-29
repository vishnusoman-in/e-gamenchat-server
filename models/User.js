import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 2,
      
    },
    email: {
      type: String,
      required: true,
      min: 2,
      
    },
    bio: {
      type: String,
      default:" "
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    picturePath: {
      type: String,
      required: true,
      min: 5,
    },
    wins: {
        type: Number,
        required: true,
        default:0,
    },
    matches: {
        type: Number,
        default:0,
    },
    rank: {
        type: Number,
        default:0,
    },
      
    extras: {
      type: Array,
      default: [],
    },
  
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;

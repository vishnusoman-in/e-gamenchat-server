import express from "express";

import { getroomusers,   } from "../controllers/roomuser.js";
import { verifyToken } from "../middleware/jwtauth.js";
const router = express.Router();

router.get("/:roomname/find", verifyToken, getroomusers); // get details of a players

export default router;
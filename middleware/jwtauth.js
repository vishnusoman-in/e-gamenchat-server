import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {

  try {
    let token = req.header("Authorization");// if token header says "Authorization" , (which we set in client side), set token 'true'

    if (!token) {
      return res.status(403).send("Access Denied"); // if it is not, denie acesss
    }

    if (token.startsWith("Bearer ")) { // check if token start with 'bearer ' word and if it is - then take string after 7th position
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET); // verify that token with our secret string
    req.user = verified; //then update user data as verified
    next(); // execute next middleware
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};

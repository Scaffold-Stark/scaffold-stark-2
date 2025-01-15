import { verifyToken } from '../utils/jwt.js';
import { findUserByEmail } from '../models/userModel.js';

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  try {
    const decoded = verifyToken(token.split(' ')[1]);
    console.log(decoded)
    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).send('User not found.');
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).send('Invalid token.');
  }
};

export { authMiddleware };

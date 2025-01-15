import jwt from 'jsonwebtoken';

const secret = 'eyJhbGciOiJIUzUxMiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyMDgxOTEyNCwiaWF0IjoxNzIwODE5MTI0fQ.Nr28WhuExhP2igHt5Hw9CMNYBpDhI-w0e7dm0AI1I7hOvIGfeXBMT9s9A2ANdPoEfInjNa7gHJfB8FLOkjfPPQ'; // Use environment variable for this in production

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

export { generateToken, verifyToken };

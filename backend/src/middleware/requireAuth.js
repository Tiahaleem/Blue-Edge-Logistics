import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}
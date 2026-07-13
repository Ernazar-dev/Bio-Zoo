const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token kerak' });
  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Ruxsat yo\'q' });
  next();
};

module.exports = { authenticate, adminOnly };

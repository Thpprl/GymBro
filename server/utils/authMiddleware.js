const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // แยก 'Bearer <token>' ให้เหลือแค่ token
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'ไม่ได้รับ token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'token ไม่ถูกต้อง' });
  }
};

module.exports = auth;

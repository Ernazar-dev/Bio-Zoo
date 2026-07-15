const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  // jti — har bir token unikal bo'lishini kafolatlaydi. Busiz bir soniya
  // ichida ikkita refresh bir xil JWT yaratib, bazadagi unique cheklovga
  // urilib, foydalanuvchi sessiyasi bekorga tugatilardi.
  const refreshToken = jwt.sign(
    { userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

module.exports = { generateTokens };

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khetiwala',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '4f21e89f8a9eb6c9e57c9f710daac8b814d5c3e98559c8b61f1ce81182932e1e9859c251',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '07196f0cc605340a915559552bf30ad6231a1bca507c8d0b',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || true,
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  environment: process.env.NODE_ENV || 'development',
});

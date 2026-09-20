// Fake settings so tests never need a real .env or a real database.
process.env.NODE_ENV = 'test';
process.env.BASE_SHORT_URL = 'http://localhost:4000';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/url-shortener-test';
process.env.JWT_ACCESS_SECRET = 'test-secret-test-secret-test-secret';
process.env.ANALYTICS_SALT_SECRET = 'test-salt-test-salt-test-salt';
process.env.LOG_LEVEL = 'silent';
process.env.BCRYPT_COST = '4'; // low cost so tests run fast
/**
 * Setup global de testes — executado antes de cada arquivo de teste.
 * Define variáveis de ambiente necessárias para validação do Zod em env.ts.
 */
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/test';
process.env['REDIS_URL'] = 'redis://:pass@localhost:6379';
process.env['GEMINI_API_KEY'] = 'test_gemini_key';
process.env['META_APP_ID'] = 'test_app_id';
process.env['META_APP_SECRET'] = 'test_app_secret';
process.env['META_WEBHOOK_VERIFY_TOKEN'] = 'test_verify_token_123';
process.env['META_WEBHOOK_SECRET'] = 'test_webhook_secret';
process.env['JWT_SECRET'] = 'test_jwt_secret_with_at_least_32_characters_long';
process.env['JWT_REFRESH_SECRET'] = 'test_jwt_refresh_secret_with_at_least_32_chars';
process.env['TOKEN_ENCRYPTION_KEY'] = 'a'.repeat(64);
process.env['ADMIN_USERNAME'] = 'admin';
// Hash bcrypt de 'password123'
process.env['ADMIN_PASSWORD'] = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
process.env['TRACKER_BASE_URL'] = 'https://test.example.com/t';
process.env['FRONTEND_URL'] = 'http://localhost:3000';

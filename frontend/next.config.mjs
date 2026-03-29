/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone apenas para builds Docker (não Netlify)
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),

  // Expõe variáveis de ambiente públicas para o client
  env: {
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001',
  },

  // Não expõe informações do servidor nos headers
  poweredByHeader: false,

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirect da raiz para /admin/dashboard
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

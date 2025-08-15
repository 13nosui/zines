const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ▼ rewritesで例外指定を追加
  async rewrites() {
    return [
      {
        source: "/test-signup.html",
        destination: "/test-signup.html",
        locale: false, // ★ i18nの影響を受けずマッチ
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // the tool links reply PDFs as /_blob/<id>; serve those from the files API
  async rewrites() {
    return [{ source: '/_blob/:id', destination: '/api/files/:id' }];
  },
  // postgres / bcrypt run on the server only
  serverExternalPackages: ['postgres'],
};

export default nextConfig;

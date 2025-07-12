/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
      domains: [
        'example.com',
        'images.unsplash.com',
        'via.placeholder.com',
        'lh3.googleusercontent.com',
        'avatars.githubusercontent.com',
        'img.youtube.com',
        'dahwzignzcfkzdhbzjmi.supabase.co',
      ],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'example.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'via.placeholder.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'img.youtube.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'dahwzignzcfkzdhbzjmi.supabase.co',
          pathname: '/**',
        },
      ],
    },
    experimental: {
      serverActions: true,
    },
  }
  
  module.exports = nextConfig
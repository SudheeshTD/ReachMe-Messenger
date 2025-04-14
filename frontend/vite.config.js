// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// import { VitePWA } from "vite-plugin-pwa";
// import mkcert from "vite-plugin-mkcert";

// // https://vitejs.dev/config/
// export default defineConfig({
//   server: {
//     https: false, // Required for service worker in development
//     port: 5173,
//   },
//   plugins: [
//     react(),
//     tailwindcss(),

//     mkcert(), // Generates local HTTPS certificate
//     VitePWA({
//       registerType: "autoUpdate",
//       strategy: "generateSW",
//       devOptions: {
//         enabled: false, // Enable in development
//         type: "module",
//         navigateFallback: "index.html",
//       },
//       manifest: {
//         name: "LetzChat",
//         short_name: "LetzChat",
//         theme_color: "#ffffff",
//         icons: [
//           {
//             src: "/icon-192.png",
//             sizes: "192x192",
//             type: "image/png",
//             purpose: "any maskable",
//           },
//           {
//             src: "/icon-512.png",
//             sizes: "512x512",
//             type: "image/png",
//             purpose: "any maskable",
//           },
//         ],
//       },
//       workbox: {
//         devOptions: {
//           enabled: true,
//           type: "module",
//           navigateFallback: "index.html",
//           suppressWarnings: true, // Add this
//         },
//         globPatterns: [
//           "**/*.{js,css,html,png}", // Add png to cached patterns
//         ],
//         runtimeCaching: [
//           {
//             urlPattern: /\/api\/messages/,
//             handler: "NetworkFirst",
//             options: {
//               cacheName: "messages-cache",
//               expiration: {
//                 maxEntries: 50,
//                 maxAgeSeconds: 24 * 60 * 60, // 24 hours
//               },
//             },
//           },
//           {
//             urlPattern: /\/assets/,
//             handler: "CacheFirst",
//             options: {
//               cacheName: "assets-cache",
//               expiration: {
//                 maxEntries: 60,
//                 maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
//               },
//             },
//           },
//         ],
//       },
//     }),
//   ],
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  server: {
    https: false, // Set to false if you don't use HTTPS in local dev
    port: 5173,
  },
  plugins: [
    react(),
    tailwindcss(),
    mkcert(), // Generates local HTTPS certificates
    VitePWA({
      registerType: "autoUpdate",
      strategy: "generateSW", // Auto-generates the service worker
      devOptions: {
        enabled: false, // Change to true if you want to test SW in development
        type: "module",
        navigateFallback: "index.html",
      },
      manifest: {
        name: "LetzChat",
        short_name: "LetzChat",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png}"],
        runtimeCaching: [
          {
            urlPattern: /\/api\/messages/,
            handler: "NetworkFirst",
            options: {
              cacheName: "messages-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400, // 24 hours
              },
            },
          },
          {
            urlPattern: /\/assets/,
            handler: "CacheFirst",
            options: {
              cacheName: "assets-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 2592000, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});

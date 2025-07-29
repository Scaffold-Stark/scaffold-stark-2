if (!self.define) {
  let e,
    s = {};
  const n = (n, c) => (
    (n = new URL(n + ".js", c).href),
    s[n] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = n), (e.onload = s), document.head.appendChild(e);
        } else (e = n), importScripts(n), s();
      }).then(() => {
        let e = s[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, i) => {
    const a =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[a]) return;
    let t = {};
    const r = (e) => n(e, a),
      o = { module: { uri: a }, exports: t, require: r };
    s[a] = Promise.all(c.map((e) => o[e] || r(e))).then((e) => (i(...e), t));
  };
}
define(["./workbox-4754cb34"], function (e) {
  "use strict";
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "fc0c20947dfe5d8ad58404b8499fd9e6",
        },
        {
          url: "/_next/static/KNOXgT2FjcTDhbYCQrdgY/_buildManifest.js",
          revision: "0f6c6493278e52020dde1ed0d0969b6e",
        },
        {
          url: "/_next/static/KNOXgT2FjcTDhbYCQrdgY/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/145-c991786d54d383d3.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/265.340bc003812c7002.js",
          revision: "340bc003812c7002",
        },
        {
          url: "/_next/static/chunks/2f0b94e8-734829800d3eb38b.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/346.ca260750499c65b1.js",
          revision: "ca260750499c65b1",
        },
        {
          url: "/_next/static/chunks/367-a0cbf7795754701c.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/389.4df1bfe1307d7f38.js",
          revision: "4df1bfe1307d7f38",
        },
        {
          url: "/_next/static/chunks/412.848767a8cc2f9d77.js",
          revision: "848767a8cc2f9d77",
        },
        {
          url: "/_next/static/chunks/431-55c80f3556f55309.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/473f56c0.06d04d0b0e18558c.js",
          revision: "06d04d0b0e18558c",
        },
        {
          url: "/_next/static/chunks/4bd1b696-48a906261550a4c5.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/508.48706cdaa305cba6.js",
          revision: "48706cdaa305cba6",
        },
        {
          url: "/_next/static/chunks/509.7193ef9a9b8c5c85.js",
          revision: "7193ef9a9b8c5c85",
        },
        {
          url: "/_next/static/chunks/519-27e0a6f350e1b22d.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/533.2a871507985e0bf8.js",
          revision: "2a871507985e0bf8",
        },
        {
          url: "/_next/static/chunks/587.31088ec13e35d66e.js",
          revision: "31088ec13e35d66e",
        },
        {
          url: "/_next/static/chunks/597-9d77aa8246907cab.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/684-3cf479aafee24c45.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/70646a03.8a93a888bb83698a.js",
          revision: "8a93a888bb83698a",
        },
        {
          url: "/_next/static/chunks/728.4a3e65548d8d522f.js",
          revision: "4a3e65548d8d522f",
        },
        {
          url: "/_next/static/chunks/742.196e5f0ba4bf2177.js",
          revision: "196e5f0ba4bf2177",
        },
        {
          url: "/_next/static/chunks/799-84eea0b9e9931939.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/816-97023bef461c0b0a.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/857.9c46b9373d8ff333.js",
          revision: "9c46b9373d8ff333",
        },
        {
          url: "/_next/static/chunks/965.7ebf2a3e13c095f3.js",
          revision: "7ebf2a3e13c095f3",
        },
        {
          url: "/_next/static/chunks/972.8e9fa6563582b2f6.js",
          revision: "8e9fa6563582b2f6",
        },
        {
          url: "/_next/static/chunks/986.4947f42dadf3b704.js",
          revision: "4947f42dadf3b704",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-04d3b5ab1d5bc6de.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/app/api/price/route-6c0ab67fce666a7b.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/app/configure/page-93d960c4645c3f4c.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/app/debug/page-d844f427aa02f34b.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/app/layout-b66106bf9d76a8ba.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/app/page-5fe8dfab73b1026c.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/e6909d18-ad93906ff42c502e.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/framework-859199dea06580b0.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/main-a106802aa546c841.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/main-app-bdb6950c7e9845d7.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/pages/_app-da15c11dea942c36.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/pages/_error-cc3f077a18ea1793.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-951a15bd4164402b.js",
          revision: "KNOXgT2FjcTDhbYCQrdgY",
        },
        {
          url: "/_next/static/css/a20c0c9e0b011012.css",
          revision: "a20c0c9e0b011012",
        },
        {
          url: "/blast-icon-color.svg",
          revision: "f455c22475a343be9fcd764de7e7147e",
        },
        {
          url: "/debug-icon.svg",
          revision: "25aadc709736507034d14ca7aabcd29d",
        },
        {
          url: "/debug-image.png",
          revision: "34c4ca2676dd59ff24d6338faa1af371",
        },
        {
          url: "/explorer-icon.svg",
          revision: "84507da0e8989bb5b7616a3f66d31f48",
        },
        {
          url: "/gradient-s.svg",
          revision: "c003f595a6d30b1b476115f64476e2cf",
        },
        { url: "/logo.ico", revision: "0359e607e29a3d3b08095d84a9d25c39" },
        { url: "/logo.svg", revision: "962a8546ade641ef7ad4e1b669f0548c" },
        { url: "/manifest.json", revision: "781788f3e2bc4b2b176b5d8c425d7475" },
        {
          url: "/rpc-version.png",
          revision: "cf97fd668cfa1221bec0210824978027",
        },
        {
          url: "/scaffold-config.png",
          revision: "1ebfc244c31732dc4273fe292bd07596",
        },
        {
          url: "/sn-symbol-gradient.png",
          revision: "908b60a4f6b92155b8ea38a009fa7081",
        },
        {
          url: "/voyager-icon.svg",
          revision: "06663dd5ba2c49423225a8e3893b45fe",
        },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: n,
              state: c,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const s = e.pathname;
        return !s.startsWith("/api/auth/") && !!s.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    );
});

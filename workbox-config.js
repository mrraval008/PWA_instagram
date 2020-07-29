module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,js,css,png,jpg}"
  ],
  "swDest": "public/service-worker-workbox.js",
  "swSrc": "public/sw-base.js",
  "globIgnores": [
    "../workbox-config.js",
    "help/**",
    "404.html"
  ]
};
// workbox generateSW  run this to direct SW test
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');
importScripts('/src/js/p1.idb.js');
importScripts('/src/js/p2.utility.js');

workbox.precaching.precacheAndRoute([{"revision":"2cab47d9e04d664d93c8d91aec59e812","url":"favicon.ico"},{"revision":"d339a02468f75d35cfc136658fe442cf","url":"index.html"},{"revision":"d11c7965f5cfba711c8e74afa6c703d7","url":"manifest.json"},{"revision":"0556e117187e3659c7eebe4730dd6594","url":"offline.html"},{"revision":"7ef9bb3b3be7314cb5ba946178052d28","url":"src/css/app.css"},{"revision":"dc09f29147ec1fec5f5046facde120a4","url":"src/css/feed.css"},{"revision":"1c6d81b27c9d423bece9869b07a7bd73","url":"src/css/help.css"},{"revision":"41e51f57c5935b9b06606db3fc585fb6","url":"src/css/stylesheet.css"},{"revision":"83011e228238e66949f0aa0f28f128ef","url":"src/images/icons/app-icon-144x144.png"},{"revision":"f927cb7f94b4104142dd6e65dcb600c1","url":"src/images/icons/app-icon-192x192.png"},{"revision":"86c18ed2761e15cd082afb9a86f9093d","url":"src/images/icons/app-icon-256x256.png"},{"revision":"fbb29bd136322381cc69165fd094ac41","url":"src/images/icons/app-icon-384x384.png"},{"revision":"45eb5bd6e938c31cb371481b4719eb14","url":"src/images/icons/app-icon-48x48.png"},{"revision":"d42d62ccce4170072b28e4ae03a8d8d6","url":"src/images/icons/app-icon-512x512.png"},{"revision":"56420472b13ab9ea107f3b6046b0a824","url":"src/images/icons/app-icon-96x96.png"},{"revision":"74061872747d33e4e9f202bdefef8f03","url":"src/images/icons/apple-icon-114x114.png"},{"revision":"abd1cfb1a51ebe8cddbb9ada65cde578","url":"src/images/icons/apple-icon-120x120.png"},{"revision":"b4b4f7ced5a981dcd18cb2dc9c2b215a","url":"src/images/icons/apple-icon-144x144.png"},{"revision":"841f96b69f9f74931d925afb3f64a9c2","url":"src/images/icons/apple-icon-152x152.png"},{"revision":"2e5e6e6f2685236ab6b0c59b0faebab5","url":"src/images/icons/apple-icon-180x180.png"},{"revision":"cc93af251fd66d09b099e90bfc0427a8","url":"src/images/icons/apple-icon-57x57.png"},{"revision":"18b745d372987b94d72febb4d7b3fd70","url":"src/images/icons/apple-icon-60x60.png"},{"revision":"b650bbe358908a2b217a0087011266b5","url":"src/images/icons/apple-icon-72x72.png"},{"revision":"bf10706510089815f7bacee1f438291c","url":"src/images/icons/apple-icon-76x76.png"},{"revision":"31b19bffae4ea13ca0f2178ddb639403","url":"src/images/main-image-lg.jpg"},{"revision":"c6bb733c2f39c60e3c139f814d2d14bb","url":"src/images/main-image-sm.jpg"},{"revision":"5c66d091b0dc200e8e89e56c589821fb","url":"src/images/main-image.jpg"},{"revision":"0f282d64b0fb306daf12050e812d6a19","url":"src/images/sf-boat.jpg"},{"revision":"e866ebb5bf8e78b8b58dd720a883f62c","url":"src/js/bundle.js"},{"revision":"6b82fbb55ae19be4935964ae8c338e92","url":"src/js/p1.fetch.js"},{"revision":"017ced36d82bea1e08b08393361e354d","url":"src/js/p1.idb.js"},{"revision":"713af0c6ce93dbbce2f00bf0a98d0541","url":"src/js/p1.material.min.js"},{"revision":"10c2238dcd105eb23f703ee53067417f","url":"src/js/p1.promise.js"},{"revision":"58cc3d9019169eeeeed135eb226149df","url":"src/js/p2.utility.js"},{"revision":"f12ee2171412be3ace3a13df9a7345b2","url":"src/js/p3.app.js"},{"revision":"bdd7ffb4314b73e2fac90c8f875027f4","url":"src/js/p4.feed.js"},{"revision":"7a7599f2bd1aa7f0ccd1308574d31343","url":"sw.js"},{"revision":"84bc70e1cc552d156388681bafb5143f","url":"workbox-a2a6bd67.js"}])


const showNotification = function() {
    self.registration.showNotification('Post Sent', {
      body: 'You are back online and your post was successfully sent!',
      icon: '/src/images/icons/app-icon-96x96.png',
      badge: '/src/images/icons/app-icon-96x96.png',
    });
  };

const backGrndSyncPlugin =new workbox.backgroundSync.Plugin('myQueueName', {
    maxRetentionTime: 24 * 60, // Retry for max of 24 Hours,
    callbacks: {
      queueDidReplay: showNotification
    }
  });



workbox.routing.registerRoute(/.*(?:fonts|gstatic)\.com.*$/, workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
        new workbox.expiration.Plugin({
            maxEntries: 3,
            maxAgeSeconds: 60 * 60 * 24 * 30
        })
    ]
}))

workbox.routing.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', workbox.strategies.staleWhileRevalidate({
    cacheName: 'material-css',
}));

workbox.routing.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, workbox.strategies.staleWhileRevalidate({
    cacheName: 'post-images'
}));

workbox.routing.registerRoute('https://pwagrant-ebc19.firebaseio.com/posts.json', function (args) {
    console.log("posts.json", args)
    return fetch(args.event.request)
        .then(function (res) {
            var clonedRes = res.clone();
            clearAllData('posts')
                .then(function () {
                    return clonedRes.json();
                })
                .then(function (data) {
                    for (var key in data) {
                        writeIndexDBData('posts', data[key])
                    }
                });
            return res;
        })
})

workbox.routing.registerRoute(function (routeData) {
    return routeData.event.request.headers.get('accept').includes('text/html');
    },
    function (args) {
       return caches.match(args.event.request)
            .then(function (response) {
                if (response) {
                    return response;
                } else {
                    return fetch(args.event.request)
                        .then(function (res) {
                            return caches.open('dynamic')
                                .then(function (cache) {
                                    cache.put(args.event.request.url, res.clone());
                                    return res;
                                })
                        })
                        .catch(function (err) {
                            return caches.match('/offline.html').
                                then(function (resp) {
                                    return resp;
                                });
                        });
                }
            })
    }

)

workbox.routing.registerRoute('https://us-central1-pwagrant-ebc19.cloudfunctions.net/storePostsData',workbox.strategies.networkOnly({
        plugins:[backGrndSyncPlugin]
    }),
    'POST'
)

self.addEventListener('notificationclick', function (event) {
    var notification = event.notification;
    var action = event.action;

    console.log(notification);

    if (action === 'confirm') {
        console.log('Confirm was chosen');
        notification.close();
    } else {
        console.log(action);
        event.waitUntil(
            clients.matchAll()
                .then(function (clis) {
                    var client = clis.find(function (c) {
                        return c.visibilityState === 'visible';
                    });

                    if (client !== undefined) {
                        client.navigate(notification.data.url);
                        client.focus();
                    } else {
                        clients.openWindow(notification.data.url);
                    }
                    notification.close();
                })
        );
    }
});

self.addEventListener('notificationclose', function (event) {
    console.log('Notification was closed', event);
});

self.addEventListener('push', function (event) {
    console.log("Push Nottification Received", event)
    let data = {
        title: 'New!',
        content: 'Something new happened!',
        openUrl: '/'
    }

    if (event.data) {
        data = JSON.parse(event.data.text());
    }

    var options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.openUrl
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
})



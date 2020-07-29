// workbox generateSW  run this to direct SW test
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');
importScripts('/src/js/p1.idb.js');
importScripts('/src/js/p2.utility.js');

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)


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



importScripts('/src/js/p1.idb.js')
importScripts('/src/js/p2.utility.js')


var CACHE_STATIC_NAME = 'static_cache_1';
var CACHE_DYNAMIC_NAME = 'dynamic_cache_1';

var STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/p3.app.js',
    '/src/js/p2.utility.js',
    '/src/js/p4.feed.js',
    '/src/js/p1.idb.js',
    '/src/js/p1.material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];




//to handle "/" rout as '/' will be part of all request
function isInArray(string, array) {

    for (let i = 0; i < array.length; i++) {
        if (array[i] === string) {
            return true
        }
    }
    return false
}


function trimCache(cacheName, maxItems) {
    caches.open(cacheName)
        .then(function (cache) {
            cache.keys()
                .then(function (keyList) {
                    if (keyList.length > maxItems) {
                        cache.delete(keyList[0])
                            .then(function () {
                                trimCache(cacheName, maxItems)
                            })
                    }
                })
        })
}

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function (cache) {
                console.log('[Service Worker] Precaching App Shell');
                cache.addAll(STATIC_FILES);
            })
    )
});


self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Service Worker Are Activated', event)
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key != CACHE_STATIC_NAME && key != CACHE_DYNAMIC_NAME) {
                    console.log('[Service Worker] Removing old cache.', key);
                    return caches.delete(key)
                }
            }))
        })
    )
    return self.clients.claim();
})


self.addEventListener('fetch', function (event) {
    var url = 'https://pwagrant-ebc19.firebaseio.com/posts';

    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(fetch(event.request)
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
        );
    } else if (isInArray(event.request.url, STATIC_FILES)) {
        event.respondWith(
            caches.match(event.request)
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(function (res) {
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function (cache) {
                                        // trimCache(CACHE_DYNAMIC_NAME, 3);
                                        cache.put(event.request.url, res.clone());
                                        return res;
                                    })
                            })
                            .catch(function (err) {
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function (cache) {
                                        if (event.request.headers.get('accept').includes('text/html')) {
                                            return cache.match('/offline.html');
                                        }
                                    });
                            });
                    }
                })
        );
    }
});



self.addEventListener('sync', function (event) {
    console.log('[Service Worker] Background Syncing ...', event);
    if (event.tag === 'sync-new-post') {
        console.log('[Service Worker] Syncing New Post...');
        event.waitUntil(
            readAllData('sync-posts')
                .then(function (data) {
                    for (let dt of data) {
                        // let obj = { id, title, location, image } = dt;
                        sendData(dt)
                            .then(function (res) {
                                console.log('Sent Data', res)
                                if (res.ok) {
                                    res.json().then(function (resData) {
                                        console.log("resData", resData)
                                        cleatItemFromDB('sync-posts', resData.id)
                                    })
                                }
                            })
                            .catch(function (err) {
                                console.log('Error in Sending Data', err)
                            })
                    }
                })
        )
    }
})

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

//Final approach  without IndexDB  

// self.addEventListener('fetch', function (event) {

//     let url = 'https://pwagrant-ebc19.firebaseio.com/posts';

//     if (event.request.url.indexOf(url) > -1) {
//         caches.open(CACHE_DYNAMIC_NAME)
//             .then(function (cache) {
//                 return fetch(event.request)
//                     .then(function (data) {

//                         // trimCache(CACHE_DYNAMIC_NAME, 3)
//                         cache.put(event.request, data.clone())
//                         return data;
//                     })
//             })
//     } else if (isInArray(event.request.url, STATIC_FILES)) {
//         event.respondWith(
//             caches.match(event.request)
//         )
//     } else {
//         event.respondWith(
//             caches.match(event.request)
//                 .then(function (resp) {
//                     if (resp) {
//                         return resp;
//                     } else {
//                         return fetch(event.request)
//                             .then(function (respData) {
//                                 caches.open(CACHE_DYNAMIC_NAME)
//                                     .then(function (cache) {
//                                         cache.put(event.request, respData.clone())
//                                         return respData;
//                                     })
//                             }).catch(function () {
//                                 caches.open(CACHE_STATIC_NAME)
//                                     .then(function (cache) {
//                                         if (event.request.headers.get('accept').includes('text/html')) {
//                                             return cache.match('/offline.html')
//                                         }
//                                     })
//                             })
//                     }
//                 })
//         )
//     }
// })



/* -----------------------------------------
Cache Than Network
-----------------------------------------*/
// self.addEventListener('fetch', function (event) {
//     event.respondWith(
//         caches.match(event.request)
//             .then(function (resp) {
//                 if (resp) {
//                     return resp;
//                 } else {
//                     return fetch(event.request)
//                         .then(function (respData) {
//                             caches.open(CACHE_DYNAMIC_NAME)
//                                 .then(function (cache) {
//                                     cache.put(event.request, respData.clone())
//                                     return respData;
//                                 })
//                         }).catch(function () {
//                             caches.open(CACHE_STATIC_NAME)
//                                 .then(function (cache) {
                                    // if (event.request.headers.get('accept').includes('text/html')) {
//                                      return cache.match('/offline.html')
                                        // }
//                                 })
//                         })
//                 }
//             })
//     )
// })


/*-----------------------------------------
Network (If Failed)Then Cache
-----------------------------------------*/

// self.addEventListener('fetch',function(event){
//     event.respondWith(
//         fetch(event.request)
//             .then(function(respData){
//                 return caches.open(CACHE_DYNAMIC_NAME)
//                     .then(function(cache){
//                         cache.put(event.request,respData.clone())
//                         return respData;
//                     })
//             }).catch(function(){
//                return caches.match(event.request)
//             })

//     )
// })

/*-----------------------------------------
Network Only
-----------------------------------------*/

// self.addEventListener('fetch',function(event){
//     event.respondWith(
//         fetch(event.request)
//     )
// })

/*-----------------------------------------
Cache Only
-----------------------------------------*/
// self.addEventListener('fetch',function(event){
//     console.log('Cache only')
//     event.respondWith(
//         caches.match(event.request)
//     )
// })

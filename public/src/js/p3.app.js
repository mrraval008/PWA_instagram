var deferredPrompt;
var notificationBtns = document.querySelectorAll('.enable-notifications');
if ('serviceWorker' in navigator) {
    var serviceWorkerFile = '/sw.js';
    if(isWorkBoxEnable()){
        serviceWorkerFile = '/service-worker-workbox.js';
    }
    navigator.serviceWorker
        // .register('/sw.js')
         .register(serviceWorkerFile)
        .then(function () {
            console.log('[Service Worker] Service Worker Are Registered')
        })
        .catch(function (err) {
            console.log("[Service Worker] Failed To Register Service Worker.", err)
        })
}

window.addEventListener('beforeinstallprompt', function (event) {
    console.log('beforeinstallprompt fired')
    event.preventDefault();
    deferredPrompt = event;
    return false;
})


function showConfirmNotification() {
    //show from Service Worker
    let options = {
        body: "You succefully subscribed to our application",
        icon: '/src/images/icons/app-icon-96x96.png',
        image: '/src/images/sf-boat.jpg',
        dir: 'ltr', //direction of text
        lang: 'en-US',
        vibrate: [100, 50, 100], //100ms vibrate than 50ms pause again 100ms vibrate
        badge: '/src/images/icons/app-icon-96x96.png'
    }
    navigator.serviceWorker.ready
        .then(function (sw) {
            sw.showNotification('Succcesfully Subscribed [from SW]', options)
        })
    //OR
    //Directly show from JAVASCRIPT
    // new Notification('Succcesfully Subscribed',options);
}

function configurePushSub(){
    var swReg;
    navigator.serviceWorker.ready
        .then(function(sw){
            swReg = sw;
            return sw.pushManager.getSubscription()
        })
        .then(function(sub){
                if(sub === null){
                    var vapidPublicKey = 'BCIwcFKQA6tBL9OTrZsI-Nw_26v5V2BedStICROMJYXeBE4R5INT2Z9X190xg29WAAAVXXoLDT04Bw856awm5n4';
                    var transformedVapidPublicKey = urlBase64ToUint8Array("BCIwcFKQA6tBL9OTrZsI-Nw_26v5V2BedStICROMJYXeBE4R5INT2Z9X190xg29WAAAVXXoLDT04Bw856awm5n4") 
                    swReg.pushManager.subscribe({
                        userVisibleOnly:true,
                        applicationServerKey:transformedVapidPublicKey
                    })
                    .then(function(newSubscription){
                        console.log('newSubscription',newSubscription)
                       return fetch('https://pwagrant-ebc19.firebaseio.com/subscription.json',{
                            method: 'POST',
                            headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                            },
                            body: JSON.stringify(newSubscription)
                        })
                    })
                    .then(function(res){
                        console.log(res)
                        if(res.ok){
                            showConfirmNotification()
                        }
                    })
                    .catch(function(err){
                        console.log('Error In Creating Push Notification',err)
                    })
                }else{
                    //User Already Has A Subscription 
                }
        })
        .catch(function(err){
            console.log('Error In Push Notification',err)
        })
        // .then(function(newSubscription){
        //     console.log('newSubscription',newSubscription)
        //    return fetch('https://pwagrant-ebc19.firebaseio.com/subscription.json',{
        //         method: 'POST',
        //         headers: {
        //         'Content-Type': 'application/json',
        //         'Accept': 'application/json'
        //         },
        //         body: JSON.stringify(newSubscription)
        //     })
        // })
        // .then(function(res){
        //     console.log(res)
        //     if(res.ok){
        //         showConfirmNotification()
        //     }
        // })
        // .catch(function(err){
        //     console.log('Error In Creating Push Notification',err)
        // })
}

function askForNotificationPersmission() {
    Notification.requestPermission(function (userChoice) {
        console.log('UserChoice on Notification', userChoice)
        if (userChoice == 'granted') {
            // showConfirmNotification();
            configurePushSub()
        } else {
            console.log("User has denied to show Notification...")
        }
    })
}


if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
    for (let i = 0; i < notificationBtns.length; i++) {
        notificationBtns[i].addEventListener('click', askForNotificationPersmission)
    }
}


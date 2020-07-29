
var fireBaseUrl = 'https://us-central1-pwagrant-ebc19.cloudfunctions.net/storePostsData';

const dbPromise = idb.open('posts-store', 1, function (db) {
    if (!db.objectStoreNames.contains('posts')) {
        //keypath indexedDB ne kehse k e object ni key kai hase
        //ex. data = {id:"id_1",data:"data_1"}
        //so in indexedDB it will store like {"id_1":{id:"id_1",data:"data_1"}}
        db.createObjectStore('posts', { keyPath: 'id' })
    }

    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', { keyPath: 'id' })
    }
})


const writeIndexDBData = function (st, data) {
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readwrite')
            var store = tx.objectStore(st);
            store.put(data)
            return tx.complete;
        })
}


const readAllData = function (st) {
    return dbPromise
        .then(function (db) {
            let tx = db.transaction(st, 'readonly')
            let store = tx.objectStore(st)
            return store.getAll();
        })
}


const clearAllData = function (st) {
    return dbPromise
        .then(function (db) {
            let tx = db.transaction(st, 'readwrite')
            let store = tx.objectStore(st);
            store.clear();
            return tx.complete
        })
}

const cleatItemFromDB = function (st, id) {
    dbPromise
        .then(function (db) {
            let tx = db.transaction(st, 'readwrite');
            let store = tx.objectStore(st);
            store.delete(id)
            return tx.complete;
        })
        .then(function () {
            console.log("Item deleted with ID", id)
        })
}


const sendData = function (dt) {
    var postData = new FormData();
    postData.append('id', dt.id);
    postData.append('title', dt.title);
    postData.append('location', dt.location);
    postData.append('file', dt.image, dt.id + '.png');
    postData.append('rawLocationLat', dt.lat);
    postData.append('rawLocationLng', dt.lng);
    return fetch(fireBaseUrl, {
        method: 'Post',
        body:postData
    })
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  }

function isWorkBoxEnable(){
    let params = new URL(location.href).searchParams;
    if(params.get('workbox') == "true"){
        return true;
    }
    return false

}
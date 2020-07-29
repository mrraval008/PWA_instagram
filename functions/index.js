const functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webPush = require('web-push'); 
var Busboy = require("busboy");
var UUID = require('uuid-v4');
var fs = require("fs");
var path = require('path');
var os = require("os");




// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./pwagrant-key.json");

var gcconfig = {
    projectId: "pwagrant-ebc19",
    keyFilename: "pwagrant-key.json"
  };
  
  var gcs = require("@google-cloud/storage")(gcconfig);
  

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:'https://pwagrant-ebc19.firebaseio.com/'
});

exports.storePostsData = functions.https.onRequest(function(request, response) {
    cors(request, response, function() {
                // response.set("Access-Control-Allow-Origin", "*");

      var uuid = UUID();
  
      const busboy = new Busboy({ headers: request.headers });
      // These objects will store the values (file + fields) extracted from busboy
      let upload;
      const fields = {};
  
      // This callback will be invoked for each file uploaded
      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        console.log(
          `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
        );
        const filepath = path.join(os.tmpdir(), filename);
        upload = { file: filepath, type: mimetype };
        file.pipe(fs.createWriteStream(filepath));
      });
  
      // This will invoked on every field detected
      busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        fields[fieldname] = val;
      });
  
      // This callback will be invoked after all uploaded files are saved.
      busboy.on("finish", () => {
        var bucket = gcs.bucket("pwagrant-ebc19.appspot.com");
        bucket.upload(
          upload.file,
          {
            uploadType: "media",
            metadata: {
              metadata: {
                contentType: upload.type,
                firebaseStorageDownloadTokens: uuid
              }
            }
          },
          function(err, uploadedFile) {
            if (!err) {
              admin
                .database()
                .ref("posts")
                .push({
                    id:fields.id,
                  title: fields.title,
                  location: fields.location,
                  rawLocationLat:fields.rawLocationLat,
                  rawLocationLng:fields.rawLocationLng,
                  image:
                    "https://firebasestorage.googleapis.com/v0/b/" +
                    bucket.name +
                    "/o/" +
                    encodeURIComponent(uploadedFile.name) +
                    "?alt=media&token=" +
                    uuid
                
                })
                .then(function() {
                  webPush.setVapidDetails(
                    'mailto:milanraval008@gmail.com',
                    'BCIwcFKQA6tBL9OTrZsI-Nw_26v5V2BedStICROMJYXeBE4R5INT2Z9X190xg29WAAAVXXoLDT04Bw856awm5n4',
                    'uXV1hFQgM6v8j9CfM8hSJMoXTQqL3zXY3KfMUmejTxE'
                  );
                    return admin.database().ref('subscription').once('value')
                })
                .then(function(subscriptions) {
                  subscriptions.forEach(function(sub) {
                    var pushConfig = {
                      endpoint: sub.val().endpoint,
                      keys: {
                        auth: sub.val().keys.auth,
                        p256dh: sub.val().keys.p256dh
                      }
                    };
  
                    webPush
                      .sendNotification(
                        pushConfig,
                        JSON.stringify({
                          title: "New Post",
                          content: "New Post added!",
                          openUrl: "/help"
                        })
                      )
                      .catch(function(err) {
                        console.log(err);
                      });
                  });
                  response
                    .status(201)
                    .json({ message: "Data stored", id: fields.id });
                })
                .catch(function(err) {
                  response.status(500).json({ error: err });
                });
            } else {
              console.log(err);
            }
          }
        );
      });
  
      // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
      // a callback when it's finished.
      busboy.end(request.rawBody);
      // formData.parse(request, function(err, fields, files) {
      //   fs.rename(files.file.path, "/tmp/" + files.file.name);
      //   var bucket = gcs.bucket("pwagrant-ebc19.appspot.com");
      // });
    });
  });

// exports.storePostsData = functions.https.onRequest( function(request, response){
//     cors(request,response,function(){
//         response.set("Access-Control-Allow-Origin", "*");
        
//         admin.database().ref('posts').push({
//             id:request.body.id,
//             title:request.body.title,
//             location:request.body.location,
//             image:request.body.image,
//         })
//         .then(function(){
//             webPush.setVapidDetails(
//                 'mailto:milanraval008@gmail.com',
//                 'BCIwcFKQA6tBL9OTrZsI-Nw_26v5V2BedStICROMJYXeBE4R5INT2Z9X190xg29WAAAVXXoLDT04Bw856awm5n4',
//                 'uXV1hFQgM6v8j9CfM8hSJMoXTQqL3zXY3KfMUmejTxE'
//             )
//             return admin.database().ref('subscription').once('value')
//         })
//         .then(function(subscriptions){
//                 console.log(subscriptions)
//                 //send Push Notification to all 
//                 subscriptions.forEach(function(sub){
//                     var pushSubscription = {
//                         endpoint: sub.val().endpoint,
//                         keys: {
//                           auth: sub.val().keys.auth,
//                           p256dh: sub.val().keys.p256dh
//                         }
//                     }
//                     webPush.sendNotification(pushSubscription,JSON.stringify({
//                         title: 'New Post',
//                         content: 'New Post added!',
//                         openUrl: '/help'
//                       }))
//                     .catch(function(err){
//                         console.log('Error in pushing Notifiaction',err)
//                     })
//                 })
//                 response.status(201).json({'message':'Data Stored',id:request.body.id,subscriptions});
//         })
//         .catch(function(err){
//             response.status(500).json({'error':err})
            
//         })
//     })
// });

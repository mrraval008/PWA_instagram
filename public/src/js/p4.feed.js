var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var formElem = document.querySelector('form');
var titleElem = document.getElementById('title');
var locationElem = document.getElementById('location');
var videoElem = document.getElementById('player');
var canvasElem = document.getElementById('canvas');
var captureBtn = document.getElementById('capture-btn');
var pickImgElem = document.getElementById('pick-image');
var picture;
var locationBtnElem = document.getElementById('location-btn');
var locationLoaderElem = document.getElementById('location-loader');
var fetchedLocation = {lat: 0, lng: 0};
let url = 'https://pwagrant-ebc19.firebaseio.com/posts.json'


locationBtnElem.addEventListener('click',function(){
  
    navigator.geolocation.getCurrentPosition(
      function(position){
          locationBtnElem.style.display = 'none';
          locationLoaderElem.style.display = 'inline-block';
          fetchedLocation =  {lat: position.coords.latitude, lng:  position.coords.longitude}
          locationElem.value = 'In Bangalore';
          document.querySelector('#manual-location').classList.add('is-focused');
          locationLoaderElem.style.display = 'none';
          
      },
      function(err){
        locationBtnElem.style.display = 'inline';
        locationLoaderElem.style.display = 'none';
        fetchedLocation =  {lat:0, lng: 0}
        console.log(err)
      },
      {timeout:7000})
})

function initializeLocation(){
  if(!('geolocation' in navigator)){
    return
  }
}

function initializeMedia(){
    if(!('mediaDevices' in navigator)){
      navigator.mediaDevices = {}
    }

    if(!('getUserMedia' in navigator.mediaDevices)){
      navigator.mediaDevices.getUserMedia = function(constraints){
          var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

          if(!getUserMedia){
            return Promise.reject(new Error('getUserMedia is not implemented!'))
          }
          return new Promise(function(resolve,reject){
            getUserMedia.call(navigator,constraints,resolve,reject)
          })
      }
    }

    navigator.mediaDevices.getUserMedia({video:true})
      .then(function(stream){
        videoElem.srcObject = stream;
        videoElem.style.display = 'block';
      }).catch(function(err){
        pickImgElem.style.display = 'block'
        captureBtn.style.display = 'none';
      })
}

pickImgElem.addEventListener('change', function (event) {
  picture = event.target.files[0];
});

captureBtn.addEventListener('click',function(){
  videoElem.style.display = 'none';
  canvasElem.style.display = 'block';
  captureBtn.style.display = 'none';
  var context = canvasElem.getContext('2d');
  context.drawImage(videoElem,0 , 0, canvas.width, videoElem.videoHeight / (videoElem.videoWidth / canvas.width));
  videoElem.srcObject.getVideoTracks().forEach(function(track){
      track.stop();
  })
  picture = dataURItoBlob(canvasElem.toDataURL());
})


function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  createPostArea.style.transform = 'translateY(0)';
  initializeMedia();
  initializeLocation();
  if(deferredPrompt){
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(function(choiceResult){
        console.log(choiceResult.outcome);
        if (choiceResult.outcome === 'dismissed') {
          console.log('User cancelled installation');
        } else {
          console.log('User added to home screen');
        }
      })
      deferredPrompt = null
  }

  // To Unregister service worker
  // if('serviceWorker' in navigator){
  //         navigator.serviceWorker.getRegistrations()
  //           .then(function(regi){
  //               for(let i=0;i<regi.length;i++){
  //                 regi[i].unregister()
  //               }
  //           })

  // }

}

function closeCreatePostModal() {
  pickImgElem.style.display = 'none';
  videoElem.srcObject.getVideoTracks().forEach(function(track){
      track.stop();
  })
  videoElem.style.display = 'none';
  canvasElem.style.display = 'none';
  captureBtn.style.display = 'inline';
  locationLoaderElem.style.display = 'none';
  locationBtnElem.style.display = 'inline';
  // createPostArea.style.display = 'none';
  createPostArea.style.transform = 'translateY(100vh)';
  
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = `${data.title}`;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent =  `${data.location}`;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}


function updateUI(data){
  clearCards()
  data.forEach(element => {
        createCard(element)
  });
}

let isNetworkReceived = false
fetch(url)
  .then(function(resp){
  return resp.json()
  })
  .then(function(respData){
    isNetworkReceived = true;
    console.log('From Web',respData)
    let dataArr = [];
    for(let key in respData){
      dataArr.push(respData[key])
    }
    updateUI(dataArr)
  })


if('caches' in window){
    caches.match(url)
          .then(function(data){
              if(data){
                return data.json();
              }
          })
          .then(function(respData){
              console.log('From Cache',respData)
              if(!isNetworkReceived){
                let dataArr = [];
                for(let key in respData){
                  dataArr.push(respData[key])
                }
                updateUI(dataArr)
              }
          })
}

if('indexedDB' in window){
  readAllData('posts')
    .then(function(data){
      if(!isNetworkReceived){
        console.log('from IndexeDB Cache',data)
        updateUI(data)
      }
  })
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);


// const sendData = function(post){
//   fetch(fireBaseUrl,{
//     method:'Post',
//     headers:{
//       'Content-Type':'application/json',
//       'Accept':'application/json'
//     },
//     body:JSON.stringify(post)
//   })
//   .then(function(res){
//     console.log('send Data',res)
//   })
// }


formElem.addEventListener('submit',function(event){
  var isWorkBox = false;
  if(isWorkBoxEnable()){
    isWorkBox = true;
  }
  event.preventDefault()
    if(titleElem.value.trim() == '' || locationElem.value.trim() == ''){
        alert('Provide valid values');
        return;
    }
    closeCreatePostModal();
    let post = {
      id:new Date().toISOString(),
      title:titleElem.value,
      location:locationElem.value,
      image:picture,
      rawLocationLat: fetchedLocation.lat,
      rawLocationLng: fetchedLocation.lng
      // "https://firebasestorage.googleapis.com/v0/b/pwagrant-ebc19.appspot.com/o/images.jpg?alt=media&token=86ec2385-dbbb-4323-bfed-a3d9fe35495a"
    }
    if('serviceWorker' in navigator && 'SyncManager' in window && !isWorkBox){
      navigator.serviceWorker.ready
        .then(function(sw){
          writeIndexDBData('sync-posts',post)
            .then(function(){
              return sw.sync.register('sync-new-post')
            })
            .then(function(){
              var snackbarContainer = document.querySelector('#confirmation-toast');
              var data = {message: 'Your post was saved for syncing!'};
              snackbarContainer.MaterialSnackbar.showSnackbar(data);
            })
            .catch(err=>{
              console.log(err)
            })
        })
    }else{
      sendData(post)
        .then(function(res){
            console.log('Send Data',res)
        })
    }
})

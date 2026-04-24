importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')
 
firebase.initializeApp({
  apiKey: "AIzaSyCOao0HHSgr92kjqyvEoafEE3ozB_ygIWw",
  authDomain: "shankly-schedule.firebaseapp.com",
  databaseURL: "https://shankly-schedule-default-rtdb.firebaseio.com",
  projectId: "shankly-schedule",
  storageBucket: "shankly-schedule.appspot.com",
  messagingSenderId: "939898424652",
  appId: "1:939898424652:web:e5d6923ea5b2d82c4a93e9"
})
 
const messaging = firebase.messaging()
 
// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    tag: title + body,
    renotify: false
  })
})
 
// Intercept ALL push events to prevent FCM from showing its own notification
self.addEventListener('push', function(event) {
  event.stopImmediatePropagation()
}, true)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Config will be replaced or managed via background sync ideally, 
// but for static public files we need the hardcoded values or a dynamic route.
// Since we are in AI Studio, I will use the values from the config file.

firebase.initializeApp({
  projectId: "gen-lang-client-0044483065",
  appId: "1:32186434162:web:f46837f51a40712ea5f8eb",
  apiKey: "AIzaSyA3Mms7btL6eGHa3zc4wEUycFICZBlkXVU",
  authDomain: "gen-lang-client-0044483065.firebaseapp.com",
  messagingSenderId: "32186434162",
  storageBucket: "gen-lang-client-0044483065.firebasestorage.app",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg', // Default icon
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

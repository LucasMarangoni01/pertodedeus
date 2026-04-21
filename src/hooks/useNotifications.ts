import { useEffect, useState } from 'react';
import { messaging, db } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// IMPORTANT: Replace with your actual VAPID key from Firebase Console -> Project Settings -> Cloud Messaging
const VAPID_KEY = "BHfvO4Q7ulfq_Cbzf_OvpiuiUxDZfXR7VAQXDBOuG8VhZGxl4hrSrYEjovzZ5rnUh7BQkk1GYcBjcB44ax6TcDQ";

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (!messaging) return false;
    
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token && user) {
          console.log('FCM Token:', token);
          // Store token in Firestore
          await updateDoc(doc(db, 'users', user.uid), {
            fcmTokens: arrayUnion(token)
          });
        }
        return true;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
    }
    return false;
  };

  useEffect(() => {
    if (!messaging) return;

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // You can trigger a custom toast or UI notification here
      if (typeof window !== 'undefined' && 'Notification' in window) {
         new Notification(payload.notification?.title || 'Nova Notificação', {
           body: payload.notification?.body,
           icon: '/vite.svg'
         });
      }
    });

    return () => unsubscribe();
  }, []);

  return { permission, requestPermission };
}

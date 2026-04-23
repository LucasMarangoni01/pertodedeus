import { useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function useNotificationTriggers() {
  const { user } = useAuth();
  const lastChatTime = useRef<number>(Date.now());
  const initialPrayerLoad = useRef(true);

  useEffect(() => {
    if (!user) return;

    // 1. Chat Notifications (Foreground/In-app simulator)
    const qChat = query(
      collection(db, "global_chat"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msg = change.doc.data();
          const msgTime = msg.createdAt?.toMillis() || Date.now();
          
          if (msg.userId !== user.uid && msgTime > lastChatTime.current) {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(`Nova mensagem de ${msg.userName}`, {
                body: msg.text,
                icon: '/vite.svg'
              });
            }
          }
          lastChatTime.current = Math.max(lastChatTime.current, msgTime);
        }
      });
    });

    // 2. Prayer Request Answer Notifications
    const qPrayer = query(
      collection(db, "prayer_requests"),
      where("userId", "==", user.uid),
      where("status", "==", "Respondido")
    );

    const unsubscribePrayer = onSnapshot(qPrayer, (snapshot) => {
      if (initialPrayerLoad.current) {
        initialPrayerLoad.current = false;
        return; // Don't notify on initial load of existing answered prayers
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const req = change.doc.data();
          if (req.status === "Respondido") {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification("Oração Respondida! 🙌", {
                body: `Deus ouviu seu clamor: "${req.title}". Veja o testemunho!`,
                icon: '/vite.svg'
              });
            }
          }
        }
      });
    });

    // 3. Devotional Reminder (Simple simulated daily reminder)
    const checkDevotionalReminder = () => {
       const lastReminder = localStorage.getItem('last_devotional_reminder');
       const today = new Date().toDateString();
       
       if (lastReminder !== today) {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             new Notification("Momento com Deus", {
               body: "Que tal fazer seu devocional de hoje? Fortaleça seu espírito!",
               icon: '/vite.svg'
             });
             localStorage.setItem('last_devotional_reminder', today);
          }
       }
    };

    const reminderInterval = setInterval(checkDevotionalReminder, 1000 * 60 * 60); // Check every hour
    checkDevotionalReminder(); // Initial check

    return () => {
      unsubscribeChat();
      unsubscribePrayer();
      clearInterval(reminderInterval);
    };
  }, [user]);
}

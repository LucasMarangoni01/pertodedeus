import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'motion/react';

export function NotificationManager() {
  const { permission, requestPermission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt if permission is not yet granted/denied
    if (permission === 'default') {
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) setShowPrompt(false);
  };

  if (permission === 'denied') return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
          >
            <div className="bg-navy border border-amber/20 p-6 rounded-[2rem] shadow-2xl space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber/10 rounded-2xl flex items-center justify-center text-amber">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold">Fique Conectado!</h3>
                  <p className="text-xs text-pearl/60">Deseja receber avisos sobre novas orações e mensagens da comunidade?</p>
                </div>
                <button onClick={() => setShowPrompt(false)} className="text-pearl/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleEnable}
                className="w-full bg-amber text-navy font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
              >
                Ativar Notificações
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { synchronizeOfflineQueue, getOfflineQueue } from '../../utils/offlineStorage';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState(''); // '', 'syncing', 'synced'
  const [syncedDetails, setSyncedDetails] = useState(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('syncing');

      try {
        const queue = await getOfflineQueue();
        if (queue.length > 0) {
          const syncRes = await synchronizeOfflineQueue();
          if (syncRes.success) {
            setSyncedDetails(syncRes.syncedCounts);
            setSyncStatus('synced');
            setTimeout(() => setSyncStatus(''), 5000);
          } else {
            setSyncStatus('');
          }
        } else {
          setSyncStatus('');
        }
      } catch (err) {
        console.error('Online auto-sync error:', err);
        setSyncStatus('');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check: if online and queue has items, sync
    if (navigator.onLine) {
      getOfflineQueue().then((q) => {
        if (q.length > 0) handleOnline();
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Offline Banner
  if (!isOnline) {
    return (
      <div style={{
        background: '#dc2626',
        color: '#ffffff',
        padding: '0.6rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 700,
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}>
        <span>⚠️</span>
        <span>
          You are currently <strong>Offline</strong>. Visited lessons remain available; your progress and quiz attempts are saved locally and will automatically synchronize when reconnected.
        </span>
      </div>
    );
  }

  // 2. Syncing Banner
  if (syncStatus === 'syncing') {
    return (
      <div style={{
        background: '#2563eb',
        color: '#ffffff',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 700,
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}>
        <span>🔄</span>
        <span>Back Online! Synchronizing your offline learning records to Learnitics cloud...</span>
      </div>
    );
  }

  // 3. Synced Success Banner
  if (syncStatus === 'synced') {
    return (
      <div style={{
        background: '#16a34a',
        color: '#ffffff',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 700,
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}>
        <span>✅</span>
        <span>
          Offline Synchronization Complete! Synced {syncedDetails?.lessonProgress || 0} lessons & {syncedDetails?.quizAttempts || 0} quiz attempts.
        </span>
      </div>
    );
  }

  return null;
}

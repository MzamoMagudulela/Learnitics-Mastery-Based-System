import api from '../services/api';

const DB_NAME = 'LearniticsOfflineDB';
const DB_VERSION = 1;
const STORE_LESSONS = 'offlineLessons';
const STORE_QUEUE = 'offlineQueue';

/**
 * Open or initialize IndexedDB
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      resolve(null); // Fallback to localStorage
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_LESSONS)) {
        db.createObjectStore(STORE_LESSONS, { keyPath: 'lessonId' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'clientSyncId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null); // Fallback to localStorage on error
  });
};

/**
 * Generate a unique clientSyncId (UUID-like)
 */
export const generateSyncId = () => {
  return 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

// ---------------------------------------------------------------------------
// 1. SAVE LESSON CONTENT FOR OFFLINE STUDY (IndexedDB + localStorage fallback)
// ---------------------------------------------------------------------------
export const saveLessonForOffline = async (lesson, course) => {
  const offlinePackage = {
    lessonId: lesson._id,
    courseId: course?._id,
    courseTitle: course?.title || 'Course',
    title: lesson.title,
    contentType: lesson.contentType,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    duration: lesson.duration,
    downloadedAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_LESSONS, 'readwrite');
        const store = tx.objectStore(STORE_LESSONS);
        const req = store.put(offlinePackage);
        req.onsuccess = () => resolve({ success: true, storage: 'indexedDB' });
        req.onerror = () => reject(req.error);
      });
    } else {
      // LocalStorage Fallback
      const existing = JSON.parse(localStorage.getItem('learnitics_offline_lessons') || '{}');
      existing[lesson._id] = offlinePackage;
      localStorage.setItem('learnitics_offline_lessons', JSON.stringify(existing));
      return { success: true, storage: 'localStorage' };
    }
  } catch (err) {
    console.error('Error saving lesson offline:', err);
    // LocalStorage Fallback
    const existing = JSON.parse(localStorage.getItem('learnitics_offline_lessons') || '{}');
    existing[lesson._id] = offlinePackage;
    localStorage.setItem('learnitics_offline_lessons', JSON.stringify(existing));
    return { success: true, storage: 'localStorage' };
  }
};

/**
 * Retrieve an offline saved lesson
 */
export const getOfflineLesson = async (lessonId) => {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_LESSONS, 'readonly');
        const store = tx.objectStore(STORE_LESSONS);
        const req = store.get(lessonId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } else {
      const existing = JSON.parse(localStorage.getItem('learnitics_offline_lessons') || '{}');
      return existing[lessonId] || null;
    }
  } catch (err) {
    const existing = JSON.parse(localStorage.getItem('learnitics_offline_lessons') || '{}');
    return existing[lessonId] || null;
  }
};

/**
 * Retrieve all offline lessons
 */
export const getAllOfflineLessons = async () => {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_LESSONS, 'readonly');
        const store = tx.objectStore(STORE_LESSONS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } else {
      const existing = JSON.parse(localStorage.getItem('learnitics_offline_lessons') || '{}');
      return Object.values(existing);
    }
  } catch (err) {
    const existing = JSON.parse(localStorage.getItem('learnitics_offline_lessons') || '{}');
    return Object.values(existing);
  }
};

// ---------------------------------------------------------------------------
// 2. QUEUE OFFLINE PROGRESS & QUIZ ATTEMPTS
// ---------------------------------------------------------------------------

/**
 * Queue lesson progress created while offline
 */
export const queueOfflineProgress = async (lessonId, progressData) => {
  const item = {
    clientSyncId: generateSyncId(),
    type: 'lessonProgress',
    lessonId,
    percentCompleted: progressData.percentCompleted || 100,
    status: progressData.status || 'completed',
    timeSpent: progressData.timeSpent || 0,
    completedAt: new Date().toISOString(),
  };

  await addToQueue(item);
  return item;
};

/**
 * Queue quiz attempt created while offline
 */
export const queueOfflineQuizAttempt = async (quizId, attemptData) => {
  const item = {
    clientSyncId: generateSyncId(),
    type: 'quizAttempt',
    quizId,
    answers: attemptData.answers || [],
    timeSpent: attemptData.timeSpent || 0,
    completedAt: new Date().toISOString(),
  };

  await addToQueue(item);
  return item;
};

const addToQueue = async (item) => {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.put(item);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } else {
      const queue = JSON.parse(localStorage.getItem('learnitics_sync_queue') || '[]');
      queue.push(item);
      localStorage.setItem('learnitics_sync_queue', JSON.stringify(queue));
      return true;
    }
  } catch (err) {
    const queue = JSON.parse(localStorage.getItem('learnitics_sync_queue') || '[]');
    queue.push(item);
    localStorage.setItem('learnitics_sync_queue', JSON.stringify(queue));
    return true;
  }
};

/**
 * Get all queued offline items
 */
export const getOfflineQueue = async () => {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } else {
      return JSON.parse(localStorage.getItem('learnitics_sync_queue') || '[]');
    }
  } catch (err) {
    return JSON.parse(localStorage.getItem('learnitics_sync_queue') || '[]');
  }
};

/**
 * Clear items from queue after successful sync
 */
export const clearSyncedQueue = async (syncedIds = []) => {
  if (!syncedIds || syncedIds.length === 0) return;

  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      syncedIds.forEach((id) => store.delete(id));
      await new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } else {
      const queue = JSON.parse(localStorage.getItem('learnitics_sync_queue') || '[]');
      const filtered = queue.filter((item) => !syncedIds.includes(item.clientSyncId));
      localStorage.setItem('learnitics_sync_queue', JSON.stringify(filtered));
    }
  } catch (err) {
    const queue = JSON.parse(localStorage.getItem('learnitics_sync_queue') || '[]');
    const filtered = queue.filter((item) => !syncedIds.includes(item.clientSyncId));
    localStorage.setItem('learnitics_sync_queue', JSON.stringify(filtered));
  }
};

// ---------------------------------------------------------------------------
// 3. SYNCHRONIZE BATCHED PAYLOAD TO POST /api/sync
// ---------------------------------------------------------------------------
export const synchronizeOfflineQueue = async () => {
  const queue = await getOfflineQueue();
  if (!queue || queue.length === 0) {
    return { synced: 0, message: 'Queue is empty' };
  }

  const lessonProgress = queue
    .filter((item) => item.type === 'lessonProgress')
    .map(({ type, ...rest }) => rest);

  const quizAttempts = queue
    .filter((item) => item.type === 'quizAttempt')
    .map(({ type, ...rest }) => rest);

  if (lessonProgress.length === 0 && quizAttempts.length === 0) {
    return { synced: 0, message: 'No items to sync' };
  }

  try {
    const res = await api.post('/sync', {
      lessonProgress,
      quizAttempts,
    });

    if (res.data.success) {
      const allSyncedIds = queue.map((item) => item.clientSyncId);
      await clearSyncedQueue(allSyncedIds);
      return {
        success: true,
        syncedCounts: res.data.syncedCounts,
        results: res.data.results,
      };
    }
    return { success: false, message: res.data.message };
  } catch (err) {
    console.error('Offline synchronization error:', err);
    return { success: false, error: err.message };
  }
};

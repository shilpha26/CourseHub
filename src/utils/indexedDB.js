// IndexedDB wrapper for storing video courses with video blobs

const DB_NAME = 'CourseHubDB';
const DB_VERSION = 1;
const COURSES_STORE = 'courses';
const VIDEOS_STORE = 'videos';

class CourseHubDB {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create courses object store
        if (!db.objectStoreNames.contains(COURSES_STORE)) {
          const coursesStore = db.createObjectStore(COURSES_STORE, { keyPath: 'id' });
          coursesStore.createIndex('name', 'name', { unique: false });
          coursesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create videos object store
        if (!db.objectStoreNames.contains(VIDEOS_STORE)) {
          const videosStore = db.createObjectStore(VIDEOS_STORE, { keyPath: 'id' });
          videosStore.createIndex('courseId', 'courseId', { unique: false });
        }
      };
    });
  }

  // Save a complete course with videos
  async saveCourse(course) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([COURSES_STORE, VIDEOS_STORE], 'readwrite');
    const coursesStore = transaction.objectStore(COURSES_STORE);
    const videosStore = transaction.objectStore(VIDEOS_STORE);

    // Prepare course metadata (without video blobs)
    const courseMetadata = {
      id: course.id,
      name: course.name,
      description: course.description || '',
      createdAt: course.createdAt || new Date().toISOString(),
      videoIds: course.videos.map(v => v.id)
    };

    // Save course metadata
    await coursesStore.put(courseMetadata);

    // Save each video with its blob
    for (const video of course.videos) {
      const videoData = {
        id: video.id,
        courseId: course.id,
        name: video.name,
        duration: video.duration || 0,
        watched: video.watched || false,
        progress: video.progress || 0,
        blob: video.blob || null,
        thumbnail: video.thumbnail || null,
        notes: video.notes || '' // Add notes field here
      };

      await videosStore.put(videoData);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(course.id);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get all courses with their videos
  async getAllCourses() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([COURSES_STORE, VIDEOS_STORE], 'readonly');
    const coursesStore = transaction.objectStore(COURSES_STORE);
    const videosStore = transaction.objectStore(VIDEOS_STORE);

    const courses = await new Promise((resolve, reject) => {
      const request = coursesStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Load videos for each course
    const coursesWithVideos = await Promise.all(
      courses.map(async (course) => {
        const videos = await new Promise((resolve, reject) => {
          const index = videosStore.index('courseId');
          const request = index.getAll(course.id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        // Create blob URLs for video playback
        const videosWithUrls = videos.map(video => ({
          ...video,
          url: video.blob ? URL.createObjectURL(video.blob) : null,
          thumbnailUrl: video.thumbnail ? URL.createObjectURL(video.thumbnail) : null
        }));

        return {
          ...course,
          videos: videosWithUrls
        };
      })
    );

    return coursesWithVideos;
  }

  // Update video progress
  async updateVideoProgress(videoId, progress, watched = false) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([VIDEOS_STORE], 'readwrite');
    const videosStore = transaction.objectStore(VIDEOS_STORE);

    const video = await new Promise((resolve, reject) => {
      const request = videosStore.get(videoId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (video) {
      video.progress = progress;
      video.watched = watched;
      await videosStore.put(video);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Save video notes
  async saveVideoNotes(videoId, notes) {
    try {
      if (!this.db) await this.init();

      console.log('Saving notes for video:', videoId);
      console.log('Notes content:', notes);

      const transaction = this.db.transaction([VIDEOS_STORE], 'readwrite');
      const videosStore = transaction.objectStore(VIDEOS_STORE);

      const video = await new Promise((resolve, reject) => {
        const request = videosStore.get(videoId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!video) {
        console.error('Video not found:', videoId);
        return false;
      }

      console.log('Found video:', video.name);
      video.notes = notes;
      await videosStore.put(video);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('✅ Notes saved successfully!');
          resolve(true);
        };
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      return false;
    }
  }

  // Delete a course and its videos
  async deleteCourse(courseId) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([COURSES_STORE, VIDEOS_STORE], 'readwrite');
    const coursesStore = transaction.objectStore(COURSES_STORE);
    const videosStore = transaction.objectStore(VIDEOS_STORE);

    // Delete course
    await coursesStore.delete(courseId);

    // Delete all videos for this course
    const index = videosStore.index('courseId');
    const videos = await new Promise((resolve, reject) => {
      const request = index.getAll(courseId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const video of videos) {
      if (video.blob) {
        URL.revokeObjectURL(URL.createObjectURL(video.blob));
      }
      await videosStore.delete(video.id);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get database size estimate
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usageInMB: (estimate.usage / 1024 / 1024).toFixed(2),
        quotaInMB: (estimate.quota / 1024 / 1024).toFixed(2),
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }
    return null;
  }
}

// Export singleton instance
const db = new CourseHubDB();
export default db;

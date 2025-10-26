const STORAGE_KEY = 'videoCoursePlayerData';

export const saveCourses = (courses) => {
  try {
    const dataToSave = courses.map(course => ({
      ...course,
      videos: course.videos.map(video => ({
        ...video,
        url: null // Don't save blob URLs
      }))
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadCourses = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
};

export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

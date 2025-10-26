import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import CourseList from './components/CourseList';
import VideoList from './components/VideoList';
import UploadModal from './components/UploadModal';
import courseHubDB from './utils/indexedDB';
import { generateId } from './utils/helpers';
import JSZip from 'jszip';
import './App.css';

function App() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('courses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load courses from IndexedDB on mount
  useEffect(() => {
    loadCoursesFromDB();
  }, []);

  const loadCoursesFromDB = async () => {
    try {
      setIsLoading(true);
      const loadedCourses = await courseHubDB.getAllCourses();
      setCourses(loadedCourses);
    } catch (error) {
      console.error('Error loading courses from IndexedDB:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleUpload = async (uploadData) => {
  const { option, courseId, title, description, files } = uploadData;

  let targetCourse = null;

  if (option === 'existing') {
    targetCourse = courses.find(c => c.id === courseId);
    if (!targetCourse) {
      alert('Course not found');
      return;
    }
  }

  // Separate ZIP files and video files
  const zipFiles = [];
  const videoFiles = [];

  for (const file of files) {
    if (file.name.endsWith('.zip')) {
      zipFiles.push(file);
    } else if (file.type.startsWith('video/')) {
      videoFiles.push(file);
    }
  }

  // Process ZIP files (each ZIP becomes its own course or adds to existing)
  for (const zipFile of zipFiles) {
    await handleZipFile(zipFile, option, targetCourse, title, description);
  }

  // Process ALL video files together as ONE course (THIS IS THE KEY FIX)
  if (videoFiles.length > 0) {
    await handleMultipleVideoFiles(videoFiles, option, targetCourse, title, description);
  }

  // Reload courses from DB
  await loadCoursesFromDB();
};

  const handleZipFile = async (zipFile, option, targetCourse, title, description) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const videos = [];

      for (const [filename, fileData] of Object.entries(zip.files)) {
        if (!fileData.dir && /\.(mp4|webm|ogg|mkv|avi)$/i.test(filename)) {
          const blob = await fileData.async('blob');
          const videoBlob = new Blob([blob], { type: 'video/mp4' });

          videos.push({
            id: generateId(),
            name: filename.split('/').pop(),
            blob: videoBlob,
            duration: 0,
            watched: false,
            progress: 0
          });
        }
      }

      if (videos.length > 0) {
        if (option === 'existing' && targetCourse) {
          // Add videos to existing course
          const updatedCourse = {
            ...targetCourse,
            videos: [...targetCourse.videos, ...videos]
          };
          await courseHubDB.saveCourse(updatedCourse);
        } else {
          // Create new course
          const newCourse = {
            id: generateId(),
            name: title || zipFile.name.replace('.zip', ''),
            description: description || '',
            videos: videos,
            createdAt: new Date().toISOString()
          };
          await courseHubDB.saveCourse(newCourse);
        }
      }
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      alert('Error processing ZIP file. Please try again.');
    }
  };

  // NEW FUNCTION: Handle multiple video files as ONE course with duplicate detection
const handleMultipleVideoFiles = async (videoFiles, option, targetCourse, title, description) => {
  let duplicates = [];
  let newVideoFiles = videoFiles;

  // Check for duplicates if adding to existing course
  if (option === 'existing' && targetCourse) {
    const existingVideoNames = targetCourse.videos.map(v => v.name.toLowerCase());
    
    duplicates = videoFiles.filter(file => 
      existingVideoNames.includes(file.name.toLowerCase())
    );

    newVideoFiles = videoFiles.filter(file => 
      !existingVideoNames.includes(file.name.toLowerCase())
    );

    // Show warning if duplicates found
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map(f => f.name).join('\n');
      const continueUpload = window.confirm(
        `⚠️ Duplicate Video${duplicates.length > 1 ? 's' : ''} Found!\n\n` +
        `The following video${duplicates.length > 1 ? 's already exist' : ' already exists'} in "${targetCourse.name}":\n\n` +
        `${duplicateNames}\n\n` +
        `${newVideoFiles.length > 0 
          ? `Do you want to upload the ${newVideoFiles.length} new video${newVideoFiles.length !== 1 ? 's' : ''}?` 
          : 'All videos are duplicates. Nothing to upload.'}`
      );

      if (!continueUpload || newVideoFiles.length === 0) {
        return;
      }
    }
  }

  // Create video objects for all non-duplicate files
  const newVideos = newVideoFiles.map(file => ({
    id: generateId(),
    name: file.name,
    blob: file,
    duration: 0,
    watched: false,
    progress: 0
  }));

  if (option === 'existing' && targetCourse) {
    // Add all new videos to existing course
    const updatedCourse = {
      ...targetCourse,
      videos: [...targetCourse.videos, ...newVideos]
    };
    await courseHubDB.saveCourse(updatedCourse);
    
    // Show success message
    if (newVideos.length > 0) {
      alert(`✅ ${newVideos.length} video${newVideos.length !== 1 ? 's' : ''} added to "${targetCourse.name}"!`);
    }
  } else {
    // Create ONE new course with ALL videos
    const newCourse = {
      id: generateId(),
      name: title || `Course - ${new Date().toLocaleDateString()}`,
      description: description || '',
      videos: newVideos,
      createdAt: new Date().toISOString()
    };
    await courseHubDB.saveCourse(newCourse);
    
    alert(`✅ Course "${newCourse.name}" created with ${newVideos.length} video${newVideos.length !== 1 ? 's' : ''}!`);
  }
};

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedVideo(course.videos[0]);
    setView('player');
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      await courseHubDB.deleteCourse(courseId);
      await loadCoursesFromDB();

      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setSelectedVideo(null);
        setView('courses');
      }
    }
  };

  const handleVideoComplete = async (videoId) => {
    if (selectedCourse) {
      await courseHubDB.updateVideoProgress(videoId, 100, true);
      await loadCoursesFromDB();

      // Update selected course
      const updated = courses.find(c => c.id === selectedCourse.id);
      if (updated) {
        setSelectedCourse(updated);
      }
    }
  };

  const handleProgressUpdate = async (videoId, progress) => {
    if (selectedCourse && progress > 0) {
      await courseHubDB.updateVideoProgress(videoId, progress, progress >= 95);
    }
  };

  const goBackToCourses = () => {
    setView('courses');
    setSelectedCourse(null);
    setSelectedVideo(null);
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <Header onUploadClick={handleUploadClick} />
        <div className="main-content">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header 
        onUploadClick={handleUploadClick}
        onBackClick={view === 'player' ? goBackToCourses : null}
      />

      {view === 'courses' ? (
        <CourseList 
          courses={courses}
          onCourseSelect={handleCourseSelect}
          onDeleteCourse={handleDeleteCourse}
        />
      ) : (
        <div className="player-view">
          <VideoPlayer 
            video={selectedVideo}
            onVideoComplete={handleVideoComplete}
            onProgressUpdate={handleProgressUpdate}
          />
          <VideoList 
            course={selectedCourse}
            selectedVideo={selectedVideo}
            onVideoSelect={handleVideoSelect}
          />
        </div>
      )}

      <UploadModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpload={handleUpload}
        existingCourses={courses}
      />
    </div>
  );
}

export default App;

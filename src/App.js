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

    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        await handleZipFile(file, option, targetCourse, title, description);
      } else if (file.type.startsWith('video/')) {
        await handleVideoFile(file, option, targetCourse, title, description);
      }
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
            blob: videoBlob, // Store blob instead of URL
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

  const handleVideoFile = async (file, option, targetCourse, title, description) => {
    const newVideo = {
      id: generateId(),
      name: file.name,
      blob: file, // Store blob directly
      duration: 0,
      watched: false,
      progress: 0
    };

    if (option === 'existing' && targetCourse) {
      const updatedCourse = {
        ...targetCourse,
        videos: [...targetCourse.videos, newVideo]
      };
      await courseHubDB.saveCourse(updatedCourse);
    } else {
      const newCourse = {
        id: generateId(),
        name: title || file.name.replace(/\.[^/.]+$/, ''),
        description: description || '',
        videos: [newVideo],
        createdAt: new Date().toISOString()
      };
      await courseHubDB.saveCourse(newCourse);
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

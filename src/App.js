import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import CourseList from './components/CourseList';
import VideoList from './components/VideoList';
import UploadModal from './components/UploadModal';
import NotesPanel from './components/NotesPanel';
import courseHubDB from './utils/indexedDB';
import { generateId } from './utils/helpers';
import * as zip from "@zip.js/zip.js";
import './App.css';

function App() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('courses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    const zipFiles = [];
    const videoFiles = [];

    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        zipFiles.push(file);
      } else if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      }
    }

    for (const zipFile of zipFiles) {
      await handleZipFile(zipFile, option, targetCourse, title, description);
    }

    if (videoFiles.length > 0) {
      await handleMultipleVideoFiles(videoFiles, option, targetCourse, title, description);
    }

    await loadCoursesFromDB();
  };

  const handleZipFile = async (zipFile, option, targetCourse, title, description) => {
    try {
      const fileSizeMB = zipFile.size / 1024 / 1024;
      if (fileSizeMB > 100) {
        console.log(`Processing large ZIP file (${fileSizeMB.toFixed(0)}MB)...`);
      }

      const zipReader = new zip.ZipReader(new zip.BlobReader(zipFile));
      const entries = await zipReader.getEntries();
      const videos = [];

      for (const entry of entries) {
        if (entry.directory) continue;
        
        const filename = entry.filename;
        
        if (/\.(mp4|webm|ogg|mkv|avi|mov)$/i.test(filename)) {
          console.log(`Extracting: ${filename} (${(entry.uncompressedSize / 1024 / 1024).toFixed(2)}MB)`);
          
          const videoBlob = await entry.getData(new zip.BlobWriter());
          
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

      await zipReader.close();

      if (videos.length === 0) {
        alert('No video files found in the ZIP archive.');
        return;
      }

      console.log(`Found ${videos.length} video(s)`);

      if (option === 'existing' && targetCourse) {
        const updatedCourse = {
          ...targetCourse,
          videos: [...targetCourse.videos, ...videos]
        };
        await courseHubDB.saveCourse(updatedCourse);
        alert(`✅ ${videos.length} video${videos.length !== 1 ? 's' : ''} added to "${targetCourse.name}"!`);
      } else {
        const newCourse = {
          id: generateId(),
          name: title || zipFile.name.replace('.zip', ''),
          description: description || '',
          videos: videos,
          createdAt: new Date().toISOString()
        };
        await courseHubDB.saveCourse(newCourse);
        alert(`✅ Course "${newCourse.name}" created with ${videos.length} video${videos.length !== 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      
      if (error.message && error.message.includes('memory')) {
        alert(
          '⚠️ ZIP file too large for browser memory!\n\n' +
          'Please extract the ZIP and upload videos individually.'
        );
      } else {
        alert('Error processing ZIP file. Please try again or upload videos individually.');
      }
    }
  };

  const handleMultipleVideoFiles = async (videoFiles, option, targetCourse, title, description) => {
    let duplicates = [];
    let newVideoFiles = videoFiles;

    if (option === 'existing' && targetCourse) {
      const existingVideoNames = targetCourse.videos.map(v => v.name.toLowerCase());
      
      duplicates = videoFiles.filter(file => 
        existingVideoNames.includes(file.name.toLowerCase())
      );

      newVideoFiles = videoFiles.filter(file => 
        !existingVideoNames.includes(file.name.toLowerCase())
      );

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

    const newVideos = newVideoFiles.map(file => ({
      id: generateId(),
      name: file.name,
      blob: file,
      duration: 0,
      watched: false,
      progress: 0
    }));

    if (option === 'existing' && targetCourse) {
      const updatedCourse = {
        ...targetCourse,
        videos: [...targetCourse.videos, ...newVideos]
      };
      await courseHubDB.saveCourse(updatedCourse);
      
      if (newVideos.length > 0) {
        alert(`✅ ${newVideos.length} video${newVideos.length !== 1 ? 's' : ''} added to "${targetCourse.name}"!`);
      }
    } else {
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

  const handleCourseSelect = async (course) => {
    if (!course || !course.videos || course.videos.length === 0) {
      alert('This course has no videos yet.');
      return;
    }
    
    // Reload fresh data from database
    const allCourses = await courseHubDB.getAllCourses();
    const freshCourse = allCourses.find(c => c.id === course.id);
    
    setSelectedCourse(freshCourse || course);
    setSelectedVideo(freshCourse?.videos[0] || course.videos[0]);
    setView('player');
  };

  const handleVideoSelect = async (video) => {
    // Reload course from database to get fresh notes
    const updatedCourses = await courseHubDB.getAllCourses();
    const updatedCourse = updatedCourses.find(c => c.id === selectedCourse?.id);
    
    if (updatedCourse) {
      setSelectedCourse(updatedCourse);
      const freshVideo = updatedCourse.videos.find(v => v.id === video.id);
      setSelectedVideo(freshVideo || video);
    } else {
      setSelectedVideo(video);
    }
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

  const handleDeleteVideo = async (videoId) => {
  if (!selectedCourse) return;

  if (window.confirm('Are you sure you want to delete this video?')) {
    const updatedVideos = selectedCourse.videos.filter(v => v.id !== videoId);
    
    const updatedCourse = {
      ...selectedCourse,
      videos: updatedVideos
    };

    await courseHubDB.saveCourse(updatedCourse);
    setSelectedCourse(updatedCourse);
    
    // If deleted video was selected, select first video or null
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(updatedVideos.length > 0 ? updatedVideos[0] : null);
    }
    
    await loadCoursesFromDB();
  }
};

  const handleVideoComplete = async (videoId) => {
    if (selectedCourse) {
      await courseHubDB.updateVideoProgress(videoId, 100, true);
      await loadCoursesFromDB();

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

  const handleSaveNotes = async (videoId, notes) => {
    try {
      await courseHubDB.saveVideoNotes(videoId, notes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleReorderVideos = async (newVideoOrder) => {
    if (!selectedCourse) return;
    
    const updatedCourse = {
      ...selectedCourse,
      videos: newVideoOrder
    };
    
    await courseHubDB.saveCourse(updatedCourse);
    setSelectedCourse(updatedCourse);
    await loadCoursesFromDB();
  };

  const handleAddVideosToExistingCourse = async (courseId, files) => {
  const course = courses.find(c => c.id === courseId);
  if (!course) {
    alert('Course not found');
    return;
  }

  await handleUpload({
    option: 'existing',
    courseId: courseId,
    title: '',
    description: '',
    files: files
  });

  // Reload the current course to show new videos immediately
  const updatedCourses = await courseHubDB.getAllCourses();
  const updatedCourse = updatedCourses.find(c => c.id === courseId);
  
  if (updatedCourse) {
    setSelectedCourse(updatedCourse);
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
          <div className="player-column">
            <VideoPlayer 
              video={selectedVideo}
              onVideoComplete={handleVideoComplete}
              onProgressUpdate={handleProgressUpdate}
            />
            <NotesPanel 
              video={selectedVideo}
              onSaveNotes={handleSaveNotes}
            />
          </div>
          <div className="sidebar-column">
            <VideoList 
              course={selectedCourse}
              selectedVideo={selectedVideo}
              onVideoSelect={handleVideoSelect}
              onReorderVideos={handleReorderVideos}
              onAddVideos={handleAddVideosToExistingCourse}
              onDeleteVideo={handleDeleteVideo}
            />
          </div>
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

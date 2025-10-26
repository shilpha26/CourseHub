import React, { useState, useEffect } from 'react';
import { VideoIcon, TrashIcon } from './Icons';
import { generateThumbnailFromFirstVideo } from '../utils/thumbnailGenerator';
import EmptyState from './EmptyState';

function CourseList({ courses, onCourseSelect, onDeleteCourse, onUploadClick }) {
  const [thumbnails, setThumbnails] = useState({});
  const [loadingThumbnails, setLoadingThumbnails] = useState({});
  const [showTip, setShowTip] = useState(true);

  const calculateCourseProgress = (course) => {
    if (!course.videos || course.videos.length === 0) {
      return { watchedCount: 0, totalCount: 0, progress: 0, lastWatchedIndex: -1, lastProgress: 0 };
    }

    const totalCount = course.videos.length;
    const watchedCount = course.videos.filter(v => v.watched).length;
    
    let lastWatchedIndex = -1;
    let lastProgress = 0;
    
    for (let i = course.videos.length - 1; i >= 0; i--) {
      if (course.videos[i].progress > 0) {
        lastWatchedIndex = i;
        lastProgress = course.videos[i].progress;
        break;
      }
    }
    
    const totalProgress = course.videos.reduce((sum, video) => sum + (video.progress || 0), 0);
    const overallProgress = totalProgress / totalCount;

    return { 
      watchedCount, 
      totalCount, 
      progress: overallProgress,
      lastWatchedIndex,
      lastProgress
    };
  };

  useEffect(() => {
    courses.forEach(async (course) => {
      if (!thumbnails[course.id] && !loadingThumbnails[course.id]) {
        setLoadingThumbnails(prev => ({ ...prev, [course.id]: true }));
        
        try {
          const thumbnail = await generateThumbnailFromFirstVideo(course);
          if (thumbnail) {
            setThumbnails(prev => ({ ...prev, [course.id]: thumbnail }));
          }
        } catch (error) {
          console.error('Failed to generate thumbnail for course:', course.name, error);
        } finally {
          setLoadingThumbnails(prev => ({ ...prev, [course.id]: false }));
        }
      }
    });
  }, [courses, thumbnails, loadingThumbnails]);

  if (courses.length === 0) {
    return <EmptyState onUploadClick={onUploadClick} />;
  }

  return (
    <div className="main-content">
      {showTip && (
        <div className="info-tip">
          <div className="info-tip-content">
            <span className="info-tip-icon">💡</span>
            <div className="info-tip-text">
              <strong>New to CourseHub?</strong>
              <p>Upload ZIP files with videos or individual video files to create your course library.</p>
            </div>
            <button onClick={() => setShowTip(false)} className="btn btn-secondary btn-small">
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="courses-grid">
        {courses.map(course => {
          const { watchedCount, totalCount, progress, lastWatchedIndex, lastProgress } = calculateCourseProgress(course);
          const hasThumbnail = thumbnails[course.id];
          const isLoadingThumbnail = loadingThumbnails[course.id];

          return (
            <div key={course.id} className="course-card">
              <div 
                className="course-thumbnail"
                style={hasThumbnail ? {
                  backgroundImage: `url(${thumbnails[course.id]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                } : {}}
              >
                {!hasThumbnail && !isLoadingThumbnail && (
                  <div className="no-thumbnail">
                    <VideoIcon />
                  </div>
                )}
                {isLoadingThumbnail && (
                  <div className="thumbnail-loading">
                    <div className="spinner"></div>
                  </div>
                )}
                {hasThumbnail && (
                  <div className="thumbnail-overlay">
                    <div className="play-overlay-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="course-info">
                <h3>{course.name}</h3>
                
                {course.description && (
                  <p className="course-description">{course.description}</p>
                )}
                
                <div className="course-stats">
                  <span className="stat-item">
                    <svg className="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 7l-7 5 7 5V7z"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    {totalCount} videos
                  </span>
                  <span className="stat-item">
                    <svg className="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {watchedCount} watched
                  </span>
                </div>
                
                {lastWatchedIndex >= 0 && lastProgress < 100 && (
                  <div className="last-watched-info">
                    <span className="last-watched-label">
                      Continue: Video {lastWatchedIndex + 1}
                    </span>
                    <span className="last-watched-progress">
                      {Math.round(lastProgress)}% complete
                    </span>
                  </div>
                )}
                
                <div className="course-progress">
                  <div className="progress-bar-small">
                    <div 
                      className="progress-filled-small"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{Math.round(progress)}%</span>
                </div>
              </div>
              
              <div className="course-actions">
                <button 
                  onClick={() => onCourseSelect(course)}
                  className="btn btn-primary btn-small"
                >
                  {progress > 0 && progress < 100 ? 'Continue' : progress === 100 ? 'Review' : 'Start'}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCourse(course.id);
                  }}
                  className="btn btn-secondary btn-small btn-icon"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourseList;

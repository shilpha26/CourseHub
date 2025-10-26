import React from 'react';
import { CheckIcon } from './Icons';

function VideoList({ course, selectedVideo, onVideoSelect }) {
  if (!course) return null;

  return (
    <div className="video-list">
      <div className="video-list-header">
        <h2>{course.name}</h2>
        <p>{course.videos.length} videos</p>
      </div>
      <div className="video-list-items">
        {course.videos.map((video, index) => (
          <div
            key={video.id}
            className={`video-item ${selectedVideo?.id === video.id ? 'active' : ''} ${video.watched ? 'watched' : ''}`}
            onClick={() => onVideoSelect(video)}
          >
            <div className="video-item-number">{index + 1}</div>
            <div className="video-item-info">
              <div className="video-item-title">{video.name}</div>
              {video.progress > 0 && video.progress < 100 && (
                <div className="video-item-progress">
                  <div 
                    className="progress-bar-tiny"
                    style={{ width: `${video.progress}%` }}
                  />
                </div>
              )}
            </div>
            {video.watched && (
              <div className="video-item-check">
                <CheckIcon />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoList;

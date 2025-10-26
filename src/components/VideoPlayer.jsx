import React, { useRef, useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  SkipBackIcon, 
  SkipForwardIcon, 
  VolumeIcon, 
  FullscreenIcon,
  TheaterIcon 
} from './Icons';
import { formatTime } from '../utils/helpers';

function VideoPlayer({ video, onVideoComplete, onProgressUpdate }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (video && videoRef.current) {
      videoRef.current.src = video.url;
      if (duration > 0) {
        videoRef.current.currentTime = (video.progress / 100) * duration || 0;
      }
      setIsPlaying(false);
    }
  }, [video, duration]); // ✅ Added duration to dependency array

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;

      if (video && onProgressUpdate) {
        onProgressUpdate(video.id, progress);
      }

      if (progress >= 95 && video && onVideoComplete) {
        onVideoComplete(video.id);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!video) {
    return (
      <div className="video-player">
        <div className="no-video">
          <p>Select a video to start watching</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`video-player ${isTheaterMode ? 'theater-mode' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      <div className={`video-controls ${showControls ? 'show' : ''}`}>
        <div 
          ref={progressBarRef}
          className="progress-bar"
          onClick={handleProgressClick}
        >
          <div 
            className="progress-filled"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button onClick={() => skip(-10)} className="control-btn">
              <SkipBackIcon />
            </button>
            <button onClick={togglePlay} className="control-btn play-btn">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={() => skip(10)} className="control-btn">
              <SkipForwardIcon />
            </button>
            <div className="volume-control">
              <button onClick={toggleMute} className="control-btn">
                <VolumeIcon muted={isMuted} volume={volume} />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="controls-right">
            <button onClick={toggleTheaterMode} className="control-btn">
              <TheaterIcon />
            </button>
            <button onClick={toggleFullscreen} className="control-btn">
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;

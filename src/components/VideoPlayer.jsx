import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  }, [video, duration]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const skip = useCallback((seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!videoRef.current.muted);
    }
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const videoElement = videoRef.current;
      if (!videoElement) return;

      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          break;

        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          break;

        case 'j':
          e.preventDefault();
          skip(-10);
          break;

        case 'l':
          e.preventDefault();
          skip(10);
          break;

        case 'ArrowUp':
          e.preventDefault();
          const newVolumeUp = Math.min(1, videoElement.volume + 0.1);
          videoElement.volume = newVolumeUp;
          setVolume(newVolumeUp);
          break;

        case 'ArrowDown':
          e.preventDefault();
          const newVolumeDown = Math.max(0, videoElement.volume - 0.1);
          videoElement.volume = newVolumeDown;
          setVolume(newVolumeDown);
          break;

        case 'm':
          e.preventDefault();
          toggleMute();
          break;

        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 't':
          e.preventDefault();
          toggleTheaterMode();
          break;

        case '0':
        case 'Home':
          e.preventDefault();
          videoElement.currentTime = 0;
          break;

        case 'End':
          e.preventDefault();
          videoElement.currentTime = videoElement.duration;
          break;

        default:
          if (e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const percent = parseInt(e.key) / 10;
            videoElement.currentTime = videoElement.duration * percent;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, skip, toggleMute, toggleFullscreen, toggleTheaterMode]);

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

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
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
            <button onClick={toggleTheaterMode} className="control-btn" title="Theater mode (T)">
              <TheaterIcon />
            </button>
            <button onClick={toggleFullscreen} className="control-btn" title="Fullscreen (F)">
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
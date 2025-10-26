import React, { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './VideoList.css';

// Sortable Video Item Component
function SortableVideoItem({ video, isSelected, onClick, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(video.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`video-item ${isSelected ? 'active' : ''} ${video.watched ? 'watched' : ''}`}
      onClick={onClick}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      
      <div className="video-info">
        <div className="video-name">{video.name}</div>
        {video.progress > 0 && video.progress < 100 && (
          <div className="video-progress-bar">
            <div 
              className="video-progress-fill" 
              style={{ width: `${video.progress}%` }}
            />
          </div>
        )}
      </div>

      {video.watched && (
        <div className="watched-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      <button 
        className="btn-delete-video" 
        onClick={handleDelete}
        title="Delete video"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </div>
  );
}

function VideoList({ course, selectedVideo, onVideoSelect, onReorderVideos, onAddVideos, onDeleteVideo }) {
  const [sortOption, setSortOption] = useState('custom');
  const [videos, setVideos] = useState(course?.videos || []);
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    if (course?.videos) {
      setVideos(course.videos);
    }
  }, [course?.videos]);

  const handleDeleteVideo = (videoId) => {
    if (onDeleteVideo) {
      onDeleteVideo(videoId);
    }
  }; // ✅ Added closing brace

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setVideos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        if (onReorderVideos) {
          onReorderVideos(newOrder);
        }
        
        return newOrder;
      });
    }
  };

  const handleSort = (option) => {
    setSortOption(option);
    
    let sorted = [...videos];
    
    switch(option) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date-asc':
        sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
      case 'date-desc':
        sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'custom':
      default:
        sorted = course?.videos || [];
        break;
    }
    
    setVideos(sorted);
    
    if (option !== 'custom' && onReorderVideos) {
      onReorderVideos(sorted);
    }
  };

  const handleAddVideosClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && onAddVideos) {
      onAddVideos(course.id, files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!course) {
    return (
      <div className="video-list">
        <div className="no-course">
          <p>No course selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-list">
      <div className="video-list-header">
        <div className="header-content">
          <div className="header-title">
            <h3>{course.name}</h3>
            <p className="video-count">{videos.length} videos</p>
          </div>
          <button 
            className="btn-add-video" 
            onClick={handleAddVideosClick}
            title="Add videos to this course"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,.zip"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="sort-controls">
        <select 
          value={sortOption} 
          onChange={(e) => handleSort(e.target.value)}
          className="sort-select"
        >
          <option value="custom">Custom Order</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="date-desc">Date (Newest)</option>
        </select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={videos.map(v => v.id)}
          strategy={verticalListSortingStrategy}
          disabled={sortOption !== 'custom'}
        >
          <div className="video-items">
            {videos.map((video) => (
              <SortableVideoItem
                key={video.id}
                video={video}
                isSelected={selectedVideo?.id === video.id}
                onClick={() => onVideoSelect(video)}
                onDelete={handleDeleteVideo}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
} // ✅ Only one closing brace here

export default VideoList;

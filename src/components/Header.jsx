import React from 'react';
import { UploadIcon } from './Icons';

function Header({ onUploadClick, onBackClick }) {
  return (
    <header className="header">
      <div className="header-content">
        {/* Left: Logo and Title - Always visible */}
        <div className="logo-section">
          <img 
            src={process.env.PUBLIC_URL + "/images/zip-folder-icon.png"}
            alt="CourseHub Logo" 
            width="45" 
            height="45"
            className="logo-icon"
          />
          <div className="logo-text">
            <span className="logo-title">CourseHub</span>
            <span className="logo-subtitle">Your Learning Companion</span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="header-actions">
          {onBackClick && (
            <button onClick={onBackClick} className="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              <span>Back</span>
            </button>
          )}
          <button onClick={onUploadClick} className="btn btn-primary">
            <UploadIcon />
            <span>Upload Course</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

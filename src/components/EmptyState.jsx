import React from 'react';

function EmptyState({ onUploadClick }) {
  return (
    <div className="main-content">
      <div className="empty-state">
        {/* Hero Section */}
          <h1 className="empty-state-title">Welcome to CourseHub</h1>
          <p className="empty-state-subtitle">Your Personal Offline Video Learning Platform</p>
        </div>

        {/* Features Section */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Upload Course ZIPs</h3>
            <p>Import entire courses by uploading ZIP files containing your video lessons</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎬</div>
            <h3>Watch Videos</h3>
            <p>Play videos with full controls, track progress, and resume where you left off</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Offline Storage</h3>
            <p>All videos stored locally in your browser - no internet required after upload</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Automatic progress tracking for each video and course completion status</p>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="getting-started">
          <h2>🚀 Getting Started</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Click "Upload Course"</h4>
                <p>Use the button in the header to get started</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Choose Your Files</h4>
                <p>Upload a ZIP file with videos or select individual video files</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Add Details</h4>
                <p>Give your course a name and optional description</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Start Learning!</h4>
                <p>Your videos are saved and ready to watch anytime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <strong>Privacy First:</strong> All your videos are stored locally in your browser. 
            Nothing is uploaded to any server - your content stays 100% private and secure.
          </div>
        </div>
      </div>
  );
}

export default EmptyState;

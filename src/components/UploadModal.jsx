import React, { useState, useRef } from 'react';
import './UploadModal.css';

function UploadModal({ isOpen, onClose, onUpload, existingCourses }) {
  const [selectedOption, setSelectedOption] = useState('existing');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    if (selectedOption === 'existing' && !selectedCourse) {
      alert('Please select a course');
      return;
    }

    if (selectedOption === 'new' && !newCourseTitle.trim()) {
      alert('Please enter a course title');
      return;
    }

    const uploadData = {
      option: selectedOption,
      courseId: selectedOption === 'existing' ? selectedCourse : null,
      title: selectedOption === 'new' ? newCourseTitle : '',
      description: courseDescription,
      files: selectedFiles
    };

    onUpload(uploadData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedOption('existing');
    setSelectedCourse('');
    setNewCourseTitle('');
    setCourseDescription('');
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Course Videos</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Course Selection Options */}
          <div className="form-group">
            <label className="form-label">Choose an option:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  value="existing"
                  checked={selectedOption === 'existing'}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  disabled={existingCourses.length === 0}
                />
                <span>Add to existing course</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="new"
                  checked={selectedOption === 'new'}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <span>Create new course</span>
              </label>
            </div>
          </div>

          {/* Existing Course Dropdown */}
          {selectedOption === 'existing' && (
            <div className="form-group">
              <label htmlFor="course-select" className="form-label">
                Select Course <span className="required">*</span>
              </label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="form-select"
                required
              >
                <option value="">-- Select a course --</option>
                {existingCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.videos.length} videos)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New Course Title */}
          {selectedOption === 'new' && (
            <>
              <div className="form-group">
                <label htmlFor="course-title" className="form-label">
                  Course Title <span className="required">*</span>
                </label>
                <input
                  id="course-title"
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Advanced React Development"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="course-description" className="form-label">
                  Course Description
                </label>
                <textarea
                  id="course-description"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="form-textarea"
                  placeholder="Describe what students will learn in this course..."
                  rows="4"
                />
              </div>
            </>
          )}

          {/* File Upload */}
          <div className="form-group">
            <label htmlFor="file-upload" className="form-label">
              Select Files <span className="required">*</span>
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".zip,video/*"
              multiple
              onChange={handleFileSelect}
              className="form-file-input"
              required
            />
            <div className="file-upload-hint">
              📁 Upload ZIP files or individual video files (MP4, WebM, etc.)
            </div>
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <p className="selected-files-title">
                  {selectedFiles.length} file(s) selected:
                </p>
                <ul className="selected-files-list">
                  {selectedFiles.map((file, index) => (
                    <li key={index}>
                      <span className="file-icon">
                        {file.name.endsWith('.zip') ? '📦' : '🎬'}
                      </span>
                      {file.name}
                      <span className="file-size">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Upload Videos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadModal;

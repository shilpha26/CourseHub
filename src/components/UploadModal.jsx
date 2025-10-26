import React, { useState, useRef, useEffect } from 'react';
import './UploadModal.css';

function UploadModal({ isOpen, onClose, onUpload, existingCourses }) {
  const [selectedOption, setSelectedOption] = useState('existing');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (existingCourses && existingCourses.length === 0) {
      setSelectedOption('new');
    } else if (existingCourses && existingCourses.length > 0) {
      setSelectedOption('existing');
      setSelectedCourse(existingCourses[0].id);
    }
  }, [existingCourses]);

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setTitle('');
      setDescription('');
      
      if (existingCourses && existingCourses.length === 0) {
        setSelectedOption('new');
      } else if (existingCourses && existingCourses.length > 0) {
        setSelectedOption('existing');
        setSelectedCourse(existingCourses[0]?.id || '');
      }
    }
  }, [isOpen, existingCourses]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert('Please select at least one video or ZIP file');
      return;
    }

    if (selectedOption === 'existing' && !selectedCourse) {
      alert('Please select a course');
      return;
    }

    if (selectedOption === 'new' && !title.trim()) {
      alert('Please enter a course title');
      return;
    }

    onUpload({
      option: selectedOption,
      courseId: selectedCourse,
      title,
      description,
      files,
    });

    setFiles([]);
    setTitle('');
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  const hasExistingCourses = existingCourses && existingCourses.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Course Videos</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Choose an option:</label>
            
            <div className="radio-options">
              <label className="radio-option-inline">
                <input
                  type="radio"
                  name="uploadOption"
                  value="existing"
                  checked={selectedOption === 'existing'}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  disabled={!hasExistingCourses}
                />
                <span>Add to existing course</span>
              </label>

              <label className="radio-option-inline">
                <input
                  type="radio"
                  name="uploadOption"
                  value="new"
                  checked={selectedOption === 'new'}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <span>Create new course</span>
              </label>
            </div>
          </div>

          {selectedOption === 'existing' && hasExistingCourses && (
            <div className="form-group">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="course-select"
                required
              >
                {existingCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedOption === 'new' && (
            <>
              <div className="form-group">
                <label className="form-label">Course Title <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Advanced React Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="course-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Description</label>
                <textarea
                  placeholder="Describe what students will learn in this course..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="course-textarea"
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Select Files <span className="required">*</span></label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,.zip"
              onChange={handleFileSelect}
              className="file-input"
              required
            />
            <p className="file-hint">📁 Upload ZIP files or individual video files (MP4, WebM, etc.)</p>
            
            {files.length > 0 && (
              <div className="selected-files">
                <p className="files-count">{files.length} file(s) selected</p>
                <ul className="files-list">
                  {files.map((file, index) => (
                    <li key={index}>
                      {file.name} <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
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

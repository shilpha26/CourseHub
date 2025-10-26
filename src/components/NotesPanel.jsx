import jsPDF from 'jspdf';
import './NotesPanel.css';
import React, { useState, useEffect, useRef } from 'react';

function NotesPanel({ video, onSaveNotes }) {
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const currentVideoIdRef = useRef(null);

  useEffect(() => {
    if (video && video.id !== currentVideoIdRef.current) {
      // Only update notes when switching to a different video
      setNotes(video.notes || '');
      currentVideoIdRef.current = video.id;
    }
  }, [video?.id]);

  const handleSave = async () => {
  if (!video) return;
  
  setIsSaving(true);
    try {
      await onSaveNotes(video.id, notes);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleAddTimestamp = () => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      const currentTime = videoElement.currentTime;
      const timestamp = formatTimestamp(currentTime);
      setNotes(prev => prev + `\n[${timestamp}] `);
    }
  };

  const formatTimestamp = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const exportAsText = () => {
    if (!video) return;
    
    let content = `Notes for: ${video.name}\n`;
    content += `${'='.repeat(video.name.length + 12)}\n\n`;
    content += notes || 'No notes taken yet.';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.name.replace(/\.[^/.]+$/, '')} - Notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAsPDF = () => {
    if (!video) return;
    
    const doc = new jsPDF();
    let yPosition = 20;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Notes for: ${video.name}`, 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const notesContent = notes || 'No notes taken yet.';
    const notesLines = doc.splitTextToSize(notesContent, 170);
    
    notesLines.forEach(line => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
    
    doc.save(`${video.name.replace(/\.[^/.]+$/, '')} - Notes.pdf`);
    setShowExportMenu(false);
  };

  if (!video) return null;

  return (
    <div className={`notes-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="notes-header">
        <div className="notes-title" onClick={() => setIsExpanded(!isExpanded)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Notes</span>
          {notes && notes.trim() && (
            <span className="notes-count">
              ({notes.split('\n').filter(l => l.trim()).length} lines)
            </span>
          )}
        </div>
        <div className="notes-actions" onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn-icon" 
            onClick={handleAddTimestamp}
            title="Add timestamp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              ircle cx="12" cy="12"2" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          
          <div className="export-dropdown">
            <button 
              className="btn-icon" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export notes"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            
            {showExportMenu && (
              <div className="export-menu">
                <button className="export-menu-item" onClick={exportAsText}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Export as Text
                </button>
                <button className="export-menu-item" onClick={exportAsPDF}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Export as PDF
                </button>
              </div>
            )}
          </div>
          
          <button 
            className="btn-icon" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isExpanded ? (
                <polyline points="18 15 12 9 6 15"/>
              ) : (
                <polyline points="6 9 12 15 18 9"/>
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="notes-body">
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Take notes while watching... Click the clock icon to add timestamps."
            rows="10"
          />
          <div className="notes-footer">
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
            {showSavedMessage && (
              <span className="saved-message">✓ Saved!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesPanel;

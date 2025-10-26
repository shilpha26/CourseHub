export const generateVideoThumbnail = async (videoUrl, seekTime = 0.25) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    
    video.style.display = 'none';
    canvas.style.display = 'none';
    video.crossOrigin = 'anonymous';
    
    video.addEventListener('loadedmetadata', () => {
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Seek to 25% of the video
      video.currentTime = video.duration * seekTime;
    });
    
    video.addEventListener('seeked', () => {
      try {
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        // Convert to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        video.remove();
        canvas.remove();
        
        resolve(thumbnailUrl);
      } catch (error) {
        reject(error);
      }
    });
    
    video.addEventListener('error', (error) => {
      video.remove();
      canvas.remove();
      reject(error);
    });
    
    video.src = videoUrl;
  });
};

export const generateThumbnailFromFirstVideo = async (course) => {
  if (!course.videos || course.videos.length === 0) {
    return null;
  }
  
  try {
    const firstVideo = course.videos[0];
    if (firstVideo.url) {
      const thumbnail = await generateVideoThumbnail(firstVideo.url, 0.1);
      return thumbnail;
    }
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
  
  return null;
};

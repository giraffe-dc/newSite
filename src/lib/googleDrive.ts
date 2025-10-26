export function extractGoogleDriveFileId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle different Google Drive URL formats
    if (urlObj.hostname === 'drive.google.com') {
      // Format: https://drive.google.com/file/d/{fileId}/view
      if (url.includes('/file/d/')) {
        const match = url.match(/\/file\/d\/([^/]+)/);
        return match ? match[1] : null;
      }
      
      // Format: https://drive.google.com/open?id={fileId}
      const idParam = urlObj.searchParams.get('id');
      if (idParam) {
        return idParam;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function getGoogleDriveImageUrl(fileId: string): string {
  // Use image proxy endpoint (we implemented /api/image)
  return `${process.env.NEXT_PUBLIC_API_URL || ''}/api/image?id=${fileId}`;
}
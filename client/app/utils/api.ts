const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.sohankumar.com'  // Note: changed to api.sohankumar.com for backend
  : 'http://localhost:8000';

export const getUserImages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/images`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch images');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user images:', error);
    return { images: [] };
  }
};

export const saveGeneratedImage = async (imageUrl: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/images`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!response.ok) throw new Error('Failed to save image');
    return await response.json();
  } catch (error) {
    console.error('Error saving image:', error);
    return { success: false };
  }
};
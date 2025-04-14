export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// frontend/src/lib/utils.js
export const convertImageForOfflineStorage = async (imageUrl) => {
  if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl;

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to convert image for offline storage:", error);
    return imageUrl; // Fall back to original URL if conversion fails
  }
};

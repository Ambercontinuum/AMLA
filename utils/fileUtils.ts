import { Attachment } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const processFiles = async (files: FileList | null): Promise<Attachment[]> => {
  if (!files) return [];
  
  const processedFiles: Attachment[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const base64Data = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      
      processedFiles.push({
        file,
        previewUrl,
        mimeType: file.type,
        base64Data
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }
  
  return processedFiles;
};
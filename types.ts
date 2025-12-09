export interface Attachment {
  file: File;
  previewUrl: string;
  mimeType: string;
  base64Data: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface VisualizationData {
  type: 'bar' | 'line' | 'scatter';
  data: any[];
  xKey: string;
  yKey: string;
  title?: string;
}

export type LoadingState = 'idle' | 'uploading' | 'thinking' | 'streaming';
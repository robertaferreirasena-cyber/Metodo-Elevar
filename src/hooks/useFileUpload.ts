import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadedFile {
  file: File;
  url?: string;
  uploading?: boolean;
  error?: string;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Máximo: 10MB`;
    }
    return null;
  };

  const upload = async (file: File): Promise<string | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload do arquivo');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultiple = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const url = await upload(file);
      if (url) {
        urls.push(url);
      }
    }
    
    return urls;
  };

  return { 
    upload, 
    uploadMultiple, 
    isUploading, 
    validateFile,
    maxFileSize: MAX_FILE_SIZE 
  };
}

import { useState, useCallback } from "react";
import { Upload, X, FileText, Image, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CatalogUploaderProps {
  fileUrls: string[];
  onFilesChange: (urls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
];

const FILE_ICONS: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "text/plain": FileText,
  "text/csv": FileText,
};

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  return FILE_ICONS[type] || File;
}

function getTypeBadge(type: string) {
  if (type === "application/pdf") return "PDF";
  if (type.startsWith("image/")) return "IMG";
  if (type === "text/csv") return "CSV";
  if (type === "text/plain") return "TXT";
  return "FILE";
}

export function CatalogUploader({
  fileUrls,
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10,
}: CatalogUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    const fileArray = Array.from(files);
    const remaining = maxFiles - fileUrls.length;

    if (remaining <= 0) {
      toast.error(`Máximo de ${maxFiles} arquivos`);
      return;
    }

    const validFiles = fileArray.slice(0, remaining).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: tipo não suportado`);
        return false;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${f.name}: excede ${maxSizeMB}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of validFiles) {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("product-catalogs")
        .upload(path, file, { contentType: file.type });

      if (error) {
        toast.error(`Erro ao enviar ${file.name}`);
        console.error("Upload error:", error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("product-catalogs")
        .getPublicUrl(path);

      // Since bucket is private, we store the path and will use service role in edge function
      newUrls.push(path);
    }

    if (newUrls.length > 0) {
      onFilesChange([...fileUrls, ...newUrls]);
      toast.success(`${newUrls.length} arquivo(s) enviado(s)`);
    }

    setUploading(false);
  }, [user, fileUrls, maxFiles, maxSizeMB, onFilesChange]);

  const removeFile = useCallback((index: number) => {
    const path = fileUrls[index];
    // Delete from storage
    supabase.storage.from("product-catalogs").remove([path]);
    onFilesChange(fileUrls.filter((_, i) => i !== index));
  }, [fileUrls, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = "";
    }
  }, [uploadFiles]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onClick={() => document.getElementById("catalog-file-input")?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Enviando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Arraste arquivos ou clique para selecionar
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              PDF, imagens (JPG/PNG), TXT • Máx {maxFiles} arquivos, {maxSizeMB}MB cada
            </span>
          </div>
        )}
        <input
          id="catalog-file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* File list */}
      {fileUrls.length > 0 && (
        <div className="space-y-1.5">
          {fileUrls.map((path, i) => {
            const fileName = path.split("/").pop() || path;
            const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
            return (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
              >
                <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 text-xs">{fileName}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {ext}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UserUploads({ onSelect }: { onSelect: (url: string) => void }) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<{ id: string; url: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchUploads = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("user-carousel-uploads")
      .list(user.id);
    
    if (error) {
      console.error("Error listing uploads:", error);
    } else if (data) {
      const urls = data.map(file => ({
        id: file.id,
        name: file.name,
        url: supabase.storage.from("user-carousel-uploads").getPublicUrl(`${user.id}/${file.name}`).data.publicUrl
      }));
      setUploads(urls);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUploads();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Limite removido a pedido do usuário


    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("user-carousel-uploads")
      .upload(filePath, file);

    if (error) {
      toast.error("Erro ao fazer upload");
    } else {
      toast.success("Upload concluído!");
      fetchUploads();
    }
    setUploading(false);
  };

  const deleteUpload = async (name: string) => {
    if (!user) return;
    const { error } = await supabase.storage
      .from("user-carousel-uploads")
      .remove([`${user.id}/${name}`]);

    if (error) {
      toast.error("Erro ao deletar");
    } else {
      fetchUploads();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold mb-1">Upload de Imagens</Label>
        <div className="flex flex-col gap-2">
          <Input 
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            className="hidden" 
            id="carousel-upload" 
            disabled={uploading}
          />
          <Button 
            variant="outline" 
            className="w-full gap-2 border-dashed border-2 h-20 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50" 
            asChild
            disabled={uploading}
          >
            <label htmlFor="carousel-upload" className="cursor-pointer">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="text-xs font-bold">{uploading ? "Subindo imagem..." : "Clique para subir qualquer imagem"}</span>
              {!uploading && <span className="text-[10px] opacity-60">Sem limite de tamanho</span>}
            </label>
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImagePlus className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs">Nenhum upload ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="relative group rounded-md overflow-hidden border aspect-square bg-muted">
                <img 
                  src={upload.url} 
                  alt={upload.name} 
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSelect(upload.url)}
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteUpload(upload.name)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

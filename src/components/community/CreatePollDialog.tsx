import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (question: string, options: string[]) => Promise<void>;
}

export function CreatePollDialog({ open, onOpenChange, onCreatePoll }: CreatePollDialogProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = async () => {
    if (!question.trim()) {
      toast.error('Digite uma pergunta');
      return;
    }

    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast.error('Adicione pelo menos 2 opções');
      return;
    }

    setCreating(true);
    try {
      await onCreatePoll(question.trim(), validOptions);
      setQuestion('');
      setOptions(['', '']);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Erro ao criar enquete');
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Criar Enquete
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Pergunta</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Qual é a sua pergunta?"
            />
          </div>

          <div className="space-y-2">
            <Label>Opções</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Opção ${index + 1}`}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            
            {options.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar opção
              </Button>
            )}
          </div>

          <Button onClick={handleCreate} className="w-full" disabled={creating}>
            {creating ? 'Criando...' : 'Criar Enquete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

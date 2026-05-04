import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, MessageCircle, Calculator, GraduationCap, Trophy, Sparkles, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingFlowProps {
  open: boolean;
  currentStep: number;
  onUpdateStep: (step: number) => Promise<void>;
  onComplete: () => Promise<void>;
}

const TOTAL_STEPS = 4;

export default function OnboardingFlow({ open, currentStep, onUpdateStep, onComplete }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(currentStep);
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [saving, setSaving] = useState(false);

  const goTo = async (s: number) => {
    setStep(s);
    await onUpdateStep(s);
  };

  const saveProfileAndContinue = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (name.trim()) {
        await supabase
          .from('profiles')
          .update({ full_name: name.trim() })
          .eq('id', user.id);
      }
      await goTo(2);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async (route?: string) => {
    await onComplete();
    if (route) navigate(route);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={e => e.preventDefault()}>
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Bem-vinda à Mentoria Elevar! 🎉</h2>
            <p className="text-sm text-muted-foreground">Sua plataforma exclusiva para elevar suas vendas pelo Instagram com inteligência artificial.</p>
            <div className="grid gap-3 text-left pt-2">
              {[
                { icon: Brain, text: 'Mentora Gi: sua IA de vendas pessoal' },
                { icon: MessageCircle, text: 'Estratégias prontas para Instagram' },
                { icon: GraduationCap, text: 'Módulos de aprendizado exclusivos' },
                { icon: Trophy, text: 'Gamificação e conquistas' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <Button className="w-full mt-2" onClick={() => goTo(1)}>
              Começar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">Conta um pouco sobre você</h2>
              <p className="text-sm text-muted-foreground">Isso ajuda a personalizar sua experiência</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="ob-name">Seu nome</Label>
                <Input id="ob-name" placeholder="Ex: Maria" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ob-niche">Seu nicho de atuação</Label>
                <Input id="ob-niche" placeholder="Ex: Moda feminina, Saúde..." value={niche} onChange={e => setNiche(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => goTo(0)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button className="flex-1" onClick={saveProfileAndContinue} disabled={saving}>
                {saving ? 'Salvando...' : 'Continuar'} {!saving && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">O que você pode fazer aqui</h2>
              <p className="text-sm text-muted-foreground">Conheça os recursos principais</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Brain, title: 'Mentora Gi', desc: 'Chat IA para tirar dúvidas de vendas', color: 'text-primary' },
                { icon: Calculator, title: 'Calculadora', desc: 'Calcule preços e margens', color: 'text-emerald-500' },
                { icon: GraduationCap, title: 'Aprendizado', desc: 'Aulas e módulos exclusivos', color: 'text-blue-500' },
                { icon: Trophy, title: 'Conquistas', desc: 'Ganhe XP e suba de nível', color: 'text-amber-500' },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <div key={i} className="rounded-lg border border-border p-3 text-center space-y-1">
                  <Icon className={`h-6 w-6 mx-auto ${color}`} />
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => goTo(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button className="flex-1" onClick={() => goTo(3)}>
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Tudo pronto! Por onde começar?</h2>
            <p className="text-sm text-muted-foreground">Escolha sua primeira ação na plataforma</p>
            <div className="space-y-2 pt-2">
              <Button className="w-full" onClick={() => handleFinish('/mentor')}>
                <Brain className="h-4 w-4 mr-2" /> Conversar com a Mentora Gi
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleFinish('/persona')}>
                <Brain className="h-4 w-4 mr-2" /> Criar Raio-X da Persona
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleFinish()}>
                Explorar sozinha
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

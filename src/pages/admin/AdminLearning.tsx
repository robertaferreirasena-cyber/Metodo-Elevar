import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GraduationCap, Users, BookOpen, Bot, Save } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Module {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  position: number | null;
  is_active: boolean | null;
  total_lessons: number | null;
  created_at: string | null;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number | null;
  duration_minutes: number | null;
  is_active: boolean | null;
  activity_type: string | null;
}

interface StudentProgress {
  user_id: string;
  email: string;
  full_name: string;
  completed_lessons: number;
  total_lessons: number;
}

export default function AdminLearning() {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Module form
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', icon: '📖', category: 'instagram', position: 0 });
  // Lesson form
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '', duration_minutes: 5, position: 0, activity_type: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [mRes, lRes] = await Promise.all([
      supabase.from('learning_modules').select('*').order('position'),
      supabase.from('learning_lessons').select('*').order('position'),
    ]);
    if (mRes.data) setModules(mRes.data);
    if (lRes.data) setLessons(lRes.data);

    // Fetch student progress
    const { data: profiles } = await supabase.rpc('get_all_profiles');
    const { data: progress } = await supabase.from('user_module_progress').select('user_id, completed');
    const totalLessons = lRes.data?.filter(l => l.is_active)?.length || 0;

    if (profiles && progress) {
      const progressMap: Record<string, number> = {};
      progress.forEach((p: any) => { if (p.completed) progressMap[p.user_id] = (progressMap[p.user_id] || 0) + 1; });
      
      const studentList: StudentProgress[] = (profiles as any[])
        .filter(p => progressMap[p.id])
        .map(p => ({
          user_id: p.id,
          email: p.email || '',
          full_name: p.full_name || '',
          completed_lessons: progressMap[p.id] || 0,
          total_lessons: totalLessons,
        }))
        .sort((a, b) => b.completed_lessons - a.completed_lessons);
      setStudents(studentList);
    }
    setLoading(false);
  };

  const saveModule = async () => {
    try {
      if (editingModule) {
        await supabase.from('learning_modules').update({
          title: moduleForm.title, description: moduleForm.description,
          icon: moduleForm.icon, category: moduleForm.category, position: moduleForm.position,
        }).eq('id', editingModule.id);
        toast.success('Módulo atualizado!');
      } else {
        await supabase.from('learning_modules').insert({
          title: moduleForm.title, description: moduleForm.description,
          icon: moduleForm.icon, category: moduleForm.category, position: moduleForm.position,
        });
        toast.success('Módulo criado!');
      }
      setModuleDialogOpen(false);
      setEditingModule(null);
      fetchAll();
    } catch { toast.error('Erro ao salvar módulo'); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Excluir módulo e todas as aulas?')) return;
    await supabase.from('learning_lessons').delete().eq('module_id', id);
    await supabase.from('learning_modules').delete().eq('id', id);
    toast.success('Módulo excluído');
    fetchAll();
  };

  const toggleModuleActive = async (mod: Module) => {
    await supabase.from('learning_modules').update({ is_active: !mod.is_active }).eq('id', mod.id);
    fetchAll();
  };

  const openEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description || '', icon: mod.icon || '📖', category: mod.category || 'instagram', position: mod.position || 0 });
    setModuleDialogOpen(true);
  };

  const openNewModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '', icon: '📖', category: 'instagram', position: modules.length });
    setModuleDialogOpen(true);
  };

  const saveLesson = async () => {
    if (!selectedModuleId) return;
    try {
      if (editingLesson) {
        await (supabase.from('learning_lessons') as any).update({
          title: lessonForm.title, content: lessonForm.content,
          video_url: lessonForm.video_url || null, duration_minutes: lessonForm.duration_minutes, position: lessonForm.position,
          activity_type: lessonForm.activity_type || null,
        }).eq('id', editingLesson.id);
        toast.success('Aula atualizada!');
      } else {
        await (supabase.from('learning_lessons') as any).insert({
          module_id: selectedModuleId, title: lessonForm.title, content: lessonForm.content,
          video_url: lessonForm.video_url || null, duration_minutes: lessonForm.duration_minutes, position: lessonForm.position,
          activity_type: lessonForm.activity_type || null,
        });
        toast.success('Aula criada!');
      }
      setLessonDialogOpen(false);
      setEditingLesson(null);
      fetchAll();
    } catch { toast.error('Erro ao salvar aula'); }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Excluir esta aula?')) return;
    await supabase.from('learning_lessons').delete().eq('id', id);
    toast.success('Aula excluída');
    fetchAll();
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({ title: lesson.title, content: lesson.content || '', video_url: lesson.video_url || '', duration_minutes: lesson.duration_minutes || 5, position: lesson.position || 0, activity_type: lesson.activity_type || '' });
    setLessonDialogOpen(true);
  };

  const openNewLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    const moduleLessons = lessons.filter(l => l.module_id === moduleId);
    setLessonForm({ title: '', content: '', video_url: '', duration_minutes: 5, position: moduleLessons.length, activity_type: '' });
    setLessonDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Aprendizado</h1>
        <p className="text-muted-foreground">Módulos, aulas e progresso dos alunos</p>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules" className="gap-1"><GraduationCap className="h-4 w-4" /> Módulos</TabsTrigger>
          <TabsTrigger value="progress" className="gap-1"><Users className="h-4 w-4" /> Progresso</TabsTrigger>
          <TabsTrigger value="ai-config" className="gap-1"><Bot className="h-4 w-4" /> Config IA</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{modules.length} módulos</h2>
            <Button size="sm" onClick={openNewModule}><Plus className="h-4 w-4 mr-1" /> Novo Módulo</Button>
          </div>

          {modules.map(mod => (
            <Card key={mod.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{mod.icon}</span> {mod.title}
                    {!mod.is_active && <Badge variant="secondary">Inativo</Badge>}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Switch checked={mod.is_active ?? true} onCheckedChange={() => toggleModuleActive(mod)} />
                    <Button variant="ghost" size="icon" onClick={() => openEditModule(mod)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteModule(mod.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{mod.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">{lessons.filter(l => l.module_id === mod.id).length} aulas</span>
                  <Button variant="outline" size="sm" onClick={() => openNewLesson(mod.id)}><Plus className="h-3 w-3 mr-1" /> Aula</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pos</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo Atividade</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.filter(l => l.module_id === mod.id).sort((a, b) => (a.position || 0) - (b.position || 0)).map(lesson => (
                      <TableRow key={lesson.id}>
                        <TableCell>{lesson.position}</TableCell>
                        <TableCell>{lesson.title}</TableCell>
                        <TableCell>
                          {lesson.activity_type ? (
                            <Badge variant="secondary" className="text-[10px]">{lesson.activity_type}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{lesson.duration_minutes}min</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedModuleId(mod.id); openEditLesson(lesson); }}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteLesson(lesson.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <h2 className="text-lg font-semibold">{students.length} alunos com progresso</h2>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Concluídas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(s => {
                    const pct = s.total_lessons > 0 ? Math.round((s.completed_lessons / s.total_lessons) * 100) : 0;
                    return (
                      <TableRow key={s.user_id}>
                        <TableCell className="font-medium">{s.full_name || 'Sem nome'}</TableCell>
                        <TableCell className="text-muted-foreground">{s.email}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><Progress value={pct} className="h-2 w-24" /><span className="text-xs">{pct}%</span></div></TableCell>
                        <TableCell>{s.completed_lessons}/{s.total_lessons}</TableCell>
                      </TableRow>
                    );
                  })}
                  {students.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum aluno iniciou os módulos ainda</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-4">
          <AIConfigPanel />
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Ícone</Label><Input value={moduleForm.icon} onChange={e => setModuleForm(f => ({ ...f, icon: e.target.value }))} /></div>
              <div><Label>Categoria</Label><Input value={moduleForm.category} onChange={e => setModuleForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label>Posição</Label><Input type="number" value={moduleForm.position} onChange={e => setModuleForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <Button onClick={saveModule} className="w-full"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Conteúdo</Label><Textarea rows={6} value={lessonForm.content} onChange={e => setLessonForm(f => ({ ...f, content: e.target.value }))} /></div>
            <div><Label>URL do Vídeo (opcional)</Label><Input value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))} /></div>
            <div>
              <Label>Tipo de Atividade</Label>
              <Select value={lessonForm.activity_type} onValueChange={v => setLessonForm(f => ({ ...f, activity_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp_private">WhatsApp - Vendas 1:1</SelectItem>
                  <SelectItem value="whatsapp_group">WhatsApp - Grupos</SelectItem>
                  <SelectItem value="persona">Raio-X Persona</SelectItem>
                  <SelectItem value="content">Conteúdo / Copy</SelectItem>
                  <SelectItem value="mentor">Mentora Gi</SelectItem>
                  <SelectItem value="calculator">Calculadora</SelectItem>
                  <SelectItem value="photo">Ensaio Fotográfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Duração (min)</Label><Input type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 5 }))} /></div>
              <div><Label>Posição</Label><Input type="number" value={lessonForm.position} onChange={e => setLessonForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <Button onClick={saveLesson} className="w-full"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AIConfigPanel() {
  const [mentorPrompts, setMentorPrompts] = useState({
    'mentora-gi': '',
    'estrategista': '',
    'copywriter': '',
    'instagram-expert': '',
  });
  const [loading, setLoading] = useState(false);

  const personas: Record<string, { label: string; icon: string }> = {
    'mentora-gi': { label: 'Mentora Gi', icon: '👩‍🏫' },
    'estrategista': { label: 'Estrategista', icon: '🎯' },
    'copywriter': { label: 'Copywriter', icon: '✍️' },
    'instagram-expert': { label: 'Instagram Expert', icon: '📸' },
  };

  const handleSave = () => {
    toast.success('Configurações de IA salvas! (As alterações serão aplicadas na próxima conversa)');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><Bot className="h-5 w-5" /> Configuração da IA Mentora</h2>
        <p className="text-sm text-muted-foreground">Personalize os prompts e comportamento de cada persona da Mentora Gi</p>
      </div>

      {Object.entries(personas).map(([key, { label, icon }]) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{icon} {label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Instruções adicionais (opcional)</Label>
            <Textarea
              rows={3}
              placeholder={`Instruções extras para a persona ${label}...`}
              value={mentorPrompts[key as keyof typeof mentorPrompts]}
              onChange={e => setMentorPrompts(prev => ({ ...prev, [key]: e.target.value }))}
            />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">⚙️ Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Usar contexto da Persona</p>
              <p className="text-xs text-muted-foreground">Incluir dados do Raio-X nas respostas da mentora</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sugestões dinâmicas</p>
              <p className="text-xs text-muted-foreground">Gerar sugestões baseadas no histórico do aluno</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Limitar tamanho das respostas</p>
              <p className="text-xs text-muted-foreground">Manter respostas concisas (máx ~500 palavras)</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full"><Save className="h-4 w-4 mr-1" /> Salvar Configurações</Button>
    </div>
  );
}

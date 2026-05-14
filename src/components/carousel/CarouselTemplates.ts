export type CarouselLayout =
  | "text-only"
  | "image-bg"
  | "profile-post"
  | "photo-grid"
  | "sales-highlight"
  | "editorial"
  | "tweet-post"
  | "prompt-card"
  | "sticker-card"
  // ===== Família Journaling (papelaria orgânica) =====
  | "journal-note"        // folha de caderno + selo dourado
  | "journal-tape"        // folha presa com fita + card destaque
  | "journal-photo-card"  // foto de fundo + card colorido sobreposto
  | "journal-binder"      // espiral metálico no topo
  | "journal-torn-paper"  // papel rasgado sobre foto
  | "journal-envelope";   // envelope aberto + selo de cera

export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16";

export interface FormatSpec {
  width: number;
  height: number;
  label: string;
  titleSize: number;
  bodySize: number;
}

export const FORMAT_SPECS: Record<AspectRatio, FormatSpec> = {
  "1:1":  { width: 1080, height: 1080, label: "Feed 1:1",    titleSize: 42, bodySize: 26 },
  "4:5":  { width: 1080, height: 1350, label: "Portrait 4:5", titleSize: 42, bodySize: 26 },
  "9:16": { width: 1080, height: 1920, label: "Stories 9:16", titleSize: 48, bodySize: 28 },
  "16:9": { width: 1920, height: 1080, label: "Wide 16:9",    titleSize: 48, bodySize: 28 },
};

// ========== GOOGLE FONTS ==========
export interface FontOption {
  name: string;
  family: string;
  style: string; // CSS preview style
  category: "serif" | "sans-serif" | "display" | "handwriting";
}

export const FONT_OPTIONS: FontOption[] = [
  { name: "Playfair Display", family: "'Playfair Display', serif", style: "font-style:italic;font-weight:700", category: "serif" },
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif", style: "letter-spacing:2px", category: "display" },
  { name: "DM Sans", family: "'DM Sans', sans-serif", style: "font-weight:800", category: "sans-serif" },
  { name: "Cormorant Garamond", family: "'Cormorant Garamond', serif", style: "font-style:italic;font-weight:600", category: "serif" },
  { name: "Montserrat", family: "'Montserrat', sans-serif", style: "font-weight:800", category: "sans-serif" },
  { name: "Oswald", family: "'Oswald', sans-serif", style: "font-weight:700", category: "sans-serif" },
  { name: "Abril Fatface", family: "'Abril Fatface', serif", style: "", category: "display" },
  { name: "Caveat", family: "'Caveat', cursive", style: "font-weight:700", category: "handwriting" },
  { name: "Nunito", family: "'Nunito', sans-serif", style: "font-weight:900", category: "sans-serif" },
  { name: "Pacifico", family: "'Pacifico', cursive", style: "", category: "handwriting" },
  { name: "Georgia", family: "'Georgia', 'Times New Roman', serif", style: "", category: "serif" },
  { name: "Arial Black", family: "'Arial Black', Arial, sans-serif", style: "", category: "sans-serif" },
  { name: "Impact", family: "'Impact', 'Arial Black', sans-serif", style: "", category: "display" },
  { name: "Segoe UI", family: "'Segoe UI', system-ui, sans-serif", style: "", category: "sans-serif" },
  { name: "Trebuchet MS", family: "'Trebuchet MS', 'Helvetica', sans-serif", style: "", category: "sans-serif" },
];

// ========== PREMIUM GRADIENTS ==========
export interface GradientPreset {
  name: string;
  value: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: "Sunset Gold", value: "linear-gradient(160deg, #3d1f0a 0%, #0e0905 100%)" },
  { name: "Forest Night", value: "linear-gradient(160deg, #1e2e1a 0%, #0e1a0a 100%)" },
  { name: "Ocean Deep", value: "linear-gradient(135deg, #0a1628 0%, #1a3a5f 50%, #0e2444 100%)" },
  { name: "Royal Purple", value: "linear-gradient(160deg, #1B1B2F 0%, #2D2B55 100%)" },
  { name: "Fire Storm", value: "linear-gradient(135deg, #FF6B35 0%, #E11D48 100%)" },
  { name: "Midnight Blue", value: "linear-gradient(145deg, #1E3A5F 0%, #1A2744 100%)" },
  { name: "Copper Elegance", value: "linear-gradient(160deg, #1a0e05 0%, #2d1a0a 100%)" },
  { name: "Dark Carbon", value: "linear-gradient(180deg, #1A1A2E 0%, #0A0A0A 100%)" },
  { name: "Emerald", value: "linear-gradient(135deg, #065F46 0%, #0E7490 100%)" },
  { name: "Violet Dream", value: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)" },
  { name: "Warm Brown", value: "linear-gradient(160deg, #3D2B1F 0%, #5C3D2E 50%, #2D1B0E 100%)" },
  { name: "Pure Black", value: "linear-gradient(180deg, #0a0808 0%, #1a1209 100%)" },
];

export interface CarouselTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: "1:1" | "4:5" | "16:9" | "9:16";
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  titleSize: number;
  bodySize: number;
  align: "left" | "center";
  bgGradient?: string;
  layout: CarouselLayout;
  highlightBgColor?: string;
}

 export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
   {
     id: "blank-canvas",
     name: "Criar do Zero",
     description: "Tela em branco para total liberdade criativa",
     aspectRatio: "1:1",
     bgColor: "#FFFFFF",
     textColor: "#1A1A1A",
     accentColor: "#E11D48",
     fontFamily: "'DM Sans', sans-serif",
     titleSize: 42,
     bodySize: 26,
     align: "center",
     layout: "text-only",
   },
  // ========== MODELOS PRONTOS / LAYOUTS (NEW) ==========
  {
    id: "checklist-moderno",
    name: "Checklist Moderno",
    description: "Layout de lista limpa e moderna",
    aspectRatio: "1:1",
    bgColor: "#F8FAFC",
    textColor: "#0F172A",
    accentColor: "#3B82F6",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 38,
    bodySize: 22,
    align: "left",
    layout: "text-only",
  },
  {
    id: "citacao-impacto",
    name: "Citação Impacto",
    description: "Design focado em frases e aspas",
    aspectRatio: "1:1",
    bgColor: "#0F172A",
    textColor: "#F8FAFC",
    accentColor: "#F59E0B",
    fontFamily: "'Playfair Display', serif",
    titleSize: 44,
    bodySize: 24,
    align: "center",
    layout: "text-only",
  },
  {
    id: "alerta-importante",
    name: "Alerta Importante",
    description: "Visual de atenção/notificação",
    aspectRatio: "1:1",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    accentColor: "#EF4444",
    fontFamily: "'Arial Black', Arial, sans-serif",
    titleSize: 40,
    bodySize: 22,
    align: "left",
    layout: "text-only",
  },
  {
    id: "degrau-evolucao",
    name: "Degrau de Evolução",
    description: "Layout de progresso e passos",
    aspectRatio: "1:1",
    bgColor: "#F0FDFA",
    textColor: "#134E4A",
    accentColor: "#2DD4BF",
    fontFamily: "'Montserrat', sans-serif",
    titleSize: 36,
    bodySize: 20,
    align: "center",
    layout: "text-only",
  },
  // ========== TEMPLATES ORIGINAIS ==========
  {
    id: "twitter-thread",
    name: "Twitter Thread",
    description: "Fundo escuro estilo Twitter/X",
    aspectRatio: "16:9",
    bgColor: "#15202B",
    textColor: "#FFFFFF",
    accentColor: "#1DA1F2",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    titleSize: 28,
    bodySize: 18,
    align: "left",
    layout: "text-only",
  },
  {
    id: "instagram-educativo",
    name: "Instagram Educativo",
    description: "Gradiente vibrante com texto bold",
    aspectRatio: "1:1",
    bgColor: "#667EEA",
    textColor: "#FFFFFF",
    accentColor: "#FBBF24",
    fontFamily: "'Arial Black', Arial, sans-serif",
    titleSize: 32,
    bodySize: 20,
    align: "center",
    bgGradient: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
    layout: "text-only",
  },
  {
    id: "instagram-minimalista",
    name: "Instagram Minimalista",
    description: "Clean e elegante, tipografia limpa",
    aspectRatio: "1:1",
    bgColor: "#FAFAFA",
    textColor: "#1A1A1A",
    accentColor: "#E11D48",
    fontFamily: "'Georgia', serif",
    titleSize: 30,
    bodySize: 18,
    align: "center",
    layout: "text-only",
  },
  {
    id: "bold-vibrante",
    name: "Carrossel Bold",
    description: "Cores vibrantes, texto grande e impactante",
    aspectRatio: "1:1",
    bgColor: "#FF6B35",
    textColor: "#FFFFFF",
    accentColor: "#FFF740",
    fontFamily: "'Impact', 'Arial Black', sans-serif",
    titleSize: 36,
    bodySize: 20,
    align: "center",
    bgGradient: "linear-gradient(135deg, #FF6B35 0%, #F7C948 100%)",
    layout: "text-only",
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Fundo escuro, tom narrativo e premium",
    aspectRatio: "1:1",
    bgColor: "#0A0A0A",
    textColor: "#F5F5F5",
    accentColor: "#A78BFA",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    titleSize: 28,
    bodySize: 18,
    align: "left",
    layout: "text-only",
  },
  {
    id: "dicas-rapidas",
    name: "Dicas Rápidas",
    description: "Cards numerados, direto ao ponto",
    aspectRatio: "1:1",
    bgColor: "#FFFFFF",
    textColor: "#1E293B",
    accentColor: "#3B82F6",
    fontFamily: "'Trebuchet MS', 'Helvetica', sans-serif",
    titleSize: 26,
    bodySize: 17,
    align: "left",
    layout: "text-only",
  },
  {
    id: "depoimentos",
    name: "Depoimentos",
    description: "Fundo escuro elegante com aspas decorativas",
    aspectRatio: "1:1",
    bgColor: "#1B1B2F",
    textColor: "#E2E8F0",
    accentColor: "#F59E0B",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    titleSize: 26,
    bodySize: 19,
    align: "center",
    bgGradient: "linear-gradient(160deg, #1B1B2F 0%, #2D2B55 100%)",
    layout: "text-only",
  },
  {
    id: "antes-depois",
    name: "Antes / Depois",
    description: "Gradiente verde, layout de transformação",
    aspectRatio: "1:1",
    bgColor: "#065F46",
    textColor: "#FFFFFF",
    accentColor: "#34D399",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    titleSize: 28,
    bodySize: 18,
    align: "left",
    bgGradient: "linear-gradient(135deg, #065F46 0%, #0E7490 100%)",
    layout: "text-only",
  },
  {
    id: "lista-beneficios",
    name: "Lista de Benefícios",
    description: "Fundo azul profundo, estilo checklist",
    aspectRatio: "1:1",
    bgColor: "#1E3A5F",
    textColor: "#FFFFFF",
    accentColor: "#FBBF24",
    fontFamily: "'Arial', 'Helvetica', sans-serif",
    titleSize: 28,
    bodySize: 18,
    align: "left",
    bgGradient: "linear-gradient(145deg, #1E3A5F 0%, #1A2744 100%)",
    layout: "text-only",
  },
  // ========== TEMPLATES VIRAIS (ORIGINAIS) ==========
  {
    id: "viral-foto",
    name: "Viral com Foto",
    description: "Foto de fundo + overlay escuro + texto bold",
    aspectRatio: "1:1",
    bgColor: "#1A1A1A",
    textColor: "#FFFFFF",
    accentColor: "#FF6B35",
    fontFamily: "'Arial Black', Arial, sans-serif",
    titleSize: 32,
    bodySize: 18,
    align: "left",
    layout: "image-bg",
  },
  {
    id: "editorial",
    name: "Editorial / Notícia",
    description: "Fundo escuro, headline grande, foto lateral",
    aspectRatio: "1:1",
    bgColor: "#0A0A0A",
    textColor: "#FFFFFF",
    accentColor: "#FF4500",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    titleSize: 28,
    bodySize: 16,
    align: "left",
    layout: "editorial",
  },
  {
    id: "perfil-educativo",
    name: "Post Educativo",
    description: "Simula post do Instagram com avatar e @handle",
    aspectRatio: "1:1",
    bgColor: "#FFFFFF",
    textColor: "#1A1A1A",
    accentColor: "#E11D48",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    titleSize: 22,
    bodySize: 17,
    align: "left",
    layout: "profile-post",
  },
  {
    id: "storytelling-fotos",
    name: "Storytelling com Fotos",
    description: "Texto narrativo + grid de fotos",
    aspectRatio: "1:1",
    bgColor: "#FFFFFF",
    textColor: "#1A1A1A",
    accentColor: "#6366F1",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    titleSize: 22,
    bodySize: 16,
    align: "left",
    layout: "photo-grid",
  },
  {
    id: "slide-vendas",
    name: "Slide de Vendas",
    description: "Gradiente marrom, blocos de destaque coloridos",
    aspectRatio: "1:1",
    bgColor: "#3D2B1F",
    textColor: "#FFFFFF",
    accentColor: "#22C55E",
    fontFamily: "'Arial Black', Arial, sans-serif",
    titleSize: 30,
    bodySize: 18,
    align: "center",
    bgGradient: "linear-gradient(160deg, #3D2B1F 0%, #5C3D2E 50%, #2D1B0E 100%)",
    layout: "sales-highlight",
    highlightBgColor: "#22C55E",
  },

  // ========== NOVOS TEMPLATES PostStudio ==========
  {
    id: "imersao",
    name: "✨ Imersão",
    description: "Gradiente dourado escuro, Playfair italic premium",
    aspectRatio: "1:1",
    bgColor: "#0e0905",
    textColor: "#f0ebe3",
    accentColor: "#c9965a",
    fontFamily: "'Playfair Display', serif",
    titleSize: 36,
    bodySize: 20,
    align: "center",
    bgGradient: "linear-gradient(160deg, #3d1f0a 0%, #0e0905 100%)",
    layout: "text-only",
  },
  {
    id: "cta-bold",
    name: "🔥 CTA Bold",
    description: "Bebas Neue gigante, lettering impactante",
    aspectRatio: "1:1",
    bgColor: "#1a0e05",
    textColor: "#FFFFFF",
    accentColor: "#c9965a",
    fontFamily: "'Bebas Neue', sans-serif",
    titleSize: 44,
    bodySize: 18,
    align: "center",
    bgGradient: "linear-gradient(160deg, #1a0e05 0%, #2d1a0a 100%)",
    layout: "text-only",
  },
  {
    id: "handwrite",
    name: "✍️ Handwrite",
    description: "Caveat cursivo grande, fundo floresta",
    aspectRatio: "1:1",
    bgColor: "#1e2e1a",
    textColor: "#FFFFFF",
    accentColor: "#7ecf71",
    fontFamily: "'Caveat', cursive",
    titleSize: 42,
    bodySize: 20,
    align: "left",
    bgGradient: "linear-gradient(160deg, #1e2e1a 0%, #0e1a0a 100%)",
    layout: "text-only",
  },
  {
    id: "card-post",
    name: "📱 Card Post",
    description: "Box escuro com avatar, simula post Instagram",
    aspectRatio: "1:1",
    bgColor: "#0a0a0a",
    textColor: "#FFFFFF",
    accentColor: "#e07d5b",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 26,
    bodySize: 17,
    align: "left",
    bgGradient: "linear-gradient(160deg, #0a0a0a 0%, #1a1209 100%)",
    layout: "profile-post",
  },
  {
    id: "chat-bubble",
    name: "💬 Chat Bubble",
    description: "Playfair grande + corpo DM Sans, fundo verde",
    aspectRatio: "1:1",
    bgColor: "#0d1a0a",
    textColor: "#FFFFFF",
    accentColor: "#4ade80",
    fontFamily: "'Playfair Display', serif",
    titleSize: 36,
    bodySize: 18,
    align: "left",
    bgGradient: "linear-gradient(180deg, #0d1a0a 0%, #1a2010 100%)",
    layout: "text-only",
  },
  {
    id: "pergunta-retorica",
    name: "❓ Pergunta",
    description: "Playfair italic, pergunta retórica em fundo escuro",
    aspectRatio: "1:1",
    bgColor: "#0a0808",
    textColor: "#FFFFFF",
    accentColor: "#c9965a",
    fontFamily: "'Playfair Display', serif",
    titleSize: 34,
    bodySize: 18,
    align: "left",
    bgGradient: "linear-gradient(180deg, #0a0808 0%, #1a1209 100%)",
    layout: "text-only",
  },
  {
    id: "lista-numerada",
    name: "📋 Lista Numerada",
    description: "Box marrom com lista, tipografia mista",
    aspectRatio: "1:1",
    bgColor: "#2d1a0a",
    textColor: "#FFFFFF",
    accentColor: "#c9965a",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 28,
    bodySize: 17,
    align: "left",
    bgGradient: "linear-gradient(135deg, #2d1a0a 0%, #1a1209 100%)",
    layout: "text-only",
  },
  {
    id: "tweet-light",
    name: "🐦 Tweet Light",
    description: "Fundo branco limpo, tipografia preta",
    aspectRatio: "1:1",
    bgColor: "#f9f9f9",
    textColor: "#0f1419",
    accentColor: "#1DA1F2",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 28,
    bodySize: 18,
    align: "left",
    layout: "text-only",
  },
  {
    id: "destaque-dourado",
    name: "🏆 Destaque",
    description: "Fundo cobre dourado com texto bold branco",
    aspectRatio: "1:1",
    bgColor: "#c96542",
    textColor: "#FFFFFF",
    accentColor: "#FFF740",
    fontFamily: "'Montserrat', sans-serif",
    titleSize: 34,
    bodySize: 20,
    align: "center",
    layout: "sales-highlight",
    highlightBgColor: "#c96542",
  },
  {
    id: "sticker-notes",
    name: "📌 Sticker Notes",
    description: "Boxes rotacionados tipo post-its orgânicos",
    aspectRatio: "1:1",
    bgColor: "#4a5a48",
    textColor: "#FFFFFF",
    accentColor: "#c9965a",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 28,
    bodySize: 18,
    align: "left",
    bgGradient: "linear-gradient(160deg, #4a5a48 0%, #2a3a28 100%)",
    layout: "text-only",
  },

  // ========== TEMPLATES STORIES (9:16) ==========
  {
    id: "stories-bold",
    name: "Stories Bold",
    description: "Gradiente vibrante vertical para Stories",
    aspectRatio: "9:16",
    bgColor: "#FF6B35",
    textColor: "#FFFFFF",
    accentColor: "#FFF740",
    fontFamily: "'Arial Black', Arial, sans-serif",
    titleSize: 36,
    bodySize: 20,
    align: "center",
    bgGradient: "linear-gradient(180deg, #FF6B35 0%, #E11D48 100%)",
    layout: "text-only",
  },
  {
    id: "stories-escuro",
    name: "Stories Dark",
    description: "Fundo escuro premium para Stories",
    aspectRatio: "9:16",
    bgColor: "#0A0A0A",
    textColor: "#FFFFFF",
    accentColor: "#A78BFA",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    titleSize: 32,
    bodySize: 20,
    align: "center",
    bgGradient: "linear-gradient(180deg, #1A1A2E 0%, #0A0A0A 100%)",
    layout: "text-only",
  },
  {
    id: "stories-foto",
    name: "Stories com Foto",
    description: "Foto de fundo vertical + texto overlay",
    aspectRatio: "9:16",
    bgColor: "#1A1A1A",
    textColor: "#FFFFFF",
    accentColor: "#FF6B35",
    fontFamily: "'Arial Black', Arial, sans-serif",
    titleSize: 34,
    bodySize: 18,
    align: "center",
    layout: "image-bg",
  },
  {
    id: "stories-educativo",
    name: "Stories Educativo",
    description: "Gradiente azul educativo para Stories",
    aspectRatio: "9:16",
    bgColor: "#667EEA",
    textColor: "#FFFFFF",
    accentColor: "#FBBF24",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    titleSize: 30,
    bodySize: 18,
    align: "center",
    bgGradient: "linear-gradient(180deg, #667EEA 0%, #764BA2 100%)",
    layout: "text-only",
  },
  // ========== STORIES PostStudio ==========
  {
    id: "stories-imersao",
    name: "Stories Imersão",
    description: "Playfair italic vertical, gradiente dourado",
    aspectRatio: "9:16",
    bgColor: "#0e0905",
    textColor: "#f0ebe3",
    accentColor: "#c9965a",
    fontFamily: "'Playfair Display', serif",
    titleSize: 40,
    bodySize: 22,
    align: "center",
    bgGradient: "linear-gradient(180deg, #3d1f0a 0%, #0e0905 100%)",
    layout: "text-only",
  },

  // ========== TEMPLATES PORTRAIT (4:5) ==========
  {
    id: "portrait-premium",
    name: "Portrait Premium",
    description: "Formato ideal Instagram (1080x1350)",
    aspectRatio: "4:5",
    bgColor: "#0A0A0A",
    textColor: "#FFFFFF",
    accentColor: "#D4AF37",
    fontFamily: "'Playfair Display', serif",
    titleSize: 42,
    bodySize: 24,
    align: "center",
    layout: "text-only",
  },
  {
    id: "portrait-minimal",
    name: "Portrait Minimal",
    description: "Clean e focado em leitura",
    aspectRatio: "4:5",
    bgColor: "#FAFAFA",
    textColor: "#1A1A1A",
    accentColor: "#3B82F6",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 38,
    bodySize: 22,
    align: "left",
    layout: "text-only",
  },
  {
    id: "stories-cta",
    name: "Stories CTA",
    description: "Bebas Neue vertical, CTA impactante",
    aspectRatio: "9:16",
    bgColor: "#1a0e05",
    textColor: "#FFFFFF",
    accentColor: "#e07d5b",
    fontFamily: "'Bebas Neue', sans-serif",
    titleSize: 48,
    bodySize: 20,
    align: "center",
    bgGradient: "linear-gradient(180deg, #1a0e05 0%, #2d1a0a 100%)",
    layout: "text-only",
  },

  // ========== TEMPLATES VIRAIS PostStudio ==========
  {
    id: "tweet-3img",
    name: "🐦 Tweet 3 Fotos",
    description: "Estilo tweet com texto + 3 imagens grid",
    aspectRatio: "1:1",
    bgColor: "#f5f5f5",
    textColor: "#0f1419",
    accentColor: "#1DA1F2",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 18,
    bodySize: 15,
    align: "left",
    layout: "tweet-post",
  },
  {
    id: "tweet-2img",
    name: "🐦 Tweet 2 Fotos",
    description: "Estilo tweet com texto + 2 imagens lado a lado",
    aspectRatio: "1:1",
    bgColor: "#f5f5f5",
    textColor: "#0f1419",
    accentColor: "#1DA1F2",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 18,
    bodySize: 15,
    align: "left",
    layout: "tweet-post",
  },
  {
    id: "prompt-branco",
    name: "📌 Prompt Card",
    description: "Fundo branco com avatar e texto estilo prompt",
    aspectRatio: "1:1",
    bgColor: "#ffffff",
    textColor: "#000000",
    accentColor: "#E11D48",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 22,
    bodySize: 17,
    align: "left",
    layout: "prompt-card",
  },
  {
    id: "sticker-rotated",
    name: "📌 Sticker Cards",
    description: "Cards rotacionados estilo post-it em fundo verde",
    aspectRatio: "1:1",
    bgColor: "#4a5a48",
    textColor: "#FFFFFF",
    accentColor: "#c9965a",
    fontFamily: "'DM Sans', sans-serif",
    titleSize: 22,
    bodySize: 16,
    align: "left",
    bgGradient: "linear-gradient(160deg, #4a5a48 0%, #2a3a28 100%)",
    layout: "sticker-card",
    highlightBgColor: "rgba(92,61,46,.94)",
  },
  {
    id: "caixa-clara",
    name: "🔲 Caixa Clara",
    description: "Fundo escuro com caixa branca centralizada",
    aspectRatio: "1:1",
    bgColor: "#2d1a0a",
    textColor: "#4a2511",
    accentColor: "#c9965a",
    fontFamily: "'Bebas Neue', sans-serif",
    titleSize: 34,
    bodySize: 22,
    align: "center",
    bgGradient: "linear-gradient(160deg, #2d1a0a 0%, #1a1209 100%)",
    layout: "sales-highlight",
    highlightBgColor: "rgba(255,255,255,0.95)",
  },

  // ============================================================
  // ========== COLEÇÃO JOURNALING (papelaria orgânica) ==========
  // ============================================================
  {
    id: "journal-cream",
    name: "📓 Caderno Cream",
    description: "Folha de caderno + selo dourado, fundo linho creme",
    aspectRatio: "1:1",
    bgColor: "#f0e4cf",
    textColor: "#3a1a12",
    accentColor: "#a23e2e",
    fontFamily: "'Cormorant Garamond', serif",
    titleSize: 38,
    bodySize: 18,
    align: "center",
    layout: "journal-note",
  },
  {
    id: "journal-rust",
    name: "📓 Caderno Rust",
    description: "Folha presa com fita washi sobre fundo vermelho terra",
    aspectRatio: "1:1",
    bgColor: "#a23e2e",
    textColor: "#3a1a12",
    accentColor: "#f0e6d2",
    fontFamily: "'Playfair Display', serif",
    titleSize: 40,
    bodySize: 18,
    align: "center",
    layout: "journal-tape",
  },
  {
    id: "journal-olive",
    name: "🌿 Caderno Olive",
    description: "Foto de fundo + card oliva sobreposto",
    aspectRatio: "1:1",
    bgColor: "#6b7a3a",
    textColor: "#fefdf8",
    accentColor: "#6b7a3a",
    fontFamily: "'Cormorant Garamond', serif",
    titleSize: 38,
    bodySize: 18,
    align: "center",
    layout: "journal-photo-card",
  },
  {
    id: "journal-copper",
    name: "✉️ Caderno Copper",
    description: "Envelope aberto com selo de cera vermelho",
    aspectRatio: "1:1",
    bgColor: "#b8693d",
    textColor: "#3a1a12",
    accentColor: "#7a1f15",
    fontFamily: "'Playfair Display', serif",
    titleSize: 36,
    bodySize: 18,
    align: "center",
    layout: "journal-envelope",
  },
  {
    id: "journal-forest",
    name: "🌱 Caderno Forest",
    description: "Papel rasgado sobre foto de natureza",
    aspectRatio: "1:1",
    bgColor: "#3a4a32",
    textColor: "#3a2a1a",
    accentColor: "#8aa05a",
    fontFamily: "'Cormorant Garamond', serif",
    titleSize: 42,
    bodySize: 18,
    align: "center",
    layout: "journal-torn-paper",
  },
  {
    id: "journal-binder",
    name: "📎 Caderno Espiral",
    description: "Folha presa por espiral metálico no topo",
    aspectRatio: "1:1",
    bgColor: "#e85a2a",
    textColor: "#3a1a12",
    accentColor: "#a23e2e",
    fontFamily: "'Cormorant Garamond', serif",
    titleSize: 38,
    bodySize: 18,
    align: "center",
    layout: "journal-binder",
  },
];

// IDs da família Journaling (para agrupamento na UI e distribuição em sequência)
export const JOURNAL_TEMPLATE_IDS = [
  "journal-rust",
  "journal-cream",
  "journal-olive",
  "journal-binder",
  "journal-forest",
  "journal-copper",
] as const;

// Sequência de layouts aplicada automaticamente quando o usuário escolhe
// "Aplicar a todos" em qualquer template Journaling — gera variação visual coerente.
export const JOURNAL_LAYOUT_SEQUENCE: CarouselLayout[] = [
  "journal-tape",        // capa impactante
  "journal-note",        // desenvolvimento 1
  "journal-photo-card",  // desenvolvimento 2
  "journal-binder",      // desenvolvimento 3
  "journal-torn-paper",  // desenvolvimento 4
  "journal-envelope",    // CTA / encerramento
];

export function isJournalTemplate(templateId: string): boolean {
  return (JOURNAL_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

// ============================================================
// Variações de paleta para a Coleção Journaling
// (mantém textura/layout, troca apenas cores)
// ============================================================
export interface JournalPalette {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  /** swatch shown in the UI selector */
  swatch: string;
}

export const JOURNAL_PALETTES: JournalPalette[] = [
  { id: "terracota", name: "Terracota",   emoji: "🟫", bgColor: "#a23e2e", textColor: "#3a1a12", accentColor: "#f0e6d2", swatch: "#a23e2e" },
  { id: "salvia",    name: "Sálvia",      emoji: "🌿", bgColor: "#7a8b6a", textColor: "#2a2a1a", accentColor: "#f5ede0", swatch: "#7a8b6a" },
  { id: "borgonha",  name: "Borgonha",    emoji: "🍷", bgColor: "#5a1f1f", textColor: "#f5e9d5", accentColor: "#e8d4b0", swatch: "#5a1f1f" },
  { id: "marinho",   name: "Marinho",     emoji: "🌊", bgColor: "#1f3a5a", textColor: "#f0ebe0", accentColor: "#c9965a", swatch: "#1f3a5a" },
  { id: "pessego",   name: "Pêssego Nude",emoji: "🍑", bgColor: "#e8a87c", textColor: "#3a1a12", accentColor: "#7a1f15", swatch: "#e8a87c" },
  { id: "creme",     name: "Linho Creme", emoji: "🤎", bgColor: "#f0e4cf", textColor: "#3a1a12", accentColor: "#a23e2e", swatch: "#f0e4cf" },
];

export function applyPaletteToSlide(slide: SlideData, palette: JournalPalette): SlideData {
  return {
    ...slide,
    bgColor: palette.bgColor,
    textColor: palette.textColor,
    accentColor: palette.accentColor,
    // clear per-slide overrides for color fields so the palette wins
    titleColor: undefined,
    bodyColor: undefined,
  };
}

/**
 * Sample journaling content used by the off-screen Collection Exporter
 * to render the 6 layouts with the same body of text and current palette.
 */
export const JOURNAL_SAMPLE_CONTENT: { title: string; body: string }[] = [
  { title: "Como dobrar seu faturamento sem dobrar a jornada", body: "Três pilares que aplicamos com nossas mentoradas para escalar com leveza e estratégia." },
  { title: "O segredo da consistência está nos pequenos rituais", body: "Não é talento. É repetição inteligente, todos os dias, no mesmo horário, com presença." },
  { title: "Sua marca precisa de uma narrativa, não só de posts", body: "Histórias conectam. Conteúdo solto se perde. Comece pelo porquê e o resto se organiza." },
  { title: "Pare de vender produto. Venda transformação", body: "Sua cliente não quer comprar — ela quer virar uma versão melhor de si mesma." },
  { title: "Estratégia sem execução é só sonho bonito", body: "Plano de 90 dias, ações de 7, revisão semanal. Simples, mas exige disciplina." },
  { title: "Vamos juntas construir o seu próximo capítulo?", body: "Clique no link da bio e agende uma conversa gratuita comigo. Sua hora chegou." },
];

/** Pre-made offline content themes for the Journaling Collection sample button. */
export interface JournalSampleTheme {
  id: string;
  label: string;
  emoji: string;
  slides: { title: string; body: string }[];
}

export const JOURNAL_SAMPLE_THEMES: JournalSampleTheme[] = [
  {
    id: "generico",
    label: "Genérico (mentoria)",
    emoji: "📓",
    slides: JOURNAL_SAMPLE_CONTENT,
  },
  {
    id: "autoestima",
    label: "Autoestima",
    emoji: "💗",
    slides: [
      { title: "Você é mais do que o espelho diz hoje", body: "Sua autoestima não nasce da imagem — nasce do quanto você se escolhe todos os dias." },
      { title: "O elogio que falta vem de dentro", body: "Pare de esperar validação externa. Comece pelo seu próprio olhar pelo seu nome." },
      { title: "Pequenos rituais reconstroem grandes mulheres", body: "Café com calma, banho consciente, roupa que abraça. O cuidado é uma forma de amor." },
      { title: "Compare-se só com a versão de ontem", body: "A jornada das outras não é régua. Cada passo seu já é coragem em movimento." },
      { title: "Você cabe inteira no espaço que ocupa", body: "Não diminua sua voz, sua presença, seus sonhos. O mundo precisa de você inteira." },
      { title: "Que tal começar hoje a se escolher?", body: "Salve este post. Releia amanhã. E me conta nos comentários: qual passo você dá hoje?" },
    ],
  },
  {
    id: "rotina",
    label: "Rotina matinal",
    emoji: "☀️",
    slides: [
      { title: "Sua manhã decide o tom do seu dia", body: "Não é mágica — é estrutura. As primeiras duas horas constroem ou destroem o resto." },
      { title: "Acorde 30 min antes do celular", body: "O scroll matinal sequestra sua atenção antes de você existir. Comece por você." },
      { title: "Hidrate, respire, alongue", body: "Três gestos simples que reativam corpo e mente sem custar nada e mudam tudo." },
      { title: "Escreva 3 prioridades em papel", body: "Tudo que está na cabeça pesa. No papel, vira plano. Plano vira ação." },
      { title: "Movimento antes da tela", body: "Caminhar 10 minutos no sol já reorganiza humor, foco e energia para o dia." },
      { title: "Vamos montar sua rotina ideal?", body: "Comenta MANHÃ que te mando o checklist completo da rotina das mentoradas." },
    ],
  },
  {
    id: "produtividade",
    label: "Produtividade leve",
    emoji: "🌿",
    slides: [
      { title: "Produtividade não é fazer mais — é fazer o que importa", body: "Listas infinitas cansam. Foco em 3 prioridades reais transforma." },
      { title: "Bloqueie tempo, não tarefas", body: "Agenda por blocos protege sua energia. Tarefa solta vira procrastinação criativa." },
      { title: "Faça primeiro o que dá medo", body: "A tarefa que você empurra é exatamente a que vai destravar seu dia inteiro." },
      { title: "Pausas são parte do método", body: "Cérebro descansado entrega 3x mais. Trabalhe em ciclos, não em maratona." },
      { title: "Encerre o dia com revisão", body: "5 minutos para olhar o que andou e o que sobrou. Amanhã começa pronto." },
      { title: "Quer minha planilha de blocos?", body: "Comenta FOCO e te envio o template que uso com minhas mentoradas toda semana." },
    ],
  },
  {
    id: "vendas",
    label: "Vendas com leveza",
    emoji: "💼",
    slides: [
      { title: "Vender é servir, não convencer", body: "Quando você entende a dor real da sua cliente, a venda vira conversa natural." },
      { title: "Pare de pedir desculpa pelo seu preço", body: "Seu valor não é o seu custo. É a transformação que sua cliente recebe." },
      { title: "Escute mais, fale menos", body: "Cada objeção é um pedido de segurança. Pergunte antes de apresentar solução." },
      { title: "Mostre prova, não promessa", body: "Print de cliente, antes/depois, depoimento real. Resultado fala mais que adjetivo." },
      { title: "Follow-up é onde mora a venda", body: "70% das vendas acontecem depois do 5º contato. Não desista no primeiro 'vou pensar'." },
      { title: "Bora destravar suas vendas?", body: "Comenta VENDER e te chamo no direct com o roteiro que multiplicou meu fechamento." },
    ],
  },
];

/** Builds 6 sample SlideData (one per JOURNAL_LAYOUT_SEQUENCE entry) for the exporter. */
export function buildJournalSampleSlides(
  palette: JournalPalette,
  profileHandle?: string,
  themeId?: string,
): SlideData[] {
  const theme = JOURNAL_SAMPLE_THEMES.find(t => t.id === themeId) || JOURNAL_SAMPLE_THEMES[0];
  const content = theme.slides;
  return JOURNAL_LAYOUT_SEQUENCE.map((layout, i) => ({
    title: content[i]?.title || content[0].title,
    body: content[i]?.body || content[0].body,
    bgColor: palette.bgColor,
    textColor: palette.textColor,
    accentColor: palette.accentColor,
    titleSize: 38,
    bodySize: 18,
    fontFamily: "'Cormorant Garamond', serif",
    align: "center",
    layout,
    profileHandle: profileHandle || "@suamarca",
  }));
}

export interface SlideData {
  title: string;
  body: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  titleSize: number;
  bodySize: number;
  fontFamily: string;
  align: "left" | "center";
  bgGradient?: string;
  layout: CarouselLayout;
  imageUrl?: string;
  imageUrls?: string[];
  profileName?: string;
  profileHandle?: string;
  profileImageUrl?: string;
  highlightBgColor?: string;
  // Advanced formatting
  titleBold?: boolean;
  titleItalic?: boolean;
  titleUnderline?: boolean;
  bodyBold?: boolean;
  bodyItalic?: boolean;
  bodyUnderline?: boolean;
  titleColor?: string;
  bodyColor?: string;
  titleAlign?: "left" | "center" | "right";
  bodyAlign?: "left" | "center" | "right";
  gap?: number; // spacing between title and body
  textShadow?: string;
  overlayOpacity?: number;
  bgImageUrl?: string;
  verticalAlign?: "top" | "center" | "bottom";
  // Background image adjustments (per slide)
  bgImagePositionX?: number;  // 0–100 (%) – default 50
  bgImagePositionY?: number;  // 0–100 (%) – default 50
  bgImageScale?: number;      // 1–3 (zoom) – default 1
  bgImageBlur?: number;       // 0–20 (px) – default 0
  bgImageBrightness?: number; // 50–150 (%) – default 100
  bgImageContrast?: number;   // 50–150 (%) – default 100
  // Layout image (image-bg / editorial) adjustments
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
  imageBlur?: number;
  imageBrightness?: number;
  imageContrast?: number;
  // Journaling-only adjustments for the floating highlight card
  highlightScale?: number;    // 0.7–1.3 (default 1)
   highlightOffsetY?: number;  // -15 to +15 (% of slide height, default 0)
   // Free edit positioning (relative to slide width/height, 0-1)
   titlePos?: { x: number; y: number; width?: number; height?: number; rotation?: number };
   bodyPos?: { x: number; y: number; width?: number; height?: number; rotation?: number };
   // Custom layers for "Create from scratch"
   layers?: LayerData[];
 }
 
 export interface LayerData {
   id: string;
   type: "text" | "image" | "shape" | "sticker";
   content?: string;
   x: number;
   y: number;
   width: number;
   height: number;
   rotation?: number;
   style?: any;
 }

export function createSlidesFromTemplate(
  template: CarouselTemplate,
  content: { title: string; body: string }[]
): SlideData[] {
  const isJournal = isJournalTemplate(template.id);
  return content.map((c, i) => ({
    title: c.title,
    body: c.body,
    bgColor: template.bgColor,
    textColor: template.textColor,
    accentColor: template.accentColor,
    titleSize: template.titleSize,
    bodySize: template.bodySize,
    fontFamily: template.fontFamily,
    align: template.align,
    bgGradient: template.bgGradient,
    // Journaling templates: distribute the 6 narrative layouts across slides
    layout: isJournal
      ? JOURNAL_LAYOUT_SEQUENCE[i % JOURNAL_LAYOUT_SEQUENCE.length]
      : template.layout,
    highlightBgColor: template.highlightBgColor,
    // Ensure default positions are set so changes are visible instantly
    titlePos: { x: 0.1, y: 0.1, width: 0.8, height: 0.1 },
    bodyPos: { x: 0.1, y: 0.25, width: 0.8, height: 0.3 },
  }));
}


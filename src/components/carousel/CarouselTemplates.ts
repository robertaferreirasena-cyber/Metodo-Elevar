export type CarouselLayout =
  | "text-only"
  | "image-bg"
  | "profile-post"
  | "photo-grid"
  | "sales-highlight"
  | "editorial";

export interface CarouselTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: "1:1" | "16:9" | "9:16";
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
  // ========== TEMPLATES VIRAIS ==========
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
];

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
}

export function createSlidesFromTemplate(
  template: CarouselTemplate,
  content: { title: string; body: string }[]
): SlideData[] {
  return content.map((c) => ({
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
    layout: template.layout,
    highlightBgColor: template.highlightBgColor,
  }));
}

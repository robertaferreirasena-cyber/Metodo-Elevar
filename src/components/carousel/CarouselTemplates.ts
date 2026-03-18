export interface CarouselTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: "1:1" | "16:9";
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  titleSize: number;
  bodySize: number;
  align: "left" | "center";
  bgGradient?: string;
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
  }));
}

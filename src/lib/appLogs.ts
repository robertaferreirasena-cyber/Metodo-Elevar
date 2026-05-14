import { toast } from "sonner";

export const logAppError = (message: string, details?: any) => {
  console.error(`[App Error] ${message}`, details);
  toast.error(message, {
    description: details?.message || "Ocorreu um erro inesperado.",
    duration: 5000,
  });
};

export const logPopupBlocked = () => {
  logAppError("Pop-up bloqueado pelo navegador", {
    message: "Verifique as configurações do seu navegador para permitir pop-ups neste site para que o conteúdo abra corretamente."
  });
};

export const logInvalidUrl = (url: string) => {
  logAppError("URL inválida ou inacessível", {
    message: `A URL "${url}" não pôde ser carregada. Verifique se o endereço está correto.`
  });
};

export const logViniPlayerError = (error?: any) => {
  logAppError("Erro ao carregar Player Vini", {
    message: "Não foi possível carregar o player de áudio. Tente atualizar a página."
  });
};

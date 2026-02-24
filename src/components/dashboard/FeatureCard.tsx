import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel?: string;
  ctaVariant?: "primary" | "outline";
  href?: string;
}

export function FeatureCard({
  icon,
  title,
  subtitle,
  description,
  ctaLabel,
  ctaVariant = "primary",
  href,
}: FeatureCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <div 
      className="dashboard-card cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-secondary">
            {icon}
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        {ctaLabel && (
          <Button
            variant={ctaVariant === "primary" ? "default" : "outline"}
            size="sm"
            className={ctaVariant === "primary" 
              ? "w-full gradient-primary glow-pink text-primary-foreground border-0" 
              : "w-full border-border hover:bg-muted"
            }
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

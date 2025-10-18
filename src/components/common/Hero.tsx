import { Button } from "../ui/button";

interface HeroProps {
  title?: string;
  subtitle?: string;
  onStartClick: () => void;
}

export function Hero({ title = "Brian", subtitle, onStartClick }: HeroProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-6xl md:text-8xl tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        <div className="pt-4">
          <Button
            onClick={onStartClick}
            size="lg"
            className="rounded-full px-8 py-6 text-lg"
          >
            Start
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
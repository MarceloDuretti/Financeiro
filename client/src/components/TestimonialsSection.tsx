import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import testimonialWoman from "@assets/generated_images/Testimonial_user_photo_woman_26909ec0.png";
import testimonialMan from "@assets/generated_images/Testimonial_user_photo_man_d45652f8.png";
import testimonialYoung from "@assets/generated_images/Testimonial_user_photo_young_9eb8272d.png";

const testimonials = [
  {
    name: "Ana Paula Silva",
    role: "Empresária",
    image: testimonialWoman,
    text: "O FinControl transformou a gestão do meu negócio. Agora tenho visibilidade completa das finanças e tomo decisões com muito mais segurança.",
  },
  {
    name: "Carlos Mendes",
    role: "Gerente Financeiro",
    image: testimonialMan,
    text: "Uso o sistema há mais de 5 anos. É extremamente fácil de utilizar e o suporte é sempre rápido e assertivo. Recomendo para qualquer empresa.",
  },
  {
    name: "Julia Costa",
    role: "Freelancer MEI",
    image: testimonialYoung,
    text: "Como MEI, preciso de praticidade. O FinControl me ajuda a organizar receitas, despesas e ainda consigo planejar meus investimentos futuros.",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="w-full px-4 py-16 md:px-6 md:py-24 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 text-center md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            O que nossos clientes dizem
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            <span className="font-semibold text-foreground">97%</span> das pessoas que
            usaram ficaram satisfeitas
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => {
                const isActive = index === currentIndex;
                return (
                  <Card
                    key={index}
                    className={`group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 p-8 shadow-md transition-all duration-300 ${
                      isActive
                        ? "scale-100 opacity-100 md:scale-105 shadow-2xl"
                        : "scale-95 opacity-60 md:opacity-100"
                    }`}
                    data-testid={`card-testimonial-${index}`}
                  >
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 blur-2xl" />
                    
                    <div className="relative flex flex-col gap-5">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <p className="text-base leading-relaxed text-foreground font-medium">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="relative">
                          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary to-blue-600 opacity-75 blur" />
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="relative h-14 w-14 rounded-full object-cover ring-2 ring-background"
                            data-testid={`img-testimonial-${index}`}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm">
                            {testimonial.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {testimonial.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                data-testid="button-testimonial-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/30"
                    }`}
                    data-testid={`button-testimonial-dot-${index}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                data-testid="button-testimonial-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

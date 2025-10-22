import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const contactMethods = [
  {
    icon: Phone,
    title: "Telefone",
    description: "Ligue para nós",
    info: "(11) 4002-8922",
    action: "tel:+551140028922",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Atendimento rápido",
    info: "(11) 98765-4321",
    action: "https://wa.me/5511987654321",
  },
  {
    icon: Mail,
    title: "E-mail",
    description: "Envie sua dúvida",
    info: "contato@fincontrol.com.br",
    action: "mailto:contato@fincontrol.com.br",
  },
  {
    icon: MapPin,
    title: "Endereço",
    description: "Visite nosso escritório",
    info: "Av. Paulista, 1578 - São Paulo, SP",
    action: "#",
  },
];

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contato" className="w-full bg-muted/30 px-4 py-16 md:px-6 md:py-24 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 text-center md:mb-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Entre em contato
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Estamos aqui para ajudar. Escolha o canal que preferir ou envie uma
            mensagem.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-semibold">Fale Conosco</h3>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe está pronta para atender você. Escolha o meio de
                  contato mais conveniente.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {contactMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <a
                      key={index}
                      href={method.action}
                      className="group"
                      target={method.action.startsWith("http") ? "_blank" : undefined}
                      rel={method.action.startsWith("http") ? "noopener noreferrer" : undefined}
                      data-testid={`link-contact-${index}`}
                    >
                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-blue-600/10 blur-xl transition-all duration-300 group-hover:scale-150" />
                        
                        <div className="relative flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg transition-all duration-300 group-hover:scale-110">
                            <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="font-semibold text-sm">{method.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {method.description}
                            </p>
                            <p className="text-sm font-medium text-primary group-hover:underline">
                              {method.info}
                            </p>
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 group-hover:w-full" />
                      </Card>
                    </a>
                  );
                })}
              </div>

              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-blue-600/10 p-5 shadow-md">
                <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 blur-xl" />
                
                <div className="relative flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600">
                    <Clock className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-sm">
                      Horário de Atendimento
                    </h4>
                    <p className="text-xs font-medium text-foreground">
                      Segunda a Sexta: 9h às 18h
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      Sábado: 9h às 13h
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 p-6 shadow-md md:p-8">
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-gradient-to-br from-primary/10 to-blue-600/10 blur-3xl" />
              <form onSubmit={handleSubmit} className="relative flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">Envie uma Mensagem</h3>
                  <p className="text-sm text-muted-foreground">
                    Preencha o formulário abaixo e retornaremos em até 24 horas.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="João Silva"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      data-testid="input-contact-name"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={formData.phone}
                      onChange={handleChange}
                      data-testid="input-contact-phone"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="subject">Assunto *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Como podemos ajudar?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      data-testid="input-contact-subject"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Descreva sua dúvida ou necessidade..."
                    className="min-h-[150px] resize-none"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    data-testid="textarea-contact-message"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="group w-full sm:w-auto"
                  data-testid="button-contact-submit"
                >
                  <Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  Enviar Mensagem
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

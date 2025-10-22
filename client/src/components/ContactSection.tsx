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
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
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
                      <Card className="p-4 transition-all hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
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
                      </Card>
                    </a>
                  );
                })}
              </div>

              <Card className="border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 flex-shrink-0 text-primary" />
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-sm">
                      Horário de Atendimento
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Segunda a Sexta: 9h às 18h
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sábado: 9h às 13h
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

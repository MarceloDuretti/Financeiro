import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  empresa: {
    title: "Empresa",
    links: [
      { label: "Sobre Nós", href: "#sobre" },
      { label: "Blog", href: "#blog" },
      { label: "Carreiras", href: "#carreiras" },
      { label: "Imprensa", href: "#imprensa" },
    ],
  },
  produto: {
    title: "Produto",
    links: [
      { label: "Recursos", href: "#recursos" },
      { label: "Planos", href: "#planos" },
      { label: "Segurança", href: "#seguranca" },
      { label: "Atualizações", href: "#atualizacoes" },
    ],
  },
  suporte: {
    title: "Suporte",
    links: [
      { label: "Central de Ajuda", href: "#ajuda" },
      { label: "Contato", href: "#contato" },
      { label: "Documentação", href: "#docs" },
      { label: "Status", href: "#status" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Termos de Uso", href: "#termos" },
      { label: "Privacidade", href: "#privacidade" },
      { label: "Cookies", href: "#cookies" },
      { label: "Licenças", href: "#licencas" },
    ],
  },
};

const socialLinks = [
  { icon: Facebook, href: "#facebook", label: "Facebook" },
  { icon: Twitter, href: "#twitter", label: "Twitter" },
  { icon: Instagram, href: "#instagram", label: "Instagram" },
  { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <div className="container mx-auto">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">F</span>
                </div>
                <span className="font-semibold">FinControl</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Controle financeiro inteligente para pessoas e empresas.
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className="flex h-9 w-9 items-center justify-center rounded-md border hover-elevate active-elevate-2 transition-colors"
                      aria-label={social.label}
                      data-testid={`link-social-${social.label.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} className="flex flex-col gap-4">
              <h3 className="font-semibold">{section.title}</h3>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-sm text-muted-foreground">
              © 2025 FinControl. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#pt" className="hover:text-foreground transition-colors">
                PT-BR
              </a>
              <span>•</span>
              <a href="#en" className="hover:text-foreground transition-colors">
                EN
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

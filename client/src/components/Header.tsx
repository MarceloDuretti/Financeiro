// Integration: blueprint:javascript_log_in_with_replit (Replit Auth)
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import headerLogo from "@assets/image_1761139734810.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Para Você", href: "#para-voce" },
    { label: "Para Empresas", href: "#para-empresas" },
    { label: "Recursos", href: "#recursos" },
    { label: "Planos", href: "#planos" },
    { label: "Contato", href: "#contato" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleSignup = () => {
    window.location.href = "/signup";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#" className="flex items-center gap-2" data-testid="link-logo">
              <img 
                src={headerLogo} 
                alt="SyncTime Logo" 
                className="h-8 w-auto"
                data-testid="img-header-logo"
              />
            </a>

            <nav className="hidden lg:flex lg:gap-6">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogin}
              className="hidden sm:inline-flex"
              data-testid="button-login"
            >
              Acessar Conta
            </Button>
            <Button
              size="sm"
              onClick={handleSignup}
              className="hidden sm:inline-flex"
              data-testid="button-signup"
            >
              Criar Conta Grátis
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t lg:hidden" data-testid="mobile-menu">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  handleLogin();
                  setMobileMenuOpen(false);
                }}
                data-testid="button-mobile-login"
              >
                Acessar Conta
              </Button>
              <Button 
                onClick={() => {
                  handleSignup();
                  setMobileMenuOpen(false);
                }}
                data-testid="button-mobile-signup"
              >
                Criar Conta Grátis
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

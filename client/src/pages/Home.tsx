// Integration: blueprint:javascript_log_in_with_replit (Replit Auth)
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PlansSection from "@/components/PlansSection";
import ContactSection from "@/components/ContactSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import ForEmpresas from "./ForEmpresas";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <ForEmpresas />
        <FeaturesSection />
        <TestimonialsSection />
        <PlansSection />
        <ContactSection />
        <CTASection />
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

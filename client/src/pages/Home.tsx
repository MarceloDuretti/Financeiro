import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PlansSection from "@/components/PlansSection";
import ContactSection from "@/components/ContactSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ScrollToTop from "@/components/ScrollToTop";
import ForEmpresas from "./ForEmpresas";

export default function Home() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setLoginModalOpen(true)} />
      
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

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      <ScrollToTop />
    </div>
  );
}

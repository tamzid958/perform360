import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { LogosSection } from "@/components/landing/logos-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SecuritySection } from "@/components/landing/security-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      <LogosSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}

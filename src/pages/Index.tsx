import { GradientBackground } from "@/components/GradientBackground";
import { WelcomeCard } from "@/components/WelcomeCard";
import { Features } from "@/components/Features";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <GradientBackground />
      <Navbar />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-24 space-y-16">
        <WelcomeCard />
        <Features />
      </div>
    </div>
  );
};

export default Index;

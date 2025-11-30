import { GradientBackground } from "@/components/GradientBackground";
import { WelcomeCard } from "@/components/WelcomeCard";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <GradientBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 space-y-16">
        <WelcomeCard />
        <Features />
      </div>
    </div>
  );
};

export default Index;

import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import ServicesSection from '../components/ServicesSection';
import SuccessStoriesSection from '../components/SuccessStoriesSection';
import AchievementsSection from '../components/AchievementsSection';
import SubscribeSection from '../components/SubscribeSection';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <SuccessStoriesSection />
      <AchievementsSection />
      <SubscribeSection />
    </main>
  );
}
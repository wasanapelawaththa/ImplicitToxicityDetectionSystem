
import React from 'react';
import { Page } from '../App';
import { Footer } from './Layout';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-screen h-[100dvh] overflow-hidden bg-[#d0ffff]">
      <header className="bg-[#57eaea] p-4 flex justify-between items-center shadow-sm shrink-0">
        <img src="components/images/logo.png" alt="HUB" className="h-12" />
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate(Page.LOGIN)}
            className="px-6 py-2 btn-custom font-bold rounded-full "
          >
            LOG IN
          </button>
          <button 
            onClick={() => onNavigate(Page.SIGNUP)}
            className="px-6 py-2 btn-custom font-bold rounded-full"
          >
            SIGN UP
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 overflow-hidden select-none ">
        {/* Added extra space between header and content */}
        <div className="mt-4"></div>
        
        <div className="font-shantell text-[#1a1a1a]">
          <h1 className="text-4xl font-bold mb-3">Hug Hub</h1>
          <p className="text-2xl font-medium mb-1">Your</p>
          <p className="text-2xl font-medium mb-1">Daily Dose of</p>
          <p className="text-2xl font-medium mb-4">Warm</p>
          <h2 className="text-5xl font-bold mb-1">Hug it out</h2>
        </div>
        
        <div className="max-w-[180px] sm:max-w-[200px] mx-auto ">
          <img 
            src="components/images/heart.png" 
            alt="Heart Hug" 
            className="w-full"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;

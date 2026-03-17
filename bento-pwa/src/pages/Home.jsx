import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AIActionSheet from '../components/Nana/AIActionSheet';
import './Home.css';

// Custom Line-Art Icons for 100% Fidelity
const BentoIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 12h18M12 3v18M12 12l9 9M12 12L3 21" opacity="0.2" />
    <rect x="5" y="5" width="6" height="6" rx="1" />
    <rect x="13" y="5" width="6" height="6" rx="1" />
    <rect x="5" y="13" width="6" height="6" rx="1" />
    <rect x="13" y="13" width="6" height="6" rx="1" />
  </svg>
);

const ChefIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 13.8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9.8" />
    <path d="M6 10h12M6 14h12c1 0 2 1 2 2s-1 2-2 2H6c-1 0-2-1-2-2s1-2 2-2z" />
    <path d="M8 18v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
    <path d="m11 22 2-4" />
  </svg>
);

const IngredientsIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

const SparkleAIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L14.5 9L21 11.5L14.5 14L12 21L9.5 14L3 11.5L9.5 9L12 3Z" fill="var(--color-accent)" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 3L19.5 5L21.5 5.5L19.5 6L19 8L18.5 6L16.5 5.5L18.5 5L19 3Z" fill="currentColor" />
    <path d="M5 16L5.5 18L7.5 18.5L5.5 19L5 21L4.5 19L2.5 18.5L4.5 18L5 16Z" fill="currentColor" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const { openNana } = useOutletContext();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const menuItems = [
    {
      id: 'bentos',
      title: 'Bentos',
      desc: 'Catálogo de productos finales y rentabilidad',
      icon: <BentoIcon />,
      path: '/bento-maker'
    },
    {
      id: 'preparations',
      title: 'Elaboraciones',
      desc: 'Mise en place y recetas base de cocina',
      icon: <ChefIcon />,
      path: '/preparations'
    },
    {
      id: 'ingredients',
      title: 'Insumos',
      desc: 'Control de stock y precios de mercado',
      icon: <IngredientsIcon />,
      path: '/ingredients'
    }
  ];

  return (
    <div className="home-root">
      {/* HEADER SECTION */}
      <header className="header-navy">
        <div className="seal-logo-wrapper">
          <img src="/logo-bachan.png" alt="Bachan Bentobox" className="seal-logo-crema" />
        </div>
      </header>

      {/* BODY SECTION */}
      <main className="body-paper">
        <div className="home-menu-container">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => navigate(item.path)} className="home-menu-card">
              <div className="menu-card-icon">
                {item.icon}
              </div>
              <div className="menu-card-text">
                <h3 className="menu-card-title">{item.title}</h3>
                <p className="menu-card-desc">{item.desc}</p>
              </div>
              <ArrowIcon />
            </button>
          ))}
        </div>

        {/* FOOTER MASTER AI BUTTON */}
        <footer className="home-footer-master">
          <button className="master-ai-pill" onClick={() => setIsActionSheetOpen(true)}>
            <SparkleAIIcon />
            <span>NANA IA</span>
          </button>
        </footer>
      </main>

      <AIActionSheet 
        isOpen={isActionSheetOpen} 
        onClose={() => setIsActionSheetOpen(false)}
        onSelectOption={(mode) => openNana(mode === 'vision')}
      />
    </div>
  );
}

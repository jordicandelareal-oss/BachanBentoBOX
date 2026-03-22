import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AIActionSheet from '../components/Nana/AIActionSheet';
import './Home.css';
import { SquareMenu, CookingPot, Carrot, Sparkles, ShoppingBag, TrendingUp } from 'lucide-react';



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
const ChefIcon = () => <CookingPot size={42} strokeWidth={1.2} />;
const IngredientsIcon = () => <Carrot size={42} strokeWidth={1.2} />;

const SparkleAIIcon = () => <Sparkles size={24} color="var(--color-accent)" strokeWidth={1.5} />;

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
      id: 'pos',
      title: 'TPV / Caja',
      desc: 'Cobro rápido y gestión de pedidos',
      icon: <ShoppingBag size={42} strokeWidth={1.2} />,
      path: '/pos'
    },
    {
      id: 'sales',
      title: 'Ventas',
      desc: 'Dashboard y análisis histórico',
      icon: <TrendingUp size={42} strokeWidth={1.2} />,
      path: '/admin/ventas'
    },

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

import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AIActionSheet from '../components/Nana/AIActionSheet';
import './Home.css';
import { SquareMenu, CookingPot, Carrot, Sparkles, ShoppingBag, TrendingUp, BookOpen } from 'lucide-react';



const BentoIcon = () => <BookOpen size={42} strokeWidth={1.2} />
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
      title: 'Menú',
      desc: 'Catálogo de productos finales y categorías',
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

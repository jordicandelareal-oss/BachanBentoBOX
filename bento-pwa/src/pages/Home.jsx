import { useNavigate, useOutletContext } from 'react-router-dom';
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

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const NanaFaceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5"/>
    <path d="M35 45C35 45 40 40 50 40C60 40 65 45 65 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M40 65C40 65 45 70 50 70C55 70 60 65 60 65" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="40" cy="50" r="3" fill="currentColor"/>
    <circle cx="60" cy="50" r="3" fill="currentColor"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const { openNana } = useOutletContext();

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

        {/* FOOTER ACTION BUTTONS */}
        <footer className="home-dual-footer">
          <div className="pill-buttons-row">
            <button className="pill-btn-navy" onClick={() => openNana(true)}>
              <CameraIcon />
              <span>NANA VISION</span>
            </button>
            <button className="pill-btn-navy" onClick={() => openNana(false)}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>🎎</span>
              <span>HABLAR CON NANA</span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

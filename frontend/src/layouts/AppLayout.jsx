import { NavLink, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './AppLayout.css';

const navItems = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/tree', label: 'Arbre généalogique' },
  { to: '/events', label: 'Événements' },
  { to: '/messages', label: 'Messagerie' },
  { to: '/directory', label: 'Annuaire' },
  { to: '/validations', label: 'Validations' },
  { to: '/profile', label: 'Mon profil' },
];

function AppLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          Fil des Générations
        </div>

        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="dot" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar-sm">
            {user?.person?.photoUrl ? (
              <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${user.person.photoUrl}`} alt="" />) : (
              user?.email?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div>
            <div className="member-name">{user?.email}</div>
            <div className="member-id">{user?.memberNumber}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Se déconnecter">
            ⏻
          </button>
        </div>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
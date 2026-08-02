import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Login.css';

function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const { login, register, error, loading } = useAuthStore();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      // L'erreur est déjà stockée dans le store, rien à faire ici
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">F</div>
          <span>Fil des Générations</span>
        </div>

        <h1>{mode === 'login' ? 'Bon retour parmi les vôtres' : 'Rejoindre la famille'}</h1>
        <p className="login-sub">
          {mode === 'login'
            ? 'Connectez-vous pour retrouver votre famille.'
            : 'Créez votre compte pour rejoindre l\'arbre familial.'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="login-row">
              <div className="login-field">
                <label>Prénom</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="login-field">
                <label>Nom</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>
          )}

          <div className="login-field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="login-field">
            <label>Mot de passe</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p className="login-switch">
          {mode === 'login' ? (
            <>Pas encore de compte ? <button onClick={() => setMode('register')}>S'inscrire</button></>
          ) : (
            <>Déjà membre ? <button onClick={() => setMode('login')}>Se connecter</button></>
          )}
        </p>
      </div>
    </div>
  );
}

export default Login;
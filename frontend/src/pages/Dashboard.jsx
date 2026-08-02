import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { listEvents } from '../api/events.api';
import { listPendingValidations } from '../api/validations.api';
import { listConversations } from '../api/messaging.api';
import { listPersons } from '../api/persons.api';
import './Dashboard.css';

const EVENT_TYPE_LABELS = {
  bapteme: 'Baptême',
  mariage: 'Mariage',
  reunion: 'Réunion',
  anniversaire: 'Anniversaire',
  deces: 'Décès',
  autre: 'Autre',
};

function formatEventDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });
  return { day, month };
}

function Dashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const [events, setEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const tasks = [
          listEvents({ upcoming: 'true' }),
          listConversations(),
          listPersons(),
        ];
        if (isAdmin) {
          tasks.push(listPendingValidations());
        }

        const results = await Promise.all(tasks);
        setEvents(results[0]);
        setConversations(results[1]);
        setPersons(results[2]);
        if (isAdmin) {
          setPendingRequests(results[3]);
        }
      } catch (err) {
        console.error('Erreur de chargement du tableau de bord', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [isAdmin]);

  if (loading) {
    return <p style={{ color: 'var(--sage)' }}>Chargement...</p>;
  }

  return (
    <div>
      <div className="dash-header">
        <div>
          <div className="dash-eyebrow">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1>Bonjour, {user?.email?.split('@')[0]}</h1>
        </div>
        <Link to="/events" className="dash-btn-primary">+ Créer une annonce</Link>
      </div>

      <div className="dash-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-num">{persons.length}</div>
          <div className="dash-stat-label">Membres recensés</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-num">{events.length}</div>
          <div className="dash-stat-label">Événements à venir</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-num">{conversations.length}</div>
          <div className="dash-stat-label">Conversations</div>
        </div>
        {isAdmin && (
          <div className="dash-stat-card">
            <div className="dash-stat-num">{pendingRequests.length}</div>
            <div className="dash-stat-label">Fiches à valider</div>
          </div>
        )}
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2>Événements à venir</h2>
            <Link to="/events" className="dash-link">Voir tout</Link>
          </div>
          {events.length === 0 && (
            <p className="dash-empty">Aucun événement à venir pour le moment.</p>
          )}
          {events.map((event) => {
            const { day, month } = formatEventDate(event.eventDate);
            return (
              <div key={event.id} className="dash-event-row">
                <div className="dash-event-date">
                  <div className="day">{day}</div>
                  <div className="month">{month}</div>
                </div>
                <div className="dash-event-info">
                  <div className="dash-event-title">{event.title}</div>
                  <div className="dash-event-meta">{event.location || 'Lieu à confirmer'}</div>
                </div>
                <span className={`dash-badge dash-badge-${event.eventType}`}>
                  {EVENT_TYPE_LABELS[event.eventType]}
                </span>
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <div className="dash-panel">
            <div className="dash-panel-head">
              <h2>Fiches en attente</h2>
              <Link to="/validations" className="dash-link">Tout voir</Link>
            </div>
            {pendingRequests.length === 0 && (
              <p className="dash-empty">Aucune demande en attente.</p>
            )}
            {pendingRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="dash-req-row">
                <div className="dash-seal">{req.changeType === 'create' ? '?' : '✎'}</div>
                <div className="dash-req-info">
                  <div className="dash-req-title">
                    {req.changeType === 'create' ? 'Nouvelle fiche' : 'Modification'}
                    {req.payload?.firstName && ` — ${req.payload.firstName} ${req.payload.lastName || ''}`}
                  </div>
                  <div className="dash-req-meta">Proposée par {req.requestedBy?.memberNumber}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
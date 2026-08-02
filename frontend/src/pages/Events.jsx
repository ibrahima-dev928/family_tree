import { useEffect, useState } from 'react';
import { listEvents, rsvpEvent } from '../api/events.api';
import useAuthStore from '../store/authStore';
import EventForm from '../components/EventForm';
import './Events.css';

const EVENT_TYPE_LABELS = {
  bapteme: 'Baptême',
  mariage: 'Mariage',
  reunion: 'Réunion',
  anniversaire: 'Anniversaire',
  deces: 'Décès',
  autre: 'Autre',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Events() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadEvents() {
    try {
      const data = await listEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleRsvp(eventId, response) {
    try {
      await rsvpEvent(eventId, { response });
      loadEvents(); // recharge pour mettre à jour le compteur de confirmations
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement...</p>;

  return (
    <div>
      <div className="ev-header">
        <h1>Événements</h1>
        <button className="ev-add-btn" onClick={() => setShowForm(true)}>+ Créer une annonce</button>
      </div>

      {events.length === 0 && (
        <p style={{ color: 'var(--sage)' }}>Aucun événement pour le moment.</p>
      )}

      <div className="ev-list">
        {events.map((event) => {
          const myRsvp = event.rsvps?.find((r) => r.user?.id === user.id);
          const yesCount = event.rsvps?.filter((r) => r.response === 'yes').length || event._count?.rsvps || 0;

          return (
            <div key={event.id} className="ev-card">
              <div className="ev-card-top">
                <span className={`ev-badge ev-badge-${event.eventType}`}>
                  {EVENT_TYPE_LABELS[event.eventType]}
                </span>
                <span className="ev-rsvp-count">{yesCount} confirmé(s)</span>
              </div>

              <h2 className="ev-card-title">{event.title}</h2>
              <p className="ev-card-date">{formatDate(event.eventDate)}</p>
              {event.location && <p className="ev-card-location">📍 {event.location}</p>}
              {event.description && <p className="ev-card-desc">{event.description}</p>}

              <div className="ev-rsvp-actions">
                <button
                  className={`ev-rsvp-btn ${myRsvp?.response === 'yes' ? 'active-yes' : ''}`}
                  onClick={() => handleRsvp(event.id, 'yes')}
                >
                  ✓ Je viens
                </button>
                <button
                  className={`ev-rsvp-btn ${myRsvp?.response === 'maybe' ? 'active-maybe' : ''}`}
                  onClick={() => handleRsvp(event.id, 'maybe')}
                >
                  ? Peut-être
                </button>
                <button
                  className={`ev-rsvp-btn ${myRsvp?.response === 'no' ? 'active-no' : ''}`}
                  onClick={() => handleRsvp(event.id, 'no')}
                >
                  ✕ Absent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <EventForm onClose={() => setShowForm(false)} onSuccess={loadEvents} />
      )}
    </div>
  );
}

export default Events;
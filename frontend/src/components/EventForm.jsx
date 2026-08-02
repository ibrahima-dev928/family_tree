import { useState } from 'react';
import { createEvent } from '../api/events.api';
import './EventForm.css';

const EVENT_TYPES = [
  { value: 'bapteme', label: 'Baptême' },
  { value: 'mariage', label: 'Mariage' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'deces', label: 'Décès' },
  { value: 'autre', label: 'Autre' },
];

function EventForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    eventType: 'reunion',
    eventDate: '',
    location: '',
    description: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createEvent(form);
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Erreur lors de la création.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="evform-overlay" onClick={onClose}>
      <div className="evform-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Créer une annonce</h2>

        <form onSubmit={handleSubmit} className="evform-form">
          <div className="evform-field">
            <label>Titre *</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>

          <div className="evform-field">
            <label>Type d'événement</label>
            <select name="eventType" value={form.eventType} onChange={handleChange}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="evform-field">
            <label>Date et heure *</label>
            <input type="datetime-local" name="eventDate" value={form.eventDate} onChange={handleChange} required />
          </div>

          <div className="evform-field">
            <label>Lieu</label>
            <input name="location" value={form.location} onChange={handleChange} />
          </div>

          <div className="evform-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </div>

          {error && <p className="evform-error">{error}</p>}

          <div className="evform-actions">
            <button type="button" onClick={onClose} className="evform-cancel">Annuler</button>
            <button type="submit" disabled={loading} className="evform-submit">
              {loading ? 'Création...' : 'Créer l\'annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventForm;
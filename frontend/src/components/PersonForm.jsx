import { useState } from 'react';
import { createPerson } from '../api/persons.api';
import './PersonForm.css';

function PersonForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    occupation: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // On ne renvoie que les champs remplis
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value !== '')
    );

    try {
      const result = await createPerson(payload);
      if (result.pendingRequest) {
        setPendingMessage("Votre proposition a été envoyée pour validation par un administrateur.");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Erreur lors de la création.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pform-overlay" onClick={onClose}>
      <div className="pform-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Ajouter une personne</h2>
        <p className="pform-sub">
          Pour un nouveau-né, un ancêtre décédé, ou toute personne sans compte utilisateur.
        </p>

        {pendingMessage ? (
          <p className="pform-success">{pendingMessage}</p>
        ) : (
          <form onSubmit={handleSubmit} className="pform-form">
            <div className="pform-row">
              <div className="pform-field">
                <label>Prénom *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="pform-field">
                <label>Nom *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="pform-field">
              <label>Genre</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">— Non précisé —</option>
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="pform-row">
              <div className="pform-field">
                <label>Date de naissance</label>
                <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} />
              </div>
              <div className="pform-field">
                <label>Lieu de naissance</label>
                <input name="birthPlace" value={form.birthPlace} onChange={handleChange} />
              </div>
            </div>

            <div className="pform-field">
              <label>Date de décès (si applicable)</label>
              <input type="date" name="deathDate" value={form.deathDate} onChange={handleChange} />
            </div>

            <div className="pform-field">
              <label>Profession</label>
              <input name="occupation" value={form.occupation} onChange={handleChange} />
            </div>

            {error && <p className="pform-error">{error}</p>}

            <div className="pform-actions">
              <button type="button" onClick={onClose} className="pform-cancel">Annuler</button>
              <button type="submit" disabled={loading} className="pform-submit">
                {loading ? 'Création...' : 'Ajouter'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default PersonForm;
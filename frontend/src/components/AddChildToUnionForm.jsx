import { useState } from 'react';
import { createParentChild } from '../api/relations.api';
import './AddChildToUnionForm.css';

function AddChildToUnionForm({ persons, partnerships, onClose, onSuccess }) {
  const personById = new Map(persons.map((p) => [p.id, p]));

  const [unionId, setUnionId] = useState('');
  const [childId, setChildId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!unionId || !childId) {
      setError('Sélectionnez une union et un enfant.');
      return;
    }

    const union = partnerships.find((p) => p.id === unionId);
    if (!union) {
      setError('Union introuvable.');
      return;
    }

    if (union.person1Id === childId || union.person2Id === childId) {
      setError('Cette personne fait déjà partie de l\'union sélectionnée.');
      return;
    }

    setLoading(true);
    try {
      // Crée les deux liens (chaque parent -> enfant) l'un après l'autre
      await createParentChild({ parentId: union.person1Id, childId });
      await createParentChild({ parentId: union.person2Id, childId });
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Erreur lors de la création du lien.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="actu-overlay" onClick={onClose}>
      <div className="actu-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Ajouter un enfant à une union</h2>
        <p className="actu-sub">Le lien sera créé avec les deux parents en une seule fois.</p>

        <form onSubmit={handleSubmit} className="actu-form">
          <div className="actu-field">
            <label>Union (couple)</label>
            <select value={unionId} onChange={(e) => setUnionId(e.target.value)} required>
              <option value="">— Sélectionner une union —</option>
              {partnerships.map((u) => {
                const p1 = personById.get(u.person1Id);
                const p2 = personById.get(u.person2Id);
                if (!p1 || !p2) return null;
                return (
                  <option key={u.id} value={u.id}>
                    {p1.firstName} {p1.lastName} & {p2.firstName} {p2.lastName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="actu-field">
            <label>Enfant</label>
            <select value={childId} onChange={(e) => setChildId(e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {error && <p className="actu-error">{error}</p>}

          <div className="actu-actions">
            <button type="button" onClick={onClose} className="actu-cancel">Annuler</button>
            <button type="submit" disabled={loading} className="actu-submit">
              {loading ? 'Création...' : 'Ajouter l\'enfant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddChildToUnionForm;
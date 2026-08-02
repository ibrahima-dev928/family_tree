import { useState } from 'react';
import { createParentChild, createPartnership } from '../api/relations.api';
import './RelationForm.css';

function RelationForm({ persons, onClose, onSuccess }) {
  const [relationKind, setRelationKind] = useState('parent-child'); // 'parent-child' | 'partnership'
  const [personAId, setPersonAId] = useState('');
  const [personBId, setPersonBId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!personAId || !personBId) {
      setError('Sélectionnez les deux personnes.');
      return;
    }
    if (personAId === personBId) {
      setError('Les deux personnes doivent être différentes.');
      return;
    }

    setLoading(true);
    try {
      if (relationKind === 'parent-child') {
        await createParentChild({ parentId: personAId, childId: personBId });
      } else {
        await createPartnership({ person1Id: personAId, person2Id: personBId });
      }
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
    <div className="relform-overlay" onClick={onClose}>
      <div className="relform-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Relier deux personnes</h2>

        <div className="relform-toggle">
          <button
            type="button"
            className={relationKind === 'parent-child' ? 'active' : ''}
            onClick={() => setRelationKind('parent-child')}
          >
            Lien parent → enfant
          </button>
          <button
            type="button"
            className={relationKind === 'partnership' ? 'active' : ''}
            onClick={() => setRelationKind('partnership')}
          >
            Mariage / union
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relform-form">
          <div className="relform-field">
            <label>{relationKind === 'parent-child' ? 'Parent' : 'Première personne'}</label>
            <select value={personAId} onChange={(e) => setPersonAId(e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div className="relform-field">
            <label>{relationKind === 'parent-child' ? 'Enfant' : 'Deuxième personne'}</label>
            <select value={personBId} onChange={(e) => setPersonBId(e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {error && <p className="relform-error">{error}</p>}

          <div className="relform-actions">
            <button type="button" onClick={onClose} className="relform-cancel">Annuler</button>
            <button type="submit" disabled={loading} className="relform-submit">
              {loading ? 'Création...' : 'Créer le lien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RelationForm;
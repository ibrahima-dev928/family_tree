import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { updatePerson, deletePerson, getPerson } from '../api/persons.api';
import { deleteParentChild, deletePartnership } from '../api/relations.api';
import './PersonDetail.css';

function initials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

function PersonDetail({ person, onClose, onSuccess }) {
  const [mode, setMode] = useState('view');
  const [fullPerson, setFullPerson] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const [form, setForm] = useState({
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    gender: person.gender || '',
    birthDate: toDateInputValue(person.birthDate),
    birthPlace: person.birthPlace || '',
    deathDate: toDateInputValue(person.deathDate),
    occupation: person.occupation || '',
    bio: person.bio || '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [relationError, setRelationError] = useState(null);
  const [removingRelationId, setRemovingRelationId] = useState(null);

  async function loadFullPerson() {
    setLoadingDetails(true);
    try {
      const data = await getPerson(person.id);
      setFullPerson(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  }

  useEffect(() => {
    loadFullPerson();
  }, [person.id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
    try {
      const result = await updatePerson(person.id, payload);
      if (result.pendingRequest) {
        setPendingMessage('Votre modification a été envoyée pour validation par un administrateur.');
        setTimeout(() => { onSuccess(); onClose(); }, 1800);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la modification.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    try {
      const result = await deletePerson(person.id);
      if (result.pendingRequest) {
        setPendingMessage('Votre demande de suppression a été envoyée pour validation par un administrateur.');
        setTimeout(() => { onSuccess(); onClose(); }, 1800);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setDeleteError(err.response?.data?.error?.message || 'Erreur lors de la suppression.');
    }
  }

  async function handleRemoveRelation(type, relationId) {
    setRelationError(null);
    setRemovingRelationId(relationId);
    try {
      if (type === 'parent-child') {
        await deleteParentChild(relationId);
      } else {
        await deletePartnership(relationId);
      }
      await loadFullPerson();
      onSuccess();
    } catch (err) {
      setRelationError(err.response?.data?.error?.message || 'Erreur lors de la suppression du lien.');
    } finally {
      setRemovingRelationId(null);
    }
  }

  return (
    <div className="pdetail-overlay" onClick={onClose}>
      <div className="pdetail-modal" onClick={(e) => e.stopPropagation()}>
        {pendingMessage ? (
          <p className="pdetail-success">{pendingMessage}</p>
        ) : mode === 'view' ? (
          <>
            <div className="pdetail-header">
              <div className="pdetail-avatar">{initials(person.firstName, person.lastName)}</div>
              <div>
                <h2>{person.firstName} {person.lastName}</h2>
                {person.user?.memberNumber && <div className="pdetail-id">{person.user.memberNumber}</div>}
              </div>
            </div>

            <div className="pdetail-fields">
              {person.birthDate && (
                <div className="pdetail-row">
                  <span className="pdetail-label">Naissance</span>
                  <span>{new Date(person.birthDate).toLocaleDateString('fr-FR')}{person.birthPlace ? ` — ${person.birthPlace}` : ''}</span>
                </div>
              )}
              {person.deathDate && (
                <div className="pdetail-row">
                  <span className="pdetail-label">Décès</span>
                  <span>{new Date(person.deathDate).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {person.occupation && (
                <div className="pdetail-row">
                  <span className="pdetail-label">Profession</span>
                  <span>{person.occupation}</span>
                </div>
              )}
              {person.bio && (
                <div className="pdetail-row">
                  <span className="pdetail-label">Biographie</span>
                  <span>{person.bio}</span>
                </div>
              )}
            </div>

            {/* --- Relations avec bouton de suppression --- */}
            {!loadingDetails && fullPerson && (
              <div className="pdetail-relations">
                {relationError && <p className="pdetail-error">{relationError}</p>}

                {fullPerson.childRelations?.length > 0 && (
                  <div className="pdetail-rel-group">
                    <span className="pdetail-label">Parents</span>
                    {fullPerson.childRelations.map((r) => (
                      <div key={r.id} className="pdetail-rel-row">
                        <span>{r.parent.firstName} {r.parent.lastName}</span>
                        <button
                          disabled={removingRelationId === r.id}
                          onClick={() => handleRemoveRelation('parent-child', r.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {fullPerson.parentRelations?.length > 0 && (
                  <div className="pdetail-rel-group">
                    <span className="pdetail-label">Enfants</span>
                    {fullPerson.parentRelations.map((r) => (
                      <div key={r.id} className="pdetail-rel-row">
                        <span>{r.child.firstName} {r.child.lastName}</span>
                        <button
                          disabled={removingRelationId === r.id}
                          onClick={() => handleRemoveRelation('parent-child', r.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {[...(fullPerson.partnershipsAsPerson1 || []), ...(fullPerson.partnershipsAsPerson2 || [])].length > 0 && (
                  <div className="pdetail-rel-group">
                    <span className="pdetail-label">Union(s)</span>
                    {fullPerson.partnershipsAsPerson1?.map((p) => (
                      <div key={p.id} className="pdetail-rel-row">
                        <span>{p.person2.firstName} {p.person2.lastName}</span>
                        <button
                          disabled={removingRelationId === p.id}
                          onClick={() => handleRemoveRelation('partnership', p.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {fullPerson.partnershipsAsPerson2?.map((p) => (
                      <div key={p.id} className="pdetail-rel-row">
                        <span>{p.person1.firstName} {p.person1.lastName}</span>
                        <button
                          disabled={removingRelationId === p.id}
                          onClick={() => handleRemoveRelation('partnership', p.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pdetail-actions">
              <button className="pdetail-cancel" onClick={onClose}>Fermer</button>
              <button className="pdetail-edit" onClick={() => setMode('edit')}>✎ Modifier</button>
            </div>
            <Link to={`/person/${person.id}`} className="pdetail-full-link" onClick={onClose}>
              Voir la fiche complète →
            </Link>

            {deleteError && <p className="pdetail-error" style={{ marginTop: '10px' }}>{deleteError}</p>}

            {!confirmingDelete ? (
              <button className="pdetail-delete-trigger" onClick={() => setConfirmingDelete(true)}>
                🗑 Supprimer cette fiche
              </button>
            ) : (
              <div className="pdetail-confirm-delete">
                <p>Confirmer la suppression définitive ?</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="pdetail-cancel" onClick={() => setConfirmingDelete(false)}>Annuler</button>
                  <button className="pdetail-delete-confirm" onClick={handleDelete}>Oui, supprimer</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h2>Modifier {person.firstName} {person.lastName}</h2>
            <form onSubmit={handleSubmit} className="pdetail-form">
              <div className="pdetail-form-row">
                <div className="pdetail-field">
                  <label>Prénom</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} />
                </div>
                <div className="pdetail-field">
                  <label>Nom</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="pdetail-form-row">
                <div className="pdetail-field">
                  <label>Date de naissance</label>
                  <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} />
                </div>
                <div className="pdetail-field">
                  <label>Lieu de naissance</label>
                  <input name="birthPlace" value={form.birthPlace} onChange={handleChange} />
                </div>
              </div>
              <div className="pdetail-field">
                <label>Date de décès</label>
                <input type="date" name="deathDate" value={form.deathDate} onChange={handleChange} />
              </div>
              <div className="pdetail-field">
                <label>Profession</label>
                <input name="occupation" value={form.occupation} onChange={handleChange} />
              </div>
              <div className="pdetail-field">
                <label>Biographie</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
              </div>
              {error && <p className="pdetail-error">{error}</p>}
              <div className="pdetail-actions">
                <button type="button" className="pdetail-cancel" onClick={() => setMode('view')}>Annuler</button>
                <button type="submit" disabled={loading} className="pdetail-edit">
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default PersonDetail;
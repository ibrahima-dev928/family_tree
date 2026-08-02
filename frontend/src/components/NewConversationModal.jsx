import { useState } from 'react';
import { searchUsers } from '../api/users.api';
import { createConversation } from '../api/messaging.api';
import './NewConversationModal.css';

function NewConversationModal({ onClose, onCreated }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  let searchTimeout;

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    setError(null);

    clearTimeout(searchTimeout);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    searchTimeout = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsers(value.trim());
        setResults(users);
      } catch (err) {
        setError('Erreur lors de la recherche.');
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  async function handleSelect(targetUser) {
    try {
      const conversation = await createConversation({ participantIds: [targetUser.id] });
      onCreated(conversation);
      onClose();
    } catch (err) {
      setError('Impossible de créer la conversation.');
    }
  }

  return (
    <div className="ncm-overlay" onClick={onClose}>
      <div className="ncm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nouvelle conversation</h2>
        <p className="ncm-sub">Recherchez par nom ou numéro de membre (ex: FAM-000001)</p>

        <input
          className="ncm-search"
          type="text"
          placeholder="Rechercher un membre..."
          value={query}
          onChange={handleChange}
          autoFocus
        />

        {error && <p className="ncm-error">{error}</p>}
        {searching && <p className="ncm-hint">Recherche...</p>}

        <div className="ncm-results">
          {results.map((u) => (
            <div key={u.id} className="ncm-result-row" onClick={() => handleSelect(u)}>
              <div className="ncm-result-avatar">
                {u.person?.firstName?.[0]}{u.person?.lastName?.[0]}
              </div>
              <div>
                <div className="ncm-result-name">{u.person?.firstName} {u.person?.lastName}</div>
                <div className="ncm-result-id">{u.memberNumber}</div>
              </div>
            </div>
          ))}
          {query.length >= 2 && !searching && results.length === 0 && (
            <p className="ncm-hint">Aucun membre trouvé.</p>
          )}
        </div>

        <button className="ncm-cancel" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

export default NewConversationModal;
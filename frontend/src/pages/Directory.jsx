import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPersons } from '../api/persons.api';
import './Directory.css';

function initials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function formatBirth(birthDate) {
  return birthDate ? new Date(birthDate).getFullYear() : '?';
}

function Directory() {
  const [persons, setPersons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await listPersons();
        setPersons(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = persons.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement...</p>;

  return (
    <div>
      <div className="dir-header">
        <h1>Annuaire familial</h1>
        <span className="dir-count">{persons.length} membre{persons.length !== 1 ? 's' : ''}</span>
      </div>

      <input
        className="dir-search"
        type="text"
        placeholder="Rechercher un membre par nom..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 && (
        <p style={{ color: 'var(--sage)', marginTop: '20px' }}>Aucun membre trouvé.</p>
      )}

      <div className="dir-grid">
        {filtered.map((person) => {
          const isDeceased = !!person.deathDate;
          return (
            <Link
              to={`/person/${person.id}`}
              key={person.id}
              className={`dir-card ${isDeceased ? 'deceased' : ''}`}
            >
              <div className="dir-avatar">{initials(person.firstName, person.lastName)}</div>
              <div className="dir-name">{person.firstName} {person.lastName}</div>
              <div className="dir-birth">
                {isDeceased
                  ? `${formatBirth(person.birthDate)} – ${formatBirth(person.deathDate)}`
                  : person.birthDate
                    ? `Né(e) en ${formatBirth(person.birthDate)}`
                    : ''}
              </div>
              {person.user?.memberNumber ? (
                <div className="dir-tag">{person.user.memberNumber}</div>
              ) : (
                <div className="dir-tag dir-tag-no-account">Sans compte</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Directory;
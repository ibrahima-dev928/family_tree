import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSubtree } from '../api/tree.api';
import './PersonPage.css';

function initials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function formatYears(birthDate, deathDate) {
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : '?';
  if (deathDate) return `${birthYear} – ${new Date(deathDate).getFullYear()}`;
  return birthDate ? `Né(e) en ${birthYear}` : '';
}

function PersonMiniCard({ person }) {
  return (
    <Link to={`/person/${person.id}`} className="pp-mini-card">
      <div className="pp-mini-avatar">{initials(person.firstName, person.lastName)}</div>
      <div>
        <div className="pp-mini-name">{person.firstName} {person.lastName}</div>
        <div className="pp-mini-years">{formatYears(person.birthDate, person.deathDate)}</div>
      </div>
    </Link>
  );
}

function PersonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await getSubtree(id);
        setData(result);
      } catch (err) {
        setError('Impossible de charger cette fiche.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement...</p>;
  if (error) return <p style={{ color: 'var(--seal)' }}>{error}</p>;
  if (!data) return null;

  const { person, parents, siblings, partners, children } = data;
  const isDeceased = !!person.deathDate;

  return (
    <div className="pp-page">
      <button className="pp-back" onClick={() => navigate(-1)}>← Retour</button>

      <div className="pp-header">
        <div className={`pp-avatar ${isDeceased ? 'deceased' : ''}`}>
          {initials(person.firstName, person.lastName)}
        </div>
        <div>
          <h1>{person.firstName} {person.lastName}</h1>
          <p className="pp-sub">
            {formatYears(person.birthDate, person.deathDate)}
            {person.birthPlace ? ` — ${person.birthPlace}` : ''}
          </p>
          {person.user?.memberNumber && <div className="pp-id">{person.user.memberNumber}</div>}
        </div>
      </div>

      {person.occupation && (
        <div className="pp-block">
          <h2>Profession</h2>
          <p>{person.occupation}</p>
        </div>
      )}

      {person.bio && (
        <div className="pp-block">
          <h2>Biographie</h2>
          <p>{person.bio}</p>
        </div>
      )}

      <div className="pp-relations">
        <div className="pp-relation-group">
          <h2>Parents {parents.length > 0 && `(${parents.length})`}</h2>
          {parents.length === 0 ? (
            <p className="pp-empty">Aucun parent renseigné.</p>
          ) : (
            <div className="pp-mini-list">
              {parents.map((p) => <PersonMiniCard key={p.id} person={p} />)}
            </div>
          )}
        </div>

        <div className="pp-relation-group">
          <h2>Frères et sœurs {siblings.length > 0 && `(${siblings.length})`}</h2>
          {siblings.length === 0 ? (
            <p className="pp-empty">Aucun frère ou sœur renseigné.</p>
          ) : (
            <div className="pp-mini-list">
              {siblings.map((s) => <PersonMiniCard key={s.id} person={s} />)}
            </div>
          )}
        </div>

        <div className="pp-relation-group">
          <h2>Conjoint(s) {partners.length > 0 && `(${partners.length})`}</h2>
          {partners.length === 0 ? (
            <p className="pp-empty">Aucune union renseignée.</p>
          ) : (
            <div className="pp-mini-list">
              {partners.map((p) => <PersonMiniCard key={p.id} person={p} />)}
            </div>
          )}
        </div>

        <div className="pp-relation-group">
          <h2>Enfants {children.length > 0 && `(${children.length})`}</h2>
          {children.length === 0 ? (
            <p className="pp-empty">Aucun enfant renseigné.</p>
          ) : (
            <div className="pp-mini-list">
              {children.map((c) => <PersonMiniCard key={c.id} person={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonPage;
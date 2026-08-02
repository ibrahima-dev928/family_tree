import { useEffect, useState } from 'react';
import { getFullTree } from '../api/tree.api';
import { buildTreeLayout } from '../utils/buildTreeGenerations';
import RelationForm from '../components/RelationForm';
import PersonForm from '../components/PersonForm';
import PersonDetail from '../components/PersonDetail'; // Ajout
import './Tree.css';

function initials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function formatYears(birthDate, deathDate) {
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : '?';
  if (deathDate) {
    return `${birthYear} – ${new Date(deathDate).getFullYear()}`;
  }
  return birthDate ? `Né(e) ${birthYear}` : '';
}

function Tree() {
  const [layout, setLayout] = useState(null);
  const [allPersons, setAllPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null); // Ajout

  async function loadTree() {
    try {
      const data = await getFullTree();
      setAllPersons(data.persons);
      setLayout(buildTreeLayout(data));
    } catch (err) {
      setError('Impossible de charger l\'arbre généalogique.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTree();
  }, []);

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement de l'arbre...</p>;
  if (error) return <p style={{ color: 'var(--seal)' }}>{error}</p>;

  const isEmpty = !layout || layout.placedPersons.length === 0;

  return (
    <div className="tree-page">
      <div className="tree-header">
        <h1>Arbre généalogique</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="tree-add-btn" onClick={() => setShowPersonForm(true)}>
            + Ajouter une personne
          </button>
          <button className="tree-add-btn" onClick={() => setShowRelationForm(true)}>
            + Relier deux personnes
          </button>
        </div>
      </div>

      {isEmpty && (
        <p style={{ color: 'var(--sage)', padding: '20px 48px' }}>
          Aucune personne dans l'arbre pour le moment.
        </p>
      )}

      {!isEmpty && (
        <div className="tree-canvas">
          <div
            className="tree-canvas-inner"
            style={{ width: layout.canvasWidth, height: layout.canvasHeight }}
          >
            <svg
              className="tree-lines"
              width={layout.canvasWidth}
              height={layout.canvasHeight}
            >
              {layout.lines.map((line, idx) => {
                const midY = (line.y1 + line.y2) / 2;
                const path = `M ${line.x1} ${line.y1} C ${line.x1} ${midY}, ${line.x2} ${midY}, ${line.x2} ${line.y2}`;
                return (
                  <path
                    key={idx}
                    d={path}
                    fill="none"
                    stroke="rgba(28, 43, 36, 0.28)"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>

            {layout.placedPersons.map((person) => {
              const isDeceased = !!person.deathDate;
              return (
                <div
                  key={person.id}
                  className={`tree-card-abs ${isDeceased ? 'deceased' : ''}`}
                  style={{ left: person.x, top: person.y }}
                  onClick={() => setSelectedPerson(person)} // Ajout
                >
                  <div className="tree-card-photo">{initials(person.firstName, person.lastName)}</div>
                  <div className="tree-card-name">{person.firstName} {person.lastName}</div>
                  <div className="tree-card-dates">{formatYears(person.birthDate, person.deathDate)}</div>
                  {person.user?.memberNumber && (
                    <div className="tree-card-tag">{person.user.memberNumber}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showRelationForm && (
        <RelationForm
          persons={allPersons}
          onClose={() => setShowRelationForm(false)}
          onSuccess={loadTree}
        />
      )}

      {showPersonForm && (
        <PersonForm
          onClose={() => setShowPersonForm(false)}
          onSuccess={loadTree}
        />
      )}

      {selectedPerson && (
        <PersonDetail
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onSuccess={loadTree}
        />
      )}
    </div>
  );
}

export default Tree;
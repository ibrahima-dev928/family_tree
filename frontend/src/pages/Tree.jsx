import { useEffect, useState, useRef } from 'react';
import { getFullTree } from '../api/tree.api';
import { buildTreeLayout } from '../utils/buildTreeGenerations';
import RelationForm from '../components/RelationForm';
import PersonForm from '../components/PersonForm';
import PersonDetail from '../components/PersonDetail';
import AddChildToUnionForm from '../components/AddChildToUnionForm';
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
  const [allPartnerships, setAllPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);

  function handleWheel(e) {
    if (!e.ctrlKey) return; // molette seule = scroll normal ; Ctrl+molette = zoom
    e.preventDefault();
    setZoom((z) => Math.min(1.5, Math.max(0.25, z - e.deltaY * 0.001)));
  }

  async function loadTree() {
    try {
      const data = await getFullTree();
      setAllPersons(data.persons);
      setAllPartnerships(data.partnerships);
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
          <button className="tree-add-btn" onClick={() => setShowAddChildForm(true)}>
            + Enfant d'une union
          </button>
        </div>
      </div>

      {isEmpty && (
        <p style={{ color: 'var(--sage)', padding: '20px 48px' }}>
          Aucune personne dans l'arbre pour le moment.
        </p>
      )}

      {!isEmpty && (
        <div className="tree-canvas" ref={canvasRef} onWheel={handleWheel}>
          <div
            className="tree-canvas-inner"
            style={{
              width: layout.canvasWidth * zoom,
              height: layout.canvasHeight * zoom,
            }}
          >
            <div
              style={{
                width: layout.canvasWidth,
                height: layout.canvasHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              <svg
                className="tree-lines"
                width={layout.canvasWidth}
                height={layout.canvasHeight}
              >
                {layout.marriageLines.map((line, idx) => (
                  <line
                    key={`m-${idx}`}
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                    stroke="var(--copper)"
                    strokeWidth="2"
                  />
                ))}
                {layout.descentSegments.map((seg, idx) => (
                  <line
                    key={`d-${idx}`}
                    x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                    stroke="rgba(28, 43, 36, 0.35)"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {layout.placedPersons.map((person) => {
                const isDeceased = !!person.deathDate;
                return (
                  <div
                    key={person.id}
                    className={`tree-card-abs ${isDeceased ? 'deceased' : ''}`}
                    style={{ left: person.x, top: person.y }}
                    onClick={() => setSelectedPerson(person)}
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
        </div>
      )}

      {!isEmpty && (
        <div className="tree-zoom-controls">
          <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}>+</button>
          <div className="tree-zoom-value">{Math.round(zoom * 100)}%</div>
          <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}>−</button>
          <button onClick={() => setZoom(1)} title="Réinitialiser">⤢</button>
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

      {showAddChildForm && (
        <AddChildToUnionForm
          persons={allPersons}
          partnerships={allPartnerships}
          onClose={() => setShowAddChildForm(false)}
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
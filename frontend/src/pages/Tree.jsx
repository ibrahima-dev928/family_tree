import { useEffect, useState, useRef } from 'react';
import { getFullTree } from '../api/tree.api';
import { buildTreeLayout } from '../utils/buildTreeGenerations';
import RelationForm from '../components/RelationForm';
import PersonForm from '../components/PersonForm';
import PersonDetail from '../components/PersonDetail';
import AddChildToUnionForm from '../components/AddChildToUnionForm';
import { importExcel, exportExcel } from '../api/import.api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  // Import/Export state
  const [showImportExport, setShowImportExport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

  // Gestion du zoom avec correction passive
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => Math.min(1.5, Math.max(0.25, z - e.deltaY * 0.001)));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

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

  // --- IMPORT EXCEL ---
  async function handleImport() {
    if (!importFile) {
      setImportMessage({ type: 'error', text: 'Veuillez sélectionner un fichier Excel.' });
      return;
    }
    setImportLoading(true);
    setImportMessage(null);
    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const personsSheet = workbook.Sheets['Personnes'];
      const relationsSheet = workbook.Sheets['Relations'];
      if (!personsSheet) {
        throw new Error('La feuille "Personnes" est obligatoire.');
      }
      const persons = XLSX.utils.sheet_to_json(personsSheet);
      const relations = relationsSheet ? XLSX.utils.sheet_to_json(relationsSheet) : [];

      const result = await importExcel({ persons, relations });
      setImportMessage({ type: 'success', text: `Import réussi : ${result.imported} personnes importées, ${result.updated} mises à jour.` });
      loadTree();
    } catch (err) {
      setImportMessage({ type: 'error', text: err.message || 'Erreur lors de l\'import.' });
    } finally {
      setImportLoading(false);
      setImportFile(null);
    }
  }

  // --- EXPORT EXCEL ---
  async function handleExportExcel() {
    try {
      const blob = await exportExcel();
      saveAs(blob, 'arbre_genealogique.xlsx');
    } catch (err) {
      setImportMessage({ type: 'error', text: 'Erreur lors de l\'export Excel.' });
    }
  }

  // --- EXPORT PDF ---
  function handleExportPDF() {
    if (!allPersons.length) {
      setImportMessage({ type: 'error', text: 'Aucune personne à exporter.' });
      return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Arbre généalogique', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 22, { align: 'center' });

    const rows = allPersons.map(p => [
      p.firstName || '',
      p.lastName || '',
      p.birthDate ? new Date(p.birthDate).toLocaleDateString('fr-FR') : '',
      p.deathDate ? new Date(p.deathDate).toLocaleDateString('fr-FR') : '',
      p.occupation || '',
      p.bio || '',
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Prénom', 'Nom', 'Naissance', 'Décès', 'Profession', 'Biographie']],
      body: rows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [122, 139, 127] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 40 },
      },
    });

    doc.save('arbre_genealogique.pdf');
  }

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement de l'arbre...</p>;
  if (error) return <p style={{ color: 'var(--seal)' }}>{error}</p>;

  const isEmpty = !layout || layout.placedPersons.length === 0;

  return (
    <div className="tree-page">
      <div className="tree-header">
        <h1>Arbre généalogique</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="tree-add-btn" onClick={() => setShowPersonForm(true)}>
            + Ajouter une personne
          </button>
          <button className="tree-add-btn" onClick={() => setShowRelationForm(true)}>
            + Relier deux personnes
          </button>
          <button className="tree-add-btn" onClick={() => setShowAddChildForm(true)}>
            + Enfant d'une union
          </button>
          <button className="tree-add-btn tree-import-btn" onClick={() => setShowImportExport(true)}>
            📂 Import / Export
          </button>
        </div>
      </div>

      {isEmpty && (
        <p style={{ color: 'var(--sage)', padding: '20px 48px' }}>
          Aucune personne dans l'arbre pour le moment.
        </p>
      )}

      {!isEmpty && (
        <div className="tree-canvas" ref={canvasRef}>
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

      {showImportExport && (
        <div className="import-export-modal-overlay" onClick={() => setShowImportExport(false)}>
          <div className="import-export-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Importer / Exporter</h2>
            <div className="import-export-actions">
              <div className="import-section">
                <h3>Importer un fichier Excel</h3>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files[0])}
                />
                <button onClick={handleImport} disabled={importLoading || !importFile}>
                  {importLoading ? 'Import en cours...' : 'Importer'}
                </button>
                {importMessage && (
                  <p className={`import-message ${importMessage.type}`}>{importMessage.text}</p>
                )}
              </div>

              <div className="export-section">
                <h3>Exporter en Excel</h3>
                <button onClick={handleExportExcel}>Télécharger .xlsx</button>
              </div>

              <div className="export-section">
                <h3>Exporter en PDF</h3>
                <button onClick={handleExportPDF}>Télécharger .pdf</button>
              </div>
            </div>
            <button className="import-export-close" onClick={() => setShowImportExport(false)}>
              Fermer
            </button>
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
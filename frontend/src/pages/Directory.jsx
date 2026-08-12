import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPersons } from '../api/persons.api';
import { getFullTree } from '../api/tree.api';
import { buildTreeLayout } from '../utils/buildTreeGenerations';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Directory.css';

function initials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function formatBirth(birthDate) {
  return birthDate ? new Date(birthDate).getFullYear() : '?';
}

// -------------------------------------------------------------
// Fonction pour extraire les relations depuis le layout
// -------------------------------------------------------------
function extractRelationsFromLayout(layout) {
  const relations = [];
  const cardWidth = 168; // largeur d'une carte
  const cardHeight = 90; // hauteur estimée d'une carte

  if (!layout.descentSegments || !layout.placedPersons) return relations;

  layout.descentSegments.forEach(seg => {
    // Trouver le parent : le segment commence au centre-bas de la carte parent
    const parent = layout.placedPersons.find(p => {
      const centerX = p.x + cardWidth / 2;
      const centerY = p.y + cardHeight;
      const dist = Math.hypot(centerX - seg.x1, centerY - seg.y1);
      return dist < 30; // tolérance augmentée
    });
    // Trouver l'enfant : le segment se termine au centre-haut de la carte enfant
    const child = layout.placedPersons.find(p => {
      const centerX = p.x + cardWidth / 2;
      const centerY = p.y;
      const dist = Math.hypot(centerX - seg.x2, centerY - seg.y2);
      return dist < 30;
    });
    if (parent && child) {
      relations.push({ parentId: parent.id, childId: child.id });
    }
  });

  console.log('🔗 Relations extraites du layout:', relations.length);
  return relations;
}

// -------------------------------------------------------------
// Fonction pour construire les données enrichies d'une personne
// -------------------------------------------------------------
function getPersonFullData(person, persons, partnerships, relations) {
  // Parents
  const parentRels = relations.filter(r => r.childId === person.id);
  const parentNames = parentRels
    .map(r => {
      const parent = persons.find(p => p.id === r.parentId);
      return parent ? `${parent.firstName} ${parent.lastName}` : null;
    })
    .filter(Boolean);
  const parentsStr = parentNames.length > 0 ? parentNames.join(' & ') : 'Inconnu(s)';

  // Conjoint
  const partnership = partnerships.find(p => p.person1Id === person.id || p.person2Id === person.id);
  let spouseNames = [];
  if (partnership) {
    const spouseId = partnership.person1Id === person.id ? partnership.person2Id : partnership.person1Id;
    const spouse = persons.find(p => p.id === spouseId);
    if (spouse) spouseNames.push(`${spouse.firstName} ${spouse.lastName}`);
  }
  const conjointStr = spouseNames.length > 0 ? spouseNames.join(' & ') : 'Célibataire';

  // Enfants
  const childRels = relations.filter(r => r.parentId === person.id);
  const childNames = childRels
    .map(r => {
      const child = persons.find(p => p.id === r.childId);
      return child ? `${child.firstName} ${child.lastName}` : null;
    })
    .filter(Boolean);
  const enfantsStr = childNames.length > 0 ? childNames.join(' & ') : 'Aucun enfant';

  // Frères et sœurs
  const siblingIds = new Set();
  parentRels.forEach(pr => {
    const siblings = relations
      .filter(r => r.parentId === pr.parentId && r.childId !== person.id)
      .map(r => r.childId);
    siblings.forEach(id => siblingIds.add(id));
  });
  const siblingNames = Array.from(siblingIds)
    .map(id => {
      const sib = persons.find(p => p.id === id);
      return sib ? `${sib.firstName} ${sib.lastName}` : null;
    })
    .filter(Boolean);
  const freresSoeursStr = siblingNames.length > 0 ? siblingNames.join(' & ') : 'Aucun(e)';

  return {
    prenom: person.firstName || '',
    nom: person.lastName || '',
    dateNaissance: person.birthDate ? new Date(person.birthDate).toLocaleDateString('fr-FR') : '',
    dateDeces: person.deathDate ? new Date(person.deathDate).toLocaleDateString('fr-FR') : '',
    profession: person.occupation || '',
    parents: parentsStr,
    conjoint: conjointStr,
    enfants: enfantsStr,
    freresSoeurs: freresSoeursStr,
    biographie: person.bio || '',
  };
}

// -------------------------------------------------------------
function Directory() {
  const [persons, setPersons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [fullData, setFullData] = useState(null);

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

  // Charger les données complètes pour l'export
  useEffect(() => {
    async function loadFullData() {
      try {
        const treeData = await getFullTree();
        const persons = treeData.persons || [];
        const partnerships = treeData.partnerships || [];

        // Construire le layout pour extraire les relations
        const layout = buildTreeLayout(treeData);
        const relations = extractRelationsFromLayout(layout);

        setFullData({
          persons: persons,
          partnerships: partnerships,
          relations: relations,
        });
        console.log('📊 Données complètes chargées:', {
          personnes: persons.length,
          relations: relations.length,
        });
      } catch (err) {
        console.warn('Erreur chargement données complètes', err);
      }
    }
    loadFullData();
  }, []);

  const filtered = persons.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  // --- EXPORT EXCEL ---
  async function handleExportExcel() {
    if (!fullData) {
      alert('Les données ne sont pas encore prêtes, veuillez réessayer.');
      return;
    }
    setExporting(true);
    try {
      const { persons: allPersons, partnerships, relations } = fullData;
      if (!allPersons.length) {
        alert('Aucune personne à exporter.');
        setExporting(false);
        return;
      }

      const exportData = allPersons
        .map(person => getPersonFullData(person, allPersons, partnerships, relations))
        .sort((a, b) => {
          if (a.nom < b.nom) return -1;
          if (a.nom > b.nom) return 1;
          if (a.prenom < b.prenom) return -1;
          if (a.prenom > b.prenom) return 1;
          return 0;
        });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Annuaire');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      saveAs(blob, 'annuaire_familial.xlsx');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'export Excel.');
    } finally {
      setExporting(false);
    }
  }

  // --- EXPORT PDF ---
  async function handleExportPDF() {
    if (!fullData) {
      alert('Les données ne sont pas encore prêtes, veuillez réessayer.');
      return;
    }
    setExporting(true);
    try {
      const { persons: allPersons, partnerships, relations } = fullData;
      if (!allPersons.length) {
        alert('Aucune personne à exporter.');
        setExporting(false);
        return;
      }

      const exportData = allPersons
        .map(person => getPersonFullData(person, allPersons, partnerships, relations))
        .sort((a, b) => {
          if (a.nom < b.nom) return -1;
          if (a.nom > b.nom) return 1;
          if (a.prenom < b.prenom) return -1;
          if (a.prenom > b.prenom) return 1;
          return 0;
        });

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Annuaire familial', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 22, { align: 'center' });

      const rows = exportData.map(item => [
        item.prenom,
        item.nom,
        item.dateNaissance,
        item.dateDeces,
        item.profession,
        item.parents,
        item.conjoint,
        item.enfants,
        item.freresSoeurs,
        item.biographie,
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Prénom', 'Nom', 'Naissance', 'Décès', 'Profession', 'Parents', 'Conjoint(e)', 'Enfants', 'Frères/Soeurs', 'Biographie']],
        body: rows,
        styles: { fontSize: 6, font: 'helvetica' },
        headStyles: { fillColor: [122, 139, 127], fontStyle: 'bold', textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 15 },
          2: { cellWidth: 14 },
          3: { cellWidth: 14 },
          4: { cellWidth: 18 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 },
          8: { cellWidth: 20 },
          9: { cellWidth: 25 },
        },
      });

      doc.save('annuaire_familial.pdf');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'export PDF.');
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement...</p>;

  return (
    <div>
      <div className="dir-header">
        <h1>Annuaire familial</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="dir-count">{persons.length} membre{persons.length !== 1 ? 's' : ''}</span>
          <button
            className="dir-export-btn"
            onClick={handleExportExcel}
            disabled={exporting || !fullData}
          >
            📊 Excel
          </button>
          <button
            className="dir-export-btn"
            onClick={handleExportPDF}
            disabled={exporting || !fullData}
          >
            📄 PDF
          </button>
        </div>
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
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { importExcel, exportExcel } from '../api/import.api';
import './ImportExportModal.css';

function ImportExportModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier Excel.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const personsSheet = workbook.Sheets['Personnes'];
      const relationsSheet = workbook.Sheets['Relations'];

      if (!personsSheet) {
        throw new Error('La feuille "Personnes" est obligatoire.');
      }

      const persons = XLSX.utils.sheet_to_json(personsSheet);
      const relations = relationsSheet ? XLSX.utils.sheet_to_json(relationsSheet) : [];

      const result = await importExcel({ persons, relations });
      setMessage({ type: 'success', text: `Import réussi : ${result.imported} importées, ${result.updated} mises à jour.` });
      setTimeout(() => {
        onClose(); // Ferme le modal après succès
        window.location.reload(); // Recharge pour voir les changements
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'import.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await exportExcel();
      saveAs(blob, 'arbre_genealogique.xlsx');
      setMessage({ type: 'success', text: 'Export réussi !' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'export.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>📂 Importer / Exporter l'arbre</h2>

        <div className="import-modal-body">
          <div className="import-section">
            <h3>Importer un fichier Excel</h3>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            <button onClick={handleImport} disabled={loading || !file}>
              {loading ? 'Import en cours...' : 'Importer'}
            </button>
          </div>

          <div className="export-section">
            <h3>Exporter en Excel</h3>
            <button onClick={handleExport} disabled={loading}>
              {loading ? 'Export en cours...' : 'Télécharger Excel'}
            </button>
          </div>

          {message && (
            <div className={`import-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        <button className="import-modal-close" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

export default ImportExportModal;
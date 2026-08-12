import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { importExcel, exportExcel } from '../api/import.api';
import './ImportExport.css';

function ImportExport() {
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
      // Lire le fichier en mémoire
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Extraire les feuilles
      const personsSheet = workbook.Sheets['Personnes'];
      const relationsSheet = workbook.Sheets['Relations'];

      if (!personsSheet) {
        throw new Error('La feuille "Personnes" est obligatoire.');
      }

      const persons = XLSX.utils.sheet_to_json(personsSheet);
      const relations = relationsSheet ? XLSX.utils.sheet_to_json(relationsSheet) : [];

      // Envoyer au backend
      const result = await importExcel({ persons, relations });
      setMessage({ type: 'success', text: `Import réussi : ${result.imported} personnes importées, ${result.updated} mises à jour.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'import.' });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await exportExcel();
      saveAs(blob, 'arbre_genealogique.xlsx');
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'export.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-export-container">
      <h2>Import / Export de données</h2>

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
  );
}

export default ImportExport;
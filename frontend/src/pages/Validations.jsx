import { useEffect, useState } from 'react';
import { listPendingValidations, approveValidation, rejectValidation } from '../api/validations.api';
import './Validations.css';

const CHANGE_TYPE_LABELS = {
  create: 'Nouvelle fiche',
  update: 'Modification',
  delete: 'Suppression',
  add_relation: 'Nouvelle relation',
};

function describePayload(request) {
  const { changeType, payload } = request;

  if (changeType === 'add_relation') {
    if (payload.kind === 'parent_child') {
      return `Lien parent-enfant proposé`;
    }
    if (payload.kind === 'partnership') {
      return `Union proposée`;
    }
    return 'Relation proposée';
  }

  if (payload?.firstName || payload?.lastName) {
    return `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
  }

  return 'Détails dans la fiche liée';
}

function Validations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  async function load() {
    try {
      const data = await listPendingValidations();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    setProcessingId(id);
    try {
      await approveValidation(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Erreur lors de l\'approbation.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id) {
    setProcessingId(id);
    try {
      await rejectValidation(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Erreur lors du rejet.');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement...</p>;

  return (
    <div>
      <h1>Validations en attente</h1>
      <p style={{ color: 'var(--sage)', marginTop: '8px', marginBottom: '28px' }}>
        {requests.length} demande{requests.length !== 1 ? 's' : ''} à traiter
      </p>

      {requests.length === 0 && (
        <p style={{ color: 'var(--sage)' }}>Aucune demande en attente. Tout est à jour ✅</p>
      )}

      <div className="val-list">
        {requests.map((req) => (
          <div key={req.id} className="val-card">
            <div className="val-seal">
              {req.changeType === 'create' ? '?' : req.changeType === 'delete' ? '✕' : '✎'}
            </div>

            <div className="val-info">
              <div className="val-type">{CHANGE_TYPE_LABELS[req.changeType]}</div>
              <div className="val-desc">{describePayload(req)}</div>
              <div className="val-meta">
                Proposée par {req.requestedBy?.memberNumber} ({req.requestedBy?.email}) ·{' '}
                {new Date(req.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>

            <div className="val-actions">
              <button
                className="val-btn val-approve"
                onClick={() => handleApprove(req.id)}
                disabled={processingId === req.id}
              >
                ✓ Approuver
              </button>
              <button
                className="val-btn val-reject"
                onClick={() => handleReject(req.id)}
                disabled={processingId === req.id}
              >
                ✕ Rejeter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Validations;
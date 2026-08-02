import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { updatePerson, uploadPersonPhoto } from '../api/persons.api';
import { updateEmail } from '../api/users.api';
import { changePassword } from '../api/auth.api';
import './Profile.css';

function initials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function Profile() {
  const { user, setUser } = useAuthStore();
  const person = user?.person;

  // --- Photo ---
  const [photoPreview, setPhotoPreview] = useState(
    person?.photoUrl ? `http://localhost:4000${person.photoUrl}` : null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // --- Identité (nom, prénom, profession, bio) ---
  const [identityForm, setIdentityForm] = useState({
    firstName: person?.firstName || '',
    lastName: person?.lastName || '',
    occupation: person?.occupation || '',
    bio: person?.bio || '',
  });
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState(null);
  const [identitySuccess, setIdentitySuccess] = useState(null);

  // --- Email ---
  const [emailForm, setEmailForm] = useState({ email: user?.email || '', currentPassword: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [emailSuccess, setEmailSuccess] = useState(null);

  // --- Mot de passe ---
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const updatedPerson = await uploadPersonPhoto(person.id, file);
      setPhotoPreview(`http://localhost:4000${updatedPerson.photoUrl}`);
      setUser({ ...user, person: { ...user.person, photoUrl: updatedPerson.photoUrl } });
    } catch (err) {
      setPhotoError(err.response?.data?.error?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleIdentitySubmit(e) {
    e.preventDefault();
    setIdentityError(null);
    setIdentitySuccess(null);
    setIdentityLoading(true);
    try {
      const updatedPerson = await updatePerson(person.id, identityForm);
      setUser({ ...user, person: { ...user.person, ...updatedPerson } });
      setIdentitySuccess('Informations mises à jour.');
    } catch (err) {
      setIdentityError(err.response?.data?.error?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setIdentityLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setEmailLoading(true);
    try {
      const updatedUser = await updateEmail(emailForm);
      setUser({ ...user, email: updatedUser.email });
      setEmailForm({ ...emailForm, currentPassword: '' });
      setEmailSuccess('Email mis à jour.');
    } catch (err) {
      setEmailError(err.response?.data?.error?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Mot de passe modifié.');
    } catch (err) {
      setPasswordError(err.response?.data?.error?.message || 'Erreur lors du changement.');
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!person) {
    return <p style={{ color: 'var(--sage)' }}>Profil introuvable.</p>;
  }

  return (
    <div className="profile-page">
      <h1>Mon profil</h1>

      <div className="profile-sections">
        {/* --- Photo --- */}
        <div className="profile-card">
          <div className="profile-photo-section">
            <div className="profile-photo">
              {photoPreview ? <img src={photoPreview} alt="Photo de profil" /> : initials(person.firstName, person.lastName)}
            </div>
            <label className="profile-photo-btn">
              {uploadingPhoto ? 'Envoi...' : 'Changer la photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} hidden />
            </label>
            {photoError && <p className="profile-error">{photoError}</p>}
          </div>
          <div className="profile-identity">
            <div className="profile-id">{user.memberNumber}</div>
          </div>
        </div>

        {/* --- Identité --- */}
        <div className="profile-card">
          <h2 className="profile-section-title">Identité</h2>
          <form onSubmit={handleIdentitySubmit} className="profile-form">
            <div className="profile-form-row">
              <div className="profile-field">
                <label>Prénom</label>
                <input value={identityForm.firstName} onChange={(e) => setIdentityForm({ ...identityForm, firstName: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>Nom</label>
                <input value={identityForm.lastName} onChange={(e) => setIdentityForm({ ...identityForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="profile-field">
              <label>Profession</label>
              <input value={identityForm.occupation} onChange={(e) => setIdentityForm({ ...identityForm, occupation: e.target.value })} />
            </div>
            <div className="profile-field">
              <label>Biographie</label>
              <textarea rows={3} value={identityForm.bio} onChange={(e) => setIdentityForm({ ...identityForm, bio: e.target.value })} />
            </div>
            {identityError && <p className="profile-error">{identityError}</p>}
            {identitySuccess && <p className="profile-success">{identitySuccess}</p>}
            <button type="submit" disabled={identityLoading} className="profile-submit">
              {identityLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        {/* --- Email --- */}
        <div className="profile-card">
          <h2 className="profile-section-title">Adresse email</h2>
          <form onSubmit={handleEmailSubmit} className="profile-form">
            <div className="profile-field">
              <label>Nouvel email</label>
              <input type="email" value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} />
            </div>
            <div className="profile-field">
              <label>Mot de passe actuel (confirmation)</label>
              <input type="password" value={emailForm.currentPassword} onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })} />
            </div>
            {emailError && <p className="profile-error">{emailError}</p>}
            {emailSuccess && <p className="profile-success">{emailSuccess}</p>}
            <button type="submit" disabled={emailLoading} className="profile-submit">
              {emailLoading ? 'Enregistrement...' : 'Changer l\'email'}
            </button>
          </form>
        </div>

        {/* --- Mot de passe --- */}
        <div className="profile-card">
          <h2 className="profile-section-title">Mot de passe</h2>
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="profile-field">
              <label>Mot de passe actuel</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            </div>
            <div className="profile-field">
              <label>Nouveau mot de passe</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
            <div className="profile-field">
              <label>Confirmer le nouveau mot de passe</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
            {passwordError && <p className="profile-error">{passwordError}</p>}
            {passwordSuccess && <p className="profile-success">{passwordSuccess}</p>}
            <button type="submit" disabled={passwordLoading} className="profile-submit">
              {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
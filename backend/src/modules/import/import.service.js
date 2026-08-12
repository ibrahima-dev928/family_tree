const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

/**
 * Importe des données depuis un fichier Excel
 * - Crée ou met à jour les personnes
 * - Crée les relations parent-enfant
 */
async function importExcelData(persons, relations, requestingUser) {
  // Vérifier que l'utilisateur est admin (déjà fait dans le contrôleur)
  let imported = 0;
  let updated = 0;
  const personMap = {}; // pour mapper les identifiants temporaires

  // 1. Importer / mettre à jour les personnes
  for (const p of persons) {
    // Normaliser les champs
    const data = {
      firstName: p.prenom || p.firstName || '',
      lastName: p.nom || p.lastName || '',
      birthDate: p.date_naissance || p.birthDate ? new Date(p.date_naissance || p.birthDate) : null,
      deathDate: p.date_deces || p.deathDate ? new Date(p.date_deces || p.deathDate) : null,
      photoUrl: p.photo_url || p.photoUrl || null,
      occupation: p.profession || p.occupation || null,
      bio: p.bio || null,
      gender: p.genre || p.gender || null,
      validationStatus: 'approved', // admin import = approuvé
    };

    // Si un ID est fourni, on tente une mise à jour
    const providedId = p.id || null;
    let person;

    if (providedId) {
      // Vérifier si la personne existe
      const existing = await prisma.person.findUnique({
        where: { id: providedId },
      });
      if (existing) {
        // Mise à jour
        person = await prisma.person.update({
          where: { id: providedId },
          data,
        });
        updated++;
        personMap[providedId] = providedId;
        continue;
      }
    }

    // Si pas d'ID ou ID inexistant, on crée
    person = await prisma.person.create({ data });
    imported++;
    // Stocker l'ID créé pour les relations
    personMap[person.id] = person.id;
  }

  // 2. Importer les relations parent-enfant
  for (const rel of relations) {
    // Chercher le parent et l'enfant par leur ID ou par leur nom
    let parentId = rel.parent_id || rel.parentId;
    let childId = rel.enfant_id || rel.childId || rel.enfantId;

    // Si parentId ou childId est un nom (string), on le résout
    if (parentId && typeof parentId === 'string' && !parentId.includes('-')) {
      // C'est probablement un nom complet "Prénom Nom"
      const [firstName, ...lastNameParts] = parentId.trim().split(' ');
      const lastName = lastNameParts.join(' ');
      const parent = await prisma.person.findFirst({
        where: { firstName, lastName },
      });
      if (parent) parentId = parent.id;
      else continue; // on ignore la relation si le parent n'existe pas
    }

    if (childId && typeof childId === 'string' && !childId.includes('-')) {
      const [firstName, ...lastNameParts] = childId.trim().split(' ');
      const lastName = lastNameParts.join(' ');
      const child = await prisma.person.findFirst({
        where: { firstName, lastName },
      });
      if (child) childId = child.id;
      else continue;
    }

    // Si on a des IDs valides, on crée la relation
    if (parentId && childId) {
      // Vérifier que la relation n'existe pas déjà
      const exists = await prisma.parentChildRelations.findFirst({
        where: { parentId, childId },
      });
      if (!exists) {
        await prisma.parentChildRelations.create({
          data: { parentId, childId, relationType: rel.relationType || 'parent' },
        });
      }
    }
  }

  return { imported, updated };
}

module.exports = { importExcelData };
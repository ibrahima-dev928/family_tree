const { prisma } = require('../../config/database');
const XLSX = require('xlsx');

async function exportExcelData() {
  // Récupérer toutes les personnes
  const persons = await prisma.person.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      deathDate: true,
      photoUrl: true,
      occupation: true,
      bio: true,
    },
  });

  // Récupérer toutes les relations parent-enfant
  const relations = await prisma.parentChildRelations.findMany({
    include: {
      parent: { select: { id: true, firstName: true, lastName: true } },
      child: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Transformer les données pour Excel
  const personsData = persons.map(p => ({
    id: p.id,
    prenom: p.firstName,
    nom: p.lastName,
    date_naissance: p.birthDate ? p.birthDate.toISOString().split('T')[0] : '',
    date_deces: p.deathDate ? p.deathDate.toISOString().split('T')[0] : '',
    photo_url: p.photoUrl || '',
    profession: p.occupation || '',
    bio: p.bio || '',
  }));

  const relationsData = relations.map(r => ({
    parent_id: r.parent.id,
    parent_nom: `${r.parent.firstName} ${r.parent.lastName}`,
    enfant_id: r.child.id,
    enfant_nom: `${r.child.firstName} ${r.child.lastName}`,
  }));

  // Créer le workbook
  const workbook = XLSX.utils.book_new();
  const wsPersons = XLSX.utils.json_to_sheet(personsData);
  const wsRelations = XLSX.utils.json_to_sheet(relationsData);

  XLSX.utils.book_append_sheet(workbook, wsPersons, 'Personnes');
  XLSX.utils.book_append_sheet(workbook, wsRelations, 'Relations');

  // Générer le buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

module.exports = { exportExcelData };
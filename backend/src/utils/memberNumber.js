const { prisma } = require('../config/database');

const PREFIX = 'FAM';
const PAD_LENGTH = 6;

/**
 * Génère le prochain numéro de membre disponible, ex: FAM-000123.
 */
async function generateMemberNumber() {
  const count = await prisma.user.count();
  const nextNumber = (count + 1).toString().padStart(PAD_LENGTH, '0');
  return `${PREFIX}-${nextNumber}`;
}

module.exports = { generateMemberNumber };
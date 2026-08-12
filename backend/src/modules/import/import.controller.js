const { importExcelData } = require('./import.service');
const { AppError } = require('../../middlewares/error.middleware');

async function importExcel(req, res, next) {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      throw new AppError('Accès réservé aux administrateurs.', 403);
    }

    const { persons, relations } = req.body;

    if (!persons || !Array.isArray(persons)) {
      throw new AppError('La liste des personnes est invalide.', 400);
    }

    const result = await importExcelData(persons, relations, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { importExcel };
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { errorMiddleware, notFoundMiddleware } = require('./middlewares/error.middleware');
const importController = require('./modules/import/import.controller');
const exportController = require('./modules/import/export.controller');

const app = express();

// ---- Middlewares globaux ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ---- Fichiers statiques (photos uploadées) ----
app.use('/uploads', express.static(env.upload.dir));

// ---- Healthcheck ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Routes des modules ----
// Décommenter au fur et à mesure de leur implémentation :
//
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/persons', require('./modules/persons/persons.routes'));
app.use('/api/tree', require('./modules/tree/tree.routes'));
app.use('/api/relations', require('./modules/relations/relations.routes'));
app.use('/api/validations', require('./modules/validations/validations.routes'));
app.use('/api/events', require('./modules/events/events.routes'));
app.use('/api/conversations', require('./modules/messaging/messaging.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
//app.post('/api/import', authenticate, importController.importExcel);
app.post('/api/import', authMiddleware, importController.importExcel);
app.get('/api/export', authenticate, exportController.exportExcel);

// ---- 404 & gestion d'erreurs (toujours en dernier) ----
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
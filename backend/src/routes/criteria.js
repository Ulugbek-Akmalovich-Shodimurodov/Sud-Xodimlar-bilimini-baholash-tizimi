import express from 'express';

const router = express.Router();

// Returns current criteria configuration used by the frontend to render columns dynamically.
// For now this mirrors the hardcoded score/status fields in the database.
router.get('/', (req, res) => {
  const criteria = [
    { key: 'konstitutsiya', label: 'Konstitutsiya', short: 'Konst.', scoreField: 'konstitutsiya_score', statusField: 'konstitutsiya_status' },
    { key: 'kodeks', label: 'Kodeks', short: 'Kodeks', scoreField: 'kodeks_score', statusField: 'kodeks_status' },
    { key: 'protsessual_kodeks', label: 'Protsessual kodeks', short: 'Prot.', scoreField: 'protsessual_kodeks_score', statusField: 'protsessual_kodeks_status' },
    { key: 'akt_sohasi', label: 'AKT sohasi', short: 'AKT', scoreField: 'akt_sohasi_score', statusField: 'akt_sohasi_status' },
    { key: 'odob_axloq', label: 'Odob-axloq', short: 'Odob', scoreField: 'odob_axloq_score', statusField: 'odob_axloq_status' },
  ];

  res.json(criteria);
});

export default router;

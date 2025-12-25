// backend/src/routes/health.routes.js
const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
    console.log('📡 Entró a /api/health');

    res.json({
        status: 'ok',
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;



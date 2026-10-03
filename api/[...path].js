// Penangkap /api/* (satu segmen atau lebih) supaya permintaan API tidak pernah
// jatuh ke rewrite SPA. Isinya sama dengan api/index.js.
import app from '../server/app.js'

export default app

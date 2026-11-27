// Login / logout for the private brand manual.
// POST /api/manual-acceso  (form: clave, next)  → sets the session cookie
// GET  /api/manual-acceso?salir=1               → clears it
import { handleManualAccess, manualPassword } from '../lib/manual-auth.js';

function run(request) {
  return handleManualAccess(request, { password: manualPassword() });
}

export function GET(request) {
  return run(request);
}

export function POST(request) {
  return run(request);
}

import { Outlet } from 'react-router-dom';

// Sin protección de ruta — todas las rutas son directamente accesibles.
// El portal de invitados y la lógica de roles se añadirá más adelante
// como módulo totalmente aislado.
export default function AdminRoute() {
  return <Outlet />;
}

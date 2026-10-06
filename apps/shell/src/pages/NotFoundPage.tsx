import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <>
      <h1>Página não encontrada</h1>
      <Link to="/filmes">Ir para o catálogo</Link>
    </>
  );
}

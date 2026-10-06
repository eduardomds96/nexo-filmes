import { useParams } from 'react-router';

export default function MoviePage() {
  const { id } = useParams();
  return <h1>Filme {id}</h1>;
}

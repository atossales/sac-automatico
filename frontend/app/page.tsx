import { redirect } from 'next/navigation';

/**
 * Rota raiz — redireciona para o painel do gestor.
 * A autenticação é verificada no layout do grupo (admin).
 */
export default function RootPage(): never {
  redirect('/admin/dashboard');
}

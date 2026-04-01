import bcrypt from 'bcryptjs';

/**
 * Seed básico: cria o usuário admin padrão (baseado nas variáveis de ambiente).
 *
 * Como o sistema não armazena usuários no banco (auth é via env),
 * este seed apenas valida que ADMIN_USERNAME e ADMIN_PASSWORD estão definidos
 * e gera o hash bcrypt da senha para uso no .env.
 *
 * Uso: npx tsx prisma/seed.ts
 */
async function main(): Promise<void> {
  const username = process.env['ADMIN_USERNAME'];
  const password = process.env['ADMIN_PASSWORD'];

  if (!username || !password) {
    console.error(
      'Erro: ADMIN_USERNAME e ADMIN_PASSWORD devem estar definidos no .env',
    );
    process.exit(1);
  }

  // Verifica se a senha já é um hash bcrypt
  const isBcryptHash = /^\$2[aby]?\$\d{1,2}\$.{53}$/.test(password);

  if (isBcryptHash) {
    console.log(`Seed concluido com sucesso.`);
    console.log(`  Usuario: ${username}`);
    console.log(`  Senha: ja esta em formato hash bcrypt no .env`);
    return;
  }

  // Gera o hash bcrypt da senha (mesmo padrão do auth.service.ts)
  const SALT_ROUNDS = 10;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  console.log(`Seed concluido com sucesso.`);
  console.log(`  Usuario: ${username}`);
  console.log(`  Hash bcrypt gerado para ADMIN_PASSWORD:`);
  console.log(`  ${hashedPassword}`);
  console.log('');
  console.log(
    '  Substitua o valor de ADMIN_PASSWORD no .env pelo hash acima.',
  );
}

main().catch((err: unknown) => {
  console.error('Erro ao executar seed:', err);
  process.exit(1);
});

.PHONY: dev build db-up db-down migrate studio lint test typecheck

# Inicia backend + frontend em paralelo
dev:
	npm run dev

# Compila backend e frontend para produção
build:
	npm run build

# Sobe apenas PostgreSQL e Redis
db-up:
	docker-compose up -d postgres redis

# Para PostgreSQL e Redis
db-down:
	docker-compose stop postgres redis

# Roda as migrations pendentes do Prisma
migrate:
	cd backend && npx prisma migrate dev

# Abre o Prisma Studio (GUI do banco local)
studio:
	cd backend && npx prisma studio

# ESLint em todo o projeto
lint:
	npm run lint

# Testes unitários
test:
	npm run test

# Verifica tipos TypeScript sem gerar build
typecheck:
	npm run typecheck

# Sobe todos os containers (incluindo pgAdmin)
up:
	docker-compose --profile tools up -d

# Para todos os containers
down:
	docker-compose --profile tools down

# Exibe logs do backend em tempo real
logs:
	docker-compose logs -f backend

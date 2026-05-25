# Agent DevOps

## Responsabilités
- Configuration Docker Compose (dev et prod)
- Déploiement sur serveur Ubuntu Server 24.04 LTS
- Nginx reverse proxy
- Git workflow

## Environnement de développement
- OS : Windows 11 + Docker Desktop (WSL2 backend)
- Projet : C:\Users\Steeve\Claude Code Projects\nexus
- Tous les services tournent via Docker Compose

## docker-compose.yml de référence
```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: nexus
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./packages/backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://nexus:${DB_PASSWORD}@db:5432/nexus
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: ${NODE_ENV:-development}
    volumes:
      - ./packages/backend:/app
      - ./packages/content:/content
      - /app/node_modules
    ports:
      - "4000:4000"
    depends_on:
      - db

  frontend:
    build: ./packages/frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    volumes:
      - ./packages/frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## .env de référence (jamais committé)
```
DB_PASSWORD=devpassword_change_en_prod
JWT_SECRET=change_this_secret_in_production
NODE_ENV=development
```

## Dockerfile backend
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["node", "index.js"]
```

## Dockerfile frontend
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

## Commandes Docker essentielles
```bash
# Démarrer tout
docker compose up -d

# Rebuild un service spécifique
docker compose up -d --build backend
docker compose up -d --build frontend

# Rebuild complet
docker compose up -d --build

# Réinitialiser complètement (supprime la DB)
docker compose down -v && docker compose up -d --build

# Logs en temps réel
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Exécuter une commande dans un container
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npx prisma studio
```

## Git workflow
```bash
# Branches
main      → production (serveur)
develop   → développement local (toujours stable)
feature/* → nouvelles fonctionnalités

# Workflow quotidien
git checkout develop
git pull origin develop
git checkout -b feature/nom-fonctionnalite
# ... développement ...
git add .
git commit -m "feat: description"
git checkout develop
git merge feature/nom-fonctionnalite
git push origin develop

# Déploiement production
git checkout main
git merge develop
git push origin main
```

## Déploiement serveur (Ubuntu Server 24.04 LTS sous Hyper-V)
```bash
# Sur le serveur — première fois
git clone https://github.com/TON-USERNAME/nexus
cd nexus
cp .env.example .env
# Éditer .env avec les vraies valeurs de production
docker compose up -d --build

# Mises à jour suivantes
git pull
docker compose up -d --build
```

## Nginx reverse proxy (production)
```nginx
server {
    listen 80;
    server_name nexus.local;

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

# Suggested Commands for Logship-MVP

## System (Windows)
```bash
# File operations
dir          # List directory
type file    # Read file content
mkdir name   # Create directory
del file     # Delete file

# Git
git status
git add .
git commit -m "message"
git push
```

## Package Manager
```bash
# Using Bun (based on bun.lock presence)
bun install
bun run <script>
bun add <package>
bun dev
```

## Docker (Planned)
```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## Backend (NestJS - Planned)
```bash
bun run start:dev
bun run build
bun run test
bun run lint
```

## Mobile (React Native/Expo - Planned)
```bash
Bun expo start
bun expo run:android
bun expo run:ios
```

## Database (Planned)
```bash
bunx prisma migrate dev
bunx prisma generate
bunx prisma studio
```

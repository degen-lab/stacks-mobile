# Stacks App Backend

## Prerequisites

- Node.js (v20+)
- PostgreSQL (v12+)
- Redis (v6+)
- pnpm (package manager)
- PM2 (for production)

### Install pnpm

**Linux/macOS:**

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Install PM2

```bash
npm install -g pm2
```

## Database Setup

### PostgreSQL

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**

```bash
brew install postgresql
brew services start postgresql
```

### Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql  # Linux
psql postgres          # macOS

# Create database and user
CREATE DATABASE stacks_app;
CREATE USER stacks_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stacks_app TO stacks_user;
\q
```

## Redis Setup

**Linux (Ubuntu/Debian):**

```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

**macOS:**

```bash
brew install redis
brew services start redis
```

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_key

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=stacks_user
DB_PASSWORD=your_password
DB_NAME=stacks_app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Stacks Network
STACKS_NETWORK=testnet
CONTRACT_ADDRESS=your_contract_address
ADMIN_PRIVATE_KEY=your_admin_private_key
ADMIN_ADDRESS=your_admin_address
ADMIN_PUBLIC_KEY=your_admin_public_key

# Referral
REFERRAL_BONUS=100
```

## Installation

```bash
pnpm install
```

## Build

```bash
pnpm build
```

## Start

### Development

```bash
pnpm start
```

### Production (PM2)

```bash
# Build first
pnpm build

# Start all services (API + workers)
pnpm start:prod

# Or manually
pm2 start ecosystem.config.js
```

### PM2 Commands

```bash
# View logs
pm2 logs

# View status
pm2 status

# Restart all
pm2 restart all

# Stop all
pnpm stop
# or
pm2 delete all
```

## Services

The application runs three services via PM2:

- **api**: Main API server
- **streaks-worker**: Handles daily streak challenge jobs
- **rewards-worker**: Handles tournament cycle management and rewards distribution (runs every 10 minutes to check tournament status)

## Testing

```bash
pnpm test
```

## Linting & Formatting

```bash
# Lint
pnpm lint

# Format
pnpm format

# Check formatting
pnpm format:check
```

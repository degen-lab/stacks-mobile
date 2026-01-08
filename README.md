# StacksApp

A mobile mini-game app built on the Stacks blockchain that rewards player engagement through gameplay-driven, on-chain incentives. Players can start instantly with no wallet setup or seed phrase required—wallet creation and management are handled via Google login using the [stacks-wallet-kit](https://github.com/degen-lab/stacks-wallet-kit) SDK.

**Features:**
- Endless tapper minigame with score-to-points and points-to-power-ups conversion systems
- Ad-supported sponsored transactions—watch ads, sign locally, pay zero gas
- Tiered rewards (Bronze / Silver / Gold) with daily streak tracking
- Referral system with invite codes and fraud prevention
- Anti-abuse mechanisms

## Repository Structure

```
stacks-mobile/
├── mobile-google-web3/     # Mobile frontend (Expo + React Native)
├── backend/     # Backend server (Fastify + TypeScript)
└── smart-contracts/        # Stacks blockchain contracts (Clarity)
```

| Project | Description |
|---------|-------------|
| [mobile-google-web3](./mobile-google-web3) | Cross-platform mobile app with wallet integration, game sessions, and referrals |
| [backend](./backend) | REST API handling authentication, game validation, leaderboards, and transaction broadcasting |
| [smart-contracts](./smart-contracts) | Clarity contracts for game logic, rewards distribution, and signature verification |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Mobile App    │────▶│  Backend API    │────▶│ Stacks Network   │
│  (Expo/RN)      │     │  (Fastify)      │     │ (Smart Contracts)│
└─────────────────┘     └─────────────────┘     └──────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │   PostgreSQL    │
        │               │   + Redis       │
        │               └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Stacks Wallet  │
│  (Local)        │
└─────────────────┘
```

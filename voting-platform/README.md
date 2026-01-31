# ZK-SNARK Private Voting Platform - Frontend

React-based web application for privacy-preserving voting on Oasis Sapphire blockchain using Zero-Knowledge Proofs.

## Overview

This frontend application provides a user-friendly interface for:
- **Deploying Elections** - Create new voting contracts with custom parameters
- **Casting Votes** - Generate ZK proofs and submit anonymous votes
- **Viewing Results** - Check election results after voting period ends

## Features

### Deploy Election Page
- Configure election parameters (duration, number of candidates)
- Set eligibility criteria (city, region, minimum age)
- Deploy smart contracts to Oasis Sapphire
- Automatic deployment of verifier and voting contracts

### Vote Page
- Select voter identity from predefined users
- Automatic ZK proof generation using SnarkJS
- Privacy-preserving vote submission
- Real-time eligibility validation

### Results Page
- View vote counts for all candidates
- Results revealed only after election ends
- Real-time countdown timer
- Vote distribution visualization

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask browser extension
- Oasis Sapphire Testnet ETH

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Configuration

1. **Configure Oasis Sapphire Network in MetaMask:**
   - Network Name: `Sapphire Testnet`
   - RPC URL: `https://testnet.sapphire.oasis.io`
   - Chain ID: `23295` (0x5aff)
   - Currency Symbol: `TEST`
   - Block Explorer: `https://explorer.oasis.io/testnet/sapphire`

2. **Get Testnet Tokens:**
   Visit [Oasis Faucet](https://faucet.testnet.oasis.io/) to receive testnet ETH

3. **ZK Proving Keys:**
   Ensure `public/zk/` contains:
   - `voting_final.zkey` - Proving key for circuit
   - `verification_key.json` - Verification key

## Project Structure

```
voting-platform/
├── src/
│   ├── pages/
│   │   ├── DeployPage.tsx      # Election deployment interface
│   │   ├── VotePage.tsx        # Voting interface with ZK proof generation
│   │   └── ResultsPage.tsx     # Election results display
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── DeploymentSuccessModal.tsx  # Success notification
│   ├── utils/
│   │   ├── blockchain.ts       # Smart contract interactions
│   │   ├── zk.ts              # ZK proof generation
│   │   ├── authority.ts       # Credential signing utilities
│   │   ├── helpers.ts         # Helper functions
│   │   └── config.ts          # Configuration constants
│   ├── data/
│   │   └── users.json         # Test user credentials
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Application entry point
├── public/
│   └── zk/
│       ├── voting_final.zkey        # ZK proving key
│       └── verification_key.json    # ZK verification key
└── vite.config.ts             # Vite configuration
```

## Technical Stack

### Core Framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing

### Blockchain Integration
- **Ethers.js v6** - Ethereum/Oasis interaction
- **@oasisprotocol/sapphire-ethers-v6** - Sapphire-specific utilities
- **@oasisprotocol/sapphire-paratime** - Confidential contract wrapper

### ZK-SNARKs
- **SnarkJS** - ZK proof generation and verification
- **circomlibjs** - Cryptographic primitives (Poseidon, EdDSA)

### UI & Styling
- **TailwindCSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library

## User Interface

### Navigation
The app uses React Router with three main routes:
- `/` - Deploy Election page
- `/vote` - Voting page
- `/results` - Results page

### Styling
TailwindCSS provides responsive, modern styling with:
- Dark mode support
- Gradient backgrounds
- Smooth animations
- Mobile-responsive design

## ZK Proof Generation Flow

1. **User Selection**: User chooses identity from `users.json`
2. **Credential Preparation**: 
   - Parse user attributes (name, ID, city, region, birth date)
   - Retrieve EdDSA signature from authority
3. **Input Generation**:
   - Format attributes for circuit
   - Include public inputs (eth address, election ID, etc.)
4. **Proof Generation**: 
   - Load circuit WASM and proving key
   - Generate Groth16 proof using SnarkJS
5. **Submission**: 
   - Send proof + public inputs to smart contract
   - Vote is recorded anonymously

## Development

### Available Scripts

```bash
# Start dev server with HMR
npm run dev

# Type check
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Environment Variables

Create `.env` file (if needed for custom RPC):
```
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.io
```

## Security Features

- **Client-side Proof Generation**: Private inputs never leave the user's browser
- **Confidential Smart Contracts**: Vote data encrypted on Oasis Sapphire
- **Nullifier Protection**: Prevents double voting without revealing identity
- **Signature Verification**: EdDSA signatures validated in ZK circuit

## Troubleshooting

### MetaMask Connection Issues
- Ensure Sapphire Testnet is added to MetaMask
- Check you have testnet ETH balance
- Try refreshing the page and reconnecting

### Proof Generation Fails
- Verify `public/zk/voting_final.zkey` exists and is valid
- Check browser console for specific errors
- Ensure user data in `users.json` is properly formatted

### Transaction Failures
- Confirm election hasn't ended
- Verify you haven't already voted (nullifier check)
- Ensure proof inputs match election parameters

# ZK-SNARK Private Voting Platform on Oasis Sapphire

A decentralized voting platform built on Oasis Sapphire blockchain that leverages Zero-Knowledge Proofs (ZK-SNARKs) to ensure voter privacy while maintaining eligibility verification and vote integrity.

## Overview

This project implements a privacy-preserving voting system where voters can prove their eligibility (citizenship, age, region) without revealing their identity. The system uses:

- **ZK-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge)** - For privacy-preserving eligibility proofs
- **Oasis Sapphire** - A confidential EVM-compatible blockchain
- **EdDSA signatures** - For verifiable credential authentication
- **React + TypeScript** - Modern web frontend

## Architecture

The project consists of three main components:

### 1. ZK-SNARK Circuit (`zk-snarks/`)
- **`circuit.circom`** - Circom circuit that verifies:
  - Voter's verifiable credential signature
  - Eligibility criteria (city, region, birth date)
  - Generates unique nullifier to prevent double voting
- **`generate_inputs.js`** - Script to generate proof inputs from user data
- **`scenarios.json`** - Test scenarios for circuit validation

### 2. Smart Contracts (`solidity/`)
- **`Voting.sol`** - Main voting contract that:
  - Verifies ZK proofs on-chain
  - Tracks nullifiers to prevent double voting
  - Stores encrypted votes
  - Manages election lifecycle
- **`verifier.sol`** - Auto-generated proof verifier contract

### 3. Web Application (`voting-platform/`)
- React-based frontend for:
  - Deploying new elections
  - Generating and submitting ZK proofs
  - Viewing election results
- Integration with MetaMask and Oasis Sapphire

## Privacy Features

### What's Private:
- Voter identity remains anonymous
- Individual votes are confidential
- Eligibility attributes hidden from public

### What's Verified:
- Voter meets age requirements
- Voter is from allowed city/region
- Voter has valid credential signature
- Voter hasn't voted before (via nullifier)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MetaMask wallet
- Oasis Sapphire Testnet ETH

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd vut-ip1-project
```

2. **Install ZK-SNARK dependencies**
```bash
cd zk-snarks
npm install
```

3. **Install frontend dependencies**
```bash
cd ../voting-platform
npm install
```

### Setting up the ZK Circuit

1. **Compile the circuit**
```bash
cd zk-snarks
circom circuit.circom --r1cs --wasm --sym --c
```

2. **Generate proving and verification keys** (using Powers of Tau ceremony)
```bash
# Download Powers of Tau file
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

# Generate zkey
snarkjs groth16 setup circuit.r1cs powersOfTau28_hez_final_12.ptau circuit_0000.zkey

# Contribute to ceremony
snarkjs zkey contribute circuit_0000.zkey voting_final.zkey

# Export verification key
snarkjs zkey export verificationkey voting_final.zkey verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier voting_final.zkey ../solidity/verifier.sol
```

3. **Copy keys to frontend**
```bash
cp voting_final.zkey ../voting-platform/public/zk/
cp verification_key.json ../voting-platform/public/zk/
```

### Running the Application

1. **Start the development server**
```bash
cd voting-platform
npm run dev
```

2. **Configure MetaMask**
   - Add Oasis Sapphire Testnet:
     - Network Name: Sapphire Testnet
     - RPC URL: https://testnet.sapphire.oasis.io
     - Chain ID: 0x5aff (23295)
     - Currency: TEST
   - Get testnet tokens from [Oasis Faucet](https://faucet.testnet.oasis.io/)

3. **Deploy an election**
   - Navigate to "Deploy Election" page
   - Set election parameters
   - Deploy the voting contract

4. **Vote**
   - Select your voter identity
   - Generate ZK proof
   - Submit your vote

## Project Structure

```
vut-ip1-project/
├── zk-snarks/              # ZK-SNARK circuits
│   ├── circuit.circom      # Main voting circuit
│   ├── generate_inputs.js  # Proof input generator
│   ├── scenarios.json      # Test scenarios
│   └── run_tests.sh        # Test runner
├── solidity/               # Smart contracts
│   ├── Voting.sol         # Main voting contract
│   └── verifier.sol       # ZK proof verifier
└── voting-platform/        # React frontend
    ├── src/
    │   ├── pages/         # Main pages (Deploy, Vote, Results)
    │   ├── components/    # Reusable components
    │   └── utils/         # Blockchain, ZK, and helper utilities
    └── public/
        └── zk/            # ZK proving/verification keys
```

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Blockchain**: Oasis Sapphire, Ethers.js v6
- **ZK-SNARKs**: Circom, SnarkJS, Groth16
- **Cryptography**: EdDSA (Baby JubJub), Poseidon hash
- **Smart Contracts**: Solidity 0.8.x

## Testing

### Test ZK Circuit
```bash
cd zk-snarks
./run_tests.sh
```

This runs all scenarios defined in `scenarios.json` and verifies:
- Valid proofs are accepted
- Invalid credentials are rejected
- Eligibility checks work correctly

## How It Works

### 1. Credential Issuance (Off-chain)
Authority generates verifiable credentials for eligible voters containing:
- First name, last name
- ID number
- City, postal code
- Region
- Birth date

Each credential is signed with EdDSA private key.

### 2. Proof Generation (Client-side)
When voting, the user's browser:
1. Takes private credential data
2. Generates ZK proof showing:
   - Credential signature is valid
   - User meets eligibility criteria
3. Computes nullifier (prevents double voting)
4. Outputs only: nullifier + public eligibility params

### 3. On-Chain Verification
Smart contract:
1. Verifies the ZK proof
2. Checks nullifier hasn't been used
3. Validates public inputs match election rules
4. Records the vote
5. Stores nullifier

## Security Considerations

- **Nullifier Generation**: `Poseidon(credential_hash, electionId, ethAddress)` ensures one vote per election
- **Credential Privacy**: EdDSA signature verification happens in ZK circuit
- **Front-running Protection**: Oasis Sapphire provides confidential state
- **Replay Prevention**: Each election has unique ID

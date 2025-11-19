#!/bin/bash
set -e

if [ ! -f "circuit.r1cs" ] || [ "circuit.circom" -nt "circuit.r1cs" ]; then
    circom circuit.circom --r1cs --wasm --sym -l node_modules
fi

if [ ! -f "powersOfTau28_hez_final_14.ptau" ]; then
    curl -L -o powersOfTau28_hez_final_14.ptau https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau
fi

if [ ! -f "circuit_final.zkey" ] || [ "circuit.r1cs" -nt "circuit_final.zkey" ]; then
    echo "Regenerating zkey..."
    snarkjs groth16 setup circuit.r1cs powersOfTau28_hez_final_14.ptau circuit_0000.zkey
    snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="Contributor" -e="$(date +%s)" > /dev/null
    rm -f circuit_0000.zkey
fi

if [ ! -f "verification_key.json" ] || [ "circuit_final.zkey" -nt "verification_key.json" ]; then
    echo "Regenerating verification key..."
    snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
fi

if [ ! -f "verifier.sol" ]; then
    snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol
fi

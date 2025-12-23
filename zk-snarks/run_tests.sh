#!/bin/bash
set -e

if [ ! -f "circuit.r1cs" ] || [ "circuit.circom" -nt "circuit.r1cs" ]; then
    echo "Compiling circuit..."
    circom circuit.circom --r1cs --wasm --sym -l node_modules
fi

if [ ! -f "powersOfTau28_hez_final_14.ptau" ]; then
    echo "Downloading PTAU..."
    curl -L -o powersOfTau28_hez_final_14.ptau https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau
fi

if [ ! -f "circuit_final.zkey" ]; then
    echo "Generating keys..."
    snarkjs groth16 setup circuit.r1cs powersOfTau28_hez_final_14.ptau circuit_0000.zkey
    echo "random text" | snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="Contributor" -v > /dev/null
    rm circuit_0000.zkey
    snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
fi

echo "-----------------------------------"
echo "Generating inputs from scenarios..."
node generate_inputs.js

echo "-----------------------------------"
echo "Running Tests..."

for input_file in input_*.json; do
    TEST_ID=$(echo $input_file | grep -o '[0-9]\+')
    
    EXPECTED=$(grep -A 5 "\"id\": $TEST_ID" scenarios.json | grep "expectedResult" | cut -d '"' -f 4)
    TEST_NAME=$(grep -A 5 "\"id\": $TEST_ID" scenarios.json | grep "name" | cut -d '"' -f 4)

    echo -n "Test ID $TEST_ID ($TEST_NAME): "

    if node circuit_js/generate_witness.js circuit_js/circuit.wasm $input_file witness_$TEST_ID.wtns > /dev/null 2>&1; then
        
        if snarkjs groth16 prove circuit_final.zkey witness_$TEST_ID.wtns proof_$TEST_ID.json public_$TEST_ID.json > /dev/null 2>&1; then
            RESULT="PASS"
        else
            RESULT="FAIL"
        fi
    else
        RESULT="FAIL"
    fi

    if [ "$RESULT" == "$EXPECTED" ]; then
        echo -e "\033[0;32m SUCCESS (Expected: $EXPECTED, Got: $RESULT)\033[0m"
    else
        echo -e "\033[0;31m ERROR (Expected: $EXPECTED, Got: $RESULT)\033[0m"
        if [ "$EXPECTED" == "PASS" ]; then
            echo "   Debug info:"
            node circuit_js/generate_witness.js circuit_js/circuit.wasm $input_file witness_$TEST_ID.wtns
        fi
    fi

    rm -f witness_$TEST_ID.wtns proof_$TEST_ID.json public_$TEST_ID.json
done

echo "-----------------------------------"
echo "Testing complete."
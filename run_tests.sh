#!/bin/bash

echo ""
echo ""
echo "  ZK-SNARK VOTING SYSTEM - AUTOMATED TEST SUITE"
echo ""
echo ""

# Check if circuit is compiled
if [ ! -f "circuit_js/circuit.wasm" ]; then
    echo "ERROR: Circuit not compiled! Run: circom circuit.circom --r1cs --wasm --sym -l node_modules"
    exit 1
fi

# Check if setup is done
if [ ! -f "circuit_final.zkey" ]; then
    echo "ERROR: Circuit setup not done! Run: ./run_all.sh first"
    exit 1
fi

# Check if verification key exists
if [ ! -f "verification_key.json" ]; then
    echo "ERROR: Verification key not found! Run: ./run_all.sh first"
    exit 1
fi

echo "All prerequisites found"
echo ""

# Run the test suite
node test_all.js

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "All tests completed successfully!"
else
    echo "Some tests failed. Review the output above."
fi
echo ""

exit $TEST_RESULT

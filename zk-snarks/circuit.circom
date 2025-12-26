pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/eddsaposeidon.circom"; 
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/babyjub.circom";

template VotingWithIdentity(numCandidates) {
    // Private inputs
    signal input vcAttributes[8]; 
    signal input skVC;
    
    signal input sigR8x;
    signal input sigR8y;
    signal input sigS;

    // Public inputs
    signal input pkAx;
    signal input pkAy;
    signal input pkVCx;
    signal input pkVCy;
    
    signal input allowedCity;
    signal input allowedRegion;
    signal input minBirthDate;
    
    signal input ethAddress;
    signal input electionId;

    // Outputs
    signal output nullifier;

    component privToPub = BabyPbk();
    privToPub.in <== skVC;
    privToPub.Ax === pkVCx;
    privToPub.Ay === pkVCy;

    component vcHasher = Poseidon(10);
    for (var i = 0; i < 8; i++) {
        vcHasher.inputs[i] <== vcAttributes[i];
    }
    vcHasher.inputs[8] <== pkVCx; 
    vcHasher.inputs[9] <== pkVCy;
    
    component sigVerifier = EdDSAPoseidonVerifier();
    sigVerifier.enabled <== 1;
    sigVerifier.Ax <== pkAx;
    sigVerifier.Ay <== pkAy;
    sigVerifier.R8x <== sigR8x;
    sigVerifier.R8y <== sigR8y;
    sigVerifier.S <== sigS;
    sigVerifier.M <== vcHasher.out;

    vcAttributes[3] === allowedCity;
    vcAttributes[5] === allowedRegion;
    
    component ageCheck = LessEqThan(32);
    ageCheck.in[0] <== vcAttributes[7];
    ageCheck.in[1] <== minBirthDate;
    ageCheck.out === 1;

    // Nullifier
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== skVC;
    nullifierHasher.inputs[1] <== electionId;
    nullifier <== nullifierHasher.out;
}

component main {public [pkAx, pkAy, pkVCx, pkVCy, allowedCity, allowedRegion, minBirthDate, ethAddress, electionId]} = VotingWithIdentity(5);
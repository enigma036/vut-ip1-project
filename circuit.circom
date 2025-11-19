pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/eddsamimc.circom";
include "circomlib/circuits/mimc.circom";
include "circomlib/circuits/bitify.circom";

template VotingWithIdentity(numCandidates) {
    // PRIVATE INPUTS
    signal input vcName;
    signal input vcSurname;
    signal input vcAddress;
    signal input vcCity;
    signal input vcDistrict;
    signal input vcRegion;
    signal input vcCountry;
    signal input vcDOB;
    
    signal input skVC;
    
    signal input voteChoice;
    
    // VDF parameters (private)
    signal input vdfInput;
    signal input vdfIterations; 
    
    // Signature components
    signal input sigR8x;
    signal input sigR8y;
    signal input sigS;
    
    //PUBLIC INPUTS
    signal input pkAx;
    signal input pkAy;
    
    signal input pkVCx;
    signal input pkVCy;

    signal input vdfCommitment;
    
    // Filtering criteria (public)
    signal input allowedCity;
    signal input allowedRegion;
    signal input minBirthDate;
    
    // OUTPUT
    signal output valid;
    
    component skCommit = MiMC7(91);
    skCommit.x_in <== skVC;
    skCommit.k <== 0;

    component vcHash = MiMC7(91);
    vcHash.x_in <== vcName + vcSurname + vcAddress + vcCity + 
                     vcDistrict + vcRegion + vcCountry + vcDOB;
    vcHash.k <== pkVCx;  
    
    component sigVerifier = EdDSAMiMCVerifier();
    sigVerifier.enabled <== 1;
    sigVerifier.Ax <== pkAx;
    sigVerifier.Ay <== pkAy;
    sigVerifier.R8x <== sigR8x;
    sigVerifier.R8y <== sigR8y;
    sigVerifier.S <== sigS;
    sigVerifier.M <== vcHash.out;
    
    component voteInRange1 = GreaterEqThan(32);
    voteInRange1.in[0] <== voteChoice;
    voteInRange1.in[1] <== 1;
    
    component voteInRange2 = LessEqThan(32);
    voteInRange2.in[0] <== voteChoice;
    voteInRange2.in[1] <== numCandidates;
    
    signal voteValid;
    voteValid <== voteInRange1.out * voteInRange2.out;
    voteValid === 1;

    vcCity === allowedCity;

    vcRegion === allowedRegion;
    
    component ageCheck = LessEqThan(32);
    ageCheck.in[0] <== vcDOB;
    ageCheck.in[1] <== minBirthDate;
    ageCheck.out === 1;

    component vdfHash = MiMC7(91);
    vdfHash.x_in <== voteChoice + vdfInput;
    vdfHash.k <== vdfIterations;
    
    vdfHash.out === vdfCommitment;
    
    valid <== sigVerifier.enabled;
}

// Main component with 5 candidates as example
component main {public [pkAx, pkAy, pkVCx, pkVCy, vdfCommitment, allowedCity, allowedRegion, minBirthDate]} = VotingWithIdentity(5);

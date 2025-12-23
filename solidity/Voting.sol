// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[11] memory input // ZMĚNA: Velikost musí být 11
    ) external view returns (bool);
}

contract OasisVoting {
    IVerifier public verifier;
    mapping(uint256 => bool) public nullifiers;
    mapping(uint256 => uint256) public candidateVotes;

    event VoteCast(uint256 candidate, uint256 electionId);

    constructor(address _verifierAddress) {
        verifier = IVerifier(_verifierAddress);
    }

    function vote(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[11] memory input, // ZMĚNA: Velikost musí být 11
        uint256 _voteChoice      
    ) public {
        
        // 1. Mapování signálů (podle tvého obvodu)
        // [0] = nullifier (Output)
        // [1] = voteHash (Output)
        // [2] = pkAx
        // [3] = pkAy
        // [4] = pkVCx
        // [5] = pkVCy
        // [6] = allowedCity
        // [7] = allowedRegion
        // [8] = minBirthDate
        // [9] = ethAddress  <-- Teď už na index 9 dosáhneme
        // [10] = electionId

        uint256 proofNullifier = input[0]; 
        uint256 proofEthAddress = input[9];
        uint256 proofElectionId = input[10];
        
        // 2. Kontrola odesílatele (Front-running protection)
        // Adresa v důkazu se musí shodovat s tím, kdo volá funkci.
        // V Remixu to funguje, pokud při volání použiješ stejný účet, který jsi zadal do input.json
        require(uint256(uint160(msg.sender)) == proofEthAddress, "Error: Nesedi adresa odesilatele!");

        // 3. Kontrola dvojího hlasování
        require(!nullifiers[proofNullifier], "Error: Tento clovek uz hlasoval!");

        // 4. Ověření ZK důkazu
        require(verifier.verifyProof(a, b, c, input), "Error: Neplatny ZK dukaz!");

        // 5. Zapsání hlasu
        nullifiers[proofNullifier] = true;
        candidateVotes[_voteChoice] += 1;

        emit VoteCast(_voteChoice, proofElectionId); 
    }
}
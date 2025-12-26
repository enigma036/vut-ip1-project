// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[10] memory input
    ) external view returns (bool);
}

contract OasisVoting {
    IVerifier public verifier;
    
    mapping(uint256 => uint256) private candidateVotes;
    mapping(uint256 => bool) public nullifiers;

    uint256 public electionEndTime;
    uint256 public numCandidates;

    uint256 public immutable ALLOWED_CITY;
    uint256 public immutable ALLOWED_REGION;
    uint256 public immutable MIN_BIRTH_DATE;
    uint256 public immutable ELECTION_ID;

    event VoteCast(uint256 electionId);

    constructor(
        address _verifierAddress, 
        uint256 _numCandidates, 
        uint256 _durationInSeconds,
        uint256 _allowedCity,
        uint256 _allowedRegion,
        uint256 _minBirthDate,
        uint256 _electionId
    ) {
        verifier = IVerifier(_verifierAddress);
        numCandidates = _numCandidates;
        electionEndTime = block.timestamp + _durationInSeconds;

        ALLOWED_CITY = _allowedCity;
        ALLOWED_REGION = _allowedRegion;
        MIN_BIRTH_DATE = _minBirthDate;
        ELECTION_ID = _electionId;
    }

    function vote(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[10] memory input,
        uint256 _voteChoice
    ) public {
        require(block.timestamp < electionEndTime, "Error: Election has ended!");
        require(_voteChoice > 0 && _voteChoice <= numCandidates, "Error: Invalid candidate ID!");

        uint256 proofNullifier = input[0];
        uint256 proofCity = input[5];
        uint256 proofRegion = input[6];
        uint256 proofMinDob = input[7];
        uint256 proofElectionId = input[9]; 
        
        require(proofCity == ALLOWED_CITY, "Error: Invalid City in proof");
        require(proofRegion == ALLOWED_REGION, "Error: Invalid Region in proof");
        require(proofMinDob == MIN_BIRTH_DATE, "Error: Invalid Birth Date in proof");
        require(proofElectionId == ELECTION_ID, "Error: Proof is for a different election!");

        require(!nullifiers[proofNullifier], "Error: User already voted!");
        require(verifier.verifyProof(a, b, c, input), "Error: Invalid ZK Proof!");

        nullifiers[proofNullifier] = true;
        candidateVotes[_voteChoice] += 1;

        emit VoteCast(proofElectionId); 
    }

    function getResults(uint256 _candidateId) public view returns (uint256) {
        require(block.timestamp >= electionEndTime, "Error: Election is active, results are secret!");
        require(_candidateId > 0 && _candidateId <= numCandidates, "Error: Invalid candidate ID");
        
        return candidateVotes[_candidateId];
    }

    function getAllResults() public view returns (uint256[] memory) {
        require(block.timestamp >= electionEndTime, "Error: Election is active, results are secret!");

        uint256[] memory allVotes = new uint256[](numCandidates);

        for (uint256 i = 0; i < numCandidates; i++) {
            allVotes[i] = candidateVotes[i + 1];
        }

        return allVotes;
    }

    function timeRemaining() public view returns (uint256) {
        if (block.timestamp >= electionEndTime) {
            return 0;
        }
        return electionEndTime - block.timestamp;
    }
}
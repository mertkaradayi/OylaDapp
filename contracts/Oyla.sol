// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Oyla is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private electionId;

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 electionId;
    }

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string description;
        bool isActive;
        uint256 candidateCount;
    }

    mapping(uint256 => Election) private elections;
    mapping(uint256 => mapping(uint256 => Candidate)) private candidates;
    mapping(address => Voter) private voters;
    address[] private registeredVoters;

    event ElectionCreated(uint256 indexed electionId, string description);
    event CandidateAdded(
        uint256 indexed electionId,
        uint256 candidateId,
        string name
    );
    event VoterRegistered(address indexed voterAddress);
    event VoteCast(
        address indexed voterAddress,
        uint256 electionId,
        uint256 candidateId
    );

    function createElection(string memory description) public onlyOwner {
        uint256 newElectionId = electionId.current();
        elections[newElectionId] = Election(
            newElectionId,
            description,
            true,
            0
        );
        electionId.increment();
        emit ElectionCreated(newElectionId, description);
    }

    function addCandidate(
        uint256 _electionId,
        string memory _name
    ) public onlyOwner {
        Election storage election = elections[_electionId];
        uint256 candidateId = election.candidateCount;
        candidates[_electionId][candidateId] = Candidate(candidateId, _name, 0);
        election.candidateCount++;
        emit CandidateAdded(_electionId, candidateId, _name);
    }

    function registerVoter(address _voterAddress) public onlyOwner {
        require(
            !voters[_voterAddress].isRegistered,
            "Voter is already registered"
        );
        voters[_voterAddress] = Voter(true, false, 0);
        registeredVoters.push(_voterAddress);
        emit VoterRegistered(_voterAddress);
    }

    function getWinner(
        uint256 _electionId
    )
        public
        view
        returns (
            uint256 winningCandidateId,
            string memory winnerName,
            uint256 winnerVoteCount
        )
    {
        require(!elections[_electionId].isActive, "Election is still active.");

        uint256 maxVoteCount = 0;
        uint256 candidateCount = elections[_electionId].candidateCount;

        for (uint256 i = 0; i < candidateCount; i++) {
            uint256 candidateVoteCount = candidates[_electionId][i].voteCount;
            if (candidateVoteCount >= maxVoteCount) {
                maxVoteCount = candidateVoteCount;
                winningCandidateId = i;
            }
        }

        winnerName = candidates[_electionId][winningCandidateId].name;
        winnerVoteCount = maxVoteCount;
    }

    modifier minCandidateCount(uint256 _electionId, uint256 _minCount) {
        require(
            elections[_electionId].candidateCount >= _minCount,
            "Not enough candidates."
        );
        _;
    }

    function vote(uint256 _electionId, uint256 _candidateId) public {
        require(voters[msg.sender].isRegistered, "Not registered.");
        require(!voters[msg.sender].hasVoted, "Already voted.");
        require(elections[_electionId].isActive, "Election not active.");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].electionId = _electionId;

        candidates[_electionId][_candidateId].voteCount++;
        emit VoteCast(msg.sender, _electionId, _candidateId);
    }

    function endElection(
        uint256 _electionId
    ) public onlyOwner minCandidateCount(_electionId, 2) {
        elections[_electionId].isActive = false;
    }

    function getElection(
        uint256 _electionId
    )
        public
        view
        returns (
            string memory description,
            bool isActive,
            uint256 candidateCount
        )
    {
        return (
            elections[_electionId].description,
            elections[_electionId].isActive,
            elections[_electionId].candidateCount
        );
    }

    function getCandidate(
        uint256 _electionId,
        uint256 _candidateId
    ) public view returns (string memory name, uint256 voteCount) {
        return (
            candidates[_electionId][_candidateId].name,
            candidates[_electionId][_candidateId].voteCount
        );
    }

    function getRegisteredVoters()
        public
        view
        onlyOwner
        returns (address[] memory)
    {
        return registeredVoters;
    }
}

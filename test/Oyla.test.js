const { expect } = require("chai");

describe("Oyla", function() {
    let Oyla;
    let oyla;
    let owner;
    let addr1, addr2;

    beforeEach(async function() {
        [owner, addr1] = await ethers.getSigners();
        Oyla = await ethers.getContractFactory("Oyla");
        oyla = await Oyla.deploy();
        await oyla.deployed();
    });

    describe("Contract Deployment", function() {
        it("Should deploy the contract successfully", async function() {
            expect(oyla.address).to.properAddress;
        });

        it("Should set the contract owner correctly", async function() {
            const oylaOwner = await oyla.owner();
            expect(oylaOwner).to.equal(owner.address);
        });
    });

    describe("Creating an election", function() {
        const electionDescription = "Test Election";

        it("Only the contract owner should be able to create an election", async function() {
            await expect(
                oyla.connect(addr1).createElection(electionDescription)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should create an election with the correct description", async function() {
            await oyla.createElection(electionDescription);
            const { description } = await oyla.getElection(0);
            expect(description).to.equal(electionDescription);
        });

        it("Should increment the election count", async function() {
            await oyla.createElection(electionDescription);
            const { description, isActive, candidateCount } = await oyla.getElection(
                0
            );
            expect(description).to.equal(electionDescription);
            expect(isActive).to.be.true;
            expect(candidateCount).to.equal(0);
        });

        it("Should emit the ElectionCreated event", async function() {
            await expect(oyla.createElection(electionDescription))
                .to.emit(oyla, "ElectionCreated")
                .withArgs(0, electionDescription);
        });
    });

    describe("Adding candidates", function() {
        const electionDescription = "Test Election";
        const candidateName = "John Doe";

        beforeEach(async function() {
            await oyla.createElection(electionDescription);
        });

        it("Only the contract owner should be able to add candidates", async function() {
            await expect(
                oyla.connect(addr1).addCandidate(0, candidateName)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should add a candidate with the correct name to the specified election", async function() {
            await oyla.addCandidate(0, candidateName);
            const { name } = await oyla.getCandidate(0, 0);
            expect(name).to.equal(candidateName);
        });

        it("Should increment the candidate count for the specified election", async function() {
            await oyla.addCandidate(0, candidateName);
            const { candidateCount } = await oyla.getElection(0);
            expect(candidateCount).to.equal(1);
        });

        it("Should emit the CandidateAdded event", async function() {
            await expect(oyla.addCandidate(0, candidateName))
                .to.emit(oyla, "CandidateAdded")
                .withArgs(0, 0, candidateName);
        });
    });

    describe("Registering voters", function() {
        it("Only the contract owner should be able to register voters", async function() {
            await expect(
                oyla.connect(addr1).registerVoter(addr1.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should register a voter with the correct address", async function() {
            const tx = await oyla.registerVoter(addr1.address);
            await expect(tx).to.emit(oyla, "VoterRegistered").withArgs(addr1.address);
        });

        it("Should not register an already registered voter", async function() {
            await oyla.registerVoter(addr1.address);

            // Get the number of registered voters before the second attempt
            const votersBefore = (await oyla.getRegisteredVoters()).length;

            // Try to register the same voter again and expect it to be reverted
            await expect(oyla.registerVoter(addr1.address)).to.be.revertedWith(
                "Voter is already registered"
            );

            // Get the number of registered voters after the second attempt
            const votersAfter = (await oyla.getRegisteredVoters()).length;

            // Check if the number of registered voters remains the same
            expect(votersAfter).to.equal(votersBefore);
        });

        it("Should emit the VoterRegistered event", async function() {
            await expect(oyla.registerVoter(addr1.address))
                .to.emit(oyla, "VoterRegistered")
                .withArgs(addr1.address);
        });
    });

    describe("Voting", function() {
        const electionDescription = "Test Election";
        const candidateName1 = "John Doe";
        const candidateName2 = "Jane Doe";
        let electionId;
        let candidateId1;
        let candidateId2;

        beforeEach(async function() {
            await oyla.createElection(electionDescription);
            electionId = 0;
            await oyla.addCandidate(electionId, candidateName1);
            candidateId1 = 0;
            await oyla.addCandidate(electionId, candidateName2);
            candidateId2 = 1;
            await oyla.registerVoter(addr1.address);
        });

        it("Should not allow a non-registered voter to vote", async function() {
            await expect(oyla.vote(electionId, candidateId1)).to.be.revertedWith(
                "Not registered."
            );
        });

        it("Should not allow a voter to vote in an inactive election", async function() {
            await oyla.endElection(electionId);
            await expect(
                oyla.connect(addr1).vote(electionId, candidateId1)
            ).to.be.revertedWith("Election not active.");
        });

        it("Should not allow a voter to vote twice", async function() {
            await oyla.connect(addr1).vote(electionId, candidateId1);
            await expect(
                oyla.connect(addr1).vote(electionId, candidateId1)
            ).to.be.revertedWith("Already voted.");
        });

        it("Should increment the vote count for the chosen candidate", async function() {
            await oyla.connect(addr1).vote(electionId, candidateId1);
            const { voteCount } = await oyla.getCandidate(electionId, candidateId1);
            expect(voteCount).to.equal(1);
        });

        it("Should emit the VoteCast event", async function() {
            await expect(oyla.connect(addr1).vote(electionId, candidateId1))
                .to.emit(oyla, "VoteCast")
                .withArgs(addr1.address, electionId, candidateId1);
        });
    });

    describe("Ending an election", function() {
        const electionDescription = "Test Election";
        const candidateName1 = "John Doe";
        const candidateName2 = "Jane Doe";
        let electionId;

        beforeEach(async function() {
            await oyla.createElection(electionDescription);
            electionId = 0;
        });

        it("Only the contract owner should be able to end an election", async function() {
            await oyla.addCandidate(electionId, candidateName1);
            await oyla.addCandidate(electionId, candidateName2);
            await expect(
                oyla.connect(addr1).endElection(electionId)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow ending an election with less than 2 candidates", async function() {
            await oyla.addCandidate(electionId, candidateName1);
            await expect(oyla.endElection(electionId)).to.be.revertedWith(
                "Not enough candidates."
            );
        });

        it("Should set the election status to inactive", async function() {
            await oyla.addCandidate(electionId, candidateName1);
            await oyla.addCandidate(electionId, candidateName2);
            await oyla.endElection(electionId);
            const [, isActive] = await oyla.getElection(electionId);
            expect(isActive).to.be.false;
        });
    });

    describe("Getting election and candidate information", function() {
        const electionDescription = "Test Election";
        const candidateName1 = "John Doe";
        const candidateName2 = "Jane Doe";
        let electionId;
        let candidateId1;
        let candidateId2;

        beforeEach(async function() {
            await oyla.createElection(electionDescription);
            electionId = 0;
            await oyla.addCandidate(electionId, candidateName1);
            candidateId1 = 0;
            await oyla.addCandidate(electionId, candidateName2);
            candidateId2 = 1;
        });

        it("Should return the correct election information", async function() {
            const [description, isActive, candidateCount] = await oyla.getElection(
                electionId
            );
            expect(description).to.equal(electionDescription);
            expect(isActive).to.be.true;
            expect(candidateCount).to.equal(2);
        });

        it("Should return the correct candidate information", async function() {
            const { name: name1, voteCount: voteCount1 } = await oyla.getCandidate(
                electionId,
                candidateId1
            );
            const { name: name2, voteCount: voteCount2 } = await oyla.getCandidate(
                electionId,
                candidateId2
            );

            expect(name1).to.equal(candidateName1);
            expect(voteCount1).to.equal(0);
            expect(name2).to.equal(candidateName2);
            expect(voteCount2).to.equal(0);
        });
    });

    describe("Getting the winner", function() {
        const electionDescription = "Test Election";
        const candidateName1 = "John Doe";
        const candidateName2 = "Jane Doe";
        let electionId;
        let candidateId1;
        let candidateId2;
        let addr3;

        beforeEach(async function() {
            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            Oyla = await ethers.getContractFactory("Oyla");
            oyla = await Oyla.deploy();
            await oyla.deployed();

            await oyla.createElection(electionDescription);
            electionId = 0;
            await oyla.addCandidate(electionId, candidateName1);
            candidateId1 = ethers.BigNumber.from(0);

            await oyla.addCandidate(electionId, candidateName2);
            candidateId2 = 1;
            await oyla.registerVoter(addr1.address);
            await oyla.registerVoter(addr2.address);
            await oyla.registerVoter(addr3.address);
        });

        it("Should not return the winner for an active election", async function() {
            await expect(oyla.getWinner(electionId)).to.be.revertedWith(
                "Election is still active."
            );
        });

        it("Should return the correct winner for an inactive election", async function() {
            await oyla.connect(addr1).vote(electionId, candidateId1);
            await oyla.connect(addr2).vote(electionId, candidateId2);
            await oyla.endElection(electionId);

            const [winnerId, winnerName, winnerVoteCount] = await oyla.getWinner(
                electionId
            );

            expect(winnerName).to.equal(candidateName2);
            expect(winnerVoteCount).to.equal(1);
        });

        it("Should return last candidate if the both candidate has the same vote count", async function() {
            await oyla.connect(addr1).vote(electionId, candidateId1);
            await oyla.connect(addr2).vote(electionId, candidateId2);

            await oyla.endElection(electionId);

            const [winningCandidateId, winnerName, winnerVoteCount] =
            await oyla.getWinner(electionId);

            expect(winningCandidateId).to.equal(candidateId2);
            expect(winnerVoteCount).to.equal(1);
        });
    });

    describe("Getting registered voters", function() {
        const electionDescription = "Test Election";
        const candidateName1 = "John Doe";
        const candidateName2 = "Jane Doe";
        let electionId;
        let candidateId1;
        let candidateId2;
        let addr3;

        beforeEach(async function() {
            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            Oyla = await ethers.getContractFactory("Oyla");
            oyla = await Oyla.deploy();
            await oyla.deployed();

            await oyla.createElection(electionDescription);
            electionId = 0;
            await oyla.addCandidate(electionId, candidateName1);
            candidateId1 = 0;
            await oyla.addCandidate(electionId, candidateName2);
            candidateId2 = 1;
            await oyla.registerVoter(addr1.address);
            await oyla.registerVoter(addr2.address);
            await oyla.registerVoter(addr3.address);
        });

        it("Only the contract owner should be able to get the list of registered voters", async function() {
            await expect(
                oyla.connect(addr1).getRegisteredVoters()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should return the correct list of registered voters", async function() {
            const registeredVoters = await oyla.getRegisteredVoters();
            expect(registeredVoters).to.have.lengthOf(3);
            expect(registeredVoters).to.include(addr1.address);
            expect(registeredVoters).to.include(addr2.address);
            expect(registeredVoters).to.include(addr3.address);
        });
    });
});
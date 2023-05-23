const hre = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    // Get the ContractFactory instance for your contract
    console.log("Fetching Oyla contract factory...");
    const Oyla = await hre.ethers.getContractFactory("Oyla");

    // Deploy the contract
    console.log("Deploying Oyla contract...");
    const oyla = await Oyla.deploy();

    // Wait for the transaction to be mined
    console.log(
        "Waiting for Oyla contract deployment transaction to be mined..."
    );
    await oyla.deployed();

    // Log the contract's address
    console.log("Oyla deployed to:", oyla.address);

    console.log("Deployment finished.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
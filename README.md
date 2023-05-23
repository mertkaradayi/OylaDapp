# OylaDapp

This is the repository for OylaDapp, a blockchain-based application developed with Solidity, Hardhat, and other technologies.

## Setup & Installation

Before you can run this project, you'll need to have [Node.js](https://nodejs.org/en/) installed on your machine. You will also need [Yarn](https://classic.yarnpkg.com/en/docs/install/) as the package manager.

1. **Clone the repository:**

````bash
git clone https://github.com/mertkaradayi/OylaDapp.git

2. **Navigate to the project directory:**

```bash
cd OylaDapp

3. **Install the dependencies:**
```bash
yarn install

4. **Create a `.env` file:**

The project uses environment variables to configure the Hardhat network. You will need to create a `.env` file in the root directory of the project.

This file should look like this:

```bash
GANACHE_URL="HTTP://127.0.0.1:7545"
MNEMONIC="Your 12 word mnemonic"

Replace "HTTP://127.0.0.1:7545" and "Your 12 word mnemonic" with your actual Ganache URL and mnemonic. Do not share this file or the information within it, as it contains sensitive data.

## Compile Contracts

After you've installed the project's dependencies and set up your `.env` file, you can compile the Smart Contracts.

```bash
npx hardhat compile

## Testing

You can run tests to ensure the Smart Contracts behave as expected.

```bash
npx hardhat test


# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
````

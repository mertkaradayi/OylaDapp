require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.0",
    networks: {
        ganache: {
            url: process.env.GANACHE_URL,
            accounts: {
                mnemonic: process.env.MNEMONIC,
            },
        },
    },
};
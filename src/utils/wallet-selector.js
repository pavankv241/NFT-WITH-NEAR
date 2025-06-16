import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";

export const walletSelectorConfig = {
    network: "testnet",
    modules: [
        setupMyNearWallet(),
        setupMeteorWallet(),
        setupLedger()
    ],
};
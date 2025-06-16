import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";

export const walletSelectorConfig = {
    network: "testnet",
    modules: [
        setupMyNearWallet()
    ],
};

export const initWalletSelector = async () => {
    const selector = await setupWalletSelector(walletSelectorConfig);
    const modal = setupModal(selector, {
        contractId: "your-contract-id.testnet"
    });
    
    return { selector, modal };
};
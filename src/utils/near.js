import { connect, keyStores, WalletConnection, Contract } from 'near-api-js';

const CONTRACT_NAME = 'easyapp456.testnet';

// NEAR connection configuration
const nearConfig = {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
};

// Initialize NEAR connection
export const initNear = async () => {
    try {
        // Create a key store that uses browser's local storage
        const keyStore = new keyStores.BrowserLocalStorageKeyStore();

        // Create a NEAR connection configuration
        const config = {
            networkId: nearConfig.networkId,
            nodeUrl: nearConfig.nodeUrl,
            walletUrl: nearConfig.walletUrl,
            helperUrl: nearConfig.helperUrl,
            explorerUrl: nearConfig.explorerUrl,
            keyStore: keyStore,
            headers: {},
            deps: {
                keyStore: keyStore
            }
        };

        // Initialize NEAR connection
        const near = await connect(config);

        // Create a wallet connection
        const wallet = new WalletConnection(near, 'picture-store');

        return { near, wallet };
    } catch (error) {
        console.error('Failed to initialize NEAR:', error);
        throw error;
    }
};

// Get contract instance
export const getContract = async (wallet) => {
    if (!wallet || !wallet.account()) {
        throw new Error('Wallet not connected');
    }

    const contract = new Contract(
        wallet.account(),
        CONTRACT_NAME,
        {
            viewMethods: ['get_token_counter', 'get_token_metadata', 'get_tokens_for_owner'],
            changeMethods: ['mint_nft'],
        }
    );
    return contract;
};

// Mint NFT function
export const mintNFT = async (wallet, tokenUri) => {
    try {
        const contract = await getContract(wallet);
        const result = await contract.mint_nft({
            to: wallet.getAccountId(),
            token_uri: tokenUri
        });
        return result;
    } catch (error) {
        console.error('Error minting NFT:', error);
        throw error;
    }
};

// Get token metadata
export const getTokenMetadata = async (wallet, tokenId) => {
    try {
        const contract = await getContract(wallet);
        const metadata = await contract.get_token_metadata({ token_id: tokenId });
        return metadata;
    } catch (error) {
        console.error('Error getting token metadata:', error);
        throw error;
    }
};

// Get tokens for owner
export const getTokensForOwner = async (wallet, accountId) => {
    try {
        const contract = await getContract(wallet);
        const tokens = await contract.get_tokens_for_owner({ account_id: accountId });
        return tokens;
    } catch (error) {
        console.error('Error getting tokens for owner:', error);
        throw error;
    }
};
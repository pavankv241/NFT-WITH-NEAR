import { connect, keyStores, WalletConnection, Contract } from 'near-api-js';

const CONTRACT_NAME = 'easyapp456.testnet';

const nearConfig = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org',
};

export const initNear = async () => {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const near = await connect({ ...nearConfig, keyStore, deps: { keyStore } });
  const wallet = new WalletConnection(near, null);
  window.wallet = wallet;
  return wallet;
};

const getContract = async (wallet) => {
  if (!wallet || !wallet.account()) throw new Error('Wallet not connected');
  return new Contract(wallet.account(), CONTRACT_NAME, {
    viewMethods: ['get_token_counter', 'get_token_metadata', 'get_tokens_for_owner'],
    changeMethods: ['mint_nft'],
  });
};

export const isSignedIn = () => window.wallet?.isSignedIn();
export const signIn = () => window.wallet?.requestSignIn(CONTRACT_NAME);
export const signOut = () => window.wallet?.signOut() && window.location.reload();

export const mintNFT = async (wallet, tokenUri) => {
  const contract = await getContract(wallet);
  return await contract.mint_nft({
    to: wallet.getAccountId(),
    token_uri: tokenUri,
  });
};

export const getTokensForOwner = async (wallet) => {
  const contract = await getContract(wallet);
  return await contract.get_tokens_for_owner({
    account_id: wallet.getAccountId(),
  });
};

export const getTokenMetadata = async (wallet, tokenId) => {
  const contract = await getContract(wallet);
  return await contract.get_token_metadata({ token_id: tokenId });
};

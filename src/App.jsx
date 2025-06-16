import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import PictureGallery from "./components/PictureGallery";
import ShoppingCart from "./components/ShoppingCart";
import { Toaster, toast } from "react-hot-toast";
import MintNFTPage from "./components/MintNFTPage";
import DashboardPage from "./components/DashboardPage";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { walletSelectorConfig, initWalletSelector } from "./utils/wallet-selector";

export default function App() {
  const [availablePics, setAvailablePics] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showMintPage, setShowMintPage] = useState(false);
  const [activePage, setActivePage] = useState("gallery");
  const [isInitializing, setIsInitializing] = useState(true);
  const [selector, setSelector] = useState(null);
  const [modal, setModal] = useState(null);

  const { signedAccountId, signIn, signOut } = useWalletSelector();

  useEffect(() => {
    const initWallet = async () => {
      try {
        setIsInitializing(true);
        const { selector: walletSelector, modal: walletModal } = await initWalletSelector();
        setSelector(walletSelector);
        setModal(walletModal);

        if (signedAccountId) {
          setWalletAddress(signedAccountId);
        }
      } catch (error) {
        console.error('Wallet initialization error:', error);
        toast.error('Failed to initialize NEAR wallet. Please refresh the page.');
      } finally {
        setIsInitializing(false);
      }
    };

    initWallet();
  }, [signedAccountId]);

  const getIPFSGatewayURL = (ipfsHash) => {
    // Remove 'ipfs://' prefix if present
    const hash = ipfsHash.replace('ipfs://', '');
    // Use multiple IPFS gateways for redundancy
    const gateways = [
      `https://ipfs.io/ipfs/${hash}`,
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://ipfs.infura.io/ipfs/${hash}`
    ];
    return gateways[0]; // Using the first gateway, but you can implement fallback logic
  };

  const loadNearNFTs = async (accountId) => {
    try {
      if (!selector || !accountId) {
        console.log('Wallet not initialized or no account ID');
        return;
      }

      const wallet = await selector.wallet();
      if (!wallet) {
        console.log('No wallet available');
        return;
      }

      console.log('Fetching tokens for account:', accountId);

      // First get the tokens
      const tokensResult = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: "easyapp456.testnet",
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "get_tokens_for_owner",
            args: { account_id: accountId },
            gas: "300000000000000",
            deposit: "0"
          }
        }]
      });

      console.log('Tokens result:', tokensResult);

      if (!tokensResult?.transaction_outcome?.outcome?.status?.SuccessValue) {
        console.log('No tokens found or invalid response');
        setAvailablePics([]);
        return;
      }

      // Parse the base64 response
      const tokensData = JSON.parse(atob(tokensResult.transaction_outcome.outcome.status.SuccessValue));
      console.log('Parsed tokens data:', tokensData);

      if (!Array.isArray(tokensData)) {
        console.log('Tokens data is not an array');
        setAvailablePics([]);
        return;
      }

      // Map the tokens to our format
      const nfts = tokensData.map(token => ({
        id: token.token_id || token.id,
        src: token.metadata?.media || token.media,
        name: token.metadata?.title || token.title || 'Untitled NFT',
        price: token.price || 0.1,
        creator: token.owner_id || token.creator || accountId,
      }));

      console.log('Processed NFTs:', nfts);
      setAvailablePics(nfts);
    } catch (error) {
      console.error("Failed to load NFTs:", error);
      toast.error("Failed to load your NFTs. Please try again.");
      setAvailablePics([]);
    }
  };

  const addToCart = (pic) => {
    if (!cart.find((item) => item.id === pic.id)) {
      setCart([...cart, pic]);
    }
  };

  const handleAddMintedPic = (newPic) => {
    const updatedPics = [...availablePics, newPic];
    setAvailablePics(updatedPics);
    localStorage.setItem("mintedPics", JSON.stringify(updatedPics));
  };

  const removeFromCart = (picId) => {
    setCart(cart.filter((item) => item.id !== picId));
  };

  const handleWalletToggle = async () => {
    if (signedAccountId) {
      try {
        await signOut();
        setWalletAddress(null);
        setAvailablePics([]);
        toast.success("🔌 Wallet Disconnected");
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
        toast.error("Failed to disconnect wallet");
      }
    } else {
      try {
        if (!selector) {
          console.error("Wallet selector not initialized");
          toast.error("Wallet selector not initialized. Please refresh the page.");
          return;
        }

        await signIn();

        if (signedAccountId) {
          toast.success(`Connected: ${signedAccountId}`);
        }
      } catch (err) {
        console.error("Wallet connection failed:", err);
        if (err.message.includes("User cancelled") || err.message.includes("User closed")) {
          toast.error("Wallet connection cancelled");
        } else {
          toast.error("Wallet connection failed. Please try again.");
        }
      }
    }
  };

  const handleMintNFT = async (tokenUri, price) => {
    if (!signedAccountId) {
      toast.error("Connect your NEAR wallet first");
      return;
    }

    try {
      const wallet = await selector.wallet();
      console.log('Minting NFT with data:', { tokenUri, accountId: signedAccountId });
      
      const result = await wallet.signAndSendTransaction({
        signerId: signedAccountId,
        receiverId: "easyapp456.testnet",
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "mint_nft",
            args: {
              to: signedAccountId,
              token_uri: tokenUri
            },
            gas: "300000000000000",
            deposit: "0"
          }
        }]
      });

      console.log('Minting result:', result); 

      if (result?.transaction_outcome?.outcome?.status?.SuccessReceiptId) {
        toast.success("NFT minted Successfully");

        // Wait a moment for the blockchain to update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Load all NFTs after successful minting
        await loadAllNFTs(wallet);
        // Also load user's NFTs
        await loadUserNFTs(wallet, signedAccountId);

        setShowMintPage(false);
        setActivePage("gallery");
      } else {
        console.error("Minting response:", result);
        toast.error("Minting Failed - Transaction not successful");
      }
      return result;
    } catch (error) {
      console.error("Minting failed:", error);
      toast.error("Failed to mint NFT: " + (error.message || "Unknown error"));
    }
  };

  const handlePay = async () => {
    if (!walletAddress) return toast.error("Connect your wallet first.");
    const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      for (const item of cart) {
        if (!item.creator) {
          console.warn(`Creator address missing for item: ${item.name}`);
          continue;
        }

        const valueInWei = ethers.parseEther(totalAmount.toString());

        const tx = await signer.sendTransaction({
          to: item.creator,
          value: valueInWei,
        });

        await tx.wait();
        console.log(`Payment sent to ${item.creator} for ${item.name}`);
      }

      const addressKey = walletAddress.toLowerCase();
      const allPurchases = JSON.parse(localStorage.getItem("purchasedPics")) || {};
      const previous = allPurchases[addressKey] || [];
      const updated = [...previous, ...cart];

      const unique = updated.filter(
        (pic, index, self) =>
          index === self.findIndex((p) => p.id === pic.id)
      );

      allPurchases[addressKey] = unique;
      localStorage.setItem("purchasedPics", JSON.stringify(allPurchases));

      // Remove Purchased NFt's
      const remainingPics = (availablePics || []).filter(
        (pic) => !cart.some((purchased) => purchased.id === pic.id)
      );
      setAvailablePics(remainingPics);
      localStorage.setItem("mintedPics", JSON.stringify(remainingPics));


      toast.success("NFTs Purchased and Creators Paid Successfully");
    } catch (err) {
      console.error("handlePay Error:", err);
      toast.error("Transaction Failed");
    }
  };

  // Function to get all minted NFTs
  const loadAllNFTs = async (wallet) => {
    try {
      // Get total number of tokens
      const counterResult = await wallet.signAndSendTransaction({
        signerId: wallet.getAccountId(),
        receiverId: "easyapp456.testnet",
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "get_token_counter",
            args: {},
            gas: "300000000000000",
            deposit: "0"
          }
        }]
      });

      const totalTokens = parseInt(atob(counterResult.transaction_outcome.outcome.status.SuccessValue));
      
      // Fetch metadata for each token
      const nfts = [];
      for (let i = 0; i < totalTokens; i++) {
        const metadataResult = await wallet.signAndSendTransaction({
          signerId: wallet.getAccountId(),
          receiverId: "easyapp456.testnet",
          actions: [{
            type: "FunctionCall",
            params: {
              methodName: "get_token_metadata",
              args: { token_id: i },
              gas: "300000000000000",
              deposit: "0"
            }
          }]
        });

        if (metadataResult?.transaction_outcome?.outcome?.status?.SuccessValue) {
          const metadata = JSON.parse(atob(metadataResult.transaction_outcome.outcome.status.SuccessValue));
          const imageUrl = getIPFSGatewayURL(metadata.media);
          
          nfts.push({
            id: i,
            src: imageUrl,
            name: metadata.title,
            description: metadata.description,
            creator: wallet.getAccountId()
          });
        }
      }
      return nfts;
    } catch (error) {
      console.error("Failed to load all NFTs:", error);
      throw error;
    }
  };

  // Function to get NFTs owned by an account
  const loadUserNFTs = async (wallet, accountId) => {
    try {
      // Get all token IDs owned by the account
      const result = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: "easyapp456.testnet",
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "get_tokens_for_owner",
            args: { account_id: accountId },
            gas: "300000000000000",
            deposit: "0"
          }
        }]
      });

      const tokenIds = JSON.parse(atob(result.transaction_outcome.outcome.status.SuccessValue));
      
      // Fetch metadata for each token
      const nfts = [];
      for (const tokenId of tokenIds) {
        const metadataResult = await wallet.signAndSendTransaction({
          signerId: accountId,
          receiverId: "easyapp456.testnet",
          actions: [{
            type: "FunctionCall",
            params: {
              methodName: "get_token_metadata",
              args: { token_id: tokenId },
              gas: "300000000000000",
              deposit: "0"
            }
          }]
        });

        if (metadataResult?.transaction_outcome?.outcome?.status?.SuccessValue) {
          const metadata = JSON.parse(atob(metadataResult.transaction_outcome.outcome.status.SuccessValue));
          const imageUrl = getIPFSGatewayURL(metadata.media);
          
          nfts.push({
            id: tokenId,
            src: imageUrl,
            name: metadata.title,
            description: metadata.description,
            creator: accountId
          });
        }
      }
      return nfts;
    } catch (error) {
      console.error("Failed to load user NFTs:", error);
      throw error;
    }
  };

  // Add useEffect to load NFTs when wallet is connected
  /*useEffect(() => {
    if (signedAccountId) {
      loadAllNFTs();
      loadUserNFTs(signedAccountId);
    }
  }, [signedAccountId]);*/

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Initializing NEAR wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Toaster position="top-right" />
      <Navbar
        onCartClick={() => setShowCart(true)}
        cartCount={cart.length}
        walletAddress={walletAddress}
        onWalletToggle={handleWalletToggle}
        onMintClick={() => setShowMintPage(true)}
        onDashboardClick={() => setActivePage("dashboard")}
        onHomeClick={() => setActivePage("gallery")}
      />

      <div className="p-6">
        {showMintPage ? (
          <MintNFTPage
            walletAddress={walletAddress}
            onBack={() => {
              setShowMintPage(false);
              setActivePage("gallery");
            }}
            onAddMintedPic={handleMintNFT}
          />
        ) : activePage === "dashboard" ? (
          <DashboardPage userNFTs={userNFTs} />
        ) : (
          <PictureGallery pictures={availablePics} addToCart={addToCart} />
        )}
      </div>

      <ShoppingCart
        cart={cart}
        handlePay={handlePay}
        showCart={showCart}
        onClose={() => setShowCart(false)}
        removeFromCart={removeFromCart}
      />
    </div>
  );
}

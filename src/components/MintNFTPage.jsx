import React, { useState } from "react";
import toast from "react-hot-toast";
import { useWalletSelector } from "@near-wallet-selector/react-hook";

export default function MintNFTPage({ walletAddress, onBack, onAddMintedPic }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [minting, setMinting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const { signedAccountId, signIn, signOut, selector } = useWalletSelector();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleMint = async () => {
    if (!file || !signedAccountId) {
      toast.error("Please connect your wallet and upload a file.");
      return;
    }

    try {
      setMinting(true);

      // 1. Upload to IPFS
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pinataMetaData", JSON.stringify({
        name: name || "Minted NFT",
        description: description,
        price: price
      }));

      formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload to IPFS failed");

      const result = await res.json();
      const ipfsHash = result.IpfsHash;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      // 2. Mint NFT on Near
      await onAddMintedPic(ipfsUrl, parseFloat(price));
      toast.success("NFT minted successfully!");
    } catch (err) {
      console.error("Minting error:", err);
      toast.error("Minting failed.");
    } finally {
      setMinting(false);
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

const loadAllNFTs = async (wallet) => {
    try {
        if (!signedAccountId) {
            throw new Error('Wallet not connected');
        }

        // Get total number of tokens
        const counterResult = await wallet.signAndSendTransaction({
            signerId: signedAccountId, // Use signedAccountId instead of wallet.getAccountId()
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
                signerId: signedAccountId, // Use signedAccountId instead of wallet.getAccountId()
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
                    creator: signedAccountId // Use signedAccountId instead of wallet.getAccountId()
                });
            }
        }
        setAvailablePics(nfts); // Update the state with the fetched NFTs
        return nfts;
    } catch (error) {
        console.error("Failed to load all NFTs:", error);
        throw error;
    }
};

  return (
    <div className="max-w-xl mx-auto bg-white shadow-xl p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Mint Your NFT</h2>

      <input
        type="text"
        className="w-full mb-3 px-4 py-2 border rounded"
        placeholder="NFT Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        placeholder="NFT Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
      />

      <div className="mb-3">

        <label className="block text-sm font-medium text-gray-700 mb-1">Price In Near Token </label>

        <input 
        type="number"
        step="0.01"
        min="0"
        className="w-full px-4 py-2 border rounded"
        placeholder="Enter Price In Near Token"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        />
        
     
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="w-full mb-4 rounded" />
      )}

      <div className="flex justify-between">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-1/2 mr-2"
          onClick={onBack}
        >
          Back
        </button>

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-1/2 ml-2"
          onClick={handleMint}
          disabled={minting}
        >
          {minting ? "Minting..." : "Mint NFT"}
        </button>
      </div>
    </div>
  );
}

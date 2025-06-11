import React, { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import config from "../utils/config.js"


export default function MintNFTPage({ walletAddress, onBack, onAddMintedPic }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [minting, setMinting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [network, setNetwork] = useState("sepolia");
  const SEI_CHAIN_ID = "0x530";

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleMint = async () => {
    if (!file || !walletAddress || !price) {
      toast.success("Please connect your wallet, upload a file, and enter price.");
      return;
    }
  
    try {
      setMinting(true);
  
      // 1. Upload to IPFS manually via fetch
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pinataMetadata", JSON.stringify({ name: name || "Minted NFT" }));
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
      console.log(result);
      const ipfsHash = result.IpfsHash;
  
      // Ensure IPFS URL is a string
      const ipfsUrl = String(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      console.log("Uploaded IPFS URL:", ipfsUrl); // Log the URL
  
    // Ensure user is connected to Sei testnet
    try {
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

      if (currentChainId !== SEI_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEI_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: SEI_CHAIN_ID,
                chainName: "Sei Testnet",
                rpcUrls: ["https://evm-rpc-arctic.sei-apis.com"],
                nativeCurrency: { name: "SEI", symbol: "SEI", decimals: 18 },
                blockExplorerUrls: ["https://www.seiscan.app/arctic"],
              }],
            });
          } else {
            toast.error("Failed to switch to Sei Testnet.");
            return;
          }
        }
      }
    } catch (err) {
      toast.error("Could not verify Sei network.",err);
      return;
    }


      // Use BrowserProvider instead of Web3Provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      //const selectedAddress = network === "bnbTestnet" ? config.BNB_CONTRACT_ADDRESS : config.SEPOLIA_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(config.SEI_CONTRACT, config.ABI, signer);
  
      // Explicitly convert ipfsUrl to string here
      const tx1 = await contract.mintNFT(walletAddress, String(ipfsUrl), { gasLimit: 500000 });
      console.log("Minting transaction:", tx1);
  
      const receipt = await tx1.wait();
      console.log("Minting receipt:", receipt);
  
      const tx = await signer.sendTransaction({
        to: import.meta.env.VITE_RECEIVER_WALLET,
        value: ethers.parseEther("0.0001"),
      });
      await tx.wait();
      console.log("Fee transaction completed:", tx);
  
      const nftDetails = {
        id: Date.now(),
        name: name || "Minted NFT",
        description,
        src: ipfsUrl,
        price: parseFloat(price),
        creator: walletAddress
      };
  
      onAddMintedPic(nftDetails);
  
      toast.success("NFT minted and fee paid!");
    } catch (err) {
      console.error("Minting error:", err);
      toast.error("Minting failed.");
    } finally {
      setMinting(false);
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

      <input
        type="number"
        className="w-full mb-3 px-4 py-2 border rounded"
        onChange={(e) => setPrice(e.target.value)}
        value={price}
        placeholder="NFT Price in SEI "
        step="0.00001"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="w-full mb-4 rounded" />
      )}

      {/* Network Selector */}
      <select
        className="w-full mb-3 px-4 py-2 border rounded"
        value={network}
        onChange={(e) => setNetwork(e.target.value)}
      >

        <option value="SEI">SEI Testnet </option>
      </select>

    {/* Button Row */}
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
        {minting ? "Minting..." : "Mint & Pay"}
      </button>
    </div>

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import PictureGallery from "./components/PictureGallery";
import ShoppingCart from "./components/ShoppingCart";
import { Toaster, toast } from "react-hot-toast";
import MintNFTPage from "./components/MintNFTPage";
import DashboardPage from "./components/DashboardPage";

export default function App() {
  const [availablePics, setAvailablePics] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showMintPage, setShowMintPage] = useState(false);
  const [activePage, setActivePage] = useState("gallery");

  const SEI_CHAIN_ID = "0x530"; // 1328 in hex

  useEffect(() => {
    try {
      const storedPics = JSON.parse(localStorage.getItem("mintedPics")) || [];
      const uniquePics = storedPics.filter((pic, index, self) =>
        index === self.findIndex((p) => p.src === pic.src)
      );
      const filtered = uniquePics.filter((pic) => pic.price <= 100);
      setAvailablePics(filtered);
      localStorage.setItem("mintedPics", JSON.stringify(filtered));
    } catch (err) {
      console.error("Error loading mintedPics:", err);
      setAvailablePics([]); // fallback to empty
    }
  }, []);
  

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
    if (walletAddress) {
      setWalletAddress(null);
      toast.success("🔌 Wallet Disconnected");
      return;
    }

    if (!window.ethereum) {
      toast.error("MetaMask is not available.");
      return;
    }

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

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      setWalletAddress(address);
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      toast.error("Wallet connection failed.");
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
            onAddMintedPic={handleAddMintedPic}
          />
        ) : activePage === "dashboard" ? (
          <DashboardPage walletAddress={walletAddress} />
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

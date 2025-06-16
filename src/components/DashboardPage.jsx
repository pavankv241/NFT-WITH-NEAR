import React from "react";

export default function DashboardPage({ userNFTs }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My NFTs</h1>
      
      {userNFTs.length === 0 ? (
        <div className="text-center text-xl font-bold text-gray-600">
          You haven't purchased any NFTs yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {userNFTs.map((nft) => (
            <div key={nft.id} className="border rounded-2xl shadow-lg p-4 space-y-4">
              <img
                src={nft.src}
                alt={nft.name}
                className="rounded-xl w-full h-48 object-cover"
              />
              <div className="text-center font-bold">{nft.name}</div>
              <div className="flex flex-col items-center space-y-1">
                <span className="text-sm text-gray-500">Created by: {nft.creator}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

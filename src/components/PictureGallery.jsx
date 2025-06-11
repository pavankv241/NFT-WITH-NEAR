import React, { useEffect, useState } from "react";
//import { priceService } from "../utils/fetchPrices";

export default function PictureGallery({ pictures, addToCart }) {

  if (pictures.length === 0) {
    return (
      <div className="text-center text-xl font-bold text-gray-600">
        No NFTs available to display.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {pictures.map((pic) => (
        <div key={pic.id} className="border rounded-2xl shadow-lg p-4 space-y-4">
          <img
            src={pic.src}
            alt={pic.name}
            className="rounded-xl w-full h-48 object-cover"
          />
          <div className="text-center font-bold">{pic.name}</div>
          <div className="flex flex-col items-center space-y-1">
            <span className="text-lg font-semibold">SEI {pic.price}</span>
            <span className="text-sm text-gray-500">

            </span>
          </div>
          <div className="flex justify-center pt-2">
            <button
              className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
              onClick={() => addToCart(pic)}
            >
              Buy
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

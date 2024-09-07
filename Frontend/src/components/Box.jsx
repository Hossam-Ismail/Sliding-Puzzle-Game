import React from "react";

const Box = ({ boxNumber, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-center w-24 h-24 md:w-32 md:h-32  m-1 rounded ${
        boxNumber === 0 ? "bg-gray-800" : "bg-[#183D3D] text-white"
      } shadow-md cursor-pointer`}
    >
      {boxNumber !== 0 && boxNumber}
    </div>
  );
};

export default Box;

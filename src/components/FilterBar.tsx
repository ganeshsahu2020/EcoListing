// src/components/FilterBar.tsx
import React from "react";

type Props={ onSearch?:()=>void };

const FilterBar: React.FC<Props>=({onSearch})=>{
  return (
    <div className="p-2 border-b bg-white">
      <button
        className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
        onClick={()=>onSearch&&onSearch()}
        title="Apply filters & search"
      >
        Search this area
      </button>
    </div>
  );
};

export default FilterBar;

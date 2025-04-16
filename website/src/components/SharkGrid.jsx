import React from "react";
import SharkCard from "./SharkCard";

const SharkGrid = ({ sharks }) => {
  return (
    <div className="shark-grid">
      {sharks.map((shark) => (
        <SharkCard key={shark.id} shark={shark} />
      ))}
    </div>
  );
};

export default SharkGrid;

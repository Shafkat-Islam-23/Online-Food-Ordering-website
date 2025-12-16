import React, { useContext } from "react";
import { StoreContext } from "../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import "./FoodDisplay.css";

const FoodDisplay = ({ category }) => {
  const { foodList } = useContext(StoreContext);

  return (
    <div className="food-display" id="food-display">
      <h3>Top Dishes near you</h3>
      <div className="food-display-list">
        {foodList.map((item, index) => {
          {
            console.log(category, item.category);
          }
          if (category === "All" || category === item.category) {
            return (
              <FoodItem
                key={index}
                id={item._id}
                name={item.name}
                description={item.description}
                price={item.price}
                //image={item.image}
                image={`http://localhost:4000/images/${item.image}`}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default FoodDisplay;

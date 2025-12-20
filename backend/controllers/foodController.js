import fs from "fs";
import foodModel from "../models/foodModel.js";
import { invalidateMenuCache } from "../services/menuCache.js";

//add food item

const addFood = async (req, res) => {
  let image_filename = `${req.file.filename}`;

  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    image: image_filename,
  });

  try {
    await food.save();
    res.json({ success: true, message: "Food Added" });
    invalidateMenuCache(); //Clearing menu cache so Kuddus instantly sees the new item
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// All food list

const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    // Debug: Log the image filenames stored in DB
    console.log("Foods from DB:", foods.map(f => ({ name: f.name, image: f.image })));
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove food item

const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    fs.unlink(`uploads/${food.image}`, () => { });

    await foodModel.findByIdAndDelete(req.body.id);

    invalidateMenuCache();//Clearing menu cache so Kuddus instantly sees the removed item

    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// update food details 
const updateFood = async (req, res) => {
  try {
    const { id, name, description, price, category } = req.body;

    // validate id
    if (!id) {
      return res.json({ success: false, message: "Food id is required" });
    }

    // update only editable fields
    const updated = await foodModel.findByIdAndUpdate(
      id,
      { name, description, price, category },
      { new: true }
    );

    if (!updated) {
      return res.json({ success: false, message: "Food not found" });
    }

    // clear menu cache so chatbot + frontend sees updated item quickly
    invalidateMenuCache();

    return res.json({
      success: true,
      message: "Food updated successfully",
      data: updated,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Server error while updating food" });
  }
};

export { addFood, listFood, removeFood, updateFood };


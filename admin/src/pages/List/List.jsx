import React, { useEffect, useState } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";

// category list
const FOOD_CATEGORIES = [
  "Salad",
  "Rolls",
  "Deserts",
  "Sandwich",
  "Cake",
  "Pure Veg",
  "Pasta",
  "Noodles",
];

const List = ({ url }) => {
  const [list, setList] = useState([]);

  // ✅ CHANGE: modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  // ✅ CHANGE: edit form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) setList(response.data.data);
    else toast.error("Error");
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/remove`, {
        id: foodId,
      });
      await fetchList();
      if (response.data.success) toast.success(response.data.message);
      else toast.error(response.data.message || "Error removing food");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Error");
    }
  };

  // ✅ CHANGE: open edit modal and prefill
  const openEditModal = (item) => {
    setSelectedFood(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      category: item.category || "",
    });
    setShowModal(true);
  };

  // ✅ CHANGE: close modal
  const closeEditModal = () => {
    setShowModal(false);
    setSelectedFood(null);
  };

  // ✅ CHANGE: handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ CHANGE: Save update (backend route needed: POST /api/food/update)
  const handleSave = async () => {
    if (!selectedFood?._id) return;
    try {
      setLoading(true);

      const response = await axios.post(`${url}/api/food/update`, {
        id: selectedFood._id,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
      });

      if (response.data.success) {
        toast.success("Updated successfully");
        await fetchList();
        closeEditModal();
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHANGE: delete inside modal
  const handleDeleteInsideModal = async () => {
    if (!selectedFood?._id) return;
    const ok = window.confirm("Delete this item permanently?");
    if (!ok) return;
    await removeFood(selectedFood._id);
    closeEditModal();
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>All Foods List</p>

      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>

        {list.map((item, index) => (
          <div key={index} className="list-table-format">
            <img
              className="list-thumb"
              src={`${url}/images/${item.image}`}
              alt={item.name}
            />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>${item.price}</p>

            <div className="action-buttons">
              <button
                className="icon-btn icon-btn-edit"
                title="Edit"
                onClick={() => openEditModal(item)}
              >
                ✏️
              </button>

              {/* <button
                className="icon-btn icon-btn-delete"
                title="Delete"
                onClick={() => removeFood(item._id)}
              >
                ✕
              </button> */}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ CHANGE: Modal popup */}
      {showModal && selectedFood && (
        <div className="edit-modal-overlay" onClick={closeEditModal}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>Edit Food</h3>
              <button className="modal-close" onClick={closeEditModal}>
                ✕
              </button>
            </div>

            <div className="edit-modal-preview">
              <img
                src={`${url}/images/${selectedFood.image}`}
                alt={selectedFood.name}
              />
            </div>

            <div className="edit-modal-form">
              <label>Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />

              <div className="edit-modal-grid">
                <div>
                  <label>Price</label>
                  <input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
                {/* <div>
                  <label>Category</label>
                  <input name="category" value={formData.category} onChange={handleChange} />
                </div> */}

                <div>
                  <label>Category</label>

                  {/* ✅ CHANGE: dropdown instead of manual input */}
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select category</option>

                    {FOOD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="edit-modal-actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="danger-btn"
                onClick={handleDeleteInsideModal}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>

            <p className="edit-modal-hint">
              Image preview is read-only (not editable).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;

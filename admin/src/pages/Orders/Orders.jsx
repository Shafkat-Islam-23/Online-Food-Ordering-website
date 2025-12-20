import React from "react";
import "./Orders.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { assets } from "./../../../../frontend/src/assets/assets";
import { formatDate } from "../../utils/formatDate";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    const response = await axios.get(url + "/api/order/list");
    if (response.data.success) {
      setOrders(response.data.data);
      console.log(response.data.data);
    } else {
      toast.error("Error");
    }
  };

  const statusHandler = async (event, orderId) => {
    const response = await axios.post(url + "/api/order/status", {
      orderId,
      status: event.target.value,
    });
    if (response.data.success) {
      await fetchAllOrders();
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="order add">
      {/* ✅ CHANGE: Title looks more professional */}
      <h3>Orders</h3>

      <div className="order-list">
        {orders.map((order, index) => {
          // ✅ CHANGE: Build clean items text once (more readable + cleaner UI)
          const itemsText = order.items
            .map((item) => `${item.name} x ${item.quantity}`)
            .join(", ");

          return (
            <div key={index} className="order-item">
              {/* ✅ CHANGE: Wrap left icon in a div for grid layout */}
              <div className="order-left">
                <img
                  className="order-icon"
                  src={assets.parcel_icon}
                  alt="Order"
                />
              </div>

              {/* ✅ CHANGE: Middle section for order details */}
              <div className="order-middle">
                <p className="order-item-food">{itemsText}</p>

                <p className="order-item-name">
                  {order.address.firstName + " " + order.address.lastName}
                </p>

                {/* ✅ existing feature: date (kept), but now positioned nicely */}
                <p className="order-date">Ordered: {formatDate(order.date)}</p>

                <div className="order-item-address">
                  <p>{order.address.street}</p>
                </div>

                <p className="order-item-phone">{order.address.phone}</p>
              </div>

              {/* ✅ CHANGE: Right section for summary + status dropdown */}
              <div className="order-right">
                {/* ✅ CHANGE: Professional summary box */}
                <div className="order-summary">
                  <p className="order-summary-row">
                    <span className="label">Items</span>
                    {/* ✅ CHANGE: Fix typo Itmes -> Items */}
                    <span className="value">{order.items.length}</span>
                  </p>

                  <p className="order-summary-row">
                    <span className="label">Total</span>
                    <span className="value">TK {order.amount * 130}</span>
                  </p>
                </div>

                {/* ✅ CHANGE: Styled select (class added) */}
                <select
                  className="order-status-select"
                  onChange={(event) => statusHandler(event, order._id)}
                  value={order.status}
                >
                  <option value="Food Processing">Food Processing</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;

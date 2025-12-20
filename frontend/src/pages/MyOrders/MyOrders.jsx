import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "./../../components/context/StoreContext";
import axios from "axios";
import { assets } from "./../../assets/assets";
import { formatDate } from "../../utils/formatDate";

const MyOrders = () => {
    const { url, token } = useContext(StoreContext);
    const [data, setData] = useState([]);

    const fetchOrders = async () => {
        const response = await axios.post(
            url + "/api/order/userorders",
            {},
            { headers: { token } }
        );
        setData(response.data.data);
    };

    useEffect(() => {
        if (token) fetchOrders();
    }, [token]);

    return (
        <div className="my-orders">
            <h2>My Orders</h2>

            <div className="container">
                {data.map((order, index) => {
                    const itemsText = order.items
                        .map((item) => `${item.name} x ${item.quantity}`)
                        .join(", ");

                    return (
                        <div key={index} className="my-orders-order">
                            {/* Left: icon */}
                            <div className="order-left">
                                <img className="order-icon" src={assets.parcel_icon} alt="Order" />
                            </div>

                            {/* Middle: main info */}
                            <div className="order-middle">
                                <p className="order-items">{itemsText}</p>

                                <div className="order-meta">
                                    <span className="order-amount">${order.amount}.00</span>
                                    <span className="order-dot">•</span>
                                    <span className="order-count">Items: {order.items.length}</span>
                                </div>

                                <div className="order-status-row">
                                    <span className="status-dot">●</span>
                                    <b className="order-status">{order.status}</b>
                                    <span className="order-date">
                                        • Ordered on {formatDate(order.date)}
                                    </span>
                                </div>
                            </div>

                            {/* Right: action */}
                            <div className="order-right">
                                <button className="track-btn" onClick={fetchOrders}>
                                    Track Order
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyOrders;

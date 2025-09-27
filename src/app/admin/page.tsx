"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaClipboardList, FaPlus, FaTrash } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Order {
  orderid: string;
  useremail: string;
  status: string;
  name: string;
  table_no: string;
  item_name: string;
  item_description: string;
  price: string;
  quantity: number;
  total: number;
  location_name: string;
  created_at: string; // 🔹 Added
}

interface MenuItem {
  id?: number;
  title: string;
  desc: string;
  price: string;
  image: string;
  rating: number;
}

interface Staff {
  id?: number;
  name: string;
  status: boolean; // true = Online, false = Offline
}


export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [feedbacks, setFeedbacks] = useState<{ id: number; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("orders");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  // Menu states
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [showAddMenuForm, setShowAddMenuForm] = useState(false);
  const [newMenu, setNewMenu] = useState<MenuItem>({ title: "", desc: "", price: "", image: "", rating: 5 });
  const [customers, setCustomers] = useState([])
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  // ✅ Simple login check
  const handleLogin = () => {
    if (password === "12345") {
      setIsLoggedIn(true);
    } else {
      alert("Wrong Password!");
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/feedback");
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
    }
  };

  // Fetch Owner Orders
  const fetchOrders = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/ownerorders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Fetch All Orders for Analytics
  const fetchAllOrders = async () => {
    try {
      const res = await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/adminorders");
      const data = await res.json();
      setAllOrders(data);
    } catch (err) {
      console.error("Error fetching admin orders:", err);
    }
  };

  // Fetch Menus
  const fetchMenus = async (showLoader = false) => {
    if (showLoader) setMenuLoading(true);
    try {
      const res = await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/menu");
      const data = await res.json();
      setMenus(data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      if (showLoader) setMenuLoading(false);
    }
  };

  // Approve Order
  const approveOrder = async (order: Order) => {
    try {
      await fetch(`https://jessika-patrological-crankly.ngrok-free.dev/users/admin/order/${order.orderid}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/kitchenorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderid: order.orderid,
          useremail: order.useremail,
          item_name: order.item_name,
          item_description: order.item_description,
          item_quantity: order.quantity,
        }),
      });

      await fetch(`https://jessika-patrological-crankly.ngrok-free.dev/users/deleteownerorder/${order.orderid}`, {
        method: "DELETE",
      });

      fetchOrders();
    } catch (err) {
      console.error("Error approving order:", err);
    }
  };

  // Reject Order
  const rejectOrder = async (orderid: string) => {
    try {
      await fetch(`https://jessika-patrological-crankly.ngrok-free.dev/users/admin/order/${orderid}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      await fetch(`https://jessika-patrological-crankly.ngrok-free.dev/users/deleteownerorder/${orderid}`, {
        method: "DELETE",
      });

      fetchOrders();
    } catch (err) {
      console.error("Error rejecting order:", err);
    }
  };

  // Delete Menu by title (name)
  const deleteMenu = async (name: string) => {
    try {
      if (!confirm(`Are you sure you want to delete menu "${name}"?`)) return;
      const res = await fetch(`https://jessika-patrological-crankly.ngrok-free.dev/users/deletemenu/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete menu");
      await fetchMenus();
    } catch (err) {
      console.error("Error deleting menu:", err);
      alert("Failed to delete menu. Check console.");
    }
  };

  // Add Menu
  const addMenu = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      // basic validation
      if (!newMenu.title || !newMenu.desc || !newMenu.price || !newMenu.image) {
        alert("Please fill all fields.");
        return;
      }
      const payload = {
        title: newMenu.title,
        desc: newMenu.desc,
        price: newMenu.price,
        image: newMenu.image,
        rating: Number(newMenu.rating) || 5,
      };
      const res = await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/addmenu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add menu");
      // reset form & refresh
      setNewMenu({ title: "", desc: "", price: "", image: "", rating: 5 });
      setShowAddMenuForm(false);
      await fetchMenus();
      // force refresh as requested
      window.location.reload();
    } catch (err) {
      console.error("Error adding menu:", err);
      alert("Failed to add menu. Check console.");
    }
  };

  // Fetch Staff
  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/staff");
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setStaffLoading(false);
    }
  };

  // Add Staff
  const addStaff = async () => {
    if (!newStaffName.trim()) {
      alert("Please enter staff name.");
      return;
    }
    try {
      const res = await fetch("https://jessika-patrological-crankly.ngrok-free.dev/users/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStaffName }),
      });
      if (!res.ok) throw new Error("Failed to add staff");
      setNewStaffName("");
      fetchStaff(); // refresh list
    } catch (err) {
      console.error("Error adding staff:", err);
      alert("Failed to add staff. Check console.");
    }
  };

  // Change Status → Online
  const markPresent = async (name: string) => {
    try {
      await fetch(`https://jessika-patrological-crankly.ngrok-free.dev/users/staffstatusonline/${name}`, {
        method: "PUT",
      });
      fetchStaff();
    } catch (err) {
      console.error("Error marking staff present:", err);
    }
  };

  // Change Status → Offline
  const markAbsent = async (name: string) => {
    try {
      await fetch(`https://jessika-patrological-crankly.ngrok-free.dev/users/staffstatusoffline/${name}`, {
        method: "PUT",
      });
      fetchStaff();
    } catch (err) {
      console.error("Error marking staff absent:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders(true);
      fetchAllOrders();
      fetchMenus(true);
      fetchStaff();
      fetchFeedbacks();
      const interval = setInterval(() => {
        fetchOrders(false);
        fetchAllOrders();
        fetchMenus(false);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Pagination Logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = allOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.max(1, Math.ceil(allOrders.length / ordersPerPage));

  // 🔹 Analytics Data (Group by Date)
  const analyticsData = Object.values(
    allOrders.reduce((acc: any, order) => {
      const day = new Date(order.created_at).toLocaleDateString();
      if (!acc[day]) {
        acc[day] = { day, total_sales: 0, orders_count: 0 };
      }
      acc[day].total_sales += Number(order.total) || 0;
      acc[day].orders_count += 1;
      return acc;
    }, {})
  );

  // ✅ Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-orange-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-lg w-80 text-center"
        >
          <h1 className="text-2xl font-bold text-orange-600 mb-6">Admin Login</h1>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 text-black border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  // ✅ Original Admin Panel (with Menu section added)
  return (
    <div className="flex h-screen bg-orange-50">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex w-64 bg-orange-600 text-white flex-col">
        <div className="p-4 text-2xl font-bold border-b border-orange-400">Admin Panel</div>
        <nav className="flex-1">
          <ul>
            <li
              className={`p-4 flex items-center gap-2 cursor-pointer hover:bg-orange-500 ${activeSection === "dashboard" && "bg-orange-500"}`}
              onClick={() => setActiveSection("dashboard")}
            >
              <MdDashboard /> Dashboard
            </li>
            <li
              className={`p-4 flex items-center gap-2 cursor-pointer hover:bg-orange-500 ${activeSection === "orders" && "bg-orange-500"}`}
              onClick={() => setActiveSection("orders")}
            >
              <FaClipboardList /> Orders
            </li>
            <li
              className={`p-4 flex items-center gap-2 cursor-pointer hover:bg-orange-500 ${activeSection === "analytics" && "bg-orange-500"}`}
              onClick={() => setActiveSection("analytics")}
            >
              📊 Analytics
            </li>
            <li
              className={`p-4 flex items-center gap-2 cursor-pointer hover:bg-orange-500 ${activeSection === "menu" && "bg-orange-500"}`}
              onClick={() => setActiveSection("menu")}
            >
              🍽️ Menu
            </li>
            <li
              className={`p-4 flex items-center gap-2 cursor-pointer hover:bg-orange-500 ${activeSection === "menu" && "bg-orange-500"}`}
              onClick={() => setActiveSection("staff")}
            >
              🤵 Staff
            </li>
            <li
              className={`p-4 flex items-center gap-2 cursor-pointer hover:bg-orange-500 ${activeSection === "menu" && "bg-orange-500"}`}
              onClick={() => setActiveSection("customers")}
            >
              🧔 Customers
            </li>
            <li
              className={`p-4 flex items-center gap-2 cursor-pointer hover:bg-orange-500 ${activeSection === "menu" && "bg-orange-500"}`}
              onClick={() => setActiveSection("feedback")}
            >
              🥘 Feedbacks
            </li>
          </ul>
        </nav>
      </div>

{/* Top Navbar for Mobile */}
<div className="md:hidden fixed top-0 left-0 w-full bg-orange-600 text-white flex overflow-x-auto whitespace-nowrap py-3 z-50 shadow-md">
  <button onClick={() => setActiveSection("dashboard")} className="px-4 flex-shrink-0">Dashboard</button>
  <button onClick={() => setActiveSection("orders")} className="px-4 flex-shrink-0">Orders</button>
  <button onClick={() => setActiveSection("analytics")} className="px-4 flex-shrink-0">Analytics</button>
  <button onClick={() => setActiveSection("menu")} className="px-4 flex-shrink-0">Menu</button>
  <button onClick={() => setActiveSection("staff")} className="px-4 flex-shrink-0">Staff</button>
  <button onClick={() => setActiveSection("customers")} className="px-4 flex-shrink-0">Customers</button>
  <button onClick={() => setActiveSection("feedback")} className="px-4 flex-shrink-0">Feedbacks</button>
</div>


      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto mt-14 md:mt-0">
        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col justify-center items-center h-[70vh] text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-orange-600 mb-4 drop-shadow-lg">Welcome to Dashboard</h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl">Manage your restaurant orders, track performance, and monitor analytics in real time.</p>
          </motion.div>
        )}

        {/* Orders Section */}
        {activeSection === "orders" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold text-orange-600 mb-4">Manage Orders</h1>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-10 h-10 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
                <span className="ml-3 text-orange-600 font-medium">Loading...</span>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-black">No orders found.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {orders.map((order) => (
                  <motion.div key={order.orderid} className="w-full p-4 bg-white rounded-2xl shadow-md flex flex-col justify-between" whileHover={{ scale: 1.02 }}>
                    <div className="space-y-1 text-sm md:text-base break-words">
                      <p className="font-semibold text-gray-900">Order ID: {order.orderid}</p>
                      <p className="text-gray-800">Customer: {order.name}</p>
                      <p className="text-gray-800">Email: {order.useremail}</p>
                      <p className="text-gray-800">Table: {order.table_no}</p>
                      <p className="text-gray-800">Location: {order.location_name}</p>
                      <p className="text-gray-800">Item: {order.item_name} ({order.item_description})</p>
                      <p className="text-gray-800">
                        Price: {order.price} × {order.quantity} ={" "}
                        <span className="font-bold text-orange-600">{order.total}</span>
                      </p>
                      <p className="text-gray-600 text-xs">Ordered At: {new Date(order.created_at).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <button onClick={() => approveOrder(order)} className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-xl hover:bg-green-600 justify-center flex-1">
                        <FaCheckCircle /> Approve
                      </button>
                      <button onClick={() => rejectOrder(order.orderid)} className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-600 justify-center flex-1">
                        <FaTimesCircle /> Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Analytics Section */}
        {activeSection === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold text-orange-600 mb-6">Analytics - All Orders</h1>

            {allOrders.length === 0 ? (
              <p>No orders available for analytics.</p>
            ) : (
              <div className="space-y-8">
                {/* Graph */}
                <div className="bg-white p-6 rounded-2xl shadow-md">
                  <h2 className="text-xl font-semibold text-orange-600 mb-4">📊 Daily Sales</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#f97316" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_sales" fill="#f97316" name="Total Sales (Rs)" />
                      <Bar dataKey="orders_count" fill="#16a34a" name="Orders Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Order ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Customer</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Table</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Location</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Item</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Description</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Quantity</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Total</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Ordered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentOrders.map((order) => (
                        <tr key={order.orderid} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">{order.orderid}</td>
                          <td className="px-4 py-2 text-gray-900">{order.name}</td>
                          <td className="px-4 py-2 text-gray-900">{order.useremail}</td>
                          <td className="px-4 py-2 text-gray-900">{order.table_no}</td>
                          <td className="px-4 py-2 text-gray-900">{order.location_name}</td>
                          <td className="px-4 py-2 text-gray-900">{order.item_name}</td>
                          <td className="px-4 py-2 text-gray-900">{order.item_description}</td>
                          <td className="px-4 py-2 text-gray-900">{order.quantity}</td>
                          <td className="px-4 py-2 font-semibold text-orange-600">{order.total}</td>
                          <td className="px-4 py-2 text-gray-900">{order.status}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{new Date(order.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-6 gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 rounded-md bg-orange-500 text-white disabled:bg-gray-300">
                    Prev
                  </button>
                  <span className="px-4 py-1 bg-white rounded-md shadow">Page {currentPage} of {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 rounded-md bg-orange-500 text-white disabled:bg-gray-300">
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Menu Section */}
        {activeSection === "menu" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-orange-600">Menu Management</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddMenuForm((s) => !s);
                    // reset form if opening
                    if (!showAddMenuForm) setNewMenu({ title: "", desc: "", price: "", image: "", rating: 5 });
                  }}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600"
                >
                  <FaPlus /> Add Menu
                </button>
                <button onClick={() => fetchMenus(true)} className="px-3 py-2 bg-white rounded-xl shadow">Refresh</button>
              </div>
            </div>

            {/* Add Menu Form */}
            {showAddMenuForm && (
              <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={addMenu} className="bg-white p-6 rounded-2xl shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input value={newMenu.title} onChange={(e) => setNewMenu((s) => ({ ...s, title: e.target.value }))} placeholder="Title" className="col-span-1 md:col-span-1 p-3 border rounded text-black" />
                  <input value={newMenu.price} onChange={(e) => setNewMenu((s) => ({ ...s, price: e.target.value }))} placeholder="Price (e.g., 250)" className="col-span-1 md:col-span-1 p-3 border rounded text-black" />
                  <input value={String(newMenu.rating)} onChange={(e) => setNewMenu((s) => ({ ...s, rating: Number(e.target.value) }))} type="number" min={1} max={5} placeholder="Rating (1-5)" className="col-span-1 md:col-span-1 p-3 border rounded text-black" />
                  <input value={newMenu.image} onChange={(e) => setNewMenu((s) => ({ ...s, image: e.target.value }))} placeholder="Image URL" className="col-span-1 md:col-span-3 p-3 border rounded text-black" />
                  <textarea value={newMenu.desc} onChange={(e) => setNewMenu((s) => ({ ...s, desc: e.target.value }))} placeholder="Description" className="col-span-1 md:col-span-3 p-3 border rounded text-black" />
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button type="button" onClick={() => setShowAddMenuForm(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-orange-500 text-white">Save & Add</button>
                </div>
              </motion.form>
            )}

            {/* Menu grid/list */}
            <div>
              {menuLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
                  <span>Loading menus...</span>
                </div>
              ) : menus.length === 0 ? (
                <p>No menu items found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {menus.map((m) => (
                    <motion.div key={m.title} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col" whileHover={{ y: -4 }}>
                      <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {/* image */}
                        {m.image ? <img src={m.image} alt={m.title} className="object-cover w-full h-full" /> : <div className="text-gray-400">No image</div>}
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{m.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">Rs {m.price}</p>
                            <p className="text-xs text-gray-500">⭐ {m.rating}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button onClick={() => deleteMenu(m.title)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSection === "staff" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-orange-600">Staff Management</h1>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter staff name"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="px-3 py-2 border rounded text-black"
                />
                <button
                  onClick={addStaff}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                >
                  Add Staff
                </button>
              </div>
            </div>

            {staffLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-orange-500 border-dashed rounded-full animate-spin"></div>
                <span>Loading staff...</span>
              </div>
            ) : staff.length === 0 ? (
              <p>No staff members found.</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staff.map((s) => (
                      <tr key={s.name} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{s.name}</td>
                        <td className="px-4 py-2">
                          {s.status ? (
                            <span className="text-green-600 font-semibold">Online</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Offline</span>
                          )}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => markPresent(s.name)}
                            className="px-3 py-1 rounded-md bg-green-500 text-white hover:bg-green-600"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => markAbsent(s.name)}
                            className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Customers Section */}
        {activeSection === "customers" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-orange-600 mb-6">Customers</h1>

            {allOrders.length === 0 ? (
              <p>No customer orders found.</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allOrders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{order.name}</td>
                        <td className="px-4 py-2 text-gray-600">{order.useremail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Feedback Section */}
        {activeSection === "feedback" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-orange-600 mb-6">All Feedbacks</h1>

            {feedbacks.length === 0 ? (
              <p className="text-gray-700">No feedback available.</p>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-xl bg-white shadow border border-gray-200"
                  >
                    <p className="text-gray-800">{fb.message}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Section */}
        {activeSection === "settings" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold text-orange-600 mb-4">Settings</h1>
            <p className="text-gray-700">Dummy settings section.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}


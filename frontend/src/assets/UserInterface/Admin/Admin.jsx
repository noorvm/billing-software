import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export function exit(navigate) {
  localStorage.removeItem("usertype");
  localStorage.removeItem("username");
  navigate("/", { replace: true });
}

function Admin({ isMobile = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [summary, setSummary] = useState({ total_revenue: 0, total_bills: 0, total_products: 0, low_stock_alerts: [] });
  const [products, setProducts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bills, setBills] = useState([]);
  const [returnsList, setReturnsList] = useState([]);

  const [newProd, setNewProd] = useState({ name: "", category: "Sarees", price: "", stock: "" });
  const [newStaff, setNewStaff] = useState({ username: "", email: "", password: "", usertype: "staff" });
  const [newSupplier, setNewSupplier] = useState({ name: "", contact: "", category: "" });
  const [returnForm, setReturnForm] = useState({ bill_no: "", product_id: "", quantity: 1, reason: "" });

  const loadAllData = async () => {
    try {
      const [sumRes, prodRes, staffRes, supRes, billRes, retRes] = await Promise.all([
        fetch("https://billing-software-xqyb.onrender.com/reports/summary"),
        fetch("https://billing-software-xqyb.onrender.com/products"),
        fetch("https://billing-software-xqyb.onrender.com/staff"),
        fetch("https://billing-software-xqyb.onrender.com/suppliers"),
        fetch("https://billing-software-xqyb.onrender.com/bills"),
        fetch("https://billing-software-xqyb.onrender.com/returns"),
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (billRes.ok) setBills(await billRes.json());
      if (retRes.ok) setReturnsList(await retRes.json());
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const res = await fetch("https://billing-software-xqyb.onrender.com/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProd.name,
        category: newProd.category,
        price: parseFloat(newProd.price),
        stock: parseInt(newProd.stock),
      }),
    });
    if (res.ok) {
      alert("Product Added!");
      setNewProd({ name: "", category: "Sarees", price: "", stock: "" });
      loadAllData();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Delete this product?")) {
      await fetch(`https://billing-software-xqyb.onrender.com/products/${id}`, { method: "DELETE" });
      loadAllData();
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const res = await fetch("https://billing-software-xqyb.onrender.com/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStaff),
    });
    if (res.ok) {
      alert("Staff created!");
      setNewStaff({ username: "", email: "", password: "", usertype: "staff" });
      loadAllData();
    } else {
      const err = await res.json();
      alert(err.detail);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm("Remove this staff user?")) {
      await fetch(`https://billing-software-xqyb.onrender.com/staff/${id}`, { method: "DELETE" });
      loadAllData();
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    const res = await fetch("https://billing-software-xqyb.onrender.com/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSupplier),
    });
    if (res.ok) {
      alert("Supplier added!");
      setNewSupplier({ name: "", contact: "", category: "" });
      loadAllData();
    }
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    const res = await fetch("https://billing-software-xqyb.onrender.com/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bill_no: returnForm.bill_no,
        product_id: parseInt(returnForm.product_id),
        quantity: parseInt(returnForm.quantity),
        reason: returnForm.reason,
      }),
    });
    if (res.ok) {
      alert("Product return processed & restocked!");
      setReturnForm({ bill_no: "", product_id: "", quantity: 1, reason: "" });
      loadAllData();
    } else {
      const err = await res.json();
      alert(err.detail);
    }
  };

  return (
    <div className={`admin-container ${isMobile ? "mobile-frame" : ""}`}>
      <div className="admin-header">
        <div>
          <h2>{isMobile ? "📱 Admin (Mobile UI)" : "Admin Portal"}</h2>
          <small>Textile Retail Management</small>
        </div>
        <div className="header-actions">
          {!isMobile ? (
            <button className="mobile-switch-btn" onClick={() => navigate("/mobile-admin")}>
              Test Mobile UI
            </button>
          ) : (
            <button className="mobile-switch-btn" onClick={() => navigate("/admin")}>
              Desktop View
            </button>
          )}
          <button className="admin-logout-btn" onClick={() => exit(navigate)}>
            Log out
          </button>
        </div>
      </div>

      <div className="tabs-bar">
        {[
          { key: "dashboard", label: "📊 Reports" },
          { key: "products", label: "👗 Products" },
          { key: "staff", label: "👥 Staff" },
          { key: "suppliers", label: "🏭 Suppliers" },
          { key: "returns", label: "🔄 Returns" },
          { key: "transactions", label: "🧾 Bills" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div>
          <div className="metrics-grid">
            <div className="metric-card revenue">
              <p>Total Revenue</p>
              <h3 className="metric-revenue">₹{summary.total_revenue.toFixed(2)}</h3>
            </div>
            <div className="metric-card bills">
              <p>Total Bills Issued</p>
              <h3 className="metric-bills">{summary.total_bills}</h3>
            </div>
            <div className="metric-card products">
              <p>Total Products</p>
              <h3 className="metric-products">{summary.total_products}</h3>
            </div>
          </div>

          <div className="warning-box">
            <h4 className="warning-title">⚠️ Low Stock Warnings (&lt; 10 units)</h4>
            {summary.low_stock_alerts.length === 0 ? (
              <p style={{ color: "#27ae60", margin: 0 }}>All inventory items have healthy stock.</p>
            ) : (
              <ul className="warning-list">
                {summary.low_stock_alerts.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.name}</strong> — only {item.stock} left in stock!
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div>
          <form className="admin-card-form" onSubmit={handleAddProduct}>
            <h4>+ Add New Textile Product</h4>
            <div className="form-row">
              <input
                className="form-input"
                placeholder="Product Name"
                value={newProd.name}
                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                required
              />
              <input
                className="form-input"
                placeholder="Category (e.g. Sarees)"
                value={newProd.category}
                onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                required
              />
              <input
                type="number"
                className="form-input"
                placeholder="Price (₹)"
                value={newProd.price}
                onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                required
              />
              <input
                type="number"
                className="form-input"
                placeholder="Stock"
                value={newProd.stock}
                onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                required
              />
              <button type="submit" className="form-submit-btn btn-green">
                Save
              </button>
            </div>
          </form>

          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>₹{p.price}</td>
                    <td style={{ fontWeight: "bold", color: p.stock < 10 ? "#c0392b" : "#27ae60" }}>
                      {p.stock}
                    </td>
                    <td>
                      <button className="delete-action-btn" onClick={() => handleDeleteProduct(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "staff" && (
        <div>
          <form className="admin-card-form" onSubmit={handleAddStaff}>
            <h4>+ Register New Staff Member</h4>
            <div className="form-row">
              <input
                className="form-input"
                placeholder="Username"
                value={newStaff.username}
                onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                required
              />
              <input
                type="email"
                className="form-input"
                placeholder="Email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                required
              />
              <input
                type="password"
                className="form-input"
                placeholder="Password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                required
              />
              <button type="submit" className="form-submit-btn btn-blue">
                Add Staff
              </button>
            </div>
          </form>

          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id}>
                    <td>{s.username}</td>
                    <td>{s.email}</td>
                    <td><strong>{s.usertype}</strong></td>
                    <td>
                      {s.username !== "admin" && (
                        <button className="delete-action-btn" onClick={() => handleDeleteStaff(s.id)}>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "suppliers" && (
        <div>
          <form className="admin-card-form" onSubmit={handleAddSupplier}>
            <h4>+ Add Supplier</h4>
            <div className="form-row">
              <input
                className="form-input"
                placeholder="Supplier Company Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                required
              />
              <input
                className="form-input"
                placeholder="Contact Phone"
                value={newSupplier.contact}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                required
              />
              <input
                className="form-input"
                placeholder="Supplied Category"
                value={newSupplier.category}
                onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                required
              />
              <button type="submit" className="form-submit-btn btn-green">
                Save
              </button>
            </div>
          </form>

          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Phone</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup) => (
                  <tr key={sup.id}>
                    <td>{sup.name}</td>
                    <td>{sup.contact}</td>
                    <td>{sup.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "returns" && (
        <div>
          <form className="admin-card-form" onSubmit={handleProcessReturn}>
            <h4>Process Product Return & Restock</h4>
            <div className="form-row">
              <input
                className="form-input"
                placeholder="Invoice Number (e.g. INV-123)"
                value={returnForm.bill_no}
                onChange={(e) => setReturnForm({ ...returnForm, bill_no: e.target.value })}
                required
              />
              <select
                className="form-input"
                value={returnForm.product_id}
                onChange={(e) => setReturnForm({ ...returnForm, product_id: e.target.value })}
                required
              >
                <option value="">Select Item</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="Quantity"
                value={returnForm.quantity}
                onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })}
                required
              />
              <input
                className="form-input"
                placeholder="Reason for return"
                value={returnForm.reason}
                onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                required
              />
              <button type="submit" className="form-submit-btn btn-orange">
                Restock
              </button>
            </div>
          </form>

          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {returnsList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "12px", textAlign: "center", color: "#999" }}>
                      No returns processed yet.
                    </td>
                  </tr>
                ) : (
                  returnsList.map((r) => (
                    <tr key={r.id}>
                      <td>{r.bill_no}</td>
                      <td>{r.product_name}</td>
                      <td>{r.quantity}</td>
                      <td>{r.reason}</td>
                      <td>{r.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="admin-table-card">
          <h4 style={{ margin: "0 0 15px 0" }}>All Transaction Records</h4>
          {bills.length === 0 ? (
            <p style={{ color: "#999" }}>No bills generated yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Staff</th>
                  <th>Payment</th>
                  <th>Items</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bill_no}</strong></td>
                    <td>{b.created_at}</td>
                    <td>{b.customer_name}</td>
                    <td>{b.staff_name}</td>
                    <td>{b.payment_method}</td>
                    <td>{b.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}</td>
                    <td style={{ fontWeight: "bold", color: "#27ae60" }}>
                      ₹{b.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;
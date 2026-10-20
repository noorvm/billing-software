import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Staff.css";

export function exit(navigate) {
  localStorage.removeItem("usertype");
  localStorage.removeItem("username");
  navigate("/", { replace: true });
}

function Staff() {
  const navigate = useNavigate();
  const staffName = localStorage.getItem("username") || "staff";

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [latestBill, setLatestBill] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch("https://billing-software-xqyb.onrender.com/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert("Item is out of stock!");
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more than available stock (${product.stock})`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          max_stock: product.stock,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.max_stock) {
              alert(`Maximum stock reached (${item.max_stock})`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const payload = {
      customer_name: customerName || "Walk-in Customer",
      customer_phone: customerPhone || "N/A",
      payment_method: paymentMethod,
      staff_name: staffName,
      items: cart.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await fetch("https://billing-software-xqyb.onrender.com/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Checkout failed");
      }

      setLatestBill(data.bill);
      setShowPrintModal(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="staff-container">
      <header className="staff-header">
        <div>
          <h2>Textile Retail POS - Billing Terminal</h2>
          <small>Logged in as: <strong>{staffName}</strong> (Staff)</small>
        </div>
        <button className="logout-btn" onClick={() => exit(navigate)}>
          Log out
        </button>
      </header>

      <div className="pos-grid">
        <section className="catalog-section">
          <div className="filter-bar">
            <input
              type="text"
              placeholder="🔍 Search textile product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="products-grid">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className={`product-card ${p.stock <= 0 ? "out-of-stock" : ""}`}
              >
                <div>
                  <span className="product-category">{p.category}</span>
                  <h4 className="product-name">{p.name}</h4>
                  <p className="product-price">₹{p.price.toFixed(2)}</p>
                  <span className={`product-stock ${p.stock < 10 ? "low" : ""}`}>
                    Stock: {p.stock} units
                  </span>
                </div>
                <button
                  disabled={p.stock <= 0}
                  onClick={() => addToCart(p)}
                  className="add-btn"
                >
                  {p.stock > 0 ? "+ Add to Bill" : "Out of Stock"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="cart-section">
          <div>
            <h3 className="cart-title">Current Cart ({cart.length} items)</h3>
            <div className="cart-items-wrapper">
              {cart.length === 0 ? (
                <p className="cart-empty">Cart is empty. Select items to bill.</p>
              ) : (
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.product_id}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="qty-control"
                            onClick={() => updateQuantity(item.product_id, -1)}
                          >
                            -
                          </button>
                          <span style={{ margin: "0 6px" }}>{item.quantity}</span>
                          <button
                            className="qty-control"
                            onClick={() => updateQuantity(item.product_id, 1)}
                          >
                            +
                          </button>
                        </td>
                        <td style={{ textAlign: "center" }}>₹{item.price}</td>
                        <td style={{ textAlign: "center" }}>₹{item.price * item.quantity}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="remove-btn"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="customer-form">
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="customer-input"
              />
              <input
                type="text"
                placeholder="Customer Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="customer-input"
              />
              <div className="payment-options">
                <strong>Payment: </strong>
                {["Cash", "Card", "UPI"].map((m) => (
                  <label key={m} className="payment-label">
                    <input
                      type="radio"
                      name="payment"
                      value={m}
                      checked={paymentMethod === m}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />{" "}
                    {m}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="checkout-footer">
            <div className="total-row">
              <span className="total-title">Total Amount:</span>
              <span className="total-amount">₹{cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="checkout-btn"
            >
              Print & Generate Bill
            </button>
          </div>
        </section>
      </div>

      {showPrintModal && latestBill && (
        <div className="modal-overlay">
          <div className="receipt-modal">
            <div className="receipt-header">
              <h2 style={{ margin: 0 }}>SIONIQ TEXTILES</h2>
              <p style={{ margin: "3px 0", fontSize: "12px" }}>Retail POS & Billing System</p>
              <small>Invoice: {latestBill.bill_no}</small>
            </div>

            <div className="receipt-meta">
              <div><strong>Date:</strong> {latestBill.created_at}</div>
              <div><strong>Staff:</strong> {latestBill.staff_name}</div>
              <div><strong>Customer:</strong> {latestBill.customer_name}</div>
              <div><strong>Payment:</strong> {latestBill.payment_method}</div>
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Item</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Amt</th>
                </tr>
              </thead>
              <tbody>
                {latestBill.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.name}</td>
                    <td style={{ textAlign: "center" }}>{i.quantity}</td>
                    <td style={{ textAlign: "right" }}>₹{(i.price * i.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-total">
              <strong>Total: ₹{latestBill.total_amount.toFixed(2)}</strong>
            </div>

            <div className="modal-actions">
              <button className="print-btn" onClick={() => window.print()}>
                🖨️ Print Receipt
              </button>
              <button className="close-btn" onClick={() => setShowPrintModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Staff;
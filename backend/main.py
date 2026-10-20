from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="Textile POS Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- IN-MEMORY STORAGE -----------------

USERS = [
    {"id": 1, "username": "admin", "email": "admin@textile.com", "password": "112233", "usertype": "admin"},
    {"id": 2, "username": "staff", "email": "staff@textile.com", "password": "123123", "usertype": "staff"},
]

PRODUCTS = [
    {"id": 1, "name": "Kanchipuram Silk Saree", "category": "Sarees", "price": 4500.0, "stock": 15},
    {"id": 2, "name": "Cotton Kurti - M", "category": "Women's Wear", "price": 799.0, "stock": 40},
    {"id": 3, "name": "Linen Formal Shirt - L", "category": "Men's Wear", "price": 1299.0, "stock": 25},
    {"id": 4, "name": "Raw Silk Fabric (Meter)", "category": "Fabrics", "price": 350.0, "stock": 100},
    {"id": 5, "name": "Denim Jeans - 32", "category": "Men's Wear", "price": 1499.0, "stock": 20},
]

SUPPLIERS = [
    {"id": 1, "name": "Surat Weavers Co.", "contact": "+91 9876543210", "category": "Silk & Sarees"},
    {"id": 2, "name": "Coimbatore Cotton Mills", "contact": "+91 9876543211", "category": "Cotton & Kurtis"},
]

BILLS = []
RETURNS = []

id_counters = {
    "user": 3,
    "product": 6,
    "supplier": 3,
    "bill": 1,
    "return": 1
}

# ----------------- SCHEMAS -----------------

class LoginData(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    usertype: str

class ProductSchema(BaseModel):
    name: str
    category: str
    price: float
    stock: int

class SupplierSchema(BaseModel):
    name: str
    contact: str
    category: str

class CartItem(BaseModel):
    product_id: int
    name: str
    price: float
    quantity: int

class BillCreate(BaseModel):
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = ""
    payment_method: str
    staff_name: str
    items: List[CartItem]

class ReturnCreate(BaseModel):
    bill_no: str
    product_id: int
    quantity: int
    reason: str

# ----------------- Login -----------------

@app.get("/")
def home():
    return {"message": "Textile POS API Running"}

@app.post("/login")
def login(data: LoginData):
    for u in USERS:
        if u["username"] == data.username and u["password"] == data.password:
            return {
                "status": "success",
                "message": "Successfully logged in",
                "username": u["username"],
                "usertype": u["usertype"]
            }
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

# ----------------- PRODUCT CRUD -----------------

@app.get("/products")
def get_products():
    return PRODUCTS

@app.post("/products", status_code=status.HTTP_201_CREATED)
def add_product(prod: ProductSchema):
    new_product = {
        "id": id_counters["product"],
        "name": prod.name,
        "category": prod.category,
        "price": prod.price,
        "stock": prod.stock
    }
    id_counters["product"] += 1
    PRODUCTS.append(new_product)
    return {"message": "Product added successfully", "product": new_product}

@app.put("/products/{product_id}")
def update_product(product_id: int, prod: ProductSchema):
    for p in PRODUCTS:
        if p["id"] == product_id:
            p.update({
                "name": prod.name,
                "category": prod.category,
                "price": prod.price,
                "stock": prod.stock
            })
            return {"message": "Product updated"}
    raise HTTPException(status_code=404, detail="Product not found")

@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    global PRODUCTS
    PRODUCTS = [p for p in PRODUCTS if p["id"] != product_id]
    return {"message": "Product deleted"}

# ----------------- STAFF MANAGEMENT -----------------

@app.get("/staff")
def get_staff():
    return [{"id": u["id"], "username": u["username"], "email": u["email"], "usertype": u["usertype"]} for u in USERS]

@app.post("/staff", status_code=status.HTTP_201_CREATED)
def add_staff(u: UserCreate):
    if any(user["username"] == u.username for user in USERS):
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = {
        "id": id_counters["user"],
        "username": u.username,
        "email": u.email,
        "password": u.password,
        "usertype": u.usertype
    }
    id_counters["user"] += 1
    USERS.append(new_user)
    return {"message": "Staff member created"}

@app.delete("/staff/{user_id}")
def delete_staff(user_id: int):
    global USERS
    USERS = [u for u in USERS if u["id"] != user_id]
    return {"message": "Staff member deleted"}

# ----------------- SUPPLIERS -----------------

@app.get("/suppliers")
def get_suppliers():
    return SUPPLIERS

@app.post("/suppliers", status_code=status.HTTP_201_CREATED)
def add_supplier(sup: SupplierSchema):
    new_sup = {
        "id": id_counters["supplier"],
        "name": sup.name,
        "contact": sup.contact,
        "category": sup.category
    }
    id_counters["supplier"] += 1
    SUPPLIERS.append(new_sup)
    return {"message": "Supplier added", "supplier": new_sup}

# ----------------- BILLING & POS -----------------

@app.post("/bills", status_code=status.HTTP_201_CREATED)
def create_bill(bill: BillCreate):
    if not bill.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    for item in bill.items:
        prod = next((p for p in PRODUCTS if p["id"] == item.product_id), None)
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {item.name} not found")
        if prod["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {prod['name']}")

    for item in bill.items:
        prod = next((p for p in PRODUCTS if p["id"] == item.product_id), None)
        prod["stock"] -= item.quantity

    total = sum(item.price * item.quantity for item in bill.items)
    bill_no = f"INV-{int(datetime.now().timestamp())}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_bill = {
        "id": id_counters["bill"],
        "bill_no": bill_no,
        "customer_name": bill.customer_name,
        "customer_phone": bill.customer_phone,
        "total_amount": total,
        "payment_method": bill.payment_method,
        "staff_name": bill.staff_name,
        "items": [item.model_dump() for item in bill.items],
        "created_at": now_str
    }
    id_counters["bill"] += 1
    BILLS.insert(0, new_bill)

    return {"message": "Bill generated", "bill": new_bill}

@app.get("/bills")
def get_bills():
    return BILLS

# ----------------- RETURNS -----------------

@app.post("/returns")
def process_return(ret: ReturnCreate):
    prod = next((p for p in PRODUCTS if p["id"] == ret.product_id), None)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod["stock"] += ret.quantity

    new_return = {
        "id": id_counters["return"],
        "bill_no": ret.bill_no,
        "product_id": ret.product_id,
        "product_name": prod["name"],
        "quantity": ret.quantity,
        "reason": ret.reason,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    id_counters["return"] += 1
    RETURNS.insert(0, new_return)
    return {"message": "Return completed, product restocked", "return": new_return}

@app.get("/returns")
def get_returns():
    return RETURNS

# ----------------- REPORTS -----------------

@app.get("/reports/summary")
def get_reports():
    return {
        "total_revenue": sum(b["total_amount"] for b in BILLS),
        "total_bills": len(BILLS),
        "total_products": len(PRODUCTS),
        "low_stock_alerts": [p for p in PRODUCTS if p["stock"] < 10]
    }
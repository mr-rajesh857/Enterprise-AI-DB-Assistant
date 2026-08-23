"""
Complete database seed file.
Creates: roles, permissions, users, and sample business data.

Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import random
from app.database import SessionLocal, Base, engine
from app.models.role import Role, Permission
from app.models.user import User
from app.services.auth_service import hash_password
from sqlalchemy import text

FIRST_NAMES = ["Arjun","Priya","Rahul","Sneha","Vikram","Ananya","Rohit",
               "Kavya","Amit","Deepika","Suresh","Meena","Kiran","Pooja",
               "Nikhil","Divya","Sanjay","Lakshmi","Arun","Nisha"]
LAST_NAMES  = ["Sharma","Patel","Singh","Kumar","Gupta","Joshi","Mehta",
               "Reddy","Nair","Das","Verma","Shah","Rao","Iyer","Pillai",
               "Chopra","Malhotra","Bose","Sen","Chatterjee"]
CITIES = ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata",
          "Pune","Ahmedabad","Jaipur","Surat","Lucknow","Bhopal",
          "Chandigarh","Nagpur","Indore","Patna","Vadodara","Coimbatore"]
STATES = {
    "Mumbai":"Maharashtra","Pune":"Maharashtra","Nagpur":"Maharashtra",
    "Delhi":"Delhi","Jaipur":"Rajasthan",
    "Bangalore":"Karnataka","Hyderabad":"Telangana",
    "Chennai":"Tamil Nadu","Coimbatore":"Tamil Nadu",
    "Kolkata":"West Bengal","Ahmedabad":"Gujarat",
    "Surat":"Gujarat","Vadodara":"Gujarat",
    "Lucknow":"Uttar Pradesh","Patna":"Bihar",
    "Bhopal":"Madhya Pradesh","Indore":"Madhya Pradesh",
    "Chandigarh":"Punjab",
}
CATEGORIES = ["Electronics","Clothing","Home & Kitchen","Books",
              "Sports & Outdoors","Beauty & Personal Care",
              "Toys & Games","Automotive","Health & Wellness","Food & Grocery"]
PRODUCTS = {
    "Electronics":[
        ("Wireless Bluetooth Headphones",2499,899),("Smart LED TV 43 inch",28999,18000),
        ("Laptop Core i5 8GB RAM",45999,32000),("Smartphone 128GB",18999,12000),
        ("Tablet 10 inch WiFi",15999,9500),("Portable Speaker",1999,750),
        ("USB-C Charging Hub",1299,450),("Mechanical Keyboard",3499,1200),
        ("Gaming Mouse",1799,600),("Webcam 1080p",2299,850),
    ],
    "Clothing":[
        ("Men Cotton Formal Shirt",999,280),("Women Kurti Set",1299,380),
        ("Denim Jeans Men",1799,520),("Ethnic Saree Silk",3499,1100),
        ("Kids School Uniform Set",799,220),("Sports T-Shirt Dry-fit",599,150),
        ("Winter Jacket Hooded",2999,900),("Ladies Palazzo Set",1499,420),
        ("Men Formal Trousers",1599,480),("Girls Party Dress",1199,340),
    ],
    "Home & Kitchen":[
        ("Pressure Cooker 5L",1999,680),("Non-stick Frying Pan Set",1499,480),
        ("Mixer Grinder 750W",3299,1100),("Steel Water Bottle 1L",499,120),
        ("Bedsheet King Size",1299,380),("Curtain Set 2pc",999,280),
        ("Dinner Set 24pc",2499,750),("Air Fryer 4L",5999,2200),
        ("Electric Kettle 1.5L",999,320),("Induction Cooktop 1800W",2499,850),
    ],
    "Books":[
        ("Wings of Fire APJ Abdul Kalam",299,60),("The Alchemist Paulo Coelho",249,55),
        ("Rich Dad Poor Dad",399,80),("Atomic Habits",499,100),
        ("The Psychology of Money",449,90),("Ikigai",299,62),
        ("Class 10 Science NCERT",199,40),("Python Programming Guide",699,180),
        ("IIT JEE Mathematics",899,220),("English Grammar in Use",599,140),
    ],
    "Sports & Outdoors":[
        ("Cricket Bat Kashmir Willow",1499,480),("Yoga Mat 6mm Anti-slip",799,200),
        ("Badminton Racket Set",1299,380),("Football Size 5",999,280),
        ("Cycling Helmet",1799,520),("Gym Gloves",499,120),
        ("Skipping Rope Steel",399,90),("Treadmill Manual",8999,3500),
        ("Dumbbell Set 20kg",3499,1100),("Swimming Goggles",599,150),
    ],
    "Beauty & Personal Care":[
        ("Face Wash Neem 100ml",199,45),("Sunscreen SPF 50 50g",349,80),
        ("Hair Oil Coconut 200ml",249,55),("Moisturizer Aloe Vera",299,68),
        ("Lipstick Set 6 Colors",599,150),("Electric Shaver Men",1999,650),
        ("Hair Dryer 1800W",1499,480),("Perfume Floral 100ml",899,220),
        ("Trimmer Cordless",1299,380),("Face Serum Vitamin C",699,180),
    ],
    "Toys & Games":[
        ("LEGO Building Blocks 500pc",1999,680),("Remote Control Car",1299,380),
        ("Board Game Chess Wooden",799,200),("Barbie Doll Set",999,280),
        ("Action Figure Superhero",599,150),("Puzzle 1000 Pieces",699,180),
        ("Scrabble Board Game",1299,380),("Tricycle Kids 3-5yr",3499,1100),
        ("Art and Craft Kit",899,220),("Baby Rattle Toy Set",499,100),
    ],
    "Automotive":[
        ("Car Dash Camera 1080p",3499,1100),("Tyre Inflator Portable",1999,650),
        ("Car Seat Cover Set",2499,750),("Bike Helmet Full Face",1999,600),
        ("Car Air Freshener Set",399,80),("Jump Starter Power Bank",4999,1800),
        ("Car Phone Holder",699,180),("Engine Oil 5W30 1L",599,200),
        ("Wiper Blades Pair",799,220),("Car Vacuum Cleaner",1499,480),
    ],
    "Health & Wellness":[
        ("Digital BP Monitor",1499,480),("Glucometer Kit",999,320),
        ("Pulse Oximeter",799,200),("Weighing Scale Digital",1299,380),
        ("Thermometer Digital",499,120),("Vitamin D3 Supplement 60tab",599,150),
        ("Protein Powder Whey 1kg",2499,750),("Multivitamin Tablets 100pc",799,200),
        ("Omega 3 Fish Oil 60cap",699,180),("Back Support Belt",1299,380),
    ],
    "Food & Grocery":[
        ("Basmati Rice Premium 5kg",699,380),("Toor Dal 2kg",349,180),
        ("Sunflower Oil 5L",799,450),("Ghee Pure Cow 500g",599,320),
        ("Honey Raw 500g",499,180),("Green Tea 100 Bags",299,80),
        ("Almonds Premium 500g",799,420),("Turmeric Powder 500g",199,60),
        ("Coffee Beans Arabica 250g",699,280),("Oats Rolled 1kg",299,90),
    ],
}
PAYMENT_METHODS = ["Credit Card","Debit Card","UPI","Net Banking",
                   "Cash on Delivery","EMI","Wallet"]
ORDER_STATUSES  = ["pending","confirmed","processing","shipped",
                   "delivered","cancelled","returned"]
STATUS_WEIGHTS  = [0.05,0.08,0.07,0.10,0.60,0.07,0.03]
REVIEW_TITLES = [
    "Excellent product!","Good value for money","Highly recommended",
    "Decent quality","Not as expected","Great purchase",
    "Average product","Outstanding quality","Would buy again",
    "Perfect for daily use","Worth every rupee","Superb packaging",
]
REVIEW_BODIES = [
    "Very happy with this purchase. Works exactly as described.",
    "Good quality product. Delivery was on time.",
    "Excellent build quality. Highly recommended for everyone.",
    "Product is okay but could be better for the price.",
    "Amazing product. Will definitely buy again.",
    "Packaging was great. Product exceeded expectations.",
    "Fast delivery and good packaging. Product works well.",
    "Satisfied with the purchase. Good after-sales support.",
]
DEPARTMENTS = ["Engineering","Sales","Marketing","Finance","HR",
               "Operations","Customer Support","Logistics"]
DESIGNATIONS = {
    "Engineering":["Software Engineer","Senior Engineer","Tech Lead","Engineering Manager"],
    "Sales":["Sales Executive","Senior Sales Rep","Sales Manager","VP Sales"],
    "Marketing":["Marketing Executive","Content Writer","SEO Analyst","Marketing Manager"],
    "Finance":["Accountant","Senior Accountant","Finance Manager","CFO"],
    "HR":["HR Executive","Recruiter","HR Manager","HR Director"],
    "Operations":["Operations Executive","Operations Manager","COO"],
    "Customer Support":["Support Agent","Senior Support Agent","Support Manager"],
    "Logistics":["Delivery Executive","Logistics Coordinator","Logistics Manager"],
}

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
    id           SERIAL PRIMARY KEY,
    category_id  INTEGER REFERENCES categories(id),
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    price        NUMERIC(10,2) NOT NULL,
    cost_price   NUMERIC(10,2) NOT NULL,
    stock_qty    INTEGER DEFAULT 0,
    sku          VARCHAR(50) UNIQUE,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS customers (
    id           SERIAL PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    phone        VARCHAR(15),
    city         VARCHAR(100),
    state        VARCHAR(100),
    pincode      VARCHAR(10),
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    customer_id      INTEGER REFERENCES customers(id),
    order_date       TIMESTAMP NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_method   VARCHAR(50),
    subtotal         NUMERIC(10,2) NOT NULL,
    discount         NUMERIC(10,2) DEFAULT 0,
    shipping_charge  NUMERIC(10,2) DEFAULT 0,
    total_amount     NUMERIC(10,2) NOT NULL,
    delivery_date    TIMESTAMP,
    created_at       TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER REFERENCES orders(id),
    product_id  INTEGER REFERENCES products(id),
    quantity    INTEGER NOT NULL,
    unit_price  NUMERIC(10,2) NOT NULL,
    discount    NUMERIC(10,2) DEFAULT 0,
    total_price NUMERIC(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reviews (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER REFERENCES products(id),
    customer_id INTEGER REFERENCES customers(id),
    rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(200),
    body        TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS employees (
    id           SERIAL PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    phone        VARCHAR(15),
    department   VARCHAR(100),
    designation  VARCHAR(100),
    salary       NUMERIC(10,2),
    hire_date    DATE,
    city         VARCHAR(100),
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS inventory_logs (
    id           SERIAL PRIMARY KEY,
    product_id   INTEGER REFERENCES products(id),
    change_qty   INTEGER NOT NULL,
    reason       VARCHAR(100),
    logged_at    TIMESTAMP DEFAULT NOW()
);
"""

def rdate(start=365, end=0):
    d = random.randint(end, start)
    return datetime.utcnow() - timedelta(days=d, hours=random.randint(0,23), minutes=random.randint(0,59))

def rphone():
    return f"9{random.randint(100000000,999999999)}"

def remail(first, last, idx):
    domains = ["gmail.com","yahoo.com","hotmail.com","outlook.com","rediffmail.com"]
    return f"{first.lower()}.{last.lower()}{idx}@{random.choice(domains)}"

def seed():
    print("\n🌱 Starting database seed...\n")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Roles + permissions
        if db.query(Role).count() == 0:
            print("📋 Creating roles and permissions...")
            perms = {}
            for name, desc in [
                ("query:execute","Run AI-generated SQL queries"),
                ("query:read","View query history"),
                ("users:manage","Create, edit, delete users"),
                ("users:read","View user list"),
                ("roles:read","View roles"),
                ("audit:read","View audit logs"),
                ("tables:all","Access all database tables"),
                ("tables:allowed","Access only assigned tables"),
            ]:
                p = Permission(name=name, description=desc)
                db.add(p); db.flush()
                perms[name] = p

            admin_role = Role(name="admin",description="Full system access",permissions=list(perms.values()))
            analyst_role = Role(name="analyst",description="Can execute queries on allowed tables",
                permissions=[perms["query:execute"],perms["query:read"],perms["tables:allowed"]])
            viewer_role = Role(name="viewer",description="Read-only access with execute queries on allowed tables",
                permissions=[perms["query:execute"],perms["query:read"],perms["tables:allowed"]])
            db.add_all([admin_role,analyst_role,viewer_role]); db.flush()

            db.add(User(email="admin@example.com",hashed_password=hash_password("Admin@123"),
                full_name="Super Admin",is_active=True,role_id=admin_role.id,allowed_tables=None))
            db.add(User(email="analyst@example.com",hashed_password=hash_password("Analyst@123"),
                full_name="Data Analyst",is_active=True,role_id=analyst_role.id,
                allowed_tables="orders,order_items,products,customers,categories"))
            db.add(User(email="viewer@example.com",hashed_password=hash_password("Viewer@123"),
                full_name="Report Viewer",is_active=True,role_id=viewer_role.id,
                allowed_tables="orders,customers"))
            db.commit()
            print("  ✅ Roles + users created")
        else:
            print("  ⏭  Roles already exist — ensuring viewer has chat permissions")
            viewer_role = db.query(Role).filter(Role.name == "viewer").first()
            if viewer_role:
                perm_execute = db.query(Permission).filter(Permission.name == "query:execute").first()
                if perm_execute and perm_execute not in viewer_role.permissions:
                    viewer_role.permissions.append(perm_execute)
                    db.commit()
                    print("  ✅ Updated viewer role with chat permission")

        # Business tables
        with engine.connect() as conn:
            conn.execute(text(CREATE_TABLES_SQL)); conn.commit()
        print("📦 Business tables ready")

        # Check if already seeded
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM customers")).scalar()
        if count > 0:
            print("\n✅ Business data already seeded.\n"); return

        # Categories
        print("🏷️  Seeding categories...")
        cat_desc = {
            "Electronics":"Gadgets, devices, and consumer electronics",
            "Clothing":"Men, women and kids apparel and fashion",
            "Home & Kitchen":"Cookware, appliances and home essentials",
            "Books":"Educational, fiction and non-fiction books",
            "Sports & Outdoors":"Sports equipment and outdoor gear",
            "Beauty & Personal Care":"Skincare, haircare and personal grooming",
            "Toys & Games":"Toys, board games and kids entertainment",
            "Automotive":"Car and bike accessories and parts",
            "Health & Wellness":"Medical devices and health supplements",
            "Food & Grocery":"Staple foods, dry fruits and beverages",
        }
        category_ids = {}
        for cname, cdesc in cat_desc.items():
            with engine.connect() as conn:
                r = conn.execute(text("INSERT INTO categories (name,description) VALUES (:n,:d) RETURNING id"),{"n":cname,"d":cdesc})
                conn.commit()
                category_ids[cname] = r.fetchone()[0]
        print(f"  ✅ {len(category_ids)} categories")

        # Products
        print("📱 Seeding products...")
        product_ids = {}
        sku = 1000
        for cname, items in PRODUCTS.items():
            cid = category_ids[cname]
            product_ids[cname] = []
            for pname, price, cost in items:
                sku += 1
                with engine.connect() as conn:
                    r = conn.execute(text("""
                        INSERT INTO products (category_id,name,description,price,cost_price,stock_qty,sku)
                        VALUES (:cid,:n,:d,:p,:cp,:sq,:sk) RETURNING id
                    """),{"cid":cid,"n":pname,"d":f"Quality {pname.lower()} trusted by customers.",
                          "p":price,"cp":cost,"sq":random.randint(5,500),"sk":f"SKU-{sku}"})
                    conn.commit()
                    product_ids[cname].append(r.fetchone()[0])
        total_products = sum(len(v) for v in product_ids.values())
        print(f"  ✅ {total_products} products")

        # Customers
        print("👥 Seeding 200 customers...")
        customer_ids = []
        for i in range(1, 201):
            first = random.choice(FIRST_NAMES)
            last  = random.choice(LAST_NAMES)
            city  = random.choice(CITIES)
            state = STATES.get(city, "India")
            with engine.connect() as conn:
                r = conn.execute(text("""
                    INSERT INTO customers (full_name,email,phone,city,state,pincode)
                    VALUES (:fn,:em,:ph,:ci,:st,:pi) RETURNING id
                """),{"fn":f"{first} {last}","em":remail(first,last,i),"ph":rphone(),
                      "ci":city,"st":state,"pi":str(random.randint(110001,799999))})
                conn.commit()
                customer_ids.append(r.fetchone()[0])
        print(f"  ✅ {len(customer_ids)} customers")

        # Orders + items
        print("🛒 Seeding 600 orders with items...")
        all_pids = [pid for pids in product_ids.values() for pid in pids]
        order_count = 0
        item_count  = 0
        for _ in range(600):
            cust_id    = random.choice(customer_ids)
            order_date = rdate(365)
            status     = random.choices(ORDER_STATUSES, weights=STATUS_WEIGHTS)[0]
            payment    = random.choice(PAYMENT_METHODS)
            shipping   = random.choice([0,0,0,49,99])
            delivery_date = None
            if status in ("delivered","returned"):
                delivery_date = order_date + timedelta(days=random.randint(2,7))

            chosen = random.sample(all_pids, min(random.randint(1,5), len(all_pids)))
            subtotal = 0
            items_data = []
            for pid in chosen:
                with engine.connect() as conn:
                    row = conn.execute(text("SELECT price FROM products WHERE id=:id"),{"id":pid}).fetchone()
                price = float(row[0])
                qty   = random.randint(1,4)
                disc  = round(price * random.choice([0,0,0,0.05,0.10,0.15]),2)
                total = round((price-disc)*qty,2)
                subtotal += total
                items_data.append((pid,qty,price,disc,total))

            discount     = round(subtotal * random.choice([0,0,0,0.05,0.10]),2)
            total_amount = round(subtotal - discount + shipping, 2)

            with engine.connect() as conn:
                r = conn.execute(text("""
                    INSERT INTO orders
                      (customer_id,order_date,status,payment_method,
                       subtotal,discount,shipping_charge,total_amount,delivery_date)
                    VALUES (:cid,:od,:st,:pm,:sub,:disc,:ship,:total,:dd) RETURNING id
                """),{"cid":cust_id,"od":order_date,"st":status,"pm":payment,
                      "sub":round(subtotal,2),"disc":discount,"ship":shipping,
                      "total":total_amount,"dd":delivery_date})
                conn.commit()
                order_id = r.fetchone()[0]

            for pid,qty,price,disc,total in items_data:
                with engine.connect() as conn:
                    conn.execute(text("""
                        INSERT INTO order_items
                          (order_id,product_id,quantity,unit_price,discount,total_price)
                        VALUES (:oid,:pid,:qty,:up,:disc,:tp)
                    """),{"oid":order_id,"pid":pid,"qty":qty,"up":price,"disc":disc,"tp":total})
                    conn.commit()
                    item_count += 1
            order_count += 1
        print(f"  ✅ {order_count} orders, {item_count} order items")

        # Reviews
        print("⭐ Seeding 400 reviews...")
        rev_count = 0
        for _ in range(400):
            cat = random.choice(list(product_ids.keys()))
            pid = random.choice(product_ids[cat])
            cid = random.choice(customer_ids)
            with engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO reviews (product_id,customer_id,rating,title,body)
                    VALUES (:pid,:cid,:r,:t,:b)
                """),{"pid":pid,"cid":cid,
                      "r":random.choices([1,2,3,4,5],weights=[3,5,10,30,52])[0],
                      "t":random.choice(REVIEW_TITLES),"b":random.choice(REVIEW_BODIES)})
                conn.commit()
                rev_count += 1
        print(f"  ✅ {rev_count} reviews")

        # Employees
        print("🧑‍💼 Seeding 50 employees...")
        emp_count = 0
        for i in range(1, 51):
            first = random.choice(FIRST_NAMES)
            last  = random.choice(LAST_NAMES)
            dept  = random.choice(DEPARTMENTS)
            desig = random.choice(DESIGNATIONS[dept])
            city  = random.choice(CITIES)
            hire_date = (datetime.utcnow() - timedelta(days=random.randint(30,1825))).date()
            with engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO employees
                      (full_name,email,phone,department,designation,salary,hire_date,city)
                    VALUES (:fn,:em,:ph,:dept,:desig,:sal,:hd,:city)
                """),{"fn":f"{first} {last}","em":f"{first.lower()}.{last.lower()}{i}@company.com",
                      "ph":rphone(),"dept":dept,"desig":desig,
                      "sal":random.randint(25000,250000),"hd":hire_date,"city":city})
                conn.commit()
                emp_count += 1
        print(f"  ✅ {emp_count} employees")

        # Inventory logs
        print("📊 Seeding inventory logs...")
        reasons = ["sale","restock","return","damage","adjustment"]
        inv_count = 0
        for pid in random.sample(all_pids, min(80, len(all_pids))):
            for _ in range(random.randint(2,8)):
                reason = random.choice(reasons)
                change = -random.randint(1,10) if reason=="sale" else random.randint(5,100)
                with engine.connect() as conn:
                    conn.execute(text("""
                        INSERT INTO inventory_logs (product_id,change_qty,reason,logged_at)
                        VALUES (:pid,:cq,:r,:la)
                    """),{"pid":pid,"cq":change,"r":reason,"la":rdate(90)})
                    conn.commit()
                    inv_count += 1
        print(f"  ✅ {inv_count} inventory log entries")

        print("\n" + "="*55)
        print("✅  DATABASE SEEDED SUCCESSFULLY")
        print("="*55)
        print("\n  Login credentials:")
        print("  ┌─────────────────────────────────────────────────┐")
        print("  │  admin@example.com    / Admin@123    (admin)    │")
        print("  │  analyst@example.com  / Analyst@123  (analyst)  │")
        print("  │  viewer@example.com   / Viewer@123   (viewer)   │")
        print("  └─────────────────────────────────────────────────┘")
        print(f"\n  • {len(category_ids)} categories")
        print(f"  • {total_products} products across 10 categories")
        print(f"  • {len(customer_ids)} customers (pan-India)")
        print(f"  • {order_count} orders  ({item_count} line items)")
        print(f"  • {rev_count} product reviews")
        print(f"  • {emp_count} employees across 8 departments")
        print(f"  • {inv_count} inventory log entries")
        print("\n  Adminer:  http://localhost:8080")
        print("  API docs: http://localhost:8000/docs")
        print("="*55 + "\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        import traceback; traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
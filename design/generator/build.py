import json, datetime, sys
sys.path.insert(0, '.')
from lib import page
S = {}
for m in ("screens1", "screens2", "screens3", "screens4"):
    S.update(__import__(m).S)
rows = [
  ("start", "Start, home & settings", ["Main", "Dashboard", "SyncCenter", "More", "Settings", "StyleGuide"]),
  ("staff", "Staff app — each person sees only what Admin allows", ["StaffHome", "StaffProfile"]),
  ("access", "Access control (Admin)", ["Users", "StaffAccess", "Roles"]),
  ("stock", "Stock & daily record", ["Inventory", "ProductDetail", "ReceiveStock", "DailyRecord", "CloseDay"]),
  ("sales", "Sales, deliveries & customers", ["Sales", "NewSale", "Customers", "CustomerProfile"]),
  ("money", "Expenses, staff & riders", ["Expenses", "AddExpense", "Staff", "Riders", "OnboardRider"]),
  ("fin", "Finance & reports", ["Finance", "Reports"]),
  ("rider", "Rider app", ["RiderHome", "DeliveryDetail", "RiderHistory", "RiderProfile", "RiderEditProfile"]),
]
boards, order, notes = {}, [], {}
y = 0
for nid, title, names in rows:
    notes[nid] = {"x": 0, "y": y, "text": title, "kind": "title1", "maxW": len(names)*470-80}
    y0 = y + 240
    maxh = 0
    for i, n in enumerate(names):
        t, h, body = S[n]
        open(f"canvas/project/{n}.dc.html", "w").write(page(t, h, body))
        boards[f"{n}.dc.html"] = {"x": i*470, "y": y0, "w": 390, "h": h, "title": t, "is_interactive": True, "radius": 28}
        order.append(f"{n}.dc.html"); maxh = max(maxh, h)
    y = y0 + maxh + 160
missing = set(S) - {n for _,_,ns in rows for n in ns}
assert not missing, missing
order.remove("Main.dc.html"); order.insert(0, "Main.dc.html")
canvas = {"v": 3, "createdOnFiles": {"v": 1, "at": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")},
          "title": "K-Logistics Hub App Design", "launch": {"view": "canvas"}, "pages": [],
          "boards": boards, "order": order, "notes": notes, "designSystems": []}
json.dump(canvas, open("canvas/project/canvas.json", "w"), indent=1)
print(len(boards), "boards")

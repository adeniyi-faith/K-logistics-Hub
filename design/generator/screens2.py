from lib import *

S = {}

PRODUCTS = [
    # name, unit, open, in, out, close, low
    ("Rice 50kg", "bags", 50, 20, 10, 60, False),
    ("Vegetable oil 25L", "kegs", 40, 0, 12, 28, False),
    ("Sugar 50kg", "bags", 30, 30, 14, 46, False),
    ("Noodles (carton)", "cartons", 200, 50, 20, 230, False),
    ("Tomato paste (carton)", "cartons", 15, 0, 8, 7, True),
    ("Semovita 10kg", "bags", 4, 0, 0, 4, True),
    ("Table water (pack)", "packs", 300, 20, 0, 320, False),
]


def prod_row(p, first=False):
    name, unit, o, i, d, c, low = p
    bd = "" if first else f"border-top: 1px solid {LINE}; "
    b = badge("Low stock", "amber") if low else badge("In stock", "green")
    return (f'<a href="ProductDetail.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 12px 0; {bd}color: {NAVY}">'
            f'{icon_tile("box", "#EEF1F8", NAVY)}'
            f'<div style="flex-grow: 1; min-width: 0"><div style="font-weight: 700">{name}</div>'
            f'<div style="font-size: 12px; color: {MUTED}; margin-top: 2px">Open {o} · In +{i} · Out −{d}</div></div>'
            f'<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px">'
            f'<div style="font-family: {HEAD}; font-size: 18px; font-weight: 600">{c} <span style="font-family: {BODY}; font-size: 12px; color: {MUTED}; font-weight: 500">{unit}</span></div>{b}</div></a>')


S["Inventory"] = ("Inventory", 960, topbar("Stock", sync="offline", right=f'<a href="#" aria-label="Add product" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid {LINE}">{ic("plus", 22)}</a>') + main(f'''
{searchbar("Search products")}
{chips(["All (7)", "In stock (5)", "Low stock (2)"], "All (7)")}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: {MUTED}">Received</div><div style="font-weight: 700; color: {GREEN}">+120</div></div>
<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: {MUTED}">Delivered</div><div style="font-weight: 700; color: {RED}">−64</div></div>
<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: {MUTED}">In store now</div><div style="font-weight: 700">695</div></div></div>
{card("".join(prod_row(p, k == 0) for k, p in enumerate(PRODUCTS)), pad=14, gap=0, extra="; padding-top: 4px; padding-bottom: 4px")}
''') + fab("ReceiveStock.dc.html", "Receive stock") + tabbar("admin", "Stock"))


def eq_box(label, val, bg="#FFFFFF", fg=NAVY):
    return (f'<div style="flex: 1 1 0; background: {bg}; color: {fg}; border-radius: 12px; padding: 10px 6px; text-align: center">'
            f'<div style="font-size: 11px; opacity: 0.8; font-weight: 700">{label}</div>'
            f'<div style="font-family: {HEAD}; font-size: 22px; font-weight: 600">{val}</div></div>')


def sign(t):
    return f'<div style="font-family: {HEAD}; font-size: 18px; font-weight: 600; color: #B8C3DB">{t}</div>'


hist = [("30 Sep", 50, 20, 10, 60), ("29 Sep", 58, 0, 8, 50), ("28 Sep", 46, 20, 8, 58), ("27 Sep", 55, 0, 9, 46), ("26 Sep", 40, 25, 10, 55)]
hist_rows = "".join(
    f'<div style="display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; padding: 10px 0; border-top: 1px solid {LINE}; font-size: 14px">'
    f'<span style="font-weight: 700">{d}</span><span>{o}</span><span style="color: {GREEN}">+{i}</span><span style="color: {RED}">−{x}</span><span style="font-weight: 700">{c}</span></div>'
    for d, o, i, x, c in hist)

S["ProductDetail"] = ("Product detail", 1080, topbar("Rice 50kg", "Inventory.dc.html", sub="Unit: bag · Alert below 15", sync=None,
    right=f'<a href="#" aria-label="Edit product" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center">{ic("pen", 20)}</a>') + main(f'''
<section style="background: {NAVY}; color: #FFFFFF; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 12px">
<div style="display: flex; justify-content: space-between; align-items: center"><div style="font-weight: 700">Today's stock</div><span style="font-size: 12px; color: #B8C3DB">Worked out for you</span></div>
<div style="display: flex; align-items: center; gap: 4px">
{eq_box("OPENING", "50", "#24365F", "#FFFFFF")}{sign("+")}{eq_box("RECEIVED", "20", "#24365F", "#FFFFFF")}{sign("−")}{eq_box("DELIVERED", "10", "#24365F", "#FFFFFF")}{sign("=")}{eq_box("CLOSING", "60", ORANGE, NAVY)}
</div>
<div style="font-size: 12px; color: #B8C3DB">Tonight's closing stock (60) becomes tomorrow's opening stock.</div>
</section>
{card(h2("Price & profit") + grid([stat("Cost price", "₦68,000", "per bag"), stat("Selling price", "₦75,000", "per bag"), stat("Profit per bag", "₦7,000", "10.3% margin", "up"), stat("Profit today", "₦70,000", "10 bags sold", "up")]))}
{card(h2("Last 5 days", link("Full history", "DailyRecord.dc.html")) + f"""
<div style="display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; font-size: 12px; color: {MUTED}; font-weight: 700"><span>Day</span><span>Open</span><span>In</span><span>Out</span><span>Close</span></div>{hist_rows}""", gap=6)}
<div style="display: flex; gap: 10px">{btn("Receive stock", "ReceiveStock.dc.html", "accent", "plus")}{btn("Sell", "NewSale.dc.html", "primary", "cart")}</div>
'''))

S["ReceiveStock"] = ("Receive stock", 900, topbar("Receive stock", "Inventory.dc.html", sync="offline") + main(f'''
{field("Product", "Rice 50kg", icon="box", select=True, fid="rs-product")}
<div style="display: flex; flex-direction: column; gap: 6px">
<label for="rs-qty" style="font-size: 13px; font-weight: 700">Quantity received</label>
<div style="display: flex; align-items: center; gap: 10px">
<button type="button" aria-label="Less" style="width: 52px; height: 52px; border-radius: 14px; border: 1px solid #C9CFDB; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{ic("minus", 22)}</button>
<input id="rs-qty" value="20" style="flex-grow: 1; min-width: 0; height: 52px; box-sizing: border-box; text-align: center; border: 1px solid #C9CFDB; border-radius: 14px; font-family: {HEAD}; font-size: 24px; font-weight: 600; color: {NAVY}">
<button type="button" aria-label="More" style="width: 52px; height: 52px; border-radius: 14px; border: 1px solid #C9CFDB; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{ic("plus", 22)}</button>
</div></div>
<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; background: {GREEN_BG}; color: {GREEN}; font-weight: 700; font-size: 14px">
<span>Stock now 50 bags</span>{ic("chev", 18, GREEN)}<span>After this: 70 bags</span></div>
{field("Cost price per bag", "₦68,000", fid="rs-cost", helper="Last time: ₦68,000")}
{field("Supplier (optional)", "", "Who brought it?", icon="truck", fid="rs-supplier")}
{field("Date received", "Today, 30 Sep 2026", icon="calendar", fid="rs-date")}
{card(kv("Total cost", "₦1,360,000", True), pad=14)}
<div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px">{btn("Save stock", "ProductDetail.dc.html", "accent", "check")}
<div style="font-size: 12px; color: {MUTED}; text-align: center">Saved on this phone first. Uploads when you're online.</div></div>
'''))

# ---------------- Daily record ----------------
def daychip(d, n, on=False, closed=True):
    st = f"background: {NAVY}; color: #FFFFFF" if on else f"background: #FFFFFF; color: {NAVY}; border: 1px solid {LINE}"
    mark = ic("check", 12, GREEN if not on else "#FFFFFF", 2.5) if closed else f'<span style="width: 6px; height: 6px; border-radius: 99px; background: {ORANGE}"></span>'
    return (f'<button type="button" style="flex: 1 1 0; min-height: 64px; border-radius: 14px; border: 0; {st}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px">'
            f'<span style="font-size: 11px; font-weight: 700; opacity: 0.8">{d}</span><span style="font-size: 17px; font-weight: 700">{n}</span>{mark}</button>')


per_prod = "".join(
    f'<div style="display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr; padding: 9px 0; border-top: 1px solid {LINE}; font-size: 13px">'
    f'<span style="font-weight: 700">{p[0].split(" (")[0]}</span><span>{p[2]}</span><span style="color: {GREEN}">+{p[3]}</span><span style="color: {RED}">−{p[4]}</span><span style="font-weight: 700">{p[5]}</span></div>'
    for p in PRODUCTS)

S["DailyRecord"] = ("Daily record", 1250, topbar("Daily record", "More.dc.html", sync="offline", right=f'<a href="#" aria-label="Pick a date" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center">{ic("calendar", 22)}</a>') + main(f'''
<div style="display: flex; gap: 6px">{daychip("THU", "24")}{daychip("FRI", "25")}{daychip("SAT", "26")}{daychip("SUN", "27")}{daychip("MON", "28")}{daychip("TUE", "29")}{daychip("WED", "30", True, False)}</div>
<div style="display: flex; align-items: center; justify-content: space-between"><div style="font-family: {HEAD}; font-size: 18px; font-weight: 600">Wednesday, 30 Sep</div>{badge("Day open", "amber")}</div>
{card(h2("What came in, what went out") + grid([stat("Received", "+120", "units"), stat("Delivered", "−64", "units"), stat("Remaining", "695", "units")], 3, 8))}
{card(h2("Money") + kv("Total sales", "₦2,566,000", True) + kv("Cost of goods sold", "₦2,328,000") + kv("Expenses", "₦41,500") + f'<div style="border-top: 1px solid {LINE}"></div>' + kv("Profit", "₦196,500", True, GREEN) + kv("Still owed by customers", "₦615,000", True, ORANGE_TXT), gap=10)}
{card(h2("Deliveries") + grid([stat("Completed", "13"), stat("Pending", "5", "carry over if not done", "amber")]))}
{card(h2("Stock by product") + f"""<div style="display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr; font-size: 12px; color: {MUTED}; font-weight: 700"><span>Product</span><span>Open</span><span>In</span><span>Out</span><span>Close</span></div>{per_prod}""", gap=4)}
{btn("Review and close day", "CloseDay.dc.html", "primary", "clip")}
'''))

carry = "".join(
    f'<div style="display: flex; justify-content: space-between; padding: 9px 0; border-top: 1px solid {LINE}; font-size: 14px"><span>{p[0]}</span>'
    f'<span style="display: flex; align-items: center; gap: 6px; font-weight: 700">{p[5]} {ic("chev", 14, MUTED)} {p[5]}</span></div>'
    for p in PRODUCTS[:5])

S["CloseDay"] = ("Close the day", 960, topbar("Close 30 Sep", "DailyRecord.dc.html", sync="offline") + main(f'''
<div style="font-size: 15px; line-height: 1.5">Closing locks today's record. Tonight's closing stock is copied into tomorrow as opening stock.</div>
{card(h2("Check before closing") +
      row(icon_tile("truck"), "5 deliveries still pending", "They move to 1 Oct automatically", border=False) +
      row(icon_tile("cloudup"), "3 records not uploaded yet", "Fine — they'll sync later") +
      row(icon_tile("check", GREEN_BG, GREEN), "All sales have a rider", "Nothing missing"), gap=0)}
{card(h2("Carry over to tomorrow") + f"""<div style="display: flex; justify-content: space-between; font-size: 12px; color: {MUTED}; font-weight: 700"><span>Product</span><span>Close today → Open 1 Oct</span></div>{carry}
<div style="font-size: 13px; color: {MUTED}; padding-top: 8px">+ 2 more products</div>""", gap=4)}
<div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px">
{btn("Close 30 Sep and start 1 Oct", "Dashboard.dc.html", "accent", "check")}
<div style="font-size: 12px; color: {MUTED}; text-align: center">Only Admin can reopen a closed day. Every change is logged.</div></div>
'''))

# ---------------- Sales ----------------
def sale_card(no, cust, items, amt, rider, dstat, pay, owe=None, unsynced=False, first=False):
    dk = {"Delivered": "green", "Pending": "amber", "On the way": "blue"}[dstat]
    pk = {"Paid": "green", "Unpaid": "red", "Part paid": "amber"}[pay]
    o = f'<span style="font-size: 13px; color: {RED}; font-weight: 700">Owes {owe}</span>' if owe else ""
    u = pending_dot() if unsynced else ""
    return (f'<a href="CustomerProfile.dc.html" style="display: flex; flex-direction: column; gap: 8px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; padding: 14px; color: {NAVY}">'
            f'<div style="display: flex; justify-content: space-between; align-items: center"><span style="font-size: 12px; color: {MUTED}; font-weight: 700">{no}</span>{u}{badge(dstat, dk)}</div>'
            f'<div style="display: flex; justify-content: space-between; gap: 8px"><div><div style="font-weight: 700; font-size: 16px">{cust}</div><div style="font-size: 13px; color: {MUTED}">{items}</div></div>'
            f'<div style="font-family: {HEAD}; font-size: 17px; font-weight: 600; white-space: nowrap">{amt}</div></div>'
            f'<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid {LINE}">'
            f'<span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: {MUTED}">{ic("bike", 16)}{rider}</span>'
            f'<span style="display: flex; align-items: center; gap: 8px">{o}{badge(pay, pk)}</span></div></a>')


S["Sales"] = ("Sales and deliveries", 1060, topbar("Sales & deliveries", sync="offline") + main(f'''
{segmented(["Sales", "Deliveries", "Payments"], "Sales")}
<div style="display: flex; align-items: center; gap: 8px"><button type="button" style="display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid {LINE}; background: #FFFFFF; font-weight: 700; font-size: 14px">{ic("calendar", 18)}Today, 30 Sep{ic("down", 16)}</button>
<button type="button" style="display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid {LINE}; background: #FFFFFF; font-weight: 700; font-size: 14px">{ic("filter", 16)}All riders</button></div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{stat("Sales", "18")}{stat("Value", "₦2.57m")}{stat("Owed", "₦615k", "", None)}</div>
{sale_card("#S-0930-18 · 11:05", "Mama Ngozi Stores", "Rice 50kg × 3", "₦225,000", "Emeka · Bike 1", "Pending", "Unpaid", "₦225,000", True)}
{sale_card("#S-0930-17 · 10:40", "Balogun Supermarket", "Sugar 50kg × 5", "₦335,000", "Sadiq · Bike 2", "Delivered", "Paid")}
{sale_card("#S-0930-16 · 10:12", "Alhaji Musa Ventures", "Vegetable oil 25L × 6", "₦255,000", "Tolu · Bike 3", "On the way", "Part paid", "₦150,000")}
{sale_card("#S-0930-15 · 09:30", "Grace Mini Mart", "Noodles × 20", "₦220,000", "Chinedu · Bike 4", "Delivered", "Part paid", "₦170,000")}
''') + fab("NewSale.dc.html", "New sale") + tabbar("admin", "Sales"))

S["NewSale"] = ("New sale", 1120, topbar("New sale", "Sales.dc.html", sync="offline") + main(f'''
<div style="display: flex; flex-direction: column; gap: 6px">
{field("Customer", "Mama Ngozi Stores", icon="user", select=True, fid="ns-cust")}
<div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: {ORANGE_TXT}; font-weight: 700">{ic("alert", 16, ORANGE_TXT)}Already owes ₦0 · Buys on credit sometimes</div></div>
{card(h2("Items", link("+ Add product", "#")) + f"""
<div style="display: flex; align-items: center; gap: 12px">{icon_tile("box", "#EEF1F8", NAVY)}
<div style="flex-grow: 1"><div style="font-weight: 700">Rice 50kg</div><div style="font-size: 12px; color: {MUTED}">₦75,000 each · 60 in stock</div></div>
<div style="display: flex; align-items: center; gap: 4px; border: 1px solid #C9CFDB; border-radius: 12px">
<button type="button" aria-label="Less" style="width: 40px; height: 40px; border: 0; background: transparent; display: flex; align-items: center; justify-content: center">{ic("minus", 18)}</button>
<span style="min-width: 20px; text-align: center; font-weight: 700; font-size: 16px">3</span>
<button type="button" aria-label="More" style="width: 40px; height: 40px; border: 0; background: transparent; display: flex; align-items: center; justify-content: center">{ic("plus", 18)}</button></div></div>
<div style="display: flex; justify-content: space-between; font-size: 14px; padding-top: 10px; border-top: 1px solid {LINE}"><span style="color: {MUTED}">3 × ₦75,000</span><b>₦225,000</b></div>""")}
{card(h2("Delivery") + field("Rider & bike", "Emeka Obi · Bike 1 (LAG-234KJA)", icon="bike", select=True, fid="ns-rider") + field("Deliver on", "Today, 30 Sep", icon="calendar", fid="ns-date") + field("Delivery address", "Shop 14, [Market name], Lagos", icon="pin", fid="ns-addr"))}
{card(h2("Payment") + segmented(["Paid in full", "Part paid", "Not paid"], "Not paid") + field("Amount paid now", "₦0", fid="ns-paid") +
      f'<div style="border-top: 1px solid {LINE}"></div>' + kv("Total", "₦225,000", True) + kv("Paid", "₦0") + kv("Customer will owe", "₦225,000", True, RED), gap=10)}
{btn("Save sale", "Sales.dc.html", "accent", "check")}
'''))

# ---------------- Customers ----------------
def cust_row(init, name, phone, owes, first=False):
    r = badge("Owes " + owes, "red") if owes else badge("Paid up", "green")
    return row(avatar(init), name, phone, "", r, "CustomerProfile.dc.html", border=not first)


S["Customers"] = ("Customers", 900, topbar("Customers", sync="offline", right=f'<a href="#" aria-label="Add customer" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid {LINE}">{ic("plus", 22)}</a>') + main(f'''
{searchbar("Search name or phone")}
<section style="background: {NAVY}; color: #FFFFFF; border-radius: 18px; padding: 16px; display: flex; justify-content: space-between; align-items: center">
<div><div style="font-size: 13px; color: #B8C3DB">Customers owe you</div><div style="font-family: {HEAD}; font-size: 26px; font-weight: 700">₦615,000</div></div>
<div style="text-align: right"><div style="font-size: 13px; color: #B8C3DB">Owing</div><div style="font-weight: 700; font-size: 18px">4 of 32</div></div></section>
{chips(["All", "Owing", "Paid up"], "All")}
{card(cust_row("MN", "Mama Ngozi Stores", "0803 111 2233", "₦225,000", True) + cust_row("GM", "Grace Mini Mart", "0816 222 3344", "₦170,000") +
      cust_row("AM", "Alhaji Musa Ventures", "0706 555 6677", "₦150,000") + cust_row("OK", "Okafor & Sons", "0809 444 1100", "₦70,000") +
      cust_row("BS", "Balogun Supermarket", "0812 345 6789", None) + cust_row("TF", "Tunde Foods", "0805 888 7766", None), pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")}
''') + tabbar("admin", "Customers"))

S["CustomerProfile"] = ("Customer profile", 1120, topbar("Mama Ngozi Stores", "Customers.dc.html", sub="Customer since Jan 2026", sync="offline") + main(f'''
<div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: {MUTED}">
<span style="display: flex; align-items: center; gap: 8px">{ic("phone", 16)}0803 111 2233</span>
<span style="display: flex; align-items: center; gap: 8px">{ic("pin", 16)}Shop 14, [Market name], Lagos</span></div>
<section style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 18px; overflow: hidden; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))">
<div style="padding: 14px 12px"><div style="font-size: 12px; color: {MUTED}; font-weight: 700">BOUGHT</div><div style="font-family: {HEAD}; font-size: 17px; font-weight: 600">₦1,870,000</div></div>
<div style="padding: 14px 12px; border-left: 1px solid {LINE}"><div style="font-size: 12px; color: {MUTED}; font-weight: 700">PAID</div><div style="font-family: {HEAD}; font-size: 17px; font-weight: 600; color: {GREEN}">₦1,645,000</div></div>
<div style="padding: 14px 12px; border-left: 1px solid {LINE}; background: {RED_BG}"><div style="font-size: 12px; color: {RED}; font-weight: 700">OWES</div><div style="font-family: {HEAD}; font-size: 17px; font-weight: 600; color: {RED}">₦225,000</div></div>
</section>
<div style="display: flex; gap: 8px">{btn("Record payment", None, "accent", "wallet")}{btn("New sale", "NewSale.dc.html", "ghost", "cart")}</div>
{segmented(["History", "Products", "Payments"], "History")}
{card(
    row(icon_tile("cart"), "Rice 50kg × 3", "30 Sep · #S-0930-18 · Emeka", "₦225,000", f'<span style="font-size: 12px; color: {RED}; font-weight: 700">Balance ₦225,000</span>', border=False) +
    row(icon_tile("wallet", GREEN_BG, GREEN), "Payment · Transfer", "27 Sep · received by Kemi", "−₦300,000", f'<span style="font-size: 12px; color: {MUTED}; font-weight: 700">Balance ₦0</span>') +
    row(icon_tile("cart"), "Sugar 50kg × 3 · Noodles × 4", "25 Sep · #S-0925-07 · Sadiq", "₦245,000", f'<span style="font-size: 12px; color: {MUTED}; font-weight: 700">Balance ₦300,000</span>') +
    row(icon_tile("wallet", GREEN_BG, GREEN), "Payment · Cash", "22 Sep · collected by Tolu", "−₦150,000", f'<span style="font-size: 12px; color: {MUTED}; font-weight: 700">Balance ₦55,000</span>'), pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")}
{card(h2("Most bought") + kv("Rice 50kg", "18 bags · ₦1,350,000") + kv("Sugar 50kg", "6 bags · ₦402,000") + kv("Tomato paste", "4 cartons · ₦74,000") + kv("Noodles", "4 cartons · ₦44,000"), gap=10)}
'''))

from lib import *

S = {}

PRODUCTS = [
    # name, unit, open, in, out, close, low
    ("Mullein herbal tea", "boxes", 40, 24, 9, 55, False),
    ("Orafix Power Duo", "packs", 36, 0, 8, 28, False),
    ("Fibnova", "packs", 30, 20, 7, 43, False),
    ("Sabana Pro", "bottles", 25, 0, 6, 19, False),
    ("Kidney Support tea", "boxes", 22, 0, 5, 17, False),
    ("Prostdesx", "bottles", 18, 12, 2, 28, False),
    ("5 Vitamin C", "bottles", 12, 0, 4, 8, True),
    ("Glow Serum", "bottles", 6, 0, 3, 3, True),
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


S["Inventory"] = ("Inventory", 1010, topbar("Stock", sync="offline", right=f'<a href="#" aria-label="Add product" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid {LINE}">{ic("plus", 22)}</a>') + main(f'''
{seglinks([("In store", "Inventory.dc.html"), ("Received", "StockReceived.dc.html")], "In store")}
{searchbar("Search products")}
{chips(["All (27)", "Low stock (3)", "Capsules", "Teas", "Skin care"], "All (27)")}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: {MUTED}">Received</div><div style="font-weight: 700; color: {GREEN}">+66</div></div>
<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: {MUTED}">Delivered</div><div style="font-weight: 700; color: {RED}">−56</div></div>
<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: {MUTED}">In store now</div><div style="font-weight: 700">612</div></div></div>
{card("".join(prod_row(p, k == 0) for k, p in enumerate(PRODUCTS)) + f'<div style="padding: 12px 0; border-top: 1px solid {LINE}; font-size: 13px; font-weight: 700; color: {MUTED}; text-align: center">+ 19 more products</div>', pad=14, gap=0, extra="; padding-top: 4px; padding-bottom: 4px")}
''') + fab("ReceiveStock.dc.html", "Receive stock") + tabbar("admin", "Stock"))


def eq_box(label, val, bg="#FFFFFF", fg=NAVY):
    return (f'<div style="flex: 1 1 0; background: {bg}; color: {fg}; border-radius: 12px; padding: 10px 6px; text-align: center">'
            f'<div style="font-size: 11px; opacity: 0.8; font-weight: 700">{label}</div>'
            f'<div style="font-family: {HEAD}; font-size: 22px; font-weight: 600">{val}</div></div>')


def sign(t):
    return f'<div style="font-family: {HEAD}; font-size: 18px; font-weight: 600; color: #B8C3DB">{t}</div>'


hist = [("30 Sep", 40, 24, 9, 55), ("29 Sep", 47, 0, 7, 40), ("28 Sep", 38, 15, 6, 47), ("27 Sep", 45, 0, 7, 38), ("26 Sep", 50, 0, 5, 45)]
hist_rows = "".join(
    f'<div style="display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; padding: 10px 0; border-top: 1px solid {LINE}; font-size: 14px">'
    f'<span style="font-weight: 700">{d}</span><span>{o}</span><span style="color: {GREEN}">+{i}</span><span style="color: {RED}">−{x}</span><span style="font-weight: 700">{c}</span></div>'
    for d, o, i, x, c in hist)

S["ProductDetail"] = ("Product detail", 1280, topbar("Mullein herbal tea", "Inventory.dc.html", sub="Herbal teas · Box of 20 tea bags", sync=None,
    right=f'<a href="#" aria-label="Edit product" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center">{ic("pen", 20)}</a>') + main(f'''
<section style="background: {NAVY}; color: #FFFFFF; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 12px">
<div style="display: flex; justify-content: space-between; align-items: center"><div style="font-weight: 700">Today's stock</div><span style="font-size: 12px; color: #B8C3DB">Worked out for you</span></div>
<div style="display: flex; align-items: center; gap: 4px">
{eq_box("OPENING", "40", "#24365F", "#FFFFFF")}{sign("+")}{eq_box("RECEIVED", "24", "#24365F", "#FFFFFF")}{sign("−")}{eq_box("DELIVERED", "9", "#24365F", "#FFFFFF")}{sign("=")}{eq_box("CLOSING", "55", ORANGE, NAVY)}
</div>
<div style="font-size: 12px; color: #B8C3DB">Tonight's closing stock (55) becomes tomorrow's opening stock.</div>
</section>
{card(h2("Price & profit") + grid([stat("Cost price", "₦14,000", "per box"), stat("Selling price", "₦21,500", "per box"), stat("Profit per box", "₦7,500", "34.9% margin", "up"), stat("Profit today", "₦67,500", "9 boxes sold", "up")]))}
{card(h2("Product info") + kv("NAFDAC reg. no.", "A7-101802L", True) + kv("Supplier", "Bioharb") + kv("Nearest expiry", "Mar 2028 · batch MT-0924") + kv("Warn me below", "10 boxes"), gap=10)}
{card(h2("Last 5 days", link("Full history", "DailyRecord.dc.html")) + f"""
<div style="display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; font-size: 12px; color: {MUTED}; font-weight: 700"><span>Day</span><span>Open</span><span>In</span><span>Out</span><span>Close</span></div>{hist_rows}""", gap=6)}
<div style="display: flex; gap: 10px">{btn("Receive stock", "ReceiveStock.dc.html", "accent", "plus")}{btn("Sell", "NewSale.dc.html", "primary", "cart")}</div>
'''))

S["ReceiveStock"] = ("Receive stock", 1000, topbar("Receive stock", "Inventory.dc.html", sync="offline") + main(f'''
{field("Product", "Mullein herbal tea", icon="box", select=True, fid="rs-product")}
<div style="display: flex; flex-direction: column; gap: 6px">
<label for="rs-qty" style="font-size: 13px; font-weight: 700">Quantity received</label>
<div style="display: flex; align-items: center; gap: 10px">
<button type="button" aria-label="Less" style="width: 52px; height: 52px; border-radius: 14px; border: 1px solid #C9CFDB; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{ic("minus", 22)}</button>
<input id="rs-qty" value="24" style="flex-grow: 1; min-width: 0; height: 52px; box-sizing: border-box; text-align: center; border: 1px solid #C9CFDB; border-radius: 14px; font-family: {HEAD}; font-size: 24px; font-weight: 600; color: {NAVY}">
<button type="button" aria-label="More" style="width: 52px; height: 52px; border-radius: 14px; border: 1px solid #C9CFDB; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{ic("plus", 22)}</button>
</div></div>
<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; background: {GREEN_BG}; color: {GREEN}; font-weight: 700; font-size: 14px">
<span>Stock now 40 boxes</span>{ic("chev", 18, GREEN)}<span>After this: 64 boxes</span></div>
{field("Cost price per box", "₦14,000", fid="rs-cost", helper="Last time: ₦14,000")}
{field("Supplier", "Bioharb", icon="truck", select=True, fid="rs-supplier")}
{grid([field("Batch no.", "MT-0930", fid="rs-batch"), field("Expiry date", "Sep 2028", icon="calendar", fid="rs-exp")], 2, 10)}
{field("Date received", "Today, 30 Sep 2026", icon="calendar", fid="rs-date")}
{card(kv("Total cost", "₦336,000", True), pad=14)}
<div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px">{btn("Save stock", "StockReceived.dc.html", "accent", "check")}
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
    f'<span style="font-weight: 700">{p[0].replace(" herbal tea", "").replace(" Power Duo", "").replace(" tea", "")}</span><span>{p[2]}</span><span style="color: {GREEN}">+{p[3]}</span><span style="color: {RED}">−{p[4]}</span><span style="font-weight: 700">{p[5]}</span></div>'
    for p in PRODUCTS)

S["DailyRecord"] = ("Daily record", 1560, topbar("Daily record", "More.dc.html", sync="offline", right=f'<a href="#" aria-label="Pick a date" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center">{ic("calendar", 22)}</a>') + main(f'''
<div style="display: flex; gap: 6px">{daychip("THU", "24")}{daychip("FRI", "25")}{daychip("SAT", "26")}{daychip("SUN", "27")}{daychip("MON", "28")}{daychip("TUE", "29")}{daychip("WED", "30", True, False)}</div>
<div style="display: flex; align-items: center; justify-content: space-between"><div style="font-family: {HEAD}; font-size: 18px; font-weight: 600">Wednesday, 30 Sep</div>{badge("Day open", "amber")}</div>
{card(h2("What came in, what went out") + grid([stat("Received", "+66", "units"), stat("Delivered", "−56", "units"), stat("Remaining", "612", "units")], 3, 8))}
{card(h2("Money") + kv("Total sales", "₦1,204,000", True) + kv("Cost of goods sold", "₦784,000") + kv("Expenses", "₦41,500") + f'<div style="border-top: 1px solid {LINE}"></div>' + kv("Profit", "₦378,500", True, GREEN), gap=10)}
{card(h2("Deliveries", link("Delivered orders", "Deliveries.dc.html")) + grid([stat("Completed", "13"), stat("Pending", "5", "carry over if not done", "amber")]))}
{card(h2("Rider earnings", link("By day", "RiderEarnings.dc.html")) + kv("Emeka Obi · 3 deliveries", "₦15,000") + kv("Sadiq Bello · 4 deliveries", "₦20,000") + kv("Tolu Ade · 4 deliveries", "₦20,000") + kv("Chinedu Eze · 2 deliveries", "₦10,000") + f'<div style="border-top: 1px solid {LINE}"></div>' + kv("All riders", "₦65,000", True), gap=10)}
{card(h2("Stock by product") + f"""<div style="display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr; font-size: 12px; color: {MUTED}; font-weight: 700"><span>Product</span><span>Open</span><span>In</span><span>Out</span><span>Close</span></div>{per_prod}<div style="padding-top: 9px; border-top: 1px solid {LINE}; font-size: 13px; color: {MUTED}">+ 19 more products</div>""", gap=4)}
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
<div style="font-size: 13px; color: {MUTED}; padding-top: 8px">+ 22 more products</div>""", gap=4)}
<div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px">
{btn("Close 30 Sep and start 1 Oct", "Dashboard.dc.html", "accent", "check")}
<div style="font-size: 12px; color: {MUTED}; text-align: center">Only Admin can reopen a closed day. Every change is logged.</div></div>
'''))

# ---------------- Sales ----------------
def sale_card(no, cust, area, items, amt, rider, dstat, pay, unsynced=False, href="CustomerProfile.dc.html"):
    dk = {"Delivered": "green", "Pending": "amber", "On the way": "blue"}[dstat]
    pk = {"Paid · Transfer": "green", "Pay on delivery": "blue", "Paid · Cash": "green"}[pay]
    u = pending_dot() if unsynced else ""
    return (f'<a href="{href}" style="display: flex; flex-direction: column; gap: 8px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; padding: 14px; color: {NAVY}">'
            f'<div style="display: flex; justify-content: space-between; align-items: center"><span style="font-size: 12px; color: {MUTED}; font-weight: 700">{no}</span>{u}{badge(dstat, dk)}</div>'
            f'<div style="display: flex; justify-content: space-between; gap: 8px"><div><div style="font-weight: 700; font-size: 16px">{cust}</div>'
            f'<div style="display: flex; align-items: center; gap: 4px; font-size: 13px; color: {MUTED}">{ic("pin", 14)}{area}</div>'
            f'<div style="font-size: 13px; color: {MUTED}">{items}</div></div>'
            f'<div style="font-family: {HEAD}; font-size: 17px; font-weight: 600; white-space: nowrap">{amt}</div></div>'
            f'<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid {LINE}">'
            f'<span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: {MUTED}">{ic("bike", 16)}{rider}</span>{badge(pay, pk)}</div></a>')


FILTER_BTN = f'display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid {LINE}; background: #FFFFFF; font-weight: 700; font-size: 14px'

S["Sales"] = ("Sales and deliveries", 1120, topbar("Sales & deliveries", sync="offline") + main(
    seglinks([("All orders", "Sales.dc.html"), ("Delivered", "Deliveries.dc.html")], "All orders")
    + f'<div style="display: flex; align-items: center; gap: 8px"><button type="button" style="{FILTER_BTN}">{ic("calendar", 18)}Today, 30/09/2026{ic("down", 16)}</button>'
    + f'<button type="button" style="{FILTER_BTN}">{ic("filter", 16)}All riders</button></div>'
    + f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{stat("Orders", "18")}{stat("Value", "₦1.20m")}{stat("Delivered", "13", "5 pending", "amber")}</div>'
    + sale_card("#S-0930-18 · 11:05", "Grace Herbal Store", "Rumuola", "Mullein herbal tea × 6", "₦129,000", "Emeka · Bike 1", "Pending", "Pay on delivery", True)
    + sale_card("#S-0930-17 · 10:40", "Wellness Pharmacy", "GRA Phase 2", "Orafix × 4 · Sabana Pro × 4", "₦172,000", "Sadiq · Bike 2", "Delivered", "Paid · Transfer", href="DeliveryProof.dc.html")
    + sale_card("#S-0930-16 · 10:12", "Divine Health Store", "Trans-Amadi", "Fibnova × 5", "₦107,500", "Tolu · Bike 3", "On the way", "Pay on delivery")
    + sale_card("#S-0930-15 · 09:30", "Mama Chioma Chemist", "Mile 1", "Kidney Support tea × 5", "₦107,500", "Chinedu · Bike 4", "Delivered", "Paid · Cash", href="DeliveryProof.dc.html")
) + fab("NewSale.dc.html", "New sale") + tabbar("admin", "Sales"))

STEP_BTN = 'width: 40px; height: 40px; border: 0; background: transparent; display: flex; align-items: center; justify-content: center'
ITEM = (f'<div style="display: flex; align-items: center; gap: 12px">{icon_tile("box", "#EEF1F8", NAVY)}'
        f'<div style="flex-grow: 1"><div style="font-weight: 700">Mullein herbal tea</div><div style="font-size: 12px; color: {MUTED}">₦21,500 each · 55 in stock</div></div>'
        f'<div style="display: flex; align-items: center; gap: 4px; border: 1px solid #C9CFDB; border-radius: 12px">'
        f'<button type="button" aria-label="Less" style="{STEP_BTN}">{ic("minus", 18)}</button>'
        f'<span style="min-width: 20px; text-align: center; font-weight: 700; font-size: 16px">6</span>'
        f'<button type="button" aria-label="More" style="{STEP_BTN}">{ic("plus", 18)}</button></div></div>'
        f'<div style="display: flex; justify-content: space-between; font-size: 14px; padding-top: 10px; border-top: 1px solid {LINE}"><span style="color: {MUTED}">6 × ₦21,500</span><b>₦129,000</b></div>')

S["NewSale"] = ("New sale", 1100, topbar("New sale", "Sales.dc.html", sync="offline") + main(
    field("Customer", "Grace Herbal Store", icon="user", select=True, fid="ns-cust")
    + card(h2("Items", link("+ Add product", "#")) + ITEM)
    + card(h2("Delivery") + note("Last delivered to this customer by <b>Emeka Obi (Bike 1)</b> on 25/09/2026. Same rider picked for you.", "bike", "blue")
           + field("Rider & bike", "Emeka Obi · Bike 1 (PHC-234KA)", icon="bike", select=True, fid="ns-rider")
           + field("Deliver on", "Today, 30/09/2026", icon="calendar", fid="ns-date")
           + field("Delivery area & address", "Rumuola · Rumuola Road, Port Harcourt", icon="pin", fid="ns-addr"))
    + card(h2("Payment") + segmented(["Paid by transfer", "Pay on delivery"], "Pay on delivery")
           + f'<div style="border-top: 1px solid {LINE}"></div>' + kv("Total", "₦129,000", True) + kv("Rider collects on delivery", "₦129,000", True, BLUE), gap=10)
    + btn("Save sale", "Sales.dc.html", "accent", "check")
))


# ---------------- Customers ----------------
def cust_row(init, name, sub, last, first=False):
    return row(avatar(init), name, sub, "", f'<span style="font-size: 12px; color: {MUTED}">Last order {last}</span>', "CustomerProfile.dc.html", border=not first)


S["Customers"] = ("Customers", 860, topbar("Customers", sync="offline", right=f'<a href="#" aria-label="Add customer" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid {LINE}">{ic("plus", 22)}</a>') + main(
    searchbar("Search name, phone or area")
    + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{stat("Customers", "32")}{stat("Ordered this week", "21")}</div>'
    + chips(["All", "This week", "By area"], "All")
    + card(cust_row("GH", "Grace Herbal Store", "Rumuola · 0803 111 2233", "30/09", True) + cust_row("WP", "Wellness Pharmacy", "GRA Phase 2 · 0812 345 6789", "30/09")
           + cust_row("DH", "Divine Health Store", "Trans-Amadi · 0816 222 3344", "30/09") + cust_row("MC", "Mama Chioma Chemist", "Mile 1 · 0706 555 6677", "30/09")
           + cust_row("BI", "Blessing Ibe", "Rumuokoro · 0809 444 1100", "30/09") + cust_row("PC", "Peace Chemist", "Eleme · 0805 888 7766", "29/09"),
           pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")
) + tabbar("admin", "Customers"))


def dhist(date, items, rider, area, status="Delivered", first=False):
    k = "green" if status == "Delivered" else "amber"
    bd = "" if first else f"border-top: 1px solid {LINE}; "
    return (f'<a href="DeliveryProof.dc.html" style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; {bd}color: {NAVY}">'
            f'<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 15px">{date}</b>{badge(status, k)}</div>'
            f'<div style="font-size: 14px">{items}</div>'
            f'<div style="display: flex; gap: 12px; font-size: 13px; color: {MUTED}"><span style="display: flex; align-items: center; gap: 4px">{ic("bike", 15)}{rider}</span>'
            f'<span style="display: flex; align-items: center; gap: 4px">{ic("pin", 15)}{area}</span></div></a>')


TRI = 'padding: 14px 12px'
S["CustomerProfile"] = ("Customer profile", 1180, topbar("Grace Herbal Store", "Customers.dc.html", sub="Customer since Jan 2026", sync="offline") + main(
    f'<div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: {MUTED}">'
    f'<span style="display: flex; align-items: center; gap: 8px">{ic("phone", 16)}0803 111 2233</span>'
    f'<span style="display: flex; align-items: center; gap: 8px">{ic("pin", 16)}Rumuola · Rumuola Road, Port Harcourt</span></div>'
    f'<section style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 18px; overflow: hidden; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))">'
    f'<div style="{TRI}"><div style="font-size: 12px; color: {MUTED}; font-weight: 700">TOTAL BOUGHT</div><div style="font-family: {HEAD}; font-size: 17px; font-weight: 600">₦1,354,500</div></div>'
    f'<div style="{TRI}; border-left: 1px solid {LINE}"><div style="font-size: 12px; color: {MUTED}; font-weight: 700">ORDERS</div><div style="font-family: {HEAD}; font-size: 17px; font-weight: 600">14</div></div>'
    f'<div style="{TRI}; border-left: 1px solid {LINE}"><div style="font-size: 12px; color: {MUTED}; font-weight: 700">LAST ORDER</div><div style="font-family: {HEAD}; font-size: 17px; font-weight: 600">30/09</div></div></section>'
    f'<section style="background: {NAVY}; color: #FFFFFF; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px">'
    f'<div style="display: flex; align-items: center; gap: 12px">{avatar("EO", ORANGE, NAVY, 44)}<div style="flex-grow: 1"><div style="font-size: 12px; color: #B8C3DB">Usually delivered by</div>'
    f'<div style="font-weight: 700; font-size: 16px">Emeka Obi · Bike 1</div><div style="font-size: 12px; color: #B8C3DB">9 of 14 deliveries · last on 25/09/2026</div></div></div>'
    f'<a href="NewSale.dc.html" style="min-height: 48px; border-radius: 12px; background: {ORANGE}; color: {NAVY}; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px">{ic("truck", 20, NAVY)}New order with Emeka</a></section>'
    + f'<div style="display: flex; gap: 8px">{btn("Call", None, "ghost", "phone")}{btn("New order", "NewSale.dc.html", "ghost", "cart")}</div>'
    + card(h2("Delivery history")
           + dhist("30/09/2026", "Mullein herbal tea × 6 · ₦129,000", "Emeka · Bike 1", "Rumuola", "Pending", True)
           + dhist("25/09/2026", "Orafix × 4 · Fibnova × 4 · ₦172,000", "Emeka · Bike 1", "Rumuola")
           + dhist("22/09/2026", "Kidney Support tea × 4 · ₦86,000", "Tolu · Bike 3", "Rumuola")
           + dhist("15/09/2026", "Mullein herbal tea × 6 · ₦129,000", "Emeka · Bike 1", "Rumuola"), gap=0)
    + card(h2("Most bought") + kv("Mullein herbal tea", "24 boxes · ₦516,000") + kv("Orafix Power Duo", "15 packs · ₦322,500") + kv("Fibnova", "14 packs · ₦301,000") + kv("Kidney Support tea", "10 boxes · ₦215,000"), gap=10)
))

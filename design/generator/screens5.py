from lib import *

S = {}

# ---------------- Stock received: one page, grouped by date ----------------
def recv(name, qty, batch, who, first=False):
    bd = "" if first else f"border-top: 1px solid {LINE}; "
    return (f'<a href="ProductDetail.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 11px 0; {bd}color: {NAVY}">'
            f'{icon_tile("box", GREEN_BG, GREEN, 36)}<div style="flex-grow: 1; min-width: 0"><div style="font-weight: 700">{name}</div>'
            f'<div style="font-size: 12px; color: {MUTED}">{batch} · by {who}</div></div>'
            f'<div style="font-family: {HEAD}; font-size: 17px; font-weight: 600; color: {GREEN}">+{qty}</div></a>')


S["StockReceived"] = ("Stock received", 1360, topbar("Stock", sync="offline") + main(
    seglinks([("In store", "Inventory.dc.html"), ("Received", "StockReceived.dc.html")], "Received")
    + f'<div style="display: flex; gap: 8px"><div style="flex-grow: 1">{searchbar("Search product")}</div>'
      f'<button type="button" style="display: flex; align-items: center; gap: 6px; min-height: 48px; padding: 0 14px; border-radius: 12px; border: 1px solid {LINE}; background: #FFFFFF; font-weight: 700; font-size: 14px">{ic("calendar", 18)}Sep 2026</button></div>'
    + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{stat("Received this month", "412", "units", "up")}{stat("Deliveries from Bioharb", "9")}</div>'
    + datehead("30/09/2026", "Wednesday · Today", "66 units")
    + card(recv("Mullein herbal tea", 24, "Batch MT-0930 · exp 09/2028", "Bola", True) + recv("Fibnova", 20, "Batch FB-0930 · exp 06/2028", "Bola")
           + recv("Prostdesx", 12, "Batch PX-0930 · exp 08/2028", "Bola") + recv("Zemora tea", 10, "Batch ZT-0930 · exp 07/2028", "Kemi"), pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")
    + datehead("28/09/2026", "Monday", "57 units")
    + card(recv("Orafix Power Duo", 30, "Batch OF-0928 · exp 03/2028", "Bola", True) + recv("Mullein herbal tea", 15, "Batch MT-0928 · exp 09/2028", "Bola")
           + recv("Sootra", 12, "Batch ST-0928 · exp 05/2028", "Bola"), pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")
    + datehead("26/09/2026", "Saturday", "54 units")
    + card(recv("Sabana Pro", 24, "Batch SP-0926 · exp 04/2028", "Kemi", True) + recv("Kidney Support tea", 20, "Batch KS-0926 · exp 08/2028", "Kemi")
           + recv("Glow Serum", 10, "Batch GS-0926 · exp 02/2028", "Kemi"), pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")
    + f'<div style="font-size: 13px; color: {MUTED}; text-align: center; padding: 4px">Scroll for earlier dates</div>'
) + fab("ReceiveStock.dc.html", "Receive stock") + tabbar("admin", "Stock"))


# ---------------- Delivered orders ----------------
def done(no, time, cust, area, items, rider, recv_by, first=False):
    return (f'<a href="DeliveryProof.dc.html" style="display: flex; flex-direction: column; gap: 8px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; padding: 14px; color: {NAVY}">'
            f'<div style="display: flex; justify-content: space-between; align-items: center"><span style="font-size: 12px; color: {MUTED}; font-weight: 700">{no}</span>'
            f'{badge(ic("check", 12, GREEN, 3) + " Delivered " + time, "green")}</div>'
            f'<div><div style="font-weight: 700; font-size: 16px">{cust}</div><div style="font-size: 13px; color: {MUTED}">{items}</div></div>'
            f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding-top: 8px; border-top: 1px solid {LINE}; font-size: 13px; color: {MUTED}">'
            f'<span style="display: flex; align-items: center; gap: 4px">{ic("bike", 15)}{rider}</span>'
            f'<span style="display: flex; align-items: center; gap: 4px">{ic("pin", 15)}{area}</span>'
            f'<span style="display: flex; align-items: center; gap: 4px">{ic("user", 15)}{recv_by}</span>'
            f'<span style="display: flex; align-items: center; gap: 4px">{ic("camera", 15)}Photo &amp; signature</span></div></a>')


S["Deliveries"] = ("Delivered orders", 1300, topbar("Sales & deliveries", sync="offline") + main(
    seglinks([("All orders", "Sales.dc.html"), ("Delivered", "Deliveries.dc.html")], "Delivered")
    + searchbar("Customer, phone, area or order no.")
    + note("Customer says an order wasn't delivered? Search here. Every delivered order shows who delivered it, when, where, who received it, and the photo.", "shield", "blue")
    + chips(["All riders", "Emeka", "Sadiq", "Tolu", "Chinedu"], "All riders")
    + datehead("30/09/2026", "Today", "13 delivered")
    + done("#S-0930-17", "10:52", "Wellness Pharmacy", "GRA Phase 2", "Orafix × 4 · Sabana Pro × 4 · ₦172,000", "Sadiq · Bike 2", "Mr Kelechi", True)
    + done("#S-0930-14", "10:52", "Joy Pharmacy", "Choba", "Swanky × 3 · ₦64,500", "Emeka · Bike 1", "Joy (owner)")
    + done("#S-0930-15", "10:05", "Mama Chioma Chemist", "Mile 1", "Kidney Support tea × 5 · ₦107,500", "Chinedu · Bike 4", "Mama Chioma")
    + datehead("29/09/2026", "Tuesday", "15 delivered")
    + done("#S-0929-11", "16:20", "Mama Chioma Chemist", "Mile 1", "Devano × 4 · ₦86,000", "Emeka · Bike 1", "Ifeanyi (staff)")
    + f'<div style="font-size: 13px; color: {MUTED}; text-align: center; padding: 4px">Scroll for earlier dates</div>'
) + tabbar("admin", "Sales"))


# ---------------- Proof of one delivery ----------------
def step(time, text, done=True, last=False):
    dot = GREEN if done else "#C9CFDB"
    line = "" if last else f'<div style="position: absolute; left: 5px; top: 16px; bottom: -6px; width: 2px; background: {LINE}"></div>'
    return (f'<div style="position: relative; display: flex; gap: 12px; padding-bottom: 12px">{line}'
            f'<span style="width: 12px; height: 12px; border-radius: 99px; background: {dot}; margin-top: 4px; flex-shrink: 0"></span>'
            f'<div style="flex-grow: 1; display: flex; justify-content: space-between; gap: 8px; font-size: 14px"><span>{text}</span><span style="color: {MUTED}; font-weight: 700">{time}</span></div></div>')


PH = f'border-radius: 14px; background: {BG}; border: 1px solid {LINE}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: {MUTED}; font-size: 12px; font-weight: 700'

S["DeliveryProof"] = ("Delivery proof", 1300, topbar("#S-0930-17", "Deliveries.dc.html", sub="Wellness Pharmacy", sync="synced") + main(
    f'<section style="background: {GREEN_BG}; border: 1px solid #BFE3CD; border-radius: 18px; padding: 16px; display: flex; align-items: center; gap: 12px; color: {GREEN}">'
    f'{icon_tile("check", GREEN, "#FFFFFF", 48)}<div><div style="font-family: {HEAD}; font-size: 20px; font-weight: 600">Delivered</div>'
    f'<div style="font-size: 14px; font-weight: 500">30/09/2026 at 10:52 AM</div></div></section>'
    + card(h2("Order") + kv("Customer", "Wellness Pharmacy") + kv("Area", "GRA Phase 2") + kv("Items", "Orafix × 4 · Sabana Pro × 4") + kv("Amount", "₦172,000 · Paid by transfer", True), gap=10)
    + card(h2("Delivered by") + row(avatar("SB"), "Sadiq Bello", "Bike 2 · PHC-118RM", "", "", border=False)
           + kv("Received by", "Mr Kelechi (pharmacist)") + kv("Location recorded", "GRA Phase 2, Port Harcourt"), gap=10)
    + card(h2("Proof") + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">'
           f'<div style="min-height: 120px; {PH}">{ic("camera", 24)}[Delivery photo]</div><div style="min-height: 120px; {PH}">{ic("pen", 24)}[Customer signature]</div></div>')
    + card(h2("Timeline") + step("09:58", "Order taken by Kemi") + step("10:05", "Given to Sadiq") + step("10:20", "Picked up from store")
           + step("10:52", "Delivered and photo taken") + step("10:53", "Uploaded to the cloud", last=True), gap=6)
    + btn("Share proof on WhatsApp", None, "primary", "share")
    + btn("New order with Sadiq", "NewSale.dc.html", "ghost", "truck")
))


# ---------------- Rider earnings by day ----------------
def erow(date, n, amt, first=False, note_=""):
    bd = "" if first else f"border-top: 1px solid {LINE}; "
    sub = f'<div style="font-size: 12px; color: {MUTED}">{note_}</div>' if note_ else ""
    return (f'<div style="display: grid; grid-template-columns: 1.4fr 1fr 1.1fr; align-items: center; padding: 11px 0; {bd}font-size: 15px">'
            f'<div><b>{date}</b>{sub}</div><span style="text-align: center">{n}</span><span style="text-align: right; font-weight: 700">{amt}</span></div>')


def head3(a, b, c):
    return (f'<div style="display: grid; grid-template-columns: 1.4fr 1fr 1.1fr; font-size: 12px; color: {MUTED}; font-weight: 700">'
            f'<span>{a}</span><span style="text-align: center">{b}</span><span style="text-align: right">{c}</span></div>')


S["RiderEarnings"] = ("Rider earnings", 1200, topbar("Rider earnings", "Riders.dc.html", sync="synced") + main(
    field("Rider", "Emeka Obi · Bike 1", icon="bike", select=True, fid="re-rider", helper="Earns ₦5,000 per delivery (set on the rider's profile)")
    + segmented(["Day by day", "Week", "Month"], "Day by day")
    + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{stat("This week", "₦180,000", "36 deliveries", None)}{stat("September", "₦745,000", "149 deliveries", None)}</div>'
    + card(h2("Emeka's earnings") + head3("Date", "Deliveries", "Earnings")
           + erow("30/09/2026", 3, "₦15,000", True, "Today so far") + erow("29/09/2026", 10, "₦50,000") + erow("28/09/2026", 9, "₦45,000")
           + erow("27/09/2026", 6, "₦30,000") + erow("26/09/2026", 8, "₦40,000")
           + f'<div style="display: grid; grid-template-columns: 1.4fr 1fr 1.1fr; padding: 11px 0; border-top: 2px solid {NAVY}; font-weight: 700"><span>Total</span><span style="text-align: center">36</span><span style="text-align: right">₦180,000</span></div>', gap=0)
    + card(h2("All riders · 30/09/2026") + head3("Rider", "Deliveries", "Earnings")
           + erow("Emeka Obi", 3, "₦15,000", True) + erow("Sadiq Bello", 4, "₦20,000") + erow("Tolu Ade", 4, "₦20,000") + erow("Chinedu Eze", 2, "₦10,000")
           + f'<div style="display: grid; grid-template-columns: 1.4fr 1fr 1.1fr; padding: 11px 0; border-top: 2px solid {NAVY}; font-weight: 700"><span>Total</span><span style="text-align: center">13</span><span style="text-align: right">₦65,000</span></div>', gap=0)
    + btn("Export earnings", None, "ghost", "download")
))

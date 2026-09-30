from lib import *

S = {}  # name -> (title, height, html body)

# ---------------- Login (entry) ----------------
S["Main"] = ("Sign in", 844, f'''
<div style="background: #FFFFFF; display: flex; flex-direction: column; align-items: center; padding: 36px 24px 20px; border-bottom-left-radius: 32px; border-bottom-right-radius: 32px">
<img src="{LOGO}" alt="K-Logistics Hub Ltd logo" style="width: 210px; height: 210px; object-fit: contain">
</div>
<main style="flex-grow: 1; display: flex; flex-direction: column; gap: 16px; padding: 24px 24px 20px">
<div><h1 style="margin: 0; font-family: {HEAD}; font-size: 24px; font-weight: 600">Welcome back</h1>
<p style="margin: 4px 0 0; color: {MUTED}; font-size: 15px">Sign in to run today's business.</p></div>
{field("Phone number or email", "0803 000 0000", icon="phone", fid="login-id")}
<div style="display: flex; flex-direction: column; gap: 6px">
<label for="login-pw" style="font-size: 13px; font-weight: 700">Password</label>
<div style="display: flex; align-items: center; gap: 10px; min-height: 50px; padding: 0 6px 0 14px; background: #FFFFFF; border: 1px solid #C9CFDB; border-radius: 12px">
<span style="color: {MUTED}; display: flex">{ic("lock", 20)}</span>
<input id="login-pw" type="password" value="password" style="flex-grow: 1; border: 0; outline: 0; background: transparent; font-size: 16px; color: {NAVY}">
<button type="button" aria-label="Show password" style="width: 44px; height: 44px; border: 0; background: transparent; color: {MUTED}; display: flex; align-items: center; justify-content: center">{ic("eye", 20)}</button>
</div></div>
{btn("Sign in", "Dashboard.dc.html")}
<a href="#" style="align-self: center; font-size: 14px; font-weight: 700; color: {ORANGE_TXT}; padding: 8px">Forgot password?</a>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto">
<div style="font-size: 12px; color: {MUTED}; text-align: center; font-weight: 700; letter-spacing: 0.04em">DEMO — OPEN THE APP AS</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
<a href="Dashboard.dc.html" style="min-height: 44px; border-radius: 12px; border: 1px solid {LINE}; background: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700">Admin</a>
<a href="ManagerDashboard.dc.html" style="min-height: 44px; border-radius: 12px; border: 1px solid {LINE}; background: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700">Manager</a>
<a href="RiderHome.dc.html" style="min-height: 44px; border-radius: 12px; border: 1px solid {LINE}; background: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700">Rider</a>
</div>
<div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: {MUTED}; margin-top: 4px">{ic("cloudoff", 16)}Works without internet. Syncs when you're back online.</div>
</div>
</main>''')

# ---------------- Admin dashboard ----------------
def quick(icon, label, href):
    return (f'<a href="{href}" style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: {NAVY}; text-align: center">'
            f'<span style="width: 56px; height: 56px; border-radius: 18px; background: #FFFFFF; border: 1px solid {LINE}; display: flex; align-items: center; justify-content: center; color: {NAVY}">{ic(icon, 24)}</span>{label}</a>')

dash_header = f'''<header style="background: {NAVY}; color: #FFFFFF; padding: 16px 20px 72px; display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; align-items: center; gap: 10px">
<img src="{LOGO}" alt="" style="width: 40px; height: 40px; border-radius: 999px; background: #FFFFFF; object-fit: contain">
<div style="flex-grow: 1"><div style="font-size: 13px; color: #B8C3DB">Wed, 30 Sep 2026</div>
<div style="font-family: {HEAD}; font-size: 18px; font-weight: 600">Good morning, Kunle</div></div>
{sync_pill("offline")}
<a href="#" aria-label="Notifications" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: #FFFFFF; margin-right: -10px">{ic("bell", 22, "#FFFFFF")}</a>
</div></header>'''

S["Dashboard"] = ("Admin dashboard", 1260, dash_header + f'''
<main style="flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; gap: 18px; padding: 0 16px 24px; margin-top: -60px">
<section style="background: #FFFFFF; border-radius: 20px; padding: 18px; box-shadow: 0 10px 30px rgba(15,30,59,0.12); display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; justify-content: space-between; align-items: flex-start">
<div><div style="font-size: 13px; color: {MUTED}; font-weight: 500">Today's sales</div>
<div style="font-family: {HEAD}; font-size: 30px; font-weight: 700; line-height: 1.2">₦2,566,000</div>
<div style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: {GREEN}">{ic("up", 14, GREEN)}12% vs yesterday</div></div>
{badge("18 sales", "navy")}</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding-top: 12px; border-top: 1px solid {LINE}">
<div><div style="font-size: 12px; color: {MUTED}">Cost of goods</div><div style="font-weight: 700">₦2,328,000</div></div>
<div><div style="font-size: 12px; color: {MUTED}">Expenses</div><div style="font-weight: 700">₦41,500</div></div>
<div><div style="font-size: 12px; color: {MUTED}">Profit</div><div style="font-weight: 700; color: {GREEN}">₦196,500</div></div>
</div></section>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
{quick("cart", "New sale", "NewSale.dc.html")}{quick("box", "Receive stock", "ReceiveStock.dc.html")}{quick("receipt", "Add expense", "AddExpense.dc.html")}{quick("wallet", "Take payment", "CustomerProfile.dc.html")}
</div>
{card(h2("Today's overview", link("Day record", "DailyRecord.dc.html")) + grid([
    stat("Products delivered", "64", "units", None),
    stat("Customers served", "14"),
    stat("Pending deliveries", "5", "2 are late", "amber"),
    stat("Customers owe you", "₦615,000", "4 customers", "amber"),
]))}
{card(h2("Inventory", link("See stock", "Inventory.dc.html")) + grid([
    stat("Current stock", "695", "units in store"),
    stat("Low stock", "2", "Tomato paste, Semovita", "amber"),
    stat("Received today", "120", "units", "up"),
    stat("Delivered today", "64", "units", "down"),
]))}
{card(h2("Operations", link("Riders", "Riders.dc.html")) + f"""
<div style="display: flex; gap: 8px">
<div style="flex: 13 1 0; height: 10px; border-radius: 6px; background: {NAVY}"></div>
<div style="flex: 5 1 0; height: 10px; border-radius: 6px; background: {ORANGE}"></div></div>
<div style="display: flex; justify-content: space-between; font-size: 13px">
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {NAVY}"></span><b>13</b> completed</span>
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {ORANGE}"></span><b>5</b> pending</span>
<span><b>4 of 6</b> riders out</span></div>""")}
<a href="CloseDay.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; background: {NAVY}; color: #FFFFFF">
{icon_tile("clip", "#24365F", "#FFFFFF")}<div style="flex-grow: 1"><div style="font-weight: 700">Close today's record</div>
<div style="font-size: 13px; color: #B8C3DB">Closing stock becomes tomorrow's opening stock</div></div>{ic("chev", 20, "#FFFFFF")}</a>
</main>
{tabbar("admin", "Home")}''')

# ---------------- Manager dashboard ----------------
S["ManagerDashboard"] = ("Manager dashboard", 1000, dash_header.replace("Good morning, Kunle", "Good morning, Kemi") + f'''
<main style="flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; gap: 18px; padding: 0 16px 24px; margin-top: -60px">
<section style="background: #FFFFFF; border-radius: 20px; padding: 18px; box-shadow: 0 10px 30px rgba(15,30,59,0.12); display: flex; flex-direction: column; gap: 12px">
<div style="font-size: 13px; color: {MUTED}; font-weight: 500">Today's deliveries</div>
<div style="display: flex; align-items: baseline; gap: 8px"><div style="font-family: {HEAD}; font-size: 30px; font-weight: 700">13 of 18</div><div style="color: {MUTED}">done</div></div>
<div style="display: flex; gap: 6px"><div style="flex: 13 1 0; height: 10px; border-radius: 6px; background: {NAVY}"></div><div style="flex: 5 1 0; height: 10px; border-radius: 6px; background: {ORANGE}"></div></div>
</section>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
{quick("cart", "New sale", "NewSale.dc.html")}{quick("box", "Receive stock", "ReceiveStock.dc.html")}{quick("truck", "Assign rider", "Sales.dc.html")}{quick("users", "Customers", "Customers.dc.html")}
</div>
{card(h2("Stock today", link("See stock", "Inventory.dc.html")) + grid([
    stat("Current stock", "695", "units"), stat("Low stock", "2", "reorder soon", "amber"),
    stat("Received", "120", "units", "up"), stat("Delivered", "64", "units", "down")]))}
{card(h2("Riders") + row(avatar("EO"), "Emeka Obi", "Bike 1 · 2 deliveries left", "", badge("On delivery", "blue"), border=False)
      + row(avatar("SB"), "Sadiq Bello", "Bike 2 · 1 left", "", badge("On delivery", "blue"))
      + row(avatar("TA"), "Tolu Ade", "Bike 3 · all done", "", badge("Available", "green")))}
<div style="display: flex; gap: 12px; align-items: center; padding: 14px 16px; border-radius: 16px; border: 1px dashed #C9CFDB; color: {MUTED}">
{ic("lock", 20)}<div style="font-size: 13px; line-height: 1.4"><b style="color: {NAVY}">Money figures are hidden.</b> The owner controls whether managers can see sales totals, profit and expenses.</div></div>
</main>
{tabbar("manager", "Home")}''')

# ---------------- Sync center ----------------
def qitem(icon, title, sub, when):
    return row(icon_tile(icon), title, sub, "", f'<span style="font-size: 12px; color: {MUTED}">{when}</span>')

S["SyncCenter"] = ("Sync centre", 900, topbar("Sync", "Dashboard.dc.html", sync=None) + main(f'''
<section style="background: {NAVY}; color: #FFFFFF; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; align-items: center; gap: 12px">{icon_tile("cloudoff", "#24365F", "#FFD7A8", 48)}
<div><div style="font-family: {HEAD}; font-size: 20px; font-weight: 600">You're offline</div>
<div style="font-size: 14px; color: #B8C3DB">3 changes are saved safely on this phone</div></div></div>
<div style="font-size: 13px; color: #B8C3DB">Last synced today at 10:42 AM. Keep working — everything will upload by itself when the internet is back.</div>
<button type="button" style="min-height: 48px; border-radius: 12px; border: 0; background: {ORANGE}; color: {NAVY}; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px">{ic("refresh", 20, NAVY)}Try to sync now</button>
</section>
{card(h2("Waiting to upload", badge("3", "amber")) + qitem("cart", "New sale #S-0930-18", "Mama Ngozi Stores · ₦225,000", "11:05")
      .replace("border-top: 1px solid " + LINE + "; ", "") + qitem("receipt", "Expense · Fuel", "₦15,000 · Daily", "11:12")
      + qitem("wallet", "Payment received", "Grace Mini Mart · ₦50,000", "11:20"), gap=0)}
{card(h2("Needs your decision", badge("1", "red")) + f"""
<div style="font-size: 14px; line-height: 1.45">Tomato paste stock was changed on two phones while one was offline.</div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">
<div style="padding: 10px 12px; border-radius: 12px; background: {BG}"><div style="font-size: 12px; color: {MUTED}">This phone (Kunle)</div><div style="font-weight: 700">7 cartons</div></div>
<div style="padding: 10px 12px; border-radius: 12px; background: {BG}"><div style="font-size: 12px; color: {MUTED}">Other phone (Bola)</div><div style="font-weight: 700">9 cartons</div></div></div>
<div style="display: flex; gap: 8px">{btn("Keep 7", kind="ghost")}{btn("Keep 9", kind="ghost")}</div>""")}
{card(h2("Sync settings") + toggle("Sync automatically", True, "Uploads in the background when online") + toggle("Use mobile data", True, "Turn off to sync on Wi-Fi only") + toggle("Keep 90 days of records on phone", True, "Older records load from the cloud"), gap=6)}
''') )

# ---------------- More ----------------
def tile(icon, label, sub, href, lock=False):
    l = f'<span style="position: absolute; top: 12px; right: 12px; color: {MUTED}">{ic("lock", 14)}</span>' if lock else ""
    return (f'<a href="{href}" style="position: relative; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; padding: 14px; '
            f'display: flex; flex-direction: column; gap: 10px; color: {NAVY}">{l}{icon_tile(icon, "#EEF1F8", NAVY)}'
            f'<div><div style="font-weight: 700; font-size: 15px">{label}</div><div style="font-size: 12px; color: {MUTED}">{sub}</div></div></a>')

S["More"] = ("More", 980, topbar("More", sync="synced") + main(f'''
<a href="Settings.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 14px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px">
{avatar("KA", NAVY, "#FFFFFF", 48)}<div style="flex-grow: 1"><div style="font-weight: 700">Kunle Adebayo</div><div style="font-size: 13px; color: {MUTED}">Owner · Admin</div></div>{badge("Admin", "navy")}</a>
{grid([
    tile("clip", "Daily record", "Each day's full story", "DailyRecord.dc.html"),
    tile("receipt", "Expenses", "Fuel, repairs, pay", "Expenses.dc.html"),
    tile("users", "Staff & pay", "Who we pay and when", "Staff.dc.html"),
    tile("bike", "Riders & bikes", "Onboard and track", "Riders.dc.html"),
    tile("chart", "Finance", "Day, week, month", "Finance.dc.html", True),
    tile("file", "Reports", "Filter and export", "Reports.dc.html"),
    tile("shield", "Users & access", "Who can see what", "Users.dc.html", True),
    tile("refresh", "Sync", "3 waiting to upload", "SyncCenter.dc.html"),
])}
<a href="Settings.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 14px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px">
{icon_tile("sliders", "#EEF1F8", NAVY)}<div style="flex-grow: 1"><div style="font-weight: 700">Business settings</div><div style="font-size: 13px; color: {MUTED}">Logo, categories, units, stock alerts</div></div>{ic("chev", 20)}</a>
<a href="Main.dc.html" style="display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; color: {RED}; font-weight: 700">{ic("logout", 20, RED)}Sign out</a>
''') + tabbar("admin", "More"))

# ---------------- Settings / customisation ----------------
def editchip(t):
    return (f'<span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: {BG}; '
            f'border: 1px solid {LINE}; font-size: 13px; font-weight: 700">{t}<button type="button" aria-label="Remove {t}" style="border: 0; background: transparent; padding: 0; color: {MUTED}; display: flex">{ic("x", 14)}</button></span>')

S["Settings"] = ("Business settings", 1120, topbar("Business settings", "More.dc.html", sync=None) + main(f'''
{card(h2("Branding") + f"""<div style="display: flex; gap: 14px; align-items: center">
<img src="{LOGO}" alt="Current logo" style="width: 72px; height: 72px; border-radius: 16px; border: 1px solid {LINE}; object-fit: contain; background: #FFFFFF">
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px"><div style="font-weight: 700">K-Logistics Hub Ltd</div><div style="font-size: 13px; color: {MUTED}">Swift, fast and reliable.</div>
<button type="button" style="align-self: flex-start; min-height: 36px; padding: 0 12px; border-radius: 10px; border: 1px solid #C9CFDB; background: #FFFFFF; font-weight: 700; font-size: 13px">Change logo</button></div></div>
<div style="display: flex; gap: 10px; align-items: center"><span style="width: 32px; height: 32px; border-radius: 8px; background: {NAVY}"></span><span style="width: 32px; height: 32px; border-radius: 8px; background: {ORANGE}"></span><span style="font-size: 13px; color: {MUTED}">Brand colours from the logo</span></div>""")}
{card(h2("Expense categories", link("+ Add", "#")) + '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + "".join(editchip(t) for t in ["Staff payment", "Fuel", "Transportation", "Bike maintenance", "Repairs", "Packaging", "Other"]) + '</div>')}
{card(h2("Products & stock") + field("Default unit", "Bag / carton / pack", select=True, fid="unit") + field("Warn me when stock falls below", "10 units", fid="lowstock", helper="You can also set this per product") + toggle("Allow sales when stock is 0", False, "Stops mistakes when stock runs out"))}
{card(h2("Words we use") + field("Call a sale", "Sale", select=True, fid="word-sale", helper="e.g. Order, Waybill, Delivery") + field("Call a rider", "Rider", select=True, fid="word-rider", helper="e.g. Dispatch rider, Driver"), gap=12)}
{card(h2("Day & money") + field("Close the day automatically at", "11:59 PM", icon="clock", fid="closeat") + field("Currency", "Naira (₦)", select=True, fid="currency"))}
'''))

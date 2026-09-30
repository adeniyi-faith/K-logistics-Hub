from lib import *

S = {}

# ---------------- Expenses ----------------
def exp_row(icon, name, freq, date, amt, first=False, unsynced=False):
    rb = pending_dot() if unsynced else f'<span style="font-size: 12px; color: {MUTED}">{date}</span>'
    return row(icon_tile(icon), name, freq, amt, rb, border=not first)


S["Expenses"] = ("Expenses", 1000, topbar("Expenses", "More.dc.html", sync="offline") + main(f'''
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{stat("Today", "₦41,500")}{stat("This week", "₦286,000")}{stat("This month", "₦1.12m")}</div>
{card(h2("This week by category") + f"""
<div style="display: flex; height: 14px; border-radius: 8px; overflow: hidden; gap: 2px">
<div style="flex: 180 1 0; background: {NAVY}"></div><div style="flex: 56 1 0; background: {ORANGE}"></div><div style="flex: 30 1 0; background: #7C8DB5"></div><div style="flex: 20 1 0; background: #C9CFDB"></div></div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; font-size: 13px">
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {NAVY}"></span>Staff pay <b style="margin-left: auto">₦180,000</b></span>
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {ORANGE}"></span>Fuel <b style="margin-left: auto">₦56,000</b></span>
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: #7C8DB5"></span>Transport <b style="margin-left: auto">₦30,000</b></span>
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: #C9CFDB"></span>Packaging <b style="margin-left: auto">₦20,000</b></span></div>""")}
{chips(["All", "Daily", "Weekly", "Monthly", "One-time"], "All")}
{card(exp_row("fuel", "Fuel · Bike 1–4", "Daily", "", "₦15,000", True, True) + exp_row("truck", "Transportation", "Daily · Supplier pickup", "Today", "₦20,000")
      + exp_row("box", "Packaging", "Daily · Nylon & tape", "Today", "₦6,500") + exp_row("users", "Staff payment", "Weekly · 4 staff", "26 Sep", "₦180,000")
      + exp_row("wrench", "Repairs · Bike 3", "One-time · Clutch", "18 Sep", "₦35,000") + exp_row("bike", "Bike maintenance", "Monthly · Service all bikes", "1 Sep", "₦25,000"),
      pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")}
''') + fab("AddExpense.dc.html", "Add expense", bottom=24))


def cat(icon, label, on=False):
    st = f"border: 2px solid {NAVY}; background: #EEF1F8" if on else f"border: 1px solid {LINE}; background: #FFFFFF"
    return (f'<button type="button" style="{st}; border-radius: 14px; min-height: 76px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 12px; font-weight: 700; color: {NAVY}">'
            f'{ic(icon, 22)}{label}</button>')


S["AddExpense"] = ("Add expense", 980, topbar("Add expense", "Expenses.dc.html", sync="offline") + main(f'''
<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 0">
<label for="ae-amt" style="font-size: 13px; color: {MUTED}; font-weight: 700">AMOUNT</label>
<input id="ae-amt" value="₦15,000" style="width: 100%; text-align: center; border: 0; background: transparent; font-family: {HEAD}; font-size: 40px; font-weight: 700; color: {NAVY}; outline: 0"></div>
<div style="display: flex; flex-direction: column; gap: 8px"><div style="font-size: 13px; font-weight: 700">Category</div>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
{cat("fuel", "Fuel", True)}{cat("users", "Staff pay")}{cat("truck", "Transport")}{cat("bike", "Bike care")}{cat("wrench", "Repairs")}{cat("box", "Packaging")}{cat("tag", "Other")}{cat("plus", "New")}</div></div>
<div style="display: flex; flex-direction: column; gap: 8px"><div style="font-size: 13px; font-weight: 700">How often?</div>{segmented(["Daily", "Weekly", "Monthly", "One-time"], "Daily")}</div>
{field("For which bike? (optional)", "All bikes", icon="bike", select=True, fid="ae-bike")}
{field("Date", "Today, 30 Sep 2026", icon="calendar", fid="ae-date")}
{field("Note", "", "e.g. Filled 4 bikes at [station]", fid="ae-note")}
<button type="button" style="display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; border-radius: 14px; border: 1px dashed #C9CFDB; background: #FFFFFF; color: {MUTED}; font-weight: 700">{ic("camera", 20)}Add receipt photo</button>
{btn("Save expense", "Expenses.dc.html", "accent", "check")}
'''))

# ---------------- Staff ----------------
def staff_row(init, name, role, pay, paid, due, first=False):
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 0; {"" if first else "border-top: 1px solid " + LINE}">'
            f'<div style="display: flex; align-items: center; gap: 12px">{avatar(init)}<div style="flex-grow: 1"><div style="font-weight: 700">{name}</div>'
            f'<div style="font-size: 13px; color: {MUTED}">{role}</div></div><div style="text-align: right"><div style="font-weight: 700">{pay}</div>{due}</div></div>'
            f'<div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px"><span style="color: {MUTED}">Paid this month <b style="color: {NAVY}">{paid}</b></span>'
            f'<button type="button" style="min-height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid #C9CFDB; background: #FFFFFF; font-weight: 700; font-size: 13px">Pay</button></div></div>')


S["Staff"] = ("Staff and payments", 1040, topbar("Staff & pay", "More.dc.html", sync="synced", right=f'<a href="#" aria-label="Add staff" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid {LINE}">{ic("plus", 22)}</a>') + main(f'''
{segmented(["Staff", "Payment history"], "Staff")}
<section style="background: {NAVY}; color: #FFFFFF; border-radius: 18px; padding: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
<div><div style="font-size: 13px; color: #B8C3DB">Paid to staff in Sep</div><div style="font-family: {HEAD}; font-size: 22px; font-weight: 700">₦690,000</div></div>
<div><div style="font-size: 13px; color: #B8C3DB">Due this week</div><div style="font-family: {HEAD}; font-size: 22px; font-weight: 700; color: #FFC27A">₦180,000</div></div></section>
{card(staff_row("KE", "Kemi Eze", "Manager · 0803 222 1111", "₦150,000/mo", "₦150,000", badge("Paid", "green"), True)
      + staff_row("BJ", "Bola Johnson", "Store keeper · 0816 333 4455", "₦25,000/wk", "₦100,000", badge("Due Fri", "amber"))
      + staff_row("EO", "Emeka Obi", "Rider · Bike 1", "₦5,000/day", "₦130,000", badge("Due today", "amber"))
      + staff_row("SB", "Sadiq Bello", "Rider · Bike 2", "₦5,000/day", "₦125,000", badge("Due today", "amber")), pad=14, gap=0, extra="; padding-top: 0; padding-bottom: 0")}
'''))

# ---------------- Riders & bikes ----------------
def rider_row(init, name, bike, reg, stt, kind, today, first=False):
    return row(avatar(init), name, f"{bike} · {reg}", "", f'{badge(stt, kind)}<span style="font-size: 12px; color: {MUTED}">{today}</span>', "RiderProfile.dc.html", border=not first)


S["Riders"] = ("Riders and bikes", 940, topbar("Riders & bikes", "More.dc.html", sync="synced") + main(f'''
{segmented(["Riders", "Bikes"], "Riders")}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{stat("Riders", "6")}{stat("Out now", "4")}{stat("Bikes in repair", "1", "", None)}</div>
{searchbar("Search rider or plate number")}
{card(rider_row("EO", "Emeka Obi", "Bike 1", "LAG-234KJA", "On delivery", "blue", "3 of 5 done", True)
      + rider_row("SB", "Sadiq Bello", "Bike 2", "LAG-118EPE", "On delivery", "blue", "4 of 5 done")
      + rider_row("TA", "Tolu Ade", "Bike 3", "LAG-509IKD", "Available", "green", "4 of 4 done")
      + rider_row("CE", "Chinedu Eze", "Bike 4", "LAG-770AGL", "On delivery", "blue", "2 of 4 done")
      + rider_row("YG", "Yusuf Garba", "Bike 6", "LAG-331LSR", "Off duty", "gray", "Rest day")
      + rider_row("FL", "Femi Lawal", "Bike 5", "LAG-902KTU", "Bike in repair", "red", "Since 25 Sep"),
      pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")}
''') + fab("OnboardRider.dc.html", "Add rider", "plus", 24))


def step(n, label, state):
    if state == "done":
        c = f'<span style="width: 28px; height: 28px; border-radius: 99px; background: {GREEN}; display: flex; align-items: center; justify-content: center">{ic("check", 16, "#FFFFFF", 2.5)}</span>'
    elif state == "on":
        c = f'<span style="width: 28px; height: 28px; border-radius: 99px; background: {NAVY}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px">{n}</span>'
    else:
        c = f'<span style="width: 28px; height: 28px; border-radius: 99px; border: 1px solid #C9CFDB; color: {MUTED}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px">{n}</span>'
    return f'<div style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700">{c}{label}</div>'


def upload(label, icon="camera"):
    return (f'<button type="button" style="min-height: 96px; border-radius: 14px; border: 1px dashed #C9CFDB; background: {BG}; color: {MUTED}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-weight: 700; font-size: 13px">'
            f'{ic(icon, 22)}{label}</button>')


S["OnboardRider"] = ("Onboard a rider", 1400, topbar("Add a rider", "Riders.dc.html", sync="offline") + main(f'''
<div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 2px">{step(1, "Personal", "done")}<div style="flex-grow: 1; height: 2px; background: {GREEN}; margin: 0 6px"></div>{step(2, "Bike", "on")}<div style="flex-grow: 1; height: 2px; background: {LINE}; margin: 0 6px"></div>{step(3, "ID & login", "")}</div>
{card(h2("Personal details", badge("Done", "green")) + field("Full name", "Ibrahim Sule", fid="or-name") + field("Phone number", "0802 765 4321", icon="phone", fid="or-phone") + field("Home address", "[House no., street, area]", icon="pin", fid="or-addr"))}
{card(h2("Bike details") + field("Bike", "Bike 7 · New bike", icon="bike", select=True, fid="or-bike", helper="Or pick an existing bike that has no rider") + field("Registration number", "LAG-", fid="or-reg") + grid([field("Make & model", "", "e.g. Bajaj Boxer", fid="or-model"), field("Colour", "", "e.g. Red", fid="or-colour")], 2, 10))}
{card(h2("Identification") + field("ID type", "NIN slip", select=True, fid="or-idtype", helper="NIN, driver's licence, voter's card or passport") + field("ID number", "", "Enter number", fid="or-idno") + grid([upload("Photo of ID", "id"), upload("Rider's photo")], 2, 10))}
{card(h2("Status & app login") + field("Date onboarded", "Today, 30 Sep 2026", icon="calendar", fid="or-date") + toggle("Active", True, "Can be given deliveries") + toggle("Create a rider login", True, "Sends an SMS invite to 0802 765 4321"), gap=10)}
{btn("Save and continue", "Riders.dc.html", "accent")}
'''))

# ---------------- Finance ----------------
bars = [("24", 1.9), ("25", 2.1), ("26", 2.4), ("27", 1.2), ("28", 2.2), ("29", 2.29), ("30", 2.566)]
bar_html = "".join(
    f'<div style="flex: 1 1 0; display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: flex-end; height: 100%">'
    f'<div style="font-size: 11px; font-weight: 700; color: {NAVY if d == "30" else MUTED}">{v:.1f}m</div>'
    f'<div style="width: 70%; height: {int(v / 2.566 * 120)}px; border-radius: 6px 6px 2px 2px; background: {ORANGE if d == "30" else NAVY}"></div>'
    f'<div style="font-size: 12px; color: {MUTED}">{d}</div></div>' for d, v in bars)


def perf(name, units, profit, pct):
    return (f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-top: 1px solid {LINE}">'
            f'<div style="display: flex; justify-content: space-between; font-size: 14px"><b>{name}</b><span style="font-weight: 700; color: {GREEN}">{profit}</span></div>'
            f'<div style="display: flex; align-items: center; gap: 10px"><div style="flex-grow: 1; height: 8px; border-radius: 6px; background: #EEF1F8"><div style="width: {pct}%; height: 8px; border-radius: 6px; background: {NAVY}"></div></div>'
            f'<span style="font-size: 12px; color: {MUTED}; min-width: 64px; text-align: right">{units}</span></div></div>')


S["Finance"] = ("Finance", 1300, topbar("Finance", "More.dc.html", sync="synced", right=f'<span title="Admin only" style="color: {MUTED}; display: flex">{ic("lock", 18)}</span>') + main(f'''
{segmented(["Day", "Week", "Month"], "Week")}
<button type="button" style="display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 0 14px; border-radius: 12px; border: 1px solid {LINE}; background: #FFFFFF; font-weight: 700">{ic("back", 18)}24 – 30 Sep 2026{ic("chev", 18)}</button>
<section style="background: {NAVY}; color: #FFFFFF; border-radius: 20px; padding: 18px; display: flex; flex-direction: column; gap: 12px">
<div style="font-size: 13px; color: #B8C3DB">Profit this week</div>
<div style="font-family: {HEAD}; font-size: 32px; font-weight: 700; line-height: 1.1">₦1,084,000</div>
<div style="font-size: 12px; color: #B8C3DB">Sales − cost of goods − expenses</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding-top: 12px; border-top: 1px solid #2C3F6B">
<div><div style="font-size: 12px; color: #B8C3DB">Sales</div><div style="font-weight: 700">₦14.82m</div></div>
<div><div style="font-size: 12px; color: #B8C3DB">Cost of goods</div><div style="font-weight: 700">₦13.45m</div></div>
<div><div style="font-size: 12px; color: #B8C3DB">Expenses</div><div style="font-weight: 700">₦286,000</div></div></div></section>
{grid([stat("Units sold", "412", "8% vs last week", "up"), stat("Products delivered", "398", "units"), stat("Customers owe", "₦615,000", "4 customers", "amber"), stat("Staff pay", "₦180,000", "of ₦286k expenses")])}
{card(h2("Daily sales (₦)") + f'<div style="display: flex; align-items: flex-end; gap: 6px; height: 170px">{bar_html}</div>')}
{card(h2("Where the money went") + kv("Staff payments", "₦180,000") + kv("Fuel", "₦56,000") + kv("Transportation", "₦30,000") + kv("Packaging", "₦20,000") + f'<div style="border-top: 1px solid {LINE}"></div>' + kv("Total expenses", "₦286,000", True), gap=10)}
{card(h2("Product performance", link("Report", "Reports.dc.html")) + perf("Rice 50kg", "62 bags", "₦434,000", 100) + perf("Sugar 50kg", "70 bags", "₦350,000", 81) + perf("Vegetable oil 25L", "58 kegs", "₦261,000", 60) + perf("Noodles", "140 ctns", "₦168,000", 39), gap=0)}
'''))

# ---------------- Reports ----------------
S["Reports"] = ("Reports", 1120, topbar("Reports", "More.dc.html", sync="synced") + main(f'''
{field("Report", "Sales report", icon="file", select=True, fid="rp-type", helper="Sales · Stock · Expenses · Profit & loss · Customer statement · Rider deliveries · Staff pay")}
<div style="display: flex; flex-direction: column; gap: 8px"><div style="font-size: 13px; font-weight: 700">Period</div>{chips(["Day", "Week", "Month", "Custom"], "Week", True)}</div>
{grid([field("Product", "All products", select=True, fid="rp-prod"), field("Customer", "All customers", select=True, fid="rp-cust"), field("Staff", "All staff", select=True, fid="rp-staff"), field("Rider", "All riders", select=True, fid="rp-rider")], 2, 10)}
{btn("Show report", None, "primary", "chart")}
{card(h2("Sales · 24 – 30 Sep") + grid([stat("Total sales", "₦14.82m", "8% vs last week", "up"), stat("Units sold", "412"), stat("Profit", "₦1.08m", "", None), stat("Deliveries", "121", "by 6 riders")]) +
      f'<div style="border-top: 1px solid {LINE}"></div>' + kv("Top customer", "Balogun Supermarket") + kv("Top product", "Rice 50kg") + kv("Top rider", "Sadiq Bello · 27 trips"))}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
{btn("PDF", None, "ghost", "download")}{btn("Excel", None, "ghost", "download")}{btn("Share", None, "ghost", "share")}</div>
{card(h2("Saved reports") + row(icon_tile("file", "#EEF1F8", NAVY), "September P&amp;L", "Made 1 Oct · PDF", "", "", border=False) + row(icon_tile("file", "#EEF1F8", NAVY), "Mama Ngozi statement", "Made 27 Sep · PDF"), gap=0)}
'''))

# ---------------- Users & access ----------------
def perm(label, admin, mgr, rider, first=False):
    def m(v):
        if v == "on":
            return f'<span style="display: flex; justify-content: center; color: {GREEN}" aria-label="Allowed">{ic("check", 18, GREEN, 2.4)}</span>'
        if v == "opt":
            return f'<span style="display: flex; justify-content: center"><span style="font-size: 11px; font-weight: 700; color: {ORANGE_TXT}; background: {ORANGE_BG}; padding: 2px 6px; border-radius: 6px">Owner decides</span></span>'
        if v == "own":
            return f'<span style="display: flex; justify-content: center; font-size: 11px; font-weight: 700; color: {BLUE}">Own only</span>'
        return f'<span style="display: flex; justify-content: center; color: #9AA3B5" aria-label="Hidden">{ic("minus", 18, "#9AA3B5")}</span>'
    return (f'<div style="display: grid; grid-template-columns: 1.3fr 0.8fr 1.1fr 0.8fr; align-items: center; padding: 9px 0; border-top: 1px solid {LINE}; font-size: 14px">'
            f'<span style="font-weight: 500">{label}</span>{m(admin)}{m(mgr)}{m(rider)}</div>')


S["Users"] = ("Users and access", 1180, topbar("Users & access", "More.dc.html", sync="synced") + main(f'''
{card(h2("People with access", link("+ Invite", "#")) +
      row(avatar("KA", NAVY, "#FFFFFF"), "Kunle Adebayo", "0803 000 0000 · You", "", badge("Admin", "navy"), border=False) +
      row(avatar("KE"), "Kemi Eze", "0803 222 1111", "", badge("Manager", "blue")) +
      row(avatar("BJ"), "Bola Johnson", "0816 333 4455", "", badge("Manager", "blue")) +
      row(avatar("EO"), "Emeka Obi", "Bike 1", "", badge("Rider", "gray")) +
      row(avatar("SB"), "Sadiq Bello", "Bike 2", "", badge("Rider", "gray")), gap=0)}
{card(h2("What each role can see") + f"""<div style="display: grid; grid-template-columns: 1.3fr 0.8fr 1.1fr 0.8fr; font-size: 12px; color: {MUTED}; font-weight: 700; text-align: center"><span style="text-align: left">Area</span><span>Admin</span><span>Manager</span><span>Rider</span></div>"""
      + perm("Dashboard", "on", "on", "off") + perm("Stock", "on", "on", "off") + perm("Sales", "on", "on", "off") + perm("Customers", "on", "on", "own")
      + perm("Deliveries", "on", "on", "own") + perm("Staff", "on", "on", "off") + perm("Expenses", "on", "opt", "off") + perm("Finance & profit", "on", "opt", "off")
      + perm("Reports", "on", "opt", "off") + perm("Users", "on", "off", "off"), gap=2)}
{card(h2("Manager money access") + toggle("See sales totals", True) + toggle("See profit and cost prices", False, "Hidden from managers right now") + toggle("Add expenses", True) + toggle("Export reports", False), gap=4)}
'''))

# ---------------- Rider app ----------------
def deliv(no, cust, area, items, collect, stt, kind, first=False):
    return (f'<a href="DeliveryDetail.dc.html" style="display: flex; flex-direction: column; gap: 8px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; padding: 14px; color: {NAVY}">'
            f'<div style="display: flex; justify-content: space-between"><span style="font-size: 12px; color: {MUTED}; font-weight: 700">{no}</span>{badge(stt, kind)}</div>'
            f'<div style="font-weight: 700; font-size: 16px">{cust}</div>'
            f'<div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: {MUTED}">{ic("pin", 16)}{area}</div>'
            f'<div style="display: flex; justify-content: space-between; font-size: 14px; padding-top: 8px; border-top: 1px solid {LINE}"><span>{items}</span><b>{collect}</b></div></a>')


S["RiderHome"] = ("Rider deliveries", 1000, f'''<header style="background: {NAVY}; color: #FFFFFF; padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; align-items: center; gap: 10px">{avatar("EO", ORANGE, NAVY, 44)}
<div style="flex-grow: 1"><div style="font-family: {HEAD}; font-size: 18px; font-weight: 600">Hi, Emeka</div><div style="font-size: 13px; color: #B8C3DB">Bike 1 · LAG-234KJA</div></div>{sync_pill("offline")}</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
<div style="background: #24365F; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: #B8C3DB">Assigned</div><div style="font-family: {HEAD}; font-size: 22px; font-weight: 600">5</div></div>
<div style="background: #24365F; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; color: #B8C3DB">Delivered</div><div style="font-family: {HEAD}; font-size: 22px; font-weight: 600">3</div></div>
<div style="background: {ORANGE}; color: {NAVY}; border-radius: 14px; padding: 10px 12px"><div style="font-size: 12px; font-weight: 700">Left</div><div style="font-family: {HEAD}; font-size: 22px; font-weight: 600">2</div></div></div>
</header>''' + main(f'''
{toggle("I'm on duty", True, "Admin can see you're available")}
{h2("Next delivery")}
<section style="background: #FFFFFF; border: 2px solid {ORANGE}; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px">
<div style="display: flex; justify-content: space-between"><span style="font-size: 12px; color: {MUTED}; font-weight: 700">#S-0930-18</span>{badge("Pending", "amber")}</div>
<div><div style="font-family: {HEAD}; font-size: 20px; font-weight: 600">Mama Ngozi Stores</div>
<div style="display: flex; align-items: center; gap: 6px; font-size: 14px; color: {MUTED}; margin-top: 4px">{ic("pin", 16)}Shop 14, [Market name], Lagos</div></div>
<div style="display: flex; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: {BG}; font-size: 14px"><span>Rice 50kg × 3 bags</span><span>Collect <b>₦225,000</b></span></div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{btn("Call", None, "ghost", "phone")}{btn("Directions", None, "ghost", "nav")}</div>
{btn("Start delivery", "DeliveryDetail.dc.html", "accent", "truck")}
</section>
{h2("Later today")}
{deliv("#S-0930-19", "Okafor &amp; Sons", "[Street], Ikeja", "Sugar 50kg × 2", "Collect ₦134,000", "Pending", "amber")}
''') + tabbar("rider", "Deliveries"))

S["DeliveryDetail"] = ("Confirm delivery", 1060, topbar("#S-0930-18", "RiderHome.dc.html", sub="Mama Ngozi Stores", sync="offline") + main(f'''
{card(h2("Items to hand over") + f"""<label style="display: flex; align-items: center; gap: 12px; min-height: 44px; font-size: 15px"><input type="checkbox" checked style="width: 22px; height: 22px; accent-color: {NAVY}">Rice 50kg<span style="margin-left: auto; font-weight: 700">3 bags</span></label>""" + kv("Address", "Shop 14, [Market name]") + kv("Phone", "0803 111 2233"))}
{card(h2("Payment collected") + segmented(["Cash", "Transfer", "Not paid"], "Cash") + field("Amount collected", "₦225,000", fid="dd-amt", big=True, helper="Amount due: ₦225,000"))}
{card(h2("Proof of delivery") + field("Received by", "Mrs Ngozi", icon="user", fid="dd-recv") + f"""
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
<button type="button" style="min-height: 110px; border-radius: 14px; border: 1px dashed #C9CFDB; background: {BG}; color: {MUTED}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-weight: 700; font-size: 13px">{ic("camera", 22)}Take photo</button>
<button type="button" style="min-height: 110px; border-radius: 14px; border: 1px dashed #C9CFDB; background: {BG}; color: {MUTED}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-weight: 700; font-size: 13px">{ic("pen", 22)}Signature</button></div>""")}
{note("No internet here — that's fine. This delivery is saved on your phone and will upload by itself.", "cloudoff")}
{btn("Confirm delivered", "RiderHome.dc.html", "accent", "check")}
<button type="button" style="min-height: 48px; border: 0; background: transparent; color: {RED}; font-weight: 700; font-size: 15px">Report a problem</button>
'''))


def hist_row(t, cust, items, stt, kind, first=False):
    return row(f'<div style="width: 52px; font-size: 13px; font-weight: 700; color: {MUTED}">{t}</div>', cust, items, "", badge(stt, kind), border=not first)


S["RiderHistory"] = ("Rider history", 900, topbar("My deliveries", sync="offline") + main(f'''
{segmented(["Today", "This week", "This month"], "This week")}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{stat("Delivered", "27")}{stat("Failed", "1")}{stat("Cash handed in", "₦1.9m")}</div>
<div style="font-size: 13px; font-weight: 700; color: {MUTED}">TODAY · 30 SEP</div>
{card(hist_row("10:52", "Adeola Provisions", "Sugar 50kg × 2", "Delivered", "green", True) + hist_row("09:48", "Tunde Foods", "Noodles × 10", "Delivered", "green") + hist_row("09:05", "Grace Mini Mart", "Water × 20 packs", "Delivered", "green"), gap=0, pad=14, extra="; padding-top: 2px; padding-bottom: 2px")}
<div style="font-size: 13px; font-weight: 700; color: {MUTED}">TUESDAY · 29 SEP</div>
{card(hist_row("16:20", "Alhaji Musa Ventures", "Oil 25L × 4", "Delivered", "green", True) + hist_row("14:02", "Okafor &amp; Sons", "Customer shop closed", "Failed", "red") + hist_row("11:30", "Mama Ngozi Stores", "Rice 50kg × 2", "Delivered", "green"), gap=0, pad=14, extra="; padding-top: 2px; padding-bottom: 2px")}
''') + tabbar("rider", "History"))

S["RiderProfile"] = ("Rider profile", 900, topbar("My profile", sync="offline") + main(f'''
<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0">{avatar("EO", ORANGE, NAVY, 80)}
<div style="font-family: {HEAD}; font-size: 20px; font-weight: 600">Emeka Obi</div>{badge("Active rider", "green")}</div>
{card(h2("My details") + kv("Phone", "0809 123 4567") + kv("Address", "[Area], Lagos") + kv("Joined", "12 Mar 2026") + kv("ID", "NIN · verified"), gap=10)}
{card(h2("My bike") + kv("Bike", "Bike 1 · Bajaj Boxer") + kv("Plate number", "LAG-234KJA") + kv("Last service", "1 Sep 2026"), gap=10)}
{card(h2("My pay") + kv("Rate", "₦5,000 per day") + kv("Paid this month", "₦130,000"), gap=10)}
{btn("Sign out", "Main.dc.html", "danger", "logout")}
''') + tabbar("rider", "Profile"))

# ---------------- Style guide ----------------
def sw(c, name, use, dark=False):
    fg = "#FFFFFF" if dark else NAVY
    return (f'<div style="display: flex; flex-direction: column; gap: 6px"><div style="height: 64px; border-radius: 14px; background: {c}; border: 1px solid {LINE}; display: flex; align-items: flex-end; padding: 8px; box-sizing: border-box; color: {fg}; font-size: 12px; font-weight: 700">{c}</div>'
            f'<div style="font-size: 13px; font-weight: 700">{name}</div><div style="font-size: 12px; color: {MUTED}">{use}</div></div>')


S["StyleGuide"] = ("Style guide", 1200, topbar("Style guide", sync=None, sub="Shared look for every screen") + main(f'''
{card(h2("Colours") + grid([sw(NAVY, "Navy", "Headers, text, main buttons", True), sw(ORANGE, "Orange", "Key action, highlights"), sw(ORANGE_TXT, "Orange text", "Orange words on white", True),
                            sw(BG, "Background", "Screen ground"), sw(GREEN, "Green", "Paid, delivered, profit", True), sw(RED, "Red", "Owes, failed, errors", True)], 3, 10))}
{card(h2("Type") + f"""<div style="font-family: {HEAD}; font-size: 30px; font-weight: 700">₦2,566,000</div><div style="font-size: 12px; color: {MUTED}">Poppins Bold — big money figures</div>
<div style="font-family: {HEAD}; font-size: 20px; font-weight: 600">Screen title</div><div style="font-size: 12px; color: {MUTED}">Poppins SemiBold — titles and headings</div>
<div style="font-size: 15px">Body text is DM Sans. Easy to read on small, cheap phones in bright sunlight.</div>""")}
{card(h2("Buttons") + btn("Main action", None, "accent", "check") + btn("Secondary action", None, "primary") + btn("Other option", None, "ghost"))}
{card(h2("Status labels") + '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + badge("Paid", "green") + badge("Delivered", "green") + badge("Pending", "amber") + badge("Low stock", "amber") + badge("Owes ₦225,000", "red") + badge("On delivery", "blue") + badge("Off duty", "gray") + '</div>'
      + '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + sync_pill("synced") + sync_pill("offline") + sync_pill("syncing") + pending_dot() + '</div>')}
'''))

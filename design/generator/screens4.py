from lib import *
from screens1 import quick, dash_header

S = {}

LEVEL_BADGE = {"Edit": "green", "View": "blue", "Off": "gray"}


def level(area, sub, active, first=False):
    opts = []
    for o in ("Off", "View", "Edit"):
        on = o == active
        st = (f"background: {NAVY}; color: #FFFFFF" if on else f"background: transparent; color: {MUTED}")
        opts.append(f'<button type="button" aria-pressed="{"true" if on else "false"}" style="min-width: 48px; min-height: 36px; border: 0; border-radius: 9px; {st}; font-size: 13px; font-weight: 700">{o}</button>')
    bd = "" if first else f"border-top: 1px solid {LINE}; "
    return (f'<div style="display: flex; align-items: center; gap: 10px; padding: 10px 0; {bd}">'
            f'<div style="flex-grow: 1; min-width: 0"><div style="font-weight: 700; font-size: 14px">{area}</div>'
            f'<div style="font-size: 12px; color: {MUTED}">{sub}</div></div>'
            f'<div role="group" aria-label="{area} access" style="display: flex; gap: 2px; padding: 3px; background: #E6E9F1; border-radius: 12px; flex-shrink: 0">{"".join(opts)}</div></div>')


def can(label, lvl, first=False):
    bd = "" if first else f"border-top: 1px solid {LINE}; "
    txt = {"Edit": "Can add & change", "View": "View only", "Off": "Hidden"}[lvl]
    return (f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; {bd}font-size: 14px">'
            f'<span style="font-weight: 500">{label}</span>{badge(txt, LEVEL_BADGE[lvl])}</div>')


# ---------------- Staff profile: my access (Kemi) ----------------
S["StaffProfile"] = ("My access", 1100, topbar("Me", sync="offline") + main(f'''
<div style="display: flex; align-items: center; gap: 14px; padding: 4px 0">{avatar("KE", ORANGE, NAVY, 64)}
<div style="display: flex; flex-direction: column; gap: 4px"><div style="font-family: {HEAD}; font-size: 20px; font-weight: 600">Kemi Eze</div>
<div style="font-size: 13px; color: {MUTED}">Sales &amp; dispatch manager</div><div style="display: flex; gap: 6px">{badge("Staff", "navy")}{badge("Manager access + 2 changes", "amber")}</div></div></div>
{card(h2("What I can use") + can("Stock", "Edit", True) + can("Sales &amp; deliveries", "Edit") + can("Customers", "Edit") + can("Riders &amp; bikes", "Edit")
      + can("Expenses", "View") + can("Reports", "View") + can("Finance &amp; profit", "Off") + can("Staff &amp; pay", "Off") + can("Business settings", "Off"), gap=0)}
{card(h2("Extra permissions") + "".join(
    f'<div style="display: flex; align-items: center; gap: 10px; font-size: 14px; min-height: 32px">{ic("check" if ok else "x", 18, GREEN if ok else "#9AA3B5", 2.2)}<span style="color: {NAVY if ok else MUTED}">{t}</span></div>'
    for t, ok in [("Record customer payments", True), ("Give discounts up to 5%", True), ("Close the day", True), ("See cost prices and profit", False), ("Cancel a saved sale", False), ("Export reports", False)]), gap=4)}
{note("Need more access? Ask Kasim. Changes reach your phone the next time it syncs.", "shield", "blue")}
{card(h2("My pay") + kv("Rate", "₦150,000 per month") + kv("Paid for September", "₦150,000"), gap=10)}
{btn("Sign out", "Main.dc.html", "danger", "logout")}
''') + tabbar("staff_mgr", "Me"))


# ---------------- Users (Admin) ----------------
def person(init, name, sub, role, kind, extra="", first=False, href="StaffAccess.dc.html"):
    rb = f'<span style="font-size: 12px; color: {ORANGE_TXT}; font-weight: 700">{extra}</span>' if extra else ""
    return row(avatar(init), name, sub, badge(role, kind), rb, href, border=not first)


def cmp(area, vals, first=False):
    sym = {"E": ("Edit", GREEN), "V": ("View", BLUE), "-": ("—", "#9AA3B5")}
    cells = "".join(f'<span style="text-align: center; font-size: 12px; font-weight: 700; color: {sym[v][1]}">{sym[v][0]}</span>' for v in vals)
    bd = "" if first else f"border-top: 1px solid {LINE}; "
    return (f'<div style="display: grid; grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr)); align-items: center; padding: 8px 0; {bd}font-size: 13px">'
            f'<span style="font-weight: 500">{area}</span>{cells}</div>')


S["Users"] = ("Users and access", 1240, topbar("Users & access", "More.dc.html", sync="synced") + main(f'''
<div style="font-size: 14px; line-height: 1.5; color: {MUTED}">Three kinds of user: <b style="color: {NAVY}">Admin</b> (everything), <b style="color: {NAVY}">Staff</b> (what you allow) and <b style="color: {NAVY}">Rider</b> (own deliveries).</div>
{chips(["All (11)", "Staff (4)", "Riders (6)"], "All (11)")}
{card(person("K", "Kasim", "CEO · You", "Admin", "navy", "Full access", True, "#")
      + person("KE", "Kemi Eze", "Manager access", "Staff", "blue", "+ 2 changes")
      + person("AO", "Ada Okoro", "Accounts access", "Staff", "blue")
      + person("BJ", "Bola Johnson", "Store keeper access", "Staff", "blue")
      + person("PA", "Precious Amadi", "Sales access", "Staff", "blue", "+ 1 change")
      + row(icon_tile("bike", "#EEF1F8", NAVY), "6 riders", "Use the Rider app · deliveries only", badge("Rider", "gray"), "", "Riders.dc.html"), pad=14, gap=0, extra="; padding-top: 2px; padding-bottom: 2px")}
{btn("Invite staff", "StaffAccess.dc.html", "accent", "plus")}
{card(h2("Compare staff access") + f"""<div style="display: grid; grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr)); font-size: 12px; color: {MUTED}; font-weight: 700"><span>Area</span><span style="text-align: center">Kemi</span><span style="text-align: center">Ada</span><span style="text-align: center">Bola</span><span style="text-align: center">Precious</span></div>"""
      + cmp("Stock", "E-EV", True) + cmp("Sales", "EVVE") + cmp("Customers", "EV-E") + cmp("Riders", "E---") + cmp("Expenses", "VE--")
      + cmp("Staff &amp; pay", "-E--") + cmp("Finance", "-V--") + cmp("Reports", "VE--") + cmp("Settings", "----")
      + f'<div style="font-size: 12px; color: {MUTED}; padding-top: 8px">Two people can hold the same job title and still have different access.</div>', gap=0)}
'''))

# ---------------- Staff access editor (Admin) ----------------
S["StaffAccess"] = ("Edit staff access", 1640, topbar("Kemi's access", "Users.dc.html", sub="Changes sync to her phone", sync="synced") + main(f'''
<div style="display: flex; align-items: center; gap: 12px">{avatar("KE", ORANGE, NAVY, 52)}
<div style="flex-grow: 1"><div style="font-weight: 700; font-size: 17px">Kemi Eze</div><div style="font-size: 13px; color: {MUTED}">0803 222 1111 · Staff since Feb 2026</div></div>{badge("Active", "green")}</div>
{field("Job title", "Sales &amp; dispatch manager", fid="sa-title")}
{card(h2("Start from a role", link("Staff roles", "Roles.dc.html")) + chips(["Manager", "Sales", "Store keeper", "Accounts", "Custom"], "Manager")
      + note("Kemi has 2 changes from the Manager role: <b>Close the day</b> turned on, <b>Reports</b> set to view only.", "sliders", "amber"))}
{card(h2("What Kemi can use") + f'<div style="font-size: 12px; color: {MUTED}">Off = hidden · View = look only · Edit = add and change</div>'
      + level("Stock", "Products, receive stock, counts", "Edit", True) + level("Sales &amp; deliveries", "New sales, assign riders", "Edit")
      + level("Customers", "Profiles and balances", "Edit") + level("Riders &amp; bikes", "Onboard, status, bikes", "Edit")
      + level("Expenses", "Fuel, repairs, packaging", "View") + level("Staff &amp; pay", "Salaries and payments", "Off")
      + level("Finance &amp; profit", "Sales, costs, profit", "Off") + level("Reports", "Filter and export", "View")
      + level("Business settings", "Logo, categories, areas", "Off"), gap=0)}
{card(h2("Extra permissions") + toggle("See cost prices and profit", False, "Hides cost and profit on every screen")
      + toggle("Give discounts", True, "Up to 5% off the selling price") + toggle("Record customer payments", True)
      + toggle("Cancel or change a saved sale", False, "Only Admin can do this for now") + toggle("Close the day", True, "Changed from the Manager role")
      + toggle("Export reports", False) + toggle("Decide sync clashes", False, "When two phones change the same thing"), gap=2)}
{card(h2("Sign-in") + toggle("Can sign in", True, "Turn off to block access at once") + btn("Reset password", None, "ghost", "lock"), gap=10)}
{btn("Save access", "Users.dc.html", "accent", "check")}
<div style="font-size: 12px; color: {MUTED}; text-align: center">Every access change is logged with who made it and when.</div>
'''))

# ---------------- Roles (Admin) ----------------
def role_card(name, people, summary, areas, fixed=False):
    tag = badge("Fixed", "gray") if fixed else link("Edit", "#")
    pills = "".join(f'<span style="padding: 4px 9px; border-radius: 999px; background: {BG}; border: 1px solid {LINE}; font-size: 12px; font-weight: 700">{a}</span>' for a in areas)
    return card(f'''<div style="display: flex; align-items: center; gap: 12px">{icon_tile("shield", "#EEF1F8", NAVY)}
<div style="flex-grow: 1"><div style="font-weight: 700; font-size: 16px">{name}</div><div style="font-size: 13px; color: {MUTED}">{people}</div></div>{tag}</div>
<div style="font-size: 13px; line-height: 1.4">{summary}</div><div style="display: flex; flex-wrap: wrap; gap: 6px">{pills}</div>''', gap=10)


S["Roles"] = ("Staff roles", 1180, topbar("Staff roles", "Users.dc.html", sync="synced") + main(f'''
<div style="font-size: 14px; line-height: 1.5; color: {MUTED}">A staff role is a ready-made set of access. Give one to a staff member, then turn single things on or off just for them. Admin and Rider access are fixed.</div>
{role_card("Manager", "1 person", "Runs daily operations: stock, sales, customers and riders.", ["Stock: edit", "Sales: edit", "Customers: edit", "Riders: edit", "Expenses: view", "Reports: edit"])}
{role_card("Accounts", "1 person", "Handles money: expenses, staff pay, finance and reports.", ["Expenses: edit", "Staff pay: edit", "Finance: view", "Reports: edit", "Sales: view"])}
{role_card("Store keeper", "1 person", "Receives and counts stock. Sees sales so they can pack orders.", ["Stock: edit", "Sales: view"])}
{role_card("Sales", "1 person", "Takes orders and looks after customers.", ["Sales: edit", "Customers: edit", "Stock: view"])}
{btn("Create a staff role", None, "ghost", "plus")}
<div style="font-size: 12px; color: {MUTED}; text-align: center">Changing a role updates everyone who has it, except the things you changed for one person.</div>
'''))


# Shared building blocks for the K-Logistics Hub design canvas.
LOGO = "/_blob/dee86848717f78f54837bb7d79f69dad"

NAVY = "#0F1E3B"
NAVY2 = "#1B2E57"
ORANGE = "#E97D01"
ORANGE_TXT = "#A85A00"
ORANGE_BG = "#FFF4E6"
BG = "#F4F6FA"
LINE = "#E3E7EF"
MUTED = "#5A6378"
GREEN = "#1B7A43"
GREEN_BG = "#E8F6EE"
RED = "#B42318"
RED_BG = "#FDECEA"
BLUE = "#1D4ED8"
BLUE_BG = "#EAF0FE"

HEAD = "'Poppins', sans-serif"
BODY = "'DM Sans', sans-serif"

ICONS = {
    "home": '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    "box": '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    "cart": '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2-8H6"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5c2.2.6 3.5 2.7 3.5 5.5"/>',
    "grid": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "minus": '<path d="M5 12h14"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    "back": '<path d="m15 18-6-6 6-6"/>',
    "chev": '<path d="m9 18 6-6-6-6"/>',
    "down": '<path d="m6 9 6 6 6-6"/>',
    "bell": '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
    "cloudok": '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8.5 4.5 4.5 0 0 1 17.5 18z"/><path d="m9.5 13 2 2 3.5-3.5"/>',
    "cloudoff": '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 1.3-2.6"/><path d="M10.5 4.3A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1 2.5 8"/><path d="M3 3l18 18"/>',
    "cloudup": '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8.5 4.5 4.5 0 0 1 17.5 18z"/><path d="M12 16v-5M9.5 13.5 12 11l2.5 2.5"/>',
    "refresh": '<path d="M20 11a8 8 0 0 0-14.5-4.5L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5L21 15"/><path d="M21 20v-5h-5"/>',
    "truck": '<path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3.5V16h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    "bike": '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9 10h6l3.5 6.5"/><path d="M9 10 8 7H6"/><path d="M15 10l-1.5-3H16"/>',
    "wallet": '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M16 15h2"/><path d="M6 6V5a2 2 0 0 1 2-2h9"/>',
    "receipt": '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "file": '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h6"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    "sliders": '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    "phone": '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    "pin": '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7"/>',
    "camera": '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13.5" r="3.5"/>',
    "filter": '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    "download": '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
    "share": '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "dn": '<path d="M12 5v14M6 13l6 6 6-6"/>',
    "alert": '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>',
    "lock": '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    "eye": '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "logout": '<path d="M15 4h4v16h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    "fuel": '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M3 21h12"/><path d="M4 10h10"/><path d="M14 8h3l2 2v7a1.5 1.5 0 0 1-3 0v-3h-2"/>',
    "wrench": '<path d="M15 4a5 5 0 0 0-6 6l-6 6 4 4 6-6a5 5 0 0 0 6-6l-3 3-3-1-1-3z"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "id": '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/>',
    "clip": '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 11h6M9 15h4"/>',
    "cash": '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    "nav": '<path d="M3 11 21 3l-8 18-2-8z"/>',
    "palette": '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    "tag": '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    "x": '<path d="M6 6l12 12M18 6 6 18"/>',
    "pen": '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    "list": '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
}


def ic(name, size=20, color="currentColor", sw=1.8):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" '
            f'style="flex-shrink: 0">{ICONS[name]}</svg>')


def page(title, h, body, extra_root=""):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&amp;family=Poppins:wght@500;600;700&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:{NAVY};text-decoration:none}}a:hover{{color:{NAVY2}}}
button,input,select{{font:inherit}}
</style>
</helmet>
<div style="width: 390px; height: {h}px; box-sizing: border-box; display: flex; flex-direction: column; background: {BG}; font-family: {BODY}; font-size: 15px; color: {NAVY}; overflow: hidden; position: relative; font-variant-numeric: tabular-nums{extra_root}">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''


def sync_pill(state="synced"):
    if state == "offline":
        return (f'<a href="SyncCenter.dc.html" style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; '
                f'border-radius: 999px; background: {ORANGE_BG}; color: {ORANGE_TXT}; font-size: 12px; font-weight: 700; white-space: nowrap">'
                f'{ic("cloudoff", 16)}Offline · 3</a>')
    if state == "syncing":
        return (f'<a href="SyncCenter.dc.html" style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; '
                f'border-radius: 999px; background: {BLUE_BG}; color: {BLUE}; font-size: 12px; font-weight: 700; white-space: nowrap">'
                f'{ic("refresh", 16)}Syncing</a>')
    return (f'<a href="SyncCenter.dc.html" style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; '
            f'border-radius: 999px; background: {GREEN_BG}; color: {GREEN}; font-size: 12px; font-weight: 700; white-space: nowrap">'
            f'{ic("cloudok", 16)}Synced</a>')


def topbar(title, back=None, right="", sub=None, sync="synced"):
    b = ""
    if back:
        b = (f'<a href="{back}" aria-label="Back" style="width: 44px; height: 44px; margin-left: -10px; display: flex; '
             f'align-items: center; justify-content: center; border-radius: 12px">{ic("back", 24)}</a>')
    s = f'<div style="font-size: 13px; color: {MUTED}; margin-top: 2px">{sub}</div>' if sub else ""
    pill = sync_pill(sync) if sync else ""
    return f'''<header style="display: flex; align-items: center; gap: 8px; padding: 14px 20px 12px; background: #FFFFFF; border-bottom: 1px solid {LINE}">
{b}<div style="flex-grow: 1; min-width: 0"><h1 style="margin: 0; font-family: {HEAD}; font-size: 20px; font-weight: 600; line-height: 1.25">{title}</h1>{s}</div>
{right}{pill}
</header>'''


TABS = {
    "admin": [("home", "Home", "Dashboard.dc.html"), ("box", "Stock", "Inventory.dc.html"),
              ("cart", "Sales", "Sales.dc.html"), ("users", "Customers", "Customers.dc.html"),
              ("grid", "More", "More.dc.html")],
    "staff_mgr": [("home", "Home", "StaffHome.dc.html"), ("box", "Stock", "Inventory.dc.html"),
                  ("cart", "Sales", "Sales.dc.html"), ("users", "Customers", "Customers.dc.html"),
                  ("user", "Me", "StaffProfile.dc.html")],
    "staff_acc": [("home", "Home", "StaffHomeAccounts.dc.html"), ("receipt", "Expenses", "Expenses.dc.html"),
                  ("chart", "Finance", "Finance.dc.html"), ("file", "Reports", "Reports.dc.html"),
                  ("user", "Me", "StaffProfile.dc.html")],
    "rider": [("truck", "Deliveries", "RiderHome.dc.html"), ("clock", "History", "RiderHistory.dc.html"),
              ("user", "Profile", "RiderProfile.dc.html")],
}


def tabbar(role, active):
    items = []
    for icon, label, href in TABS[role]:
        on = label == active
        col = NAVY if on else "#6B7489"
        dot = f'<div style="width: 20px; height: 3px; border-radius: 2px; background: {ORANGE if on else "transparent"}"></div>'
        items.append(f'<a href="{href}" style="flex: 1 1 0; display: flex; flex-direction: column; align-items: center; gap: 4px; '
                     f'padding-top: 8px; min-height: 56px; color: {col}; font-size: 11px; font-weight: {700 if on else 500}">'
                     f'{dot}{ic(icon, 22, col, 2 if on else 1.8)}{label}</a>')
    return (f'<nav aria-label="Main" style="display: flex; background: #FFFFFF; border-top: 1px solid {LINE}; padding: 0 8px 18px; flex-shrink: 0">'
            + "".join(items) + '</nav>')


def main(inner, gap=16, pad="16px 16px 24px"):
    return (f'<main style="flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; gap: {gap}px; padding: {pad}">'
            f'{inner}</main>')


def card(inner, pad=16, gap=12, extra=""):
    return (f'<section style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; padding: {pad}px; '
            f'display: flex; flex-direction: column; gap: {gap}px{extra}">{inner}</section>')


def h2(text, right=""):
    return (f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">'
            f'<h2 style="margin: 0; font-family: {HEAD}; font-size: 16px; font-weight: 600">{text}</h2>{right}</div>')


def link(text, href):
    return f'<a href="{href}" style="font-size: 13px; font-weight: 700; color: {ORANGE_TXT}; padding: 6px 0">{text}</a>'


BADGE = {"green": (GREEN_BG, GREEN), "amber": (ORANGE_BG, ORANGE_TXT), "red": (RED_BG, RED),
         "blue": (BLUE_BG, BLUE), "gray": ("#EEF0F5", MUTED), "navy": (NAVY, "#FFFFFF")}


def badge(text, kind="gray"):
    bg, fg = BADGE[kind]
    return (f'<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; '
            f'background: {bg}; color: {fg}; font-size: 12px; font-weight: 700; white-space: nowrap">{text}</span>')


def pending_dot():
    return (f'<span title="Saved on phone, waiting to sync" style="display: inline-flex; align-items: center; gap: 3px; '
            f'color: {ORANGE_TXT}; font-size: 11px; font-weight: 700">{ic("cloudup", 14, ORANGE_TXT)}Not synced</span>')


def chips(opts, active, full=False):
    out = []
    for o in opts:
        on = o == active
        style = (f'background: {NAVY}; color: #FFFFFF; border: 1px solid {NAVY}' if on
                 else f'background: #FFFFFF; color: {NAVY}; border: 1px solid {LINE}')
        flex = "flex: 1 1 0; " if full else ""
        out.append(f'<button type="button" style="{flex}min-height: 36px; padding: 0 14px; border-radius: 999px; {style}; '
                   f'font-size: 13px; font-weight: 700; white-space: nowrap">{o}</button>')
    return f'<div style="display: flex; gap: 8px; flex-wrap: wrap">{"".join(out)}</div>'


def segmented(opts, active):
    out = []
    for o in opts:
        on = o == active
        style = (f'background: #FFFFFF; color: {NAVY}; box-shadow: 0 1px 3px rgba(15,30,59,0.15)' if on
                 else f'background: transparent; color: {MUTED}')
        out.append(f'<button type="button" style="flex: 1 1 0; min-height: 40px; border: 0; border-radius: 10px; {style}; '
                   f'font-size: 14px; font-weight: 700">{o}</button>')
    return f'<div style="display: flex; gap: 4px; padding: 4px; background: #E6E9F1; border-radius: 13px">{"".join(out)}</div>'


def btn(text, href=None, kind="primary", icon=None, full=True):
    styles = {
        "primary": f"background: {NAVY}; color: #FFFFFF; border: 1px solid {NAVY}",
        "accent": f"background: {ORANGE}; color: {NAVY}; border: 1px solid {ORANGE}",
        "ghost": f"background: #FFFFFF; color: {NAVY}; border: 1px solid #C9CFDB",
        "danger": f"background: #FFFFFF; color: {RED}; border: 1px solid #F1C4BF",
    }
    w = "width: 100%; " if full else ""
    i = ic(icon, 20) if icon else ""
    inner = f'{i}{text}'
    base = (f'{w}box-sizing: border-box; min-height: 52px; padding: 0 18px; border-radius: 14px; {styles[kind]}; '
            f'display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 700')
    if href:
        return f'<a href="{href}" style="{base}">{inner}</a>'
    return f'<button type="button" style="{base}">{inner}</button>'


def icon_tile(icon, bg=ORANGE_BG, fg=ORANGE_TXT, size=40):
    return (f'<div style="width: {size}px; height: {size}px; border-radius: 12px; background: {bg}; color: {fg}; '
            f'display: flex; align-items: center; justify-content: center; flex-shrink: 0">{ic(icon, 20, fg)}</div>')


def avatar(initials, bg="#E4E9F5", fg=NAVY, size=40):
    return (f'<div style="width: {size}px; height: {size}px; border-radius: 999px; background: {bg}; color: {fg}; '
            f'display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: {int(size*0.36)}px; '
            f'flex-shrink: 0">{initials}</div>')


def row(lead, title, sub="", rt="", rb="", href=None, border=True):
    bd = f"border-top: 1px solid {LINE}; " if border else ""
    inner = (f'{lead}<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
             f'<div style="font-weight: 700; font-size: 15px">{title}</div>'
             f'<div style="font-size: 13px; color: {MUTED}">{sub}</div></div>'
             f'<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0">'
             f'<div style="font-weight: 700; font-size: 15px">{rt}</div>{rb}</div>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; {bd}color: {NAVY}'
    if href:
        return f'<a href="{href}" style="{st}">{inner}</a>'
    return f'<div style="{st}">{inner}</div>'


def stat(label, value, note="", note_kind=None, tone="white"):
    bg = "#FFFFFF" if tone == "white" else tone
    nk = {"up": GREEN, "down": RED, "amber": ORANGE_TXT, None: MUTED}[note_kind]
    arrow = ic("up", 14, nk) if note_kind == "up" else (ic("dn", 14, nk) if note_kind == "down" else "")
    n = (f'<div style="display: flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 700; color: {nk}">'
         f'{arrow}{note}</div>') if note else ""
    return (f'<div style="background: {bg}; border: 1px solid {LINE}; border-radius: 14px; padding: 12px 14px; '
            f'display: flex; flex-direction: column; gap: 4px; min-width: 0">'
            f'<div style="font-size: 12px; color: {MUTED}; font-weight: 500">{label}</div>'
            f'<div style="font-family: {HEAD}; font-size: 20px; font-weight: 600; line-height: 1.2">{value}</div>{n}</div>')


def grid(items, cols=2, gap=10):
    return (f'<div style="display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); gap: {gap}px">'
            + "".join(items) + '</div>')


def field(label, value="", placeholder="", icon=None, select=False, helper="", fid=None, big=False):
    fid = fid or ("f-" + "".join(c for c in label.lower() if c.isalnum())[:18])
    i = f'<span style="color: {MUTED}; display: flex">{ic(icon, 20)}</span>' if icon else ""
    chev = f'<span style="color: {MUTED}; display: flex">{ic("down", 20)}</span>' if select else ""
    fs = "22px" if big else "16px"
    fw = "700" if big else "500"
    h = f'<div style="font-size: 12px; color: {MUTED}">{helper}</div>' if helper else ""
    return (f'<div style="display: flex; flex-direction: column; gap: 6px">'
            f'<label for="{fid}" style="font-size: 13px; font-weight: 700">{label}</label>'
            f'<div style="display: flex; align-items: center; gap: 10px; min-height: 50px; padding: 0 14px; background: #FFFFFF; '
            f'border: 1px solid #C9CFDB; border-radius: 12px">{i}'
            f'<input id="{fid}" value="{value}" placeholder="{placeholder}" style="flex-grow: 1; min-width: 0; border: 0; outline: 0; '
            f'background: transparent; font-size: {fs}; font-weight: {fw}; color: {NAVY}">{chev}</div>{h}</div>')


def toggle(label, on=True, sub=""):
    track = NAVY if on else "#C9CFDB"
    knob = "margin-left: 20px" if on else "margin-left: 0"
    s = f'<div style="font-size: 12px; color: {MUTED}">{sub}</div>' if sub else ""
    return (f'<div style="display: flex; align-items: center; gap: 12px; min-height: 44px">'
            f'<div style="flex-grow: 1"><div style="font-weight: 700; font-size: 14px">{label}</div>{s}</div>'
            f'<button type="button" role="switch" aria-checked="{"true" if on else "false"}" aria-label="{label}" '
            f'style="width: 48px; height: 28px; border: 0; border-radius: 999px; background: {track}; padding: 3px; '
            f'display: flex; align-items: center; flex-shrink: 0"><span style="width: 22px; height: 22px; border-radius: 999px; '
            f'background: #FFFFFF; {knob}"></span></button></div>')


def fab(href, label, icon="plus", bottom=94):
    return (f'<a href="{href}" style="position: absolute; right: 16px; bottom: {bottom}px; display: flex; align-items: center; gap: 8px; '
            f'min-height: 54px; padding: 0 20px 0 16px; border-radius: 999px; background: {ORANGE}; color: {NAVY}; '
            f'font-weight: 700; font-size: 15px; box-shadow: 0 8px 20px rgba(233,125,1,0.35)">{ic(icon, 22, NAVY, 2.2)}{label}</a>')


def searchbar(ph):
    return (f'<div style="display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 14px; background: #FFFFFF; '
            f'border: 1px solid {LINE}; border-radius: 12px; color: {MUTED}">{ic("search", 20)}'
            f'<input aria-label="{ph}" placeholder="{ph}" style="flex-grow: 1; border: 0; outline: 0; background: transparent; font-size: 15px; color: {NAVY}"></div>')


def kv(k, v, strong=False, color=None):
    c = f"color: {color}; " if color else ""
    w = "700" if strong else "500"
    return (f'<div style="display: flex; justify-content: space-between; gap: 12px; font-size: 14px">'
            f'<span style="color: {MUTED}">{k}</span><span style="{c}font-weight: {w}">{v}</span></div>')


def note(text, icon="cloudup", kind="amber"):
    bg, fg = BADGE[kind]
    return (f'<div style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; '
            f'background: {bg}; color: {fg}; font-size: 13px; font-weight: 500; line-height: 1.4">{ic(icon, 18, fg)}<div>{text}</div></div>')

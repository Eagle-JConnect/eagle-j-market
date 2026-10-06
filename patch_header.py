from pathlib import Path
import re
root=Path('/mnt/data/ejm_work')
header='''<header class="header" id="siteHeader">\n  <a class="brand" href="index.html">🦅 <span>EAGLE-J MARKET</span></a>\n  <nav class="nav" id="mainNav" aria-label="Main navigation">\n    <a href="index.html">Home</a>\n    <a href="businesses.html">Businesses</a>\n    <a href="products.html">Products</a>\n    <a href="deals.html">Deals</a>\n    <a href="pricing.html">Plans</a>\n    <a href="dashboard.html">My Account</a>\n    <button type="button" class="nav-action notification-trigger" id="notificationButton" aria-expanded="false" aria-controls="notificationPanel">🔔 <span data-label="Notifications">Notifications</span> <span id="notificationBadge" class="notification-badge" hidden>0</span></button>\n    <label class="language-control"><span>🌐</span><select id="languageSelect" aria-label="Language"><option value="en">English</option><option value="fr">Français</option><option value="ht">Kreyòl</option></select></label>\n    <a class="nav-action login-link" href="login.html">🔐 <span data-label="Login">Login</span></a>\n    <button type="button" class="nav-action google-menu" id="googleMenuLogin">🟢 <span data-label="Continue with Google">Gmail / Google</span></button>\n    <div class="notification-panel" id="notificationPanel" hidden>\n      <div class="notification-head"><strong data-label="Notifications">Notifications</strong><button type="button" id="closeNotifications" aria-label="Close">×</button></div>\n      <div id="notificationList" class="notification-list"><div class="notification-empty">Someone is connected</div></div>\n      <a class="btn small" href="dashboard.html" data-label="View notifications">View notifications</a>\n    </div>\n  </nav>\n  <div id="presenceStatus" class="presence-status" role="status" aria-live="polite">Online</div>\n  <button type="button" class="menu" aria-label="Menu" aria-expanded="false" aria-controls="mainNav">☰</button>\n</header>'''
for p in root.glob('*.html'):
    s=p.read_text(encoding='utf-8')
    if '<div id="nav">' not in s: continue
    # Replace only the nav wrapper contents up to </div>, safe because header has no wrapper div nesting outside notification panel.
    s2=re.sub(r'<div id="nav">.*?</div>(?=<(?:section|main|div|script|footer))', '<div id="nav">'+header+'</div>', s, count=1, flags=re.S)
    if s2==s:
        # Fallback: from nav opening to first closing wrapper before main content; most files have exact header followed by </div><main
        s2=re.sub(r'<div id="nav">.*?</header></div>', '<div id="nav">'+header+'</div>', s, count=1, flags=re.S)
    p.write_text(s2,encoding='utf-8')
print('patched html')

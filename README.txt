Add your official EAGLE-J logo/eagle artwork here. V1 uses an emoji eagle so the site works immediately without copyrighted/third-party assets.


DIAGNOSTIC
If Register shows a network error, open test-connection.html on GitHub Pages. It will test the Supabase Auth endpoint and show an HTTP/network error instead of the generic Failed to fetch.


GLOBAL HEADER FIX (2026-10-06)
- Header is present in HTML instead of depending on JavaScript rendering.
- Mobile menu, language selector, and online-presence status remain available.
- Page scripts no longer overwrite an existing static header.

COUPLE ZONE — first connected web version

1) Open config.js and replace:
   PASTE_PROJECT_URL_HERE with https://whlzsdxaypyixltqdwnb.supabase.co
   PASTE_PUBLISHABLE_KEY_HERE with your sb_publishable_... key.
   Never put a Secret key or service_role key in this project.

2) In Supabase Dashboard > SQL Editor, create a NEW query and run database_setup.sql.
   This adds the secure invitation-code functions. It does not replace your existing tables.

3) Upload all files in this folder to a GitHub repository (repository root).
   Enable GitHub Pages: repository Settings > Pages > Deploy from a branch > main > /(root) > Save.
   Wait for the published website URL.

4) In Supabase Authentication > URL Configuration, set Site URL to your GitHub Pages URL.
   Add the same URL to Redirect URLs if needed.

Notes:
- This starter includes email/password registration and login, adult confirmation, profile creation,
  one invite code per couple space, joining by six-digit code, and a simple connection status.
- Supabase email confirmation may need to be clicked before first login.
- Do not share your password or secret/service_role key.
- This is a starter build; the 200+ content library, polished 3D illustrations, translations,
  and full privacy-policy/production review still need to be completed.

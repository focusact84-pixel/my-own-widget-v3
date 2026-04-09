
Supabase patch instructions

1. Create a Supabase project.
2. In Supabase -> SQL Editor, run schema.sql.
3. In Supabase -> Project Settings -> API, copy:
   - Project URL
   - anon / publishable key
4. Open supabase-config.js and replace:
   - YOUR_SUPABASE_URL
   - YOUR_SUPABASE_ANON_KEY
5. Upload all files in this ZIP to your GitHub repo root:
   - index.html
   - daily.html
   - weekly.html
   - monthly.html
   - yearly.html
   - styles.css
   - app.js
   - supabase-config.js
   - .nojekyll
6. In GitHub -> Settings -> Pages:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

Notes
- Use the same email/password on phone and computer to sync.
- This version no longer uses localStorage for app data.
- The UI is patched, not rewritten from scratch.

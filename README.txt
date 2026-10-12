Biocare intro integration (for existing plain HTML/JS application)
1. Upload biocare-intro.js and biocare-intro.css to the repository root.
2. Add <link rel="stylesheet" href="biocare-intro.css?v=1"> immediately after styles.css in index.html.
3. Add the following immediately before </body>, AFTER the existing app script:
<script>window.BIOCARE_SUPABASE_ANON_KEY = 'YOUR_EXISTING_PUBLIC_ANON_KEY';</script>
<script src="biocare-intro.js?v=1"></script>
IMPORTANT: Use only the public anon/publishable key, never the service_role key. Reuse existing public key configuration if possible.
4. Confirm that RLS allows public SELECT on intro_video_settings.
5. MOV may not play on Android or some browsers. Convert to MP4 H.264/AAC and update video_path accordingly.
6. This package provides the intro PLAYER ONLY. Admin upload UI and protected admin authorization are not yet implemented.
7. To avoid the existing splash overlay obscuring video, intro uses a higher z-index. Existing splash remains untouched.

# Biocare introductory video feature

This is an integration starter, not a deployed application update.

1. Run `intro.sql` in Supabase SQL editor; inspect existing policies for naming conflicts first.
2. Adjust `supabaseClient` import to your app.
3. Mount `<IntroVideo>` once around your application's root view; mount `<AdminIntro>` only in the existing authenticated admin dashboard.
4. Implement `POST /api/admin/intro` on the server. Verify the bearer token with Supabase Auth and independently check an administrator role against your app's authoritative admin table. Reject all non-admin requests. Parse multipart form data, validate JSON schema and mime/size (50MB), upload video with a unique safe path to `intro-videos` using a server-only service-role client, then upsert row id=1. Never expose service-role credentials to the browser. Return `{settings}`. Consider deleting superseded objects after successful commit.
5. Do not create permissive INSERT/UPDATE/DELETE RLS policies for `app_intro_settings` or the bucket. For production use, consider private video storage and signed URLs if campaigns are confidential.
6. Test autoplay on iOS/Android, slow networks, missing video, permissions, and frequency settings. The app continues to work if the intro cannot load.

The uploaded reference video is not embedded in these source files. Upload it through the completed admin endpoint after integration.

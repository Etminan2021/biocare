
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = "https://jlibhpavbqfeegsehekm.supabase.co";
const KEY = "sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK";

const db = createClient(URL, KEY, {
  auth: {
    storageKey: "biocare-admin-auth-v1",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

window.introVideoAdmin = async function () {
  const panel = document.getElementById("panel");
  panel.innerHTML = "<div class='card'>جارٍ تحميل إعدادات الفيديو...</div>";

  const { data, error } = await db
    .from("intro_video_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    panel.textContent = "تعذر تحميل الإعدادات: " + error.message;
    return;
  }

  const videoUrl = data.video_path
    ? db.storage.from("intro-videos").getPublicUrl(data.video_path).data.publicUrl
    : "";

  panel.innerHTML = `
    <div class="card" dir="rtl">
      <h2>إدارة فيديو البداية</h2>
      <p>يمكنك تغيير الفيديو وإعداداته مباشرة من هنا.</p>

      <label>تشغيل الفيديو</label>
      <select id="iv-enabled">
        <option value="true" ${data.enabled ? "selected" : ""}>مفعّل</option>
        <option value="false" ${!data.enabled ? "selected" : ""}>متوقف</option>
      </select>

      <label>تكرار العرض</label>
      <select id="iv-frequency">
        <option value="session" ${data.frequency === "session" ? "selected" : ""}>مرة لكل جلسة</option>
        <option value="always" ${data.frequency === "always" ? "selected" : ""}>عند كل فتح</option>
        <option value="daily" ${data.frequency === "daily" ? "selected" : ""}>مرة يوميًا</option>
      </select>

      <label>مدة العرض بالثواني (1 إلى 60)</label>
      <input id="iv-duration" type="number" min="1" max="60"
        value="${Number(data.max_duration_seconds) || 10}">

      <label>زر تخطي الفيديو</label>
      <select id="iv-skip">
        <option value="true" ${data.show_skip ? "selected" : ""}>إظهار</option>
        <option value="false" ${!data.show_skip ? "selected" : ""}>إخفاء</option>
      </select>

      <label>رفع فيديو جديد (MP4 أو MOV أو WebM، بحد أقصى 20MB)</label>
      <input id="iv-file" type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm">

      ${videoUrl ? `
        <p>الفيديو الحالي:</p>
        <video controls playsinline style="width:100%;max-height:260px"
          src="${escapeHtml(videoUrl)}"></video>
      ` : "<p>لا يوجد فيديو حاليًا.</p>"}

      <button id="iv-save" type="button">حفظ إعدادات فيديو البداية</button>
      <p id="iv-status" role="status"></p>
    </div>
  `;

  document.getElementById("iv-save").onclick = async () => {
    const button = document.getElementById("iv-save");
    const status = document.getElementById("iv-status");
    const file = document.getElementById("iv-file").files[0];
    const duration = Number(document.getElementById("iv-duration").value);

    if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
      status.textContent = "المدة يجب أن تكون بين 1 و60 ثانية.";
      return;
    }

    button.disabled = true;
    status.textContent = "جارٍ الحفظ...";

    try {
      const { data: admin, error: adminError } = await db.rpc("care_is_admin");
      if (adminError || admin !== true) {
        throw new Error("يجب تسجيل الدخول بحساب مدير النظام.");
      }

      let path = data.video_path;

      if (file) {
        const allowed = {
          "video/mp4": "mp4",
          "video/quicktime": "mov",
          "video/webm": "webm"
        };

        const extension = allowed[file.type];
        if (!extension) throw new Error("صيغة الفيديو غير مدعومة.");
        if (file.size > 20 * 1024 * 1024) {
          throw new Error("حجم الفيديو يتجاوز 20MB.");
        }

        path = `intro-${Date.now()}.${extension}`;
        const { error: uploadError } = await db.storage
          .from("intro-videos")
          .upload(path, file, { upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;
      }

      const { error: saveError } = await db
        .from("intro_video_settings")
        .update({
          enabled: document.getElementById("iv-enabled").value === "true",
          frequency: document.getElementById("iv-frequency").value,
          max_duration_seconds: duration,
          show_skip: document.getElementById("iv-skip").value === "true",
          video_path: path,
          updated_at: new Date().toISOString()
        })
        .eq("id", 1);

      if (saveError) throw saveError;

      status.textContent = "تم حفظ الإعدادات بنجاح.";
      await window.introVideoAdmin();
    } catch (err) {
      status.textContent = "تعذر الحفظ: " + err.message;
    } finally {
      button.disabled = false;
    }
  };
};

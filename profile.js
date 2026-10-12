// Biocare customer profile integration with Supabase profiles table.
// Loaded after app.js.
(() => {
  let profileData = null;
  let profileLoadedForId = null;
  let profileLoading = false;

  profile = function () {
    if (!authUser) {
      return `<section class="section"><div class="section-head"><h2 class="under">حسابي</h2></div><div class="card"><h3>حساب العميل</h3><p class="muted">سجّل الدخول بالبريد الإلكتروني للوصول إلى حسابك.</p><button class="primary" onclick="openLogin()">تسجيل الدخول / إنشاء حساب</button></div></section>`;
    }

    if (profileLoading && profileLoadedForId !== authUser.id) {
      return `<section class="section"><div class="section-head"><h2 class="under">حسابي</h2></div><div class="card"><h3>جارٍ تحميل الحساب...</h3><p class="muted">يتم جلب بياناتك بشكل آمن.</p></div></section>`;
    }

    const p = profileLoadedForId === authUser.id && profileData
      ? profileData
      : { full_name: '', phone: '' };

    return `<section class="section"><div class="section-head"><h2 class="under">حسابي</h2></div>
      <div class="card">
        <h3>بيانات العميل</h3>
        <form id="profileForm" onsubmit="saveProfile(event)">
          <label for="profileName">الاسم الكامل</label>
          <input id="profileName" type="text" autocomplete="name" maxlength="120" value="${esc(p.full_name || '')}" placeholder="الاسم الكامل" style="width:100%;padding:12px;margin:8px 0 14px">

          <label for="profilePhone">رقم الجوال</label>
          <input id="profilePhone" type="tel" autocomplete="tel" maxlength="25" value="${esc(p.phone || '')}" placeholder="05xxxxxxxx" style="width:100%;padding:12px;margin:8px 0 14px" dir="ltr">

          <label>البريد الإلكتروني</label>
          <input type="email" value="${esc(authUser.email || '')}" readonly style="width:100%;padding:12px;margin:8px 0 14px;background:#f5f5f5">

          <button class="primary" type="submit" id="profileSaveBtn">حفظ البيانات</button>
        </form>
        <p id="profileMessage" role="status" style="margin-top:12px"></p>
        <p class="micro-note">يتم حفظ الاسم ورقم الجوال في حسابك فقط، وتمنع سياسات الأمان المستخدمين الآخرين من الوصول إليها.</p>
        <button class="secondary" onclick="logout()">تسجيل الخروج</button>
      </div>
    </section>`;
  };

  async function loadProfile() {
    if (!authUser || profileLoading || profileLoadedForId === authUser.id) return;

    profileLoading = true;
    if (view === 'profile') originalRender();

    try {
      const client = await initAuth();
      const { data, error } = await client
        .from('profiles')
        .select('id,full_name,phone')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      profileData = data || {
        id: authUser.id,
        full_name: '',
        phone: ''
      };
      profileLoadedForId = authUser.id;
    } catch (error) {
      console.error('Biocare profile load error:', error);
      profileData = {
        id: authUser.id,
        full_name: '',
        phone: ''
      };
      profileLoadedForId = authUser.id;
      setTimeout(() => toast('تعذر تحميل بيانات الحساب. حاول مجددًا.'), 0);
    } finally {
      profileLoading = false;
      if (view === 'profile') originalRender();
    }
  }

  window.saveProfile = async (event) => {
    event?.preventDefault();

    if (!authUser) {
      openLogin();
      return;
    }

    const full_name = document.getElementById('profileName')?.value.trim() || '';
    const phone = document.getElementById('profilePhone')?.value.trim() || '';
    const msg = document.getElementById('profileMessage');
    const btn = document.getElementById('profileSaveBtn');

    if (btn) btn.disabled = true;
    if (msg) {
      msg.textContent = 'جارٍ حفظ البيانات...';
      msg.style.color = '#176744';
    }

    try {
      const client = await initAuth();
      const row = {
        id: authUser.id,
        full_name,
        phone
      };

      const { error } = await client
        .from('profiles')
        .upsert(row, { onConflict: 'id' });

      if (error) throw error;

      profileData = row;
      profileLoadedForId = authUser.id;

      if (msg) {
        msg.textContent = 'تم حفظ بياناتك بنجاح.';
        msg.style.color = '#176744';
      }
      toast('تم حفظ بيانات الحساب');
    } catch (error) {
      console.error('Biocare profile save error:', error);
      if (msg) {
        msg.textContent = 'تعذر حفظ البيانات. حاول مجددًا.';
        msg.style.color = '#b42318';
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  const originalRender = render;
  render = function () {
    originalRender();
    if (view === 'profile' && authUser) loadProfile();
  };

  // Refresh the current page if the user was already on the profile view.
  if (view === 'profile') render();
})();

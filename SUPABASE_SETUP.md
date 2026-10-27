# 把「朝暮」变成两台设备共享的线上版

GitHub Pages 只能放网页，不能保存两个人共同编辑的照片和留言。  
所以这个版本用 **GitHub Pages 放网站 + Supabase 放你们的数据**，两边都免费。

只需要额外一个 **Supabase 免费账号**，可以直接用 GitHub 登录。

---

## 你需要准备

- 一个 GitHub 账号
- 一个 Supabase 账号（在 supabase.com 用 GitHub 登录即可）
- 大约 15 分钟

---

## 第 1 步：创建 Supabase 项目

1. 打开 [supabase.com](https://supabase.com)，点 **Start your project**。
2. 选择 **Continue with GitHub**，用 GitHub 登录。
3. 新建一个项目，例如：
   - Name：`zhaomu`
   - Database Password：设一个强密码并保存好（不是网站登录密码，是数据库密码）
   - Region：选 **Southeast Asia (Singapore)** 或离你们最近的区域
4. 创建后等 1～2 分钟，让数据库准备好。

---

## 第 2 步：创建数据表

1. 在 Supabase 左侧点 **SQL Editor**。
2. 点 **New query**。
3. 打开本项目的 `supabase/schema.sql`，把**全部内容**复制进去。
4. 点 **Run**，看到成功即可。

这一步会创建：

- `couple_state`：保存你们的名字、照片、纸条、心愿
- `couple_owner`：白名单，只有被加入这个表的账号才能读取和修改
- 行级安全策略（RLS）和自动更新时间

---

## 第 3 步：创建你们的登录账号

> Supabase 在 2025～2026 改过界面。下面按新版写法说明；如果按钮文字略有不同，按位置找即可。

1. 左侧进入 **Authentication → Users**。
2. 点右上角 **Add user**，选择 **Create new user**。
   - 不要选 **Send invitation**。我们要的是直接创建邮箱 + 密码账号。
3. 填你们的邮箱和密码。
   - 如果弹窗里有 **Auto Confirm User** 开关，打开它。
   - **如果没看到这个开关，不用找了**，直接创建用户；下一步用 SQL 帮你确认邮箱。
4. 创建成功后，回到 **SQL Editor**，新建查询并运行下面的 SQL（把邮箱换成你刚创建的邮箱）：

```sql
-- 1. 确认邮箱，避免登录时提示 Email not confirmed
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email = '你们刚刚创建的邮箱';

-- 2. 把账号加入白名单
insert into public.couple_owner (user_id)
select id from auth.users where email = '你们刚刚创建的邮箱'
on conflict (user_id) do nothing;
```

运行成功后再看 **Authentication → Users**，这个账号应该显示为已确认（Confirmed）。

如果你们想各自拥有一个账号，可以再创建一个用户，并把它的邮箱也执行一遍上面的 SQL。两个人用同一个账号登录也可以。

> 建议同时关闭公开注册：
> **Authentication → Sign In / Providers → Email**，关闭 **Allow new users to sign up**。
> 即使不关闭，`couple_owner` 白名单也会保护数据；但关闭更稳妥。

---

## 第 4 步：找到 Project URL 和 Publishable key

Supabase 新版界面**已经没有单独的 Settings → API 页面了**，不要在那里找。

### 方法 A：Connect 弹窗（最快）

1. 进入 Supabase 项目首页。
2. 点页面顶部的 **Connect** 按钮。
3. 在弹出的窗口里可以看到：
   - **Project URL**
   - **Publishable key**（`sb_publishable_...`）

### 方法 B：Project Settings → API Keys

1. 点左侧最下方的 **Project Settings**。
2. 进入 **API Keys**。
3. 切换到 **Publishable and secret API keys** 标签页。
4. 复制：
   - **Project URL**（页面顶部，或 Connect 弹窗里）
   - **Publishable key**（`sb_publishable_...`）

如果你的项目还没有新式 key：

- 页面上会有 **Create new API keys** 按钮，点一下生成。
- 也可以切到 **Legacy API keys** 标签，复制旧版的 **anon public** key（`eyJ...`）。
- 两个都可以用。

> **绝对不要**复制 **Secret key** 或 **service_role** key。  
> Secret / service_role 会绕过所有权限保护，不能放进网页。

拿到后打开 `assets/js/config.js`：

```js
window.ZHAOMU_CONFIG = {
  supabaseUrl: "https://xxxxxxxx.supabase.co",
  supabaseAnonKey: "sb_publishable_xxxxxxxx"
};
```

旧版 anon key 也可以填在 `supabaseAnonKey` 里：

```js
supabaseAnonKey: "eyJhbGciOi..."
```

对应官方说明：

- [Supabase API Keys / Find your keys](https://supabase.com/docs/guides/getting-started/api-keys#find-your-keys)
- [Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)

---

## 第 5 步：本地先试一次

1. 双击 `index.html`。
2. 会出现「只属于我们的小宇宙」登录页。
3. 用第 3 步创建的邮箱和密码登录。
4. 写一张纸条/上传一张照片。
5. 打开另一个浏览器（或另一台设备），用同一个账号登录，确认能看到同一份内容。
6. 右上角的「已同步」可以点击，手动检查另一台设备的新内容。

如果这一步通过，说明云端已经通了。

---

## 第 6 步：传上 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `zhaomu`。
   - 免费账号的 Pages 需要 **public** 仓库。
   - 代码和示例图会公开，但你们的真实数据在 Supabase 里，受登录和白名单保护。
2. 进入仓库，点 **Add file → Upload files**。
3. 把本项目文件夹里的这些内容拖进去（保持在仓库根目录）：
   - `index.html`
   - `assets/`
   - `supabase/`
   - `README.md`
   - `打开网站.bat`（可选）
   - `preview/`（可选）
4. 点 **Commit changes**。
5. 进入仓库的 **Settings → Pages**。
6. **Build and deployment → Source** 选 **Deploy from a branch**。
7. Branch 选 **main**，文件夹选 **/ (root)**，点 **Save**。
8. 等 1～3 分钟，页面顶部会出现网址，形如：

```text
https://你的用户名.github.io/zhaomu/
```

这个网址就是你们以后在任何设备上打开的地址。电脑关机也不影响。

---

## 第 7 步：在手机和电脑上登录

在两台设备上都打开 GitHub Pages 网址，用同一个邮箱和密码登录。

之后：

- 任意一台设备修改内容，另一台在 20 秒内、切回页面时、或点击右上角「已同步」时同步。
- 同一时间两台设备都修改时，以最后一次保存为准。
- 「定制 → 我们的数据」里仍可导出/导入 JSON 备份。

---

## 数据与安全

- 网站本身是静态页面，可以公开。
- 照片、纸条、心愿、名字存在**你的 Supabase 项目**里，不在 GitHub。
- 只有 `couple_owner` 白名单中的账号能读写数据。
- 数据库密码、Secret key / `service_role` key 不要写进前端，也不要发给别人。
- 清理浏览器数据只会退出登录，不会删除云端内容。
- 忘记密码：在 Supabase **Authentication → Users** 里重置，或重新创建一个用户并加入白名单。

---

## 免费额度与注意事项

- Supabase 免费项目长时间完全无访问会被暂停；进入 Supabase 控制台点 **Restore project** 即可恢复，数据还在。
- GitHub Pages 免费、稳定，适合这种静态网站。
- 当前版本把照片压缩后作为 Base64 存在数据库里，单次同步约限制 4.6MB。
  - 正常情侣相册建议保留 20～30 张精修照片。
  - 如果想要几百张原图，需要再接入 Supabase Storage；可以继续让我加。
- 同时编辑时是「后保存覆盖前保存」，不会自动合并两份修改。

---

## 常见问题

**登录页提示「云端数据表还没创建」**  
→ 第 2 步的 `schema.sql` 没有执行成功，回 Supabase SQL Editor 重新运行。

**登录页提示「没有权限读取云端内容」**  
→ 第 3 步的白名单 SQL 没有执行，或者邮箱写错了。

**登录页提示「邮箱或密码不正确」**  
→ 检查账号是否在 Authentication → Users 里。  
→ 如果提示的是 `Email not confirmed`，回到第 3 步运行那段 `update auth.users ...` SQL。

**页面打开 404**  
→ GitHub Pages 的分支或目录选错了；`index.html` 必须在仓库根目录。

**修改后另一台设备没变**  
→ 等 20 秒，或点右上角「已同步」；再确认两台设备登录的是同一个账号。

**想退回单机版**  
→ 把 `assets/js/config.js` 里的两个值清空，网站就恢复为本地模式（数据不会自动迁移）。

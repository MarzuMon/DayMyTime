

# Plan: Content System Fixes and Author Dashboard Enhancements

## Issues to Fix

### 1. Publish button race condition
The "Publish" button uses `setForm` then `setTimeout(savePost, 0)` -- this is unreliable because React state updates are async. Fix by passing status directly to `savePost` as a parameter.

### 2. Post links broken (slug routes missing)
Share buttons generate URLs like `/history/march-12-...` but no route exists for `/history/:slug` or `/todaytip/:slug`. The app only has `/history` and `/todaytip`. Fix by adding slug-based routes that load the specific post.

### 3. Remove Teams and Templates tabs from Author page
Remove the `teams` and `templates` TabsTriggers and TabsContent, plus their imports.

## New Features

### 4. Instagram share button
Add Instagram share (copy link with toast since Instagram has no web share API) to both public pages and the author PostList.

### 5. Post link copy button
Add a "Copy Link" button next to share buttons on public pages and in the PostList on the author dashboard.

### 6. All share options in PostList (author page)
Add share buttons (Twitter, Facebook, LinkedIn, Instagram, Copy Link) to each post row in the author ContentManagementTab PostList.

### 7. Page preview in author page
Add an "eye/preview" button on each post in PostList that opens the post's public URL in a new tab.

### 8. Draft post scheduling
Add a "Schedule" status option: admin can set a future publish date with status "scheduled". Add a select dropdown in the dialog footer for Draft / Scheduled / Published.

### 9. Content analytics in author page (views/visitors)
Add a Content Analytics card showing total posts, published count, total likes, and a simple per-post views display. Since we don't have a page_views table, create one to track views from the public pages.

## Technical Details

### Database changes
- Create `page_views` table with columns: `id`, `page_path`, `post_id` (nullable), `created_at`, `viewer_ip` (nullable text). Public insert, admin select. This tracks views from History and TodayTip pages.

### File changes

**`src/App.jsx`**
- Add routes: `/history/:slug` and `/todaytip/:slug` pointing to the same History/TodayTip components.

**`src/pages/History.tsx`**
- Accept `useParams` slug param; if present, fetch that specific post on load.
- Add Instagram share + Copy Link buttons.
- Insert a page view record on post load.

**`src/pages/TodayTip.tsx`**  
- Same slug routing, Instagram share, Copy Link, page view tracking.

**`src/components/author/ContentManagementTab.tsx`**
- Fix `savePost` to accept explicit status parameter instead of relying on async state.
- Add share buttons (Twitter, FB, LinkedIn, Instagram, Copy Link) + preview link to PostList.
- Add "Scheduled" status option in the dialog footer with a date/time picker.
- Add a Content Analytics summary card (total posts, published, likes, views from `page_views`).

**`src/pages/Author.tsx`**
- Remove Teams and Templates tab triggers, tab contents, and their component imports.

### Slug routing logic
When `/history/:slug` is hit, the component checks `useParams().slug`. If present, it queries `history_posts` where `slug = param AND status = 'published'` and sets that as the selected post. Same pattern for `/todaytip/:slug`.


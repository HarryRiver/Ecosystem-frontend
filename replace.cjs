const fs = require('fs');

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Sidebar visibility
content = content.replace(
  /<aside className="flex w-64 shrink-0 flex-col gap-3 border-r([^>]+) lg:sticky lg:top-0 lg:h-screen">/,
  '<aside className="hidden w-64 shrink-0 flex-col gap-3 border-r$1 lg:sticky lg:top-0 lg:flex lg:h-screen">'
);

// 2. Header and padding
const newHeader = `<header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#DFF0E5] bg-white/90 px-4 py-3 backdrop-blur-sm lg:px-8 lg:py-4">
          <div className="min-w-0 flex-1 pr-4">
            <h1 className="truncate text-xl font-bold text-[#103B2D] lg:text-2xl">
              {activeTab === 'overview' && 'Tổng quan'}
              {activeTab === 'users'    && 'Quản lý khách hàng'}
              {activeTab === 'pricing'  && 'Bảng giá dịch vụ'}
              {activeTab === 'orders'   && 'Quản lý đơn hàng'}
            </h1>
            <p className="mt-0.5 truncate text-xs text-[#6D877A] lg:text-sm">
              {activeTab === 'overview' && 'Số liệu & tình trạng hoạt động'}
              {activeTab === 'users'    && \`\${customerRows.length} khách hàng\`}
              {activeTab === 'pricing'  && 'Điều chỉnh giá trực tiếp'}
              {activeTab === 'orders'   && \`\${pendingCount} đơn cần xử lý\`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#EBF7F0] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#2F855A] sm:inline-block">
              Live
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 lg:hidden"
            >
              <IconLogout />
            </button>
          </div>
        </header>

        <div className="p-4 pb-24 lg:p-8">`;

content = content.replace(
  /<header className="sticky top-0 z-20 flex items-center justify-between border-b border-\[#DFF0E5\] bg-white\/90 px-8 py-4 backdrop-blur-sm">[\s\S]*?<\/header>\s*<div className="p-6 lg:p-8">/,
  newHeader
);

// 3. Search input wrap
const newSearch = `<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  className="w-full sm:flex-1 sm:min-w-[260px] rounded-full border border-[#DFF0E5] bg-white px-4 py-2.5 text-sm outline-none shadow-sm transition-colors focus:border-[#2F855A]"
                />
                <div className="flex flex-wrap gap-2 justify-start">`;

content = content.replace(
  /<div className="flex flex-wrap gap-3">\s*<input\s*value={query}\s*onChange={\(e\) => setQuery\(e\.target\.value\)}\s*placeholder="Tìm theo tên, email, số điện thoại\.\.\."\s*className="min-w-\[260px\] flex-1 rounded-full border border-\[#DFF0E5\] bg-white px-4 py-2\.5 text-sm outline-none shadow-sm transition-colors focus:border-\[#2F855A\]"\s*\/>\s*<div className="flex flex-wrap gap-2">/,
  newSearch
);

// 4. Bottom nav
const newFooter = `</main>

      {/* ══ MOBILE BOTTOM NAV ══════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#DFF0E5] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(16,59,45,0.06)] lg:hidden">
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors',
                isActive ? 'text-[#103B2D]' : 'text-[#8AA89A] hover:text-[#476458]'
              )}
            >
              {isActive && (
                <span className="absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-[#2F855A]" />
              )}
              <NavIcon id={id} active={isActive} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              {id === 'orders' && pendingCount > 0 && (
                <span className="absolute right-3 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white ring-2 ring-white">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}`;

content = content.replace(
  /<\/main>\s*<\/div>\s*\);\s*}/,
  newFooter
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content, 'utf8');
console.log('AdminDashboard updated.');

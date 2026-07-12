import Link from 'next/link';

export const AdminNavigation = () => (
  <nav className="flex flex-wrap gap-[8px] mb-[8px]">
    <Link
      className="px-[12px] py-[8px] border border-newTableBorder rounded-[6px]"
      href="/admin/stats"
    >
      Stats
    </Link>
    <Link
      className="px-[12px] py-[8px] border border-newTableBorder rounded-[6px]"
      href="/admin/errors"
    >
      Errors
    </Link>
    <Link
      className="px-[12px] py-[8px] border border-newTableBorder rounded-[6px]"
      href="/admin/notifications"
    >
      Email notifications
    </Link>
  </nav>
);

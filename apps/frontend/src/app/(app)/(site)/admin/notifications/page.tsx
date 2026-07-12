export const dynamic = 'force-dynamic';
import { AdminNotificationSettingsComponent } from '@gitroom/frontend/components/admin/admin-notification-settings.component';
import { AdminNavigation } from '@gitroom/frontend/components/admin/admin-navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Postiz Admin Notification Settings',
  description: '',
};

export default async function Page() {
  return (
    <div className="bg-newBgColorInner flex-1 flex-col flex p-[20px] gap-[12px]">
      <AdminNavigation />
      <AdminNotificationSettingsComponent />
    </div>
  );
}

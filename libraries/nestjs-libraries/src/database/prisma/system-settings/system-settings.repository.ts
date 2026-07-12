import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export type UpdateSystemNotificationSettings = {
  emailDigestIntervalMinutes: number;
  emailFailureNotificationsImmediate: boolean;
};

@Injectable()
export class SystemSettingsRepository {
  constructor(private _systemSettings: PrismaRepository<'systemSettings'>) {}

  getNotificationSettings() {
    return this._systemSettings.model.systemSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global' },
      update: {},
      select: {
        emailDigestIntervalMinutes: true,
        emailFailureNotificationsImmediate: true,
        updatedAt: true,
      },
    });
  }

  updateNotificationSettings(settings: UpdateSystemNotificationSettings) {
    return this._systemSettings.model.systemSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', ...settings },
      update: settings,
      select: {
        emailDigestIntervalMinutes: true,
        emailFailureNotificationsImmediate: true,
        updatedAt: true,
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import {
  SystemSettingsRepository,
  UpdateSystemNotificationSettings,
} from '@gitroom/nestjs-libraries/database/prisma/system-settings/system-settings.repository';

@Injectable()
export class SystemSettingsService {
  constructor(private _systemSettingsRepository: SystemSettingsRepository) {}

  getNotificationSettings() {
    return this._systemSettingsRepository.getNotificationSettings();
  }

  updateNotificationSettings(settings: UpdateSystemNotificationSettings) {
    return this._systemSettingsRepository.updateNotificationSettings(settings);
  }
}

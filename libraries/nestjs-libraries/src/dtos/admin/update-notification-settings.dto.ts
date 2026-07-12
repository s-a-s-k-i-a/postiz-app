import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsInt()
  @Min(1)
  @Max(1440)
  emailDigestIntervalMinutes!: number;

  @IsBoolean()
  emailFailureNotificationsImmediate!: boolean;
}

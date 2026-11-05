import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  Radio,
  Field,
  TabList,
  Tab,
  Switch,
  Select,
  makeStyles,
  tokens,
  shorthands,
  Caption1,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import {
  DismissRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
  DesktopRegular,
  ColorRegular,
  SettingsRegular,
  AlertRegular,
} from '@fluentui/react-icons';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { useLanguage, SupportedLanguage, supportedLanguages } from '../../i18n/LanguageContext';
import { useSettings } from '../../settings/SettingsContext';

const useStyles = makeStyles({
  surface: {
    maxWidth: '640px',
    width: '90vw',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  bodyLayout: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalXL),
    minHeight: '320px',
    marginTop: tokens.spacingVerticalM,
  },
  sideNav: {
    width: '160px',
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('0', tokens.spacingHorizontalS, '0', '0'),
  },
  contentArea: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    marginBottom: tokens.spacingVerticalS,
  },
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    cursor: 'pointer',
    marginBottom: tokens.spacingVerticalS,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  radioSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
  },
  toggleText: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
});

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const styles = useStyles();
  const { themeMode } = useTheme();
  const { language, t } = useLanguage();
  const { notifyBanners, notifySounds, notifyEmailDigest, updateSettings } = useSettings();

  const [selectedTab, setSelectedTab] = useState<'general' | 'notifications'>('general');

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as 'general' | 'notifications');
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface} aria-label={t('settings', 'Settings')}>
        <DialogBody>
          <div className={styles.headerRow}>
            <DialogTitle style={{ margin: 0 }}>{t('settings', 'Settings')}</DialogTitle>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              aria-label={t('closeSettings', 'Close settings')}
              onClick={() => onOpenChange(false)}
            />
          </div>

          <div className={styles.bodyLayout}>
            {/* Sidebar navigation */}
            <div className={styles.sideNav}>
              <TabList
                vertical
                selectedValue={selectedTab}
                onTabSelect={handleTabSelect}
                aria-label="Settings Categories"
              >
                <Tab value="general" icon={<SettingsRegular />}>
                  {t('general', 'General')}
                </Tab>
                <Tab value="notifications" icon={<AlertRegular />}>
                  {t('notifications', 'Notifications')}
                </Tab>
              </TabList>
            </div>

            {/* Main content pane */}
            <DialogContent className={styles.contentArea}>
              {selectedTab === 'general' && (
                <div>
                  {/* Theme Mode */}
                  <div className={styles.sectionTitle}>{t('theme', 'Theme')}</div>
                  <Caption1 style={{ display: 'block', marginBottom: tokens.spacingVerticalM, color: tokens.colorNeutralForeground2 }}>
                    {t('themeSubtitle', 'Choose how BCC Teams looks on your device.')}
                  </Caption1>

                  <Field label={t('displayTheme', 'Display Theme')}>
                    <RadioGroup
                      value={themeMode}
                      aria-label="Theme Selection"
                      onChange={(_, data) => void updateSettings({ theme: data.value as ThemeMode })}
                    >
                      <Radio
                        value="light"
                        label={t('light', 'Light')}
                        className={`${styles.radioOption} ${themeMode === 'light' ? styles.radioSelected : ''}`}
                      />
                      <Radio
                        value="dark"
                        label={t('dark', 'Dark')}
                        className={`${styles.radioOption} ${themeMode === 'dark' ? styles.radioSelected : ''}`}
                      />
                      <Radio
                        value="high-contrast"
                        label={t('highContrast', 'High Contrast')}
                        className={`${styles.radioOption} ${themeMode === 'high-contrast' ? styles.radioSelected : ''}`}
                      />
                      <Radio
                        value="system"
                        label={t('systemDefault', 'System default')}
                        className={`${styles.radioOption} ${themeMode === 'system' ? styles.radioSelected : ''}`}
                      />
                    </RadioGroup>
                  </Field>

                  {/* Language Selection */}
                  <div style={{ marginTop: tokens.spacingVerticalXL }}>
                    <div className={styles.sectionTitle}>{t('language', 'Language')}</div>
                    <Caption1 style={{ display: 'block', marginBottom: tokens.spacingVerticalM, color: tokens.colorNeutralForeground2 }}>
                      {t('languageSubtitle', 'Select your preferred application display language.')}
                    </Caption1>
                    <Field label={t('appLanguage', 'App Language')}>
                      <Select
                        value={language}
                        aria-label="App Language Selection"
                        onChange={(ev, data) => {
                          const val = (data?.value || ev.target.value) as SupportedLanguage;
                          void updateSettings({ language: val });
                        }}
                      >
                        {supportedLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.nativeName} ({lang.label})
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>
              )}

              {selectedTab === 'notifications' && (
                <div>
                  <div className={styles.sectionTitle}>{t('notificationPreferences', 'Notification Preferences')}</div>
                  <Caption1 style={{ display: 'block', marginBottom: tokens.spacingVerticalM, color: tokens.colorNeutralForeground2 }}>
                    {t('notificationSubtitle', 'Configure alert sounds, popups, and email digests.')}
                  </Caption1>

                  {/* Banner toasts */}
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleText}>
                      <span style={{ fontWeight: tokens.fontWeightSemibold }}>
                        {t('bannerToasts', 'Banner pop-up toasts')}
                      </span>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        {t('bannerToastsDesc', 'Display desktop notification banners for direct mentions and replies')}
                      </Caption1>
                    </div>
                    <Switch
                      checked={notifyBanners}
                      aria-label={t('bannerToasts', 'Banner pop-up toasts')}
                      onChange={(ev, data) => void updateSettings({ notifyBanners: data.checked ?? ev.currentTarget.checked })}
                    />
                  </div>

                  {/* Sound alerts */}
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleText}>
                      <span style={{ fontWeight: tokens.fontWeightSemibold }}>
                        {t('soundAlerts', 'Sound alerts')}
                      </span>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        {t('soundAlertsDesc', 'Play audio chimes for incoming messages and call rings')}
                      </Caption1>
                    </div>
                    <Switch
                      checked={notifySounds}
                      aria-label={t('soundAlerts', 'Sound alerts')}
                      onChange={(ev, data) => void updateSettings({ notifySounds: data.checked ?? ev.currentTarget.checked })}
                    />
                  </div>

                  {/* Email digest */}
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleText}>
                      <span style={{ fontWeight: tokens.fontWeightSemibold }}>
                        {t('emailDigest', 'Missed activity email digest')}
                      </span>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        {t('emailDigestDesc', 'Receive periodic email summaries of missed mentions and chats')}
                      </Caption1>
                    </div>
                    <Switch
                      checked={notifyEmailDigest}
                      aria-label={t('emailDigest', 'Missed activity email digest')}
                      onChange={(ev, data) => void updateSettings({ notifyEmailDigest: data.checked ?? ev.currentTarget.checked })}
                    />
                  </div>
                </div>
              )}
            </DialogContent>
          </div>

          <DialogActions style={{ marginTop: tokens.spacingVerticalL }}>
            <Button appearance="primary" onClick={() => onOpenChange(false)}>
              {t('done', 'Done')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

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
  makeStyles,
  tokens,
  shorthands,
  Body1,
  Caption1,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import {
  DismissRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
  DesktopRegular,
  SettingsRegular,
  AlertRegular,
} from '@fluentui/react-icons';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';

const useStyles = makeStyles({
  surface: {
    maxWidth: '620px',
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
    minHeight: '280px',
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
    transitionProperty: 'background-color, border-color',
    transitionDuration: tokens.durationFaster,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  radioSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
});

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const styles = useStyles();
  const { themeMode, setThemeMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'general' | 'notifications'>('general');

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as 'general' | 'notifications');
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface} aria-label="Application Settings">
        <DialogBody>
          <div className={styles.headerRow}>
            <DialogTitle style={{ margin: 0 }}>Settings</DialogTitle>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              aria-label="Close settings"
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
                  General
                </Tab>
                <Tab value="notifications" icon={<AlertRegular />}>
                  Notifications
                </Tab>
              </TabList>
            </div>

            {/* Main settings pane */}
            <DialogContent className={styles.contentArea}>
              {selectedTab === 'general' && (
                <div>
                  <div className={styles.sectionTitle}>Theme</div>
                  <Caption1 style={{ display: 'block', marginBottom: tokens.spacingVerticalM, color: tokens.colorNeutralForeground2 }}>
                    Choose how BCC Teams looks on your device.
                  </Caption1>

                  <Field label="Display Theme">
                    <RadioGroup
                      value={themeMode}
                      onChange={(_, data) => setThemeMode(data.value as ThemeMode)}
                      aria-label="Theme Selection"
                    >
                      <label className={`${styles.radioOption} ${themeMode === 'light' ? styles.radioSelected : ''}`}>
                        <Radio value="light" label="Light" />
                        <WeatherSunnyRegular style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground2 }} />
                      </label>

                      <label className={`${styles.radioOption} ${themeMode === 'dark' ? styles.radioSelected : ''}`}>
                        <Radio value="dark" label="Dark" />
                        <WeatherMoonRegular style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground2 }} />
                      </label>

                      <label className={`${styles.radioOption} ${themeMode === 'system' ? styles.radioSelected : ''}`}>
                        <Radio value="system" label="System default" />
                        <DesktopRegular style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground2 }} />
                      </label>
                    </RadioGroup>
                  </Field>
                </div>
              )}

              {selectedTab === 'notifications' && (
                <div>
                  <div className={styles.sectionTitle}>Notifications</div>
                  <Body1 block style={{ color: tokens.colorNeutralForeground2 }}>
                    Notification banners and sound preferences are managed here.
                  </Body1>
                  <Caption1 style={{ display: 'block', marginTop: tokens.spacingVerticalM, color: tokens.colorNeutralForeground3 }}>
                    Fine-grained notification controls will be configured in F-005.
                  </Caption1>
                </div>
              )}
            </DialogContent>
          </div>

          <DialogActions style={{ marginTop: tokens.spacingVerticalL }}>
            <Button appearance="primary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

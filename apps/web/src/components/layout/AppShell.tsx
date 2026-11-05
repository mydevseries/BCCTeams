import React, { useState } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { TopBar } from './TopBar';
import { AppBar } from './AppBar';
import { ListPane } from './ListPane';
import { MainPane } from './MainPane';
import { MemberProfile } from '@bcc/shared';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    boxSizing: 'border-box',
  },
  appBody: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    minWidth: 0,
  },
});

export const AppShell: React.FC = () => {
  const styles = useStyles();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);

  return (
    <div className={styles.root}>
      {/* 1. TOP BAR (48px tall) */}
      <TopBar
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenStatusMessage={() => setIsStatusModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSelectMember={setSelectedMember}
      />

      {/* APP BODY (Left bar 68px + List pane 320px + Main pane) */}
      <div className={styles.appBody}>
        {/* 2. LEFT APP BAR (68px wide) */}
        <AppBar />

        {/* 3. LIST PANE (320px resizable) */}
        <ListPane />

        {/* 4. MAIN PANE (Flexible, min-width: 0) */}
        <MainPane
          isProfileModalOpen={isProfileModalOpen}
          setIsProfileModalOpen={setIsProfileModalOpen}
          isStatusModalOpen={isStatusModalOpen}
          setIsStatusModalOpen={setIsStatusModalOpen}
          isSettingsModalOpen={isSettingsModalOpen}
          setIsSettingsModalOpen={setIsSettingsModalOpen}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
        />
      </div>
    </div>
  );
};

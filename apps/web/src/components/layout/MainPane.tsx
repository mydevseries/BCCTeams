import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Outlet } from 'react-router-dom';
import { ProfileModal } from '../profile/ProfileModal';
import { SettingsModal } from '../settings/SettingsModal';
import { StatusMessageModal } from '../presence/StatusMessageModal';
import { MemberProfileCard } from '../profile/MemberProfileCard';
import { MemberProfile } from '@bcc/shared';

const useStyles = makeStyles({
  mainPane: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
});

interface MainPaneProps {
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isStatusModalOpen: boolean;
  setIsStatusModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  selectedMember: MemberProfile | null;
  setSelectedMember: (member: MemberProfile | null) => void;
}

export const MainPane: React.FC<MainPaneProps> = ({
  isProfileModalOpen,
  setIsProfileModalOpen,
  isStatusModalOpen,
  setIsStatusModalOpen,
  isSettingsModalOpen,
  setIsSettingsModalOpen,
  selectedMember,
  setSelectedMember,
}) => {
  const styles = useStyles();

  return (
    <main className={styles.mainPane} role="main">
      <Outlet />

      <ProfileModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />

      <StatusMessageModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
      />

      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />

      <MemberProfileCard
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      />
    </main>
  );
};


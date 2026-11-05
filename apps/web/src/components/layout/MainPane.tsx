import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Outlet, useNavigate } from 'react-router-dom';
import { ProfileModal } from '../profile/ProfileModal';
import { SettingsModal } from '../settings/SettingsModal';
import { AdminRolesModal } from '../../roles';
import { StatusMessageModal } from '../presence/StatusMessageModal';
import { MemberProfileCard } from '../profile/MemberProfileCard';
import { MemberProfile } from '@bcc/shared';
import { useChat } from '../../chat/ChatContext';

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
  isRolesModalOpen: boolean;
  setIsRolesModalOpen: (open: boolean) => void;
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
  isRolesModalOpen,
  setIsRolesModalOpen,
  selectedMember,
  setSelectedMember,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { selectRecipient } = useChat();

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

      <AdminRolesModal
        open={isRolesModalOpen}
        onOpenChange={setIsRolesModalOpen}
      />

      <MemberProfileCard
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
        onStartChat={() => {
          if (selectedMember) {
            selectRecipient(selectedMember);
            navigate('/chat');
            setSelectedMember(null);
          }
        }}
      />
    </main>
  );
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { RequestAccessModal } from './RequestAccessModal';
import { AccessRequestsTab } from './AccessRequestsTab';
import { filesApi } from './files.api';
import { FileAccessRequestDto } from './types';

vi.mock('./files.api', () => ({
  filesApi: {
    createAccessRequest: vi.fn(),
    getPendingRequests: vi.fn(),
    reviewAccessRequest: vi.fn(),
  },
}));

describe('File Access Requests (D-009)', () => {
  describe('RequestAccessModal', () => {
    it('submits an access request with note and requested permission', async () => {
      vi.mocked(filesApi.createAccessRequest).mockResolvedValue({
        id: 'req-1',
        fileId: 'f-secret',
        requesterId: 'u2',
        requestedPermission: 'VIEW',
        status: 'PENDING',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });

      render(
        <FluentProvider theme={webLightTheme}>
          <RequestAccessModal
            fileId="f-secret"
            fileName="Confidential.pdf"
            isOpen={true}
            onClose={vi.fn()}
            token="test-token"
          />
        </FluentProvider>
      );

      expect(screen.getByText('Request access')).toBeInTheDocument();
      expect(screen.getByText('Confidential.pdf')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Explain why you need access/i);
      fireEvent.change(textarea, { target: { value: 'Need for quarterly review' } });

      const submitBtn = screen.getByTestId('submit-access-request-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(filesApi.createAccessRequest).toHaveBeenCalledWith('test-token', {
          fileId: 'f-secret',
          requestedPermission: 'VIEW',
          note: 'Need for quarterly review',
        });
        expect(screen.getByTestId('access-request-submitted')).toBeInTheDocument();
      });
    });
  });

  describe('AccessRequestsTab (Owner review)', () => {
    const mockPending: FileAccessRequestDto[] = [
      {
        id: 'req-10',
        fileId: 'f-1',
        requesterId: 'u-requester',
        requestedPermission: 'VIEW',
        status: 'PENDING',
        note: 'Please approve access for budgeting',
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        file: {
          id: 'f-1',
          name: 'Budget2026.xlsx',
          isFolder: false,
          mimeType: 'application/vnd.ms-excel',
          size: 4096,
        },
        requester: {
          id: 'u-requester',
          email: 'colleague@bcc.com',
          displayName: 'Colleague User',
        },
      },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(filesApi.getPendingRequests).mockResolvedValue(mockPending);
    });

    it('renders pending requests list for file owner', async () => {
      render(
        <FluentProvider theme={webLightTheme}>
          <AccessRequestsTab token="test-token" />
        </FluentProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('request-card-req-10')).toBeInTheDocument();
        expect(screen.getByText('Colleague User')).toBeInTheDocument();
        expect(screen.getByText('Budget2026.xlsx')).toBeInTheDocument();
        expect(screen.getByText('"Please approve access for budgeting"')).toBeInTheDocument();
      });
    });

    it('allows owner to deny request', async () => {
      vi.mocked(filesApi.reviewAccessRequest).mockResolvedValue({
        ...mockPending[0],
        status: 'DENIED',
      });

      render(
        <FluentProvider theme={webLightTheme}>
          <AccessRequestsTab token="test-token" />
        </FluentProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('deny-btn-req-10')).toBeInTheDocument();
      });

      const denyBtn = screen.getByTestId('deny-btn-req-10');
      fireEvent.click(denyBtn);

      await waitFor(() => {
        expect(filesApi.reviewAccessRequest).toHaveBeenCalledWith('test-token', 'req-10', {
          status: 'DENIED',
          grantedPermission: undefined,
        });
        expect(screen.queryByTestId('request-card-req-10')).not.toBeInTheDocument();
      });
    });
  });
});

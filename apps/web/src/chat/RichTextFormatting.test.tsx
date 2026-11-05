import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { RichTextRenderer } from './RichTextRenderer';
import { MessageComposer } from './MessageComposer';
import { ChatProvider } from './ChatContext';
import { AuthProvider } from '../auth/AuthContext';
import { PresenceProvider } from '../presence/PresenceContext';

describe('RichTextFormatting (C-005)', () => {
  it('renders bold, italic, underline, strikethrough, and inline code properly', () => {
    const content = 'This is **bold text**, *italic text*, <u>underlined text</u>, ~~strike text~~, and `inline code`.';
    render(
      <FluentProvider theme={webLightTheme}>
        <RichTextRenderer content={content} />
      </FluentProvider>
    );

    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('italic text')).toBeInTheDocument();
    expect(screen.getByText('underlined text')).toBeInTheDocument();
    expect(screen.getByText('strike text')).toBeInTheDocument();
    expect(screen.getByText('inline code')).toBeInTheDocument();
  });

  it('renders headings H1, H2, H3, blockquotes, bullet lists, and numbered lists', () => {
    const content = `# Heading One
## Heading Two
### Heading Three
> This is a quote block
- Bullet Item 1
- Bullet Item 2
1. Numbered Item 1
2. Numbered Item 2`;

    render(
      <FluentProvider theme={webLightTheme}>
        <RichTextRenderer content={content} />
      </FluentProvider>
    );

    expect(screen.getByText('Heading One')).toBeInTheDocument();
    expect(screen.getByText('Heading Two')).toBeInTheDocument();
    expect(screen.getByText('Heading Three')).toBeInTheDocument();
    expect(screen.getByText('This is a quote block')).toBeInTheDocument();
    expect(screen.getByText('Bullet Item 1')).toBeInTheDocument();
    expect(screen.getByText('Numbered Item 1')).toBeInTheDocument();
  });

  it('renders fenced code blocks with code language and copy action', () => {
    const content = '```typescript\nconst greeting = "Hello World";\n```';
    render(
      <FluentProvider theme={webLightTheme}>
        <RichTextRenderer content={content} />
      </FluentProvider>
    );

    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText(/const greeting = "Hello World";/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });

  it('renders hyperlinks safely with target _blank and noopener noreferrer', () => {
    const content = 'Visit [BCC Website](https://example.com/bcc)';
    render(
      <FluentProvider theme={webLightTheme}>
        <RichTextRenderer content={content} />
      </FluentProvider>
    );

    const link = screen.getByRole('link', { name: 'BCC Website' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/bcc');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('MessageComposer toggles format toolbar and inserts formatted markdown tokens', async () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <MessageComposer />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    const textarea = screen.getByLabelText(/message input/i) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    // Toggle format toolbar
    const formatBtn = screen.getByRole('button', { name: /toggle rich text format/i });
    expect(formatBtn).toBeInTheDocument();
    fireEvent.click(formatBtn);

    // Format toolbar buttons should now be visible
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /underline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /strikethrough/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /heading 1/i })).toBeInTheDocument();

    // Click Bold button
    fireEvent.click(screen.getByRole('button', { name: /bold/i }));
    expect(textarea.value).toContain('**bold text**');

    // Test Insert link dialog
    const linkBtn = screen.getByRole('button', { name: /insert link/i });
    fireEvent.click(linkBtn);

    await waitFor(() => {
      expect(screen.getByText(/insert link/i)).toBeInTheDocument();
    });

    const urlInput = screen.getByLabelText(/address/i);
    fireEvent.change(urlInput, { target: { value: 'https://bccteams.org' } });

    const insertBtn = screen.getByRole('button', { name: /^insert$/i });
    fireEvent.click(insertBtn);

    await waitFor(() => {
      expect(textarea.value).toContain('[https://bccteams.org](https://bccteams.org)');
    });
  });
});


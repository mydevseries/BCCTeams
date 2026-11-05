import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { GuestRestrictedBanner } from './GuestRestrictedBanner';

describe('GuestRestrictedBanner', () => {
  it('renders guest warning alert message', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <GuestRestrictedBanner featureName="Organization Directory" />
      </FluentProvider>
    );

    expect(screen.getByText('Guest Access Restricted')).toBeInTheDocument();
    expect(
      screen.getByText(/External guests cannot browse the full Organization Directory/)
    ).toBeInTheDocument();
  });
});

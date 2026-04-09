import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { createDemoAppClient } from '../../core/api/appClient';
import type { SchoolSession } from '../../core/session';
import { SchoolConsolePage } from './SchoolConsolePage';

const session: SchoolSession = {
  sessionType: 'school',
  userId: 'school_admin_1',
  fullName: 'School Admin',
  schoolId: 'school_blue_nile',
  schoolName: 'Blue Nile Academy',
  roleLabel: 'School Admin',
  branchName: 'Bahir Dar Branch',
};

afterEach(() => {
  cleanup();
});

describe('school console E2E flow', () => {
  it('shows school-scoped posture, parent readiness, and follow-up drill-in in overview', async () => {
    const user = userEvent.setup();

    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolConsolePage session={session} />
      </AppClientContext.Provider>,
    );

    await user.click((await screen.findAllByRole('button', { name: 'Reports' }))[0]);

    expect(screen.getByText('Payment posture')).toBeInTheDocument();
    expect(screen.getByText('Parent banking readiness')).toBeInTheDocument();
    expect(screen.getAllByText('Students due').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Linked parents').length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Blue Nile Academy')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Lake Tana Preparatory School')).not.toBeInTheDocument();

    const followUpTable = screen.getByText('Students needing follow-up').closest('div');
    expect(followUpTable).not.toBeNull();
    if (!followUpTable) {
      throw new Error('Expected the students follow-up block to render.');
    }

    const followUpQueries = within(followUpTable);
    let openStudentButtons: HTMLElement[] = [];
    await waitFor(() => {
      openStudentButtons = followUpQueries.getAllByRole('button', { name: 'Open student' });
      expect(openStudentButtons.length).toBeGreaterThan(0);
    });

    await user.click(openStudentButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Student Detail/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Parent Linking' })).toHaveClass('active');
    });
  });

  it('opens the billing queue from the overview action strip', async () => {
    const user = userEvent.setup();

    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolConsolePage session={session} />
      </AppClientContext.Provider>,
    );

    await user.click((await screen.findAllByRole('button', { name: 'Reports' }))[0]);
    await user.click((await screen.findAllByRole('button', { name: 'Open due invoices queue' }))[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Billing System' }).some((item) => item.className.includes('active'))).toBe(true);
      expect(screen.getByLabelText('Invoice status')).toHaveValue('open');
    });
  });

  it('opens a specific school billing scope from the school card', async () => {
    const user = userEvent.setup();

    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolConsolePage
          session={{
            schoolId: 'bank_network',
            schoolName: 'Partner School Network',
            branchName: 'Head Office',
          }}
          variant="bank"
        />
      </AppClientContext.Provider>,
    );

    await user.click((await screen.findAllByRole('button', { name: 'Overview' }))[0]);
    await user.click(await screen.findByRole('button', { name: 'Open Blue Nile Academy billing' }));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Payment Processing' }).some((item) => item.className.includes('active'))).toBe(true);
    });

    const scopedBanner = screen.getByText('Scoped to Blue Nile Academy').closest('div');
    expect(scopedBanner).not.toBeNull();
    if (!scopedBanner) {
      throw new Error('Expected the scoped school banner to render.');
    }

    const scopedBannerQueries = within(scopedBanner);
    expect(scopedBannerQueries.getByText('Students due')).toBeInTheDocument();
    expect(scopedBannerQueries.getByText('Linked parents')).toBeInTheDocument();
    expect(scopedBannerQueries.getByText('Open invoices')).toBeInTheDocument();
    expect(scopedBannerQueries.getByText('Today collected')).toBeInTheDocument();

    const schoolSelectors = screen.getAllByLabelText('School');
    const scopedSchoolSelector = schoolSelectors.find(
      (item) => item instanceof HTMLSelectElement && item.value === 'school_blue_nile',
    );
    expect(scopedSchoolSelector).toBeTruthy();
  });

  it('shows a bank-wide school operations view in bank mode', async () => {
    const user = userEvent.setup();

    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolConsolePage
          session={{
            schoolId: 'bank_network',
            schoolName: 'Partner School Network',
            branchName: 'Head Office',
          }}
          variant="bank"
        />
      </AppClientContext.Provider>,
    );

    await user.click((await screen.findAllByRole('button', { name: 'Overview' }))[0]);

    expect(screen.getByText('Partner School Portfolio')).toBeInTheDocument();
    expect((await screen.findAllByText('Blue Nile Academy')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Lake Tana Preparatory School')).length).toBeGreaterThan(0);

    await user.click((await screen.findAllByRole('button', { name: 'Onboarding' }))[0]);

    expect(screen.getByText('School onboarding')).toBeInTheDocument();
    expect(screen.getByText('Student import')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create School' })).toBeInTheDocument();
  });

  it('shows settlement by school and updates it from collections filters', async () => {
    const user = userEvent.setup();

    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolConsolePage
          session={{
            schoolId: 'bank_network',
            schoolName: 'Partner School Network',
            branchName: 'Head Office',
          }}
          variant="bank"
        />
      </AppClientContext.Provider>,
    );

    await user.click((await screen.findAllByRole('button', { name: 'Reconciliation' }))[0]);

    await screen.findByText('Settlement by school');
    const settlementTable = screen.getByText('Settlement by school').closest('div');
    expect(settlementTable).not.toBeNull();
    if (!settlementTable) {
      throw new Error('Expected the settlement by school table block to render.');
    }

    const settlementQueries = within(settlementTable);
    expect(settlementQueries.getByText('Blue Nile Academy')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Reconciliation'), 'awaiting_settlement');

    await waitFor(() => {
      expect(settlementQueries.getByText('Lake Tana Preparatory School')).toBeInTheDocument();
      expect(settlementQueries.queryByText('Blue Nile Academy')).not.toBeInTheDocument();
    });

    const schoolRow = settlementQueries.getByText('Lake Tana Preparatory School').closest('tr');
    expect(schoolRow).not.toBeNull();
    if (!schoolRow) {
      throw new Error('Expected Lake Tana settlement row to be rendered.');
    }

    const scopedQueries = within(schoolRow);
    expect(scopedQueries.getAllByText('ETB 1,200')).toHaveLength(2);
    expect(scopedQueries.getAllByText('1')).toHaveLength(2);
  });

  it('registers a student with parent detail and linked member access', async () => {
    const user = userEvent.setup();

    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolConsolePage session={session} />
      </AppClientContext.Provider>,
    );

    const registrationForm = (await screen.findAllByText('New student registration'))[0]?.closest('form');
    expect(registrationForm).not.toBeNull();
    if (!registrationForm) {
      throw new Error('Expected the new student registration form to render.');
    }

    const registrationQueries = within(registrationForm);

    await user.type(registrationQueries.getByLabelText('Student full name'), 'Abel Getnet');
    await user.type(registrationQueries.getByLabelText('Grade'), 'Grade 6');
    await user.type(registrationQueries.getByLabelText('Section'), 'A');
    await user.type(registrationQueries.getByLabelText('Parent name'), 'Getnet Belay');
    await user.type(registrationQueries.getByLabelText('Parent phone number'), '0911000001');
    await user.type(registrationQueries.getByLabelText('Parent account number'), 'BUN-100001');
    await user.type(registrationQueries.getByLabelText('Monthly fee amount'), '5000');

    await user.click(registrationQueries.getByRole('button', { name: 'Register Student' }));

    await waitFor(() => {
      expect(screen.getByText(/Registered .*parent contact/i)).toBeInTheDocument();
      expect(screen.getByText(/Registered Abel Getnet as ST-\d+/i)).toBeInTheDocument();
      expect(screen.getByText(/linked to .*100001 from the parent account number/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    await user.click((await screen.findAllByRole('button', { name: 'Parent Linking' }))[0]);
    await user.clear(screen.getByLabelText('Search'));
    await user.type(screen.getByLabelText('Search'), 'Abel Getnet');

    let registryRow: HTMLElement | undefined;
    await waitFor(() => {
      registryRow = screen
        .getAllByRole('row')
        .find((candidate) => /Abel Getnet \(ST-\d+\)/.test(candidate.textContent ?? ''));

      expect(registryRow).toBeTruthy();
    }, { timeout: 10000 });

    if (!registryRow) {
      throw new Error('Expected the registered student row to appear in the registry table.');
    }

    const rowQueries = within(registryRow);
    expect(rowQueries.getByText(/Abel Getnet \(ST-\d+\)/)).toBeInTheDocument();
    expect(rowQueries.getByText('Getnet Belay (0911000001)')).toBeInTheDocument();
    expect(rowQueries.getByText('Linked')).toBeInTheDocument();
    expect(rowQueries.getByText('ETB 5,000')).toBeInTheDocument();

    await user.click(rowQueries.getByRole('button', { name: /Open detail|Opened/ }));

    await waitFor(() => {
      expect(screen.getByText(/Student Detail/)).toBeInTheDocument();
    }, { timeout: 10000 });

    const detailPanel = screen.getByText(/Student Detail/).closest('section');
    expect(detailPanel).not.toBeNull();
    if (!detailPanel) {
      throw new Error('Expected the student detail panel to render after opening the registry row.');
    }

    const detailQueries = within(detailPanel);
    expect(detailQueries.getByText('Parent has bank account')).toBeInTheDocument();
    expect(detailQueries.getByText('Linked member/customer ID')).toBeInTheDocument();
    expect(detailQueries.getAllByText(/100001/).length).toBeGreaterThan(0);
    expect(detailQueries.getAllByText('ETB 5,000').length).toBeGreaterThan(0);
  }, 15000);

});

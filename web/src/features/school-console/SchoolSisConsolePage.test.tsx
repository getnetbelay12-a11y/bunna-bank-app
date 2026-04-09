import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { createDemoAppClient } from '../../core/api/appClient';
import type { SchoolSession } from '../../core/session';
import { SchoolSisConsolePage } from './SchoolSisConsolePage';

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

describe('SchoolSisConsolePage', () => {
  it('renders dashboard KPIs and collection chart', async () => {
    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolSisConsolePage session={session} section="schoolDashboard" />
      </AppClientContext.Provider>,
    );

    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('Collection trend')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
  });

  it('renders students registry tools', async () => {
    render(
      <AppClientContext.Provider value={createDemoAppClient()}>
        <SchoolSisConsolePage session={session} section="schoolStudents" />
      </AppClientContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Student registry')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Add student' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    const newStudentCard = screen.getByText('New student').closest('section');
    expect(newStudentCard).not.toBeNull();
    const newStudentForm = within(newStudentCard as HTMLElement);
    expect(newStudentForm.getByLabelText('Student ID')).toHaveValue('ST-9001');
    expect(newStudentForm.getByLabelText('Student full name')).toHaveValue('Demo Student');
    expect(newStudentForm.getByLabelText('Grade')).toHaveValue('Grade 7');
    expect(newStudentForm.getByLabelText('Section')).toHaveValue('A');
    expect(newStudentForm.getByLabelText('Parent name')).toHaveValue('Abebe Kebede');
    expect(newStudentForm.getByLabelText('Parent phone')).toHaveValue('0911000001');
  });

  it('links a new student to an existing mobile member account by parent phone', async () => {
    const client = createDemoAppClient();
    const createGuardianSpy = vi.spyOn(client.schoolConsoleApi!, 'createGuardian');
    const createLinkSpy = vi.spyOn(client.schoolConsoleApi!, 'createGuardianStudentLink');
    const checkExistingAccountSpy = vi.spyOn(client.authApi, 'checkExistingAccount' as never);

    render(
      <AppClientContext.Provider value={client}>
        <SchoolSisConsolePage session={session} section="schoolStudents" />
      </AppClientContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Student registry')).toBeInTheDocument();
    });

    const newStudentCard = screen.getByText('New student').closest('section');
    expect(newStudentCard).not.toBeNull();
    const newStudentForm = within(newStudentCard as HTMLElement);

    fireEvent.change(newStudentForm.getByLabelText('Student ID'), {
      target: { value: 'ST-9001' },
    });
    fireEvent.change(newStudentForm.getByLabelText('Student full name'), {
      target: { value: 'Demo Student' },
    });
    fireEvent.change(newStudentForm.getByLabelText('Grade'), {
      target: { value: 'Grade 7' },
    });
    fireEvent.change(newStudentForm.getByLabelText('Section'), {
      target: { value: 'A' },
    });
    fireEvent.change(newStudentForm.getByLabelText('Parent name'), {
      target: { value: 'Abebe Kebede' },
    });
    fireEvent.change(newStudentForm.getByLabelText('Parent phone'), {
      target: { value: '0911000001' },
    });
    fireEvent.click(newStudentForm.getByRole('button', { name: 'Add Student' }));

    await waitFor(() => {
      expect(createGuardianSpy).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(checkExistingAccountSpy).toHaveBeenCalledWith({
        phoneNumber: '0911000001',
      });
    });
    await waitFor(() => {
      expect(createLinkSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberCustomerId: 'BUN-100001',
          relationship: 'parent',
          status: 'active',
        }),
      );
    });
  });
});

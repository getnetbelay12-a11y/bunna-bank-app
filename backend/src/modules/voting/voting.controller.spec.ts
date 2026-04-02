import { VotingController } from './voting.controller';
import { VotingService } from './voting.service';

describe('VotingController', () => {
  let controller: VotingController;
  let service: jest.Mocked<VotingService>;

  beforeEach(() => {
    service = {
      getActiveVotes: jest.fn(),
      getVote: jest.fn(),
      respondToVote: jest.fn(),
      getVoteResults: jest.fn(),
      listVotesForAdmin: jest.fn(),
      createVote: jest.fn(),
      addVoteOption: jest.fn(),
      openVote: jest.fn(),
      closeVote: jest.fn(),
      getParticipation: jest.fn(),
    } as unknown as jest.Mocked<VotingService>;

    controller = new VotingController(service);
  });

  it('delegates vote response submission', async () => {
    const currentUser = { sub: 'member_1', role: 'shareholder_member' } as never;
    const dto = { optionId: 'opt_1', encryptedBallot: 'ciphertext' } as never;

    await controller.respondToVote(currentUser, 'vote_1', dto);

    expect(service.respondToVote).toHaveBeenCalledWith(currentUser, 'vote_1', dto);
  });

  it('delegates admin participation lookup', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getParticipation(currentUser, 'vote_1');

    expect(service.getParticipation).toHaveBeenCalledWith(currentUser, 'vote_1');
  });

  it('delegates admin vote list lookup', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.listVotesForAdmin(currentUser);

    expect(service.listVotesForAdmin).toHaveBeenCalledWith(currentUser);
  });
});

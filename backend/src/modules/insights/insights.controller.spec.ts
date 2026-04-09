import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

describe('InsightsController', () => {
  let controller: InsightsController;
  let insightsService: jest.Mocked<InsightsService>;

  beforeEach(() => {
    insightsService = {
      getMyInsights: jest.fn(),
      getMyHomeInsights: jest.fn(),
    } as unknown as jest.Mocked<InsightsService>;

    controller = new InsightsController(insightsService);
  });

  it('delegates full insight feed lookup', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMyInsights(currentUser);

    expect(insightsService.getMyInsights).toHaveBeenCalledWith(currentUser);
  });

  it('delegates home insight feed lookup', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMyHomeInsights(currentUser);

    expect(insightsService.getMyHomeInsights).toHaveBeenCalledWith(currentUser);
  });
});

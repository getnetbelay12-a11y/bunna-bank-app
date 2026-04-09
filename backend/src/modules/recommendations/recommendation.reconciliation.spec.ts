import { Types } from 'mongoose';

import { RecommendationCandidate } from './interfaces';
import { reconcileRecommendations } from './recommendation.reconciliation';

const buildCandidate = (fingerprint: string): RecommendationCandidate => ({
  memberId: new Types.ObjectId('65f1b5f27d27c9e2cba10001'),
  customerId: 'BUN-100001',
  branchId: new Types.ObjectId('65f1b5f27d27c9e2cba20001'),
  districtId: new Types.ObjectId('65f1b5f27d27c9e2cba30001'),
  audienceType: 'customer',
  type: 'card_order',
  title: 'Order Your ATM Card',
  description: 'desc',
  reason: 'reason',
  actionLabel: 'Order',
  actionRoute: '/cards/request',
  score: 0.8,
  priority: 70,
  badge: 'Recommended',
  source: 'rules',
  fingerprint,
});

describe('reconcileRecommendations', () => {
  it('suppresses recently dismissed duplicates and expires removed active recommendations', () => {
    const now = new Date('2026-03-15T12:00:00.000Z');

    const existing = [
      {
        _id: new Types.ObjectId('65f1b5f27d27c9e2cba40001'),
        fingerprint: 'cust:card',
        status: 'dismissed',
        updatedAt: new Date('2026-03-10T12:00:00.000Z'),
      },
      {
        _id: new Types.ObjectId('65f1b5f27d27c9e2cba40002'),
        fingerprint: 'cust:old-loan',
        status: 'new',
        updatedAt: new Date('2026-03-12T12:00:00.000Z'),
      },
    ] as any;

    const plan = reconcileRecommendations(
      existing,
      [buildCandidate('cust:card')],
      now,
    );

    expect(plan.create).toHaveLength(0);
    expect(plan.update).toHaveLength(0);
    expect(plan.expireIds).toEqual(['65f1b5f27d27c9e2cba40002']);
  });

  it('updates active matches instead of recreating them', () => {
    const now = new Date('2026-03-15T12:00:00.000Z');

    const existing = [
      {
        _id: new Types.ObjectId('65f1b5f27d27c9e2cba40003'),
        fingerprint: 'cust:card',
        status: 'viewed',
        updatedAt: new Date('2026-03-01T12:00:00.000Z'),
      },
    ] as any;

    const plan = reconcileRecommendations(
      existing,
      [buildCandidate('cust:card')],
      now,
    );

    expect(plan.create).toHaveLength(0);
    expect(plan.update).toHaveLength(1);
    expect(plan.update[0].status).toBe('viewed');
    expect(plan.expireIds).toHaveLength(0);
  });
});

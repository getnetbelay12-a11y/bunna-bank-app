import '../models/index.dart';
import 'api_contracts.dart';

const _abebeMemberId = 'abebe-kebede';
const _meseretMemberId = 'meseret-alemu';
const _newCustomerMemberId = 'selamawit-molla';

class DemoAuthApi implements AuthApi {
  @override
  Future<LoginChallenge> startLogin({
    required String identifier,
    String? deviceId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return LoginChallenge(
      challengeId: 'demo_${identifier}_${deviceId ?? 'default'}',
      expiresAt: DateTime.now().add(const Duration(minutes: 5)),
    );
  }

  @override
  Future<MemberSession> verifyPin({
    required String challengeId,
    required String pin,
    bool rememberDevice = false,
    bool biometricEnabled = false,
    String? deviceId,
  }) async {
    if (pin != '1234') {
      throw Exception('Invalid PIN');
    }

    final identifier =
        challengeId.contains('0002') ? '0911000002' : '0911000001';
    return login(customerId: identifier, password: 'demo-pass');
  }

  @override
  Future<AccountCheckResult> checkExistingAccount({
    required String phoneNumber,
    String? faydaFin,
    String? email,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));

    if (phoneNumber.trim() == '0911000001' || faydaFin == '123456789012') {
      return const AccountCheckResult(
        exists: true,
        matchType: 'phone',
        message:
            'An account already exists. Please log in or recover your account.',
      );
    }

    return const AccountCheckResult(
      exists: false,
      message: 'No existing account found.',
    );
  }

  @override
  Future<RegistrationResult> register({
    required String firstName,
    required String lastName,
    required String phoneNumber,
    String? email,
    required String dateOfBirth,
    required String region,
    required String city,
    String? preferredBranchId,
    String? preferredBranchName,
    required String password,
    required String confirmPassword,
    String? faydaFin,
    String? faydaAlias,
    String? faydaQrData,
    String? faydaFrontImage,
    String? faydaBackImage,
    bool consentAccepted = true,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));

    return const RegistrationResult(
      customerId: 'BUN-100006',
      memberId: _newCustomerMemberId,
      message:
          'Registration submitted successfully. Fayda verification is pending review.',
    );
  }

  @override
  Future<MemberSession> login({
    required String customerId,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 350));

    final isShareholder = customerId.trim().endsWith('1');

    return MemberSession(
      memberId: isShareholder ? _abebeMemberId : _meseretMemberId,
      customerId: isShareholder ? 'BUN-100001' : 'BUN-100003',
      fullName: isShareholder ? 'Abebe Kebede' : 'Meseret Alemu',
      phone: isShareholder ? '0911000001' : '0911000002',
      memberType: isShareholder ? MemberType.shareholder : MemberType.member,
      branchName: isShareholder ? 'Bahir Dar Branch' : 'Gondar Branch',
      membershipStatus: isShareholder ? 'active' : 'pending_verification',
      identityVerificationStatus:
          isShareholder ? 'verified' : 'manual_review_required',
      featureFlags: MemberFeatureFlags(
        voting: isShareholder,
        announcements: isShareholder,
        dividends: isShareholder,
        schoolPayment: true,
        loans: true,
        savings: true,
        liveChat: true,
      ),
    );
  }

  @override
  Future<Map<String, dynamic>> requestOtp({
    required String phoneNumber,
    String? email,
    String preferredChannel = 'sms',
    String? purpose,
  }) async {
    return {
      'phoneNumber': phoneNumber,
      if (email != null && email.isNotEmpty) 'email': email,
      'deliveryChannel': preferredChannel,
      'maskedDestination': preferredChannel == 'email'
          ? _maskEmail(email ?? '')
          : _maskPhoneNumber(phoneNumber),
      'status': 'otp_requested',
    };
  }

  @override
  Future<Map<String, dynamic>> verifyOtp({
    required String phoneNumber,
    required String otpCode,
  }) async {
    return {
      'phoneNumber': phoneNumber,
      'status': otpCode.isNotEmpty ? 'verified' : 'failed',
    };
  }

  @override
  Future<OnboardingStatus> getOnboardingStatus({
    required String customerId,
    required String phoneNumber,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return OnboardingStatus(
      customerId: customerId,
      phoneNumber: phoneNumber,
      onboardingReviewStatus: 'review_in_progress',
      membershipStatus: 'pending_review',
      identityVerificationStatus: 'pending_review',
      requiredAction:
          'Bank staff are validating your Fayda evidence, selfie submission, and branch selection.',
      statusMessage:
          'Your onboarding package is in active review. You will be asked for corrections only if something is missing or unclear.',
      branchName: 'Gondar Main Branch',
      reviewNote:
          'The branch team has started reviewing the submitted onboarding package.',
      lastUpdatedAt: DateTime.now().subtract(const Duration(hours: 2)),
    );
  }

  @override
  Future<Map<String, dynamic>> resetPin({
    required String phoneNumber,
    String? email,
    required String newPin,
    required String confirmPin,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    return {
      'phoneNumber': phoneNumber,
      if (email != null && email.isNotEmpty) 'email': email,
      'status': newPin == confirmPin ? 'pin_reset' : 'failed',
    };
  }

  @override
  Future<PinRecoveryOptions> getPinRecoveryOptions({
    required String identifier,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    final normalized = identifier.trim().toLowerCase();

    if (normalized == '0911000001' ||
        normalized == 'selamawit.molla@bunnabank.com') {
      return const PinRecoveryOptions(
        phoneNumber: '0911000001',
        channels: [
          RecoveryChannelOption(
            channel: 'sms',
            maskedDestination: '09******01',
          ),
          RecoveryChannelOption(
            channel: 'email',
            maskedDestination: 's*********@gmail.com',
          ),
        ],
      );
    }

    return const PinRecoveryOptions(
      phoneNumber: '0911000002',
      channels: [
        RecoveryChannelOption(
          channel: 'sms',
          maskedDestination: '09******02',
        ),
      ],
    );
  }

  @override
  Future<MemberSession?> restoreSession() async => null;

  @override
  Future<void> logout() async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
  }
}

class DemoDocumentUploadApi implements DocumentUploadApi {
  @override
  Future<UploadedDocument> uploadDocument({
    required String filePath,
    required String originalFileName,
    required String domain,
    String? entityId,
    String? documentType,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));

    final resolvedEntityId =
        entityId ?? 'upload_${DateTime.now().millisecondsSinceEpoch}';

    return UploadedDocument(
      storageKey:
          '$domain/$resolvedEntityId/${DateTime.now().millisecondsSinceEpoch}-$originalFileName',
      originalFileName: originalFileName,
      provider: 'demo',
      entityId: resolvedEntityId,
      mimeType: _guessMimeType(originalFileName),
    );
  }
}

class DemoLocationApi implements LocationApi {
  static const _branches = <LocationBranchOption>[
    LocationBranchOption(
      id: 'branch_gondar_main',
      name: 'Gondar Main Branch',
      region: 'Bunna',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_gondar_piazza',
      name: 'Gondar Piazza Branch',
      region: 'Bunna',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_gondar_university',
      name: 'Gondar University Branch',
      region: 'Bunna',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_bahir_dar',
      name: 'Bahir Dar Branch',
      region: 'Bunna',
      city: 'Bahir Dar',
    ),
    LocationBranchOption(
      id: 'branch_addis_main',
      name: 'Addis Main Branch',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
    ),
    LocationBranchOption(
      id: 'branch_adama_main',
      name: 'Adama Main Branch',
      region: 'Oromia',
      city: 'Adama',
    ),
    LocationBranchOption(
      id: 'branch_mekelle_main',
      name: 'Mekelle Main Branch',
      region: 'Tigray',
      city: 'Mekelle',
    ),
    LocationBranchOption(
      id: 'branch_gondar',
      name: 'Gondar Branch',
      region: 'Bunna',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_debre_markos',
      name: 'Debre Markos Branch',
      region: 'Bunna',
      city: 'Debre Markos',
    ),
  ];

  @override
  Future<List<String>> fetchRegions() async {
    return const ['Bunna', 'Oromia', 'Addis Ababa', 'Tigray', 'SNNP'];
  }

  @override
  Future<List<String>> fetchCities(String region) async {
    return _branches
        .where((item) => item.region == region)
        .map((item) => item.city)
        .toSet()
        .toList()
      ..sort();
  }

  @override
  Future<List<LocationBranchOption>> fetchBranches({
    required String region,
    required String city,
  }) async {
    return _branches
        .where((item) => item.region == region && item.city == city)
        .toList();
  }
}

class DemoMemberApi implements MemberApi {
  @override
  Future<MemberProfile> fetchMyProfile(String memberId) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));

    if (memberId == _abebeMemberId) {
      return const MemberProfile(
        memberId: _abebeMemberId,
        customerId: 'BUN-100001',
        memberNumber: 'BUN-100001',
        fullName: 'Abebe Kebede',
        phone: '0911000001',
        branchName: 'Bahir Dar Branch',
        memberType: 'shareholder',
        membershipStatus: 'active',
        identityVerificationStatus: 'verified',
        onboardingReviewStatus: 'approved',
      );
    }

    return const MemberProfile(
      memberId: _meseretMemberId,
      customerId: 'BUN-100003',
      memberNumber: 'BUN-100003',
      fullName: 'Meseret Alemu',
      phone: '0911000002',
      branchName: 'Gondar Branch',
      memberType: 'member',
      membershipStatus: 'pending_verification',
      identityVerificationStatus: 'manual_review_required',
      onboardingReviewStatus: 'review_in_progress',
      onboardingReviewNote:
          'Branch staff are reviewing the submitted Fayda evidence and selfie package.',
    );
  }
}

class DemoShareholderApi implements ShareholderApi {
  @override
  Future<ShareholderProfile> fetchMyShareholderProfile() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return ShareholderProfile(
      memberId: _abebeMemberId,
      shareholderId: 'SH-100001',
      memberNumber: 'BUN-100001',
      fullName: 'Abebe Kebede',
      phone: '0911000001',
      totalShares: 1250,
      status: 'active',
      memberSince: DateTime(2023, 4, 14),
    );
  }
}

class DemoRecommendationApi implements RecommendationApi {
  @override
  Future<List<SmartRecommendation>> fetchMyRecommendations() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return [
      const SmartRecommendation(
        id: 'rec_autopay_1',
        type: 'autopay_recommendation',
        title: 'Set Up AutoPay',
        description:
            'Automate regular payments to avoid repeated branch visits.',
        reason: 'Repeated manual payments were detected on your account.',
        badge: 'Recommended',
        actionLabel: 'Set up AutoPay',
        actionRoute: '/payments/autopay',
        status: 'new',
        score: 0.88,
      ),
      const SmartRecommendation(
        id: 'rec_kyc_1',
        type: 'kyc_completion',
        title: 'Complete Fayda Verification',
        description:
            'Finish verification to unlock more services and smoother access.',
        reason: 'Your profile still has a pending verification step.',
        badge: 'Complete now',
        actionLabel: 'Verify now',
        actionRoute: '/kyc/fayda',
        status: 'new',
        score: 0.96,
      ),
      const SmartRecommendation(
        id: 'rec_savings_1',
        type: 'savings_plan',
        title: 'Open a Savings Plan',
        description:
            'Your balance has stayed healthy. Consider a dedicated savings plan.',
        reason: 'Stable balance trends suggest this could be a good fit.',
        badge: 'High relevance',
        actionLabel: 'Explore plans',
        actionRoute: '/savings/plans',
        status: 'viewed',
        score: 0.83,
      ),
      const SmartRecommendation(
        id: 'rec_card_1',
        type: 'card_order',
        title: 'Order Your ATM Card',
        description:
            'Get easier access to withdrawals and daily banking services.',
        reason: 'No ATM card request was found on your account.',
        badge: 'Action needed',
        actionLabel: 'Order card',
        actionRoute: '/cards/request',
        status: 'new',
        score: 0.76,
      ),
    ];
  }

  @override
  Future<void> act(String recommendationId, {bool completed = false}) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
  }

  @override
  Future<void> dismiss(String recommendationId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
  }

  @override
  Future<void> markViewed(String recommendationId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
  }
}

class DemoInsightApi implements InsightApi {
  @override
  Future<SmartInsightFeed> fetchMyInsights() async {
    await Future<void>.delayed(const Duration(milliseconds: 140));
    return _buildFeed();
  }

  @override
  Future<SmartInsightFeed> fetchMyHomeInsights() async {
    await Future<void>.delayed(const Duration(milliseconds: 140));
    final full = _buildFeed();
    return SmartInsightFeed(
      generatedAt: full.generatedAt,
      total: full.total,
      urgentCount: full.urgentCount,
      items: full.items.take(3).toList(),
    );
  }

  SmartInsightFeed _buildFeed() {
    final now = DateTime.now();
    final items = [
      SmartInsight(
        id: 'insight_school_due',
        type: 'school_payment_due',
        priority: 'high',
        title: 'School fee due soon',
        message: 'Blue Nile Academy tuition is almost due again.',
        actionLabel: 'Pay Now',
        actionRoute: '/payments/school',
        dueAt: now.add(const Duration(days: 2)),
        amount: 5000,
        currency: 'ETB',
        metadata: const {
          'schoolName': 'Blue Nile Academy',
          'studentId': 'ST-1001',
        },
      ),
      SmartInsight(
        id: 'insight_loan_due',
        type: 'loan_due',
        priority: 'medium',
        title: 'Loan repayment window approaching',
        message: 'Your business loan repayment cycle is coming up this week.',
        actionLabel: 'View Loan',
        actionRoute: '/loans/loan_1',
        dueAt: now.add(const Duration(days: 4)),
        amount: 10000,
        currency: 'ETB',
        metadata: const {
          'loanId': 'loan_1',
        },
      ),
      SmartInsight(
        id: 'insight_savings',
        type: 'savings_suggestion',
        priority: 'low',
        title: 'Build your savings cushion',
        message:
            'Your recent deposits look healthy. Consider moving some funds into savings.',
        actionLabel: 'Transfer Funds',
        actionRoute: '/savings/transfer',
        dueAt: now.add(const Duration(days: 7)),
        amount: 24000,
        currency: 'ETB',
      ),
    ];

    return SmartInsightFeed(
      generatedAt: now,
      total: items.length,
      urgentCount: items.where((item) => item.priority == 'high').length,
      items: items,
    );
  }
}

class DemoIdentityVerificationApi implements IdentityVerificationApi {
  @override
  Future<IdentityVerificationResult> getStatus() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return const IdentityVerificationResult(
      memberId: _meseretMemberId,
      phoneNumber: '0911000002',
      verificationStatus: 'manual_review_required',
      verificationMethod: 'fin_plus_manual_review',
      faydaFin: '123456789012',
      verificationReference: 'MANUAL-VERIFY-2026',
      failureReason:
          'Submitted for manual verification. This is not official Fayda validation.',
    );
  }

  @override
  Future<IdentityVerificationResult> submitFin({
    required String faydaFin,
    String? faydaAlias,
  }) async {
    return IdentityVerificationResult(
      memberId: _meseretMemberId,
      phoneNumber: '0911000002',
      verificationStatus: 'pending_verification',
      verificationMethod: 'fin_plus_manual_review',
      faydaFin: faydaFin,
      faydaAlias: faydaAlias,
      verificationReference: 'MANUAL-FIN-2026',
    );
  }

  @override
  Future<IdentityVerificationResult> uploadQr({
    String? qrDataRaw,
    String? faydaAlias,
  }) async {
    return IdentityVerificationResult(
      memberId: _meseretMemberId,
      phoneNumber: '0911000002',
      verificationStatus: 'qr_uploaded',
      verificationMethod: 'app_qr_capture_manual_review',
      qrDataRaw: qrDataRaw,
      faydaAlias: faydaAlias,
      verificationReference: 'MANUAL-QR-2026',
    );
  }

  @override
  Future<IdentityVerificationResult> verify() async {
    return const IdentityVerificationResult(
      memberId: _meseretMemberId,
      phoneNumber: '0911000002',
      verificationStatus: 'manual_review_required',
      verificationMethod: 'fin_plus_manual_review',
      verificationReference: 'MANUAL-VERIFY-2026',
      failureReason:
          'Submitted for manual verification. This is not official Fayda validation.',
    );
  }
}

class DemoSavingsApi implements SavingsApi {
  @override
  Future<List<SavingsAccount>> fetchMyAccounts(String memberId) async {
    await Future<void>.delayed(const Duration(milliseconds: 260));

    if (memberId == _abebeMemberId) {
      return const [
        SavingsAccount(
          accountId: 'sav_1',
          accountNumber: '10023489',
          balance: 186400,
          currency: 'ETB',
          isActive: true,
        ),
        SavingsAccount(
          accountId: 'sav_2',
          accountNumber: '10023990',
          balance: 48200,
          currency: 'ETB',
          isActive: true,
        ),
      ];
    }

    return [
      const SavingsAccount(
        accountId: 'sav_3',
        accountNumber: '10024567',
        balance: 74250,
        currency: 'ETB',
        isActive: true,
      ),
    ];
  }

  @override
  Future<List<AccountTransaction>> fetchAccountTransactions(
    String accountId,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    return [
      AccountTransaction(
        transactionReference: 'TX-2026-0001',
        type: 'school_payment',
        channel: 'mobile',
        amount: 1500,
        currency: 'ETB',
        createdAt: DateTime(2026, 3, 1),
        narration: 'Term payment',
      ),
      AccountTransaction(
        transactionReference: 'TX-2026-0002',
        type: 'deposit',
        channel: 'branch',
        amount: 12000,
        currency: 'ETB',
        createdAt: DateTime(2026, 2, 24),
        narration: 'Cash deposit',
      ),
      AccountTransaction(
        transactionReference: 'TX-2026-0003',
        type: 'transfer',
        channel: 'mobile',
        amount: 2450,
        currency: 'ETB',
        createdAt: DateTime(2026, 2, 20),
        narration: 'Internal transfer',
      ),
    ];
  }
}

class DemoSchoolPaymentApi implements SchoolPaymentApi {
  final List<Map<String, dynamic>> _payments = [
    {
      'schoolName': 'Blue Nile Academy',
      'studentId': 'ST-1001',
      'amount': 1500.0,
      'status': 'successful',
      'createdAt': DateTime(2026, 3, 1).toIso8601String(),
      'transactionReference': 'TXN-DEMO-2026-000',
    },
  ];

  @override
  Future<List<Map<String, dynamic>>> fetchMyLinkedStudents() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));

    return const [
      {
        'schoolId': 'school_blue_nile',
        'schoolName': 'Blue Nile Academy',
        'studentId': 'ST-1001',
        'fullName': 'Mahi Kebede',
        'grade': 'Grade 6',
        'section': 'A',
        'guardianName': 'Abebe Kebede',
        'guardianPhone': '0911000001',
        'status': 'active',
        'paymentSummary': {
          'totalInvoiced': 1500.0,
          'totalPaid': 1500.0,
          'outstandingBalance': 0.0,
          'paymentStatus': 'paid',
          'monthlyFee': 1500.0,
        },
        'performanceSummary': {
          'latestAverage': 93,
        },
        'parentUpdateSummary': 'Grade 6 · Current term average 93% · attendance 98%',
      },
      {
        'schoolId': 'school_tana',
        'schoolName': 'Vision School',
        'studentId': 'ST-1002',
        'fullName': 'Liya Bekele',
        'grade': 'Grade 9',
        'section': 'B',
        'guardianName': 'Abebe Kebede',
        'guardianPhone': '0911000001',
        'status': 'active',
        'paymentSummary': {
          'totalInvoiced': 1500.0,
          'totalPaid': 0.0,
          'outstandingBalance': 1500.0,
          'paymentStatus': 'unpaid',
          'monthlyFee': 1500.0,
        },
        'performanceSummary': {
          'latestAverage': 87,
        },
        'parentUpdateSummary': 'Grade 9 · Current term average 87% · attendance 94%',
      },
    ];
  }

  @override
  Future<SchoolPaymentResult> createSchoolPayment({
    required String accountId,
    required String studentId,
    required String schoolName,
    required double amount,
    required String channel,
    String? narration,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 260));

    final nextIndex = _payments.length + 1;
    final transactionReference =
        'TXN-DEMO-2026-${nextIndex.toString().padLeft(3, '0')}';
    _payments.insert(0, {
      'schoolName': schoolName,
      'studentId': studentId,
      'amount': amount,
      'status': 'successful',
      'channel': channel,
      'narration': narration,
      'accountId': accountId,
      'createdAt': DateTime.now().toIso8601String(),
      'transactionReference': transactionReference,
    });

    return SchoolPaymentResult(
      schoolPaymentId: 'school_payment_$nextIndex',
      transactionReference: transactionReference,
      notificationStatus: 'sent',
    );
  }

  @override
  Future<QrPaymentResult> createQrPayment({
    required String accountId,
    required String qrPayload,
    required String merchantName,
    required double amount,
    String? narration,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    return QrPaymentResult(
      transactionId: 'qr_txn_1',
      transactionReference: 'QRP-DEMO-2026-001',
      notificationStatus: 'sent',
      merchantName: merchantName,
      amount: amount,
    );
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return List<Map<String, dynamic>>.from(_payments);
  }

  @override
  Future<PaymentActivitySummary?> fetchMyPaymentActivity() async {
    await Future<void>.delayed(const Duration(milliseconds: 160));

    return PaymentActivitySummary(
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      phone: '0911000001',
      branchName: 'Bahir Dar Branch',
      openCases: 2,
      totalReceipts: 4,
      qrPayments: 1,
      schoolPayments: 1,
      disputeReceipts: 2,
      latestActivityAt: DateTime(2026, 3, 22, 9, 10),
    );
  }

  @override
  Future<List<PaymentReceiptItem>> fetchMyPaymentReceipts() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return [
      PaymentReceiptItem(
        receiptId: 'receipt_qr_1',
        receiptType: 'qr_payment',
        sourceId: 'qr_txn_1',
        title: 'ABa Cafe',
        description: 'QR payment to ABa Cafe',
        status: 'successful',
        amount: 275,
        currency: 'ETB',
        transactionReference: 'QRP-DEMO-2026-001',
        counterparty: 'ABa Cafe',
        channel: 'mobile',
        attachments: [],
        recordedAt: DateTime(2026, 3, 21, 7, 45),
        metadata: {
          'qrPayload': 'merchant:aba-cafe',
        },
      ),
      PaymentReceiptItem(
        receiptId: 'receipt_school_1',
        receiptType: 'school_payment',
        sourceId: 'school_payment_1',
        title: 'Blue Nile Academy',
        description: 'School payment for Blue Nile Academy.',
        status: 'successful',
        amount: 1500,
        currency: 'ETB',
        channel: 'mobile',
        attachments: [],
        recordedAt: DateTime(2026, 3, 20, 10, 15),
        metadata: {
          'studentId': 'ST-1001',
        },
      ),
      PaymentReceiptItem(
        receiptId: 'receipt_request_1',
        receiptType: 'failed_transfer',
        sourceId: 'request_receipt_1',
        title: 'Transfer issue for TXN-2026-001',
        description: 'Operations is validating the transfer reference.',
        status: 'under_review',
        amount: 2400,
        currency: 'ETB',
        transactionReference: 'TXN-2026-001',
        counterparty: 'Dashen Bank',
        attachments: ['transfer_receipt.png'],
        recordedAt: DateTime(2026, 3, 21, 9, 30),
        metadata: {
          'occurredAt': '2026-03-21 09:10',
        },
      ),
      PaymentReceiptItem(
        receiptId: 'receipt_request_2',
        receiptType: 'payment_dispute',
        sourceId: 'request_receipt_2',
        title: 'Payment dispute for SCH-2026-014',
        description:
            'Please upload the payment receipt screenshot to continue the review.',
        status: 'awaiting_customer',
        amount: 3500,
        currency: 'ETB',
        transactionReference: 'SCH-2026-014',
        counterparty: 'Bahir Dar Academy',
        attachments: [],
        recordedAt: DateTime(2026, 3, 22, 9, 10),
        metadata: {
          'occurredAt': '2026-03-22 08:30',
        },
      ),
    ];
  }
}

class DemoLoanApi implements LoanApi {
  @override
  Future<List<LoanSummary>> fetchMyLoans() async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    return [
      LoanSummary(
        loanId: 'loan_1',
        loanType: 'Business Loan',
        amount: 500000,
        interestRate: 14.5,
        termMonths: 24,
        status: 'branch_review',
        currentLevel: 'branch',
        deficiencyReasons: [
          'Upload latest income proof',
          'Replace blurred Fayda back image',
        ],
        purpose: 'Working capital',
        createdAt: DateTime(2026, 2, 10),
      ),
      LoanSummary(
        loanId: 'loan_2',
        loanType: 'School Expansion Loan',
        amount: 1200000,
        interestRate: 13.0,
        termMonths: 36,
        status: 'approved',
        currentLevel: 'head_office',
        deficiencyReasons: [],
        purpose: 'Expansion',
        createdAt: DateTime(2025, 11, 18),
      ),
    ];
  }

  @override
  Future<LoanSummary> fetchLoanDetail(String loanId) async {
    final loans = await fetchMyLoans();
    return loans.firstWhere((loan) => loan.loanId == loanId);
  }

  @override
  Future<List<LoanTimelineItem>> fetchLoanTimeline(String loanId) async {
    final loan = await fetchLoanDetail(loanId);
    return [
      const LoanTimelineItem(
        status: 'submitted',
        title: 'Submitted',
        description:
            'Your application was received and entered into the queue.',
        isCompleted: true,
        isCurrent: false,
      ),
      LoanTimelineItem(
        status: 'branch_review',
        title: 'Branch Review',
        description: loan.deficiencyReasons.isNotEmpty
            ? 'Branch team needs more evidence: ${loan.deficiencyReasons.join(', ')}.'
            : 'Branch team is validating documents and preparing the next decision.',
        isCompleted:
            loan.currentLevel != 'branch' || loan.status != 'submitted',
        isCurrent: loan.currentLevel == 'branch' && loan.status == 'submitted',
      ),
      LoanTimelineItem(
        status: 'district_review',
        title: 'District Review',
        description:
            'Higher-value applications move to district review for additional controls.',
        isCompleted: ['head_office', 'approved', 'disbursed', 'rejected']
                .contains(loan.currentLevel) ||
            ['approved', 'disbursed', 'rejected'].contains(loan.status),
        isCurrent:
            loan.currentLevel == 'district' && loan.status == 'submitted',
      ),
      LoanTimelineItem(
        status: 'head_office_review',
        title: 'Head Office Review',
        description:
            'Head office final review confirms approval conditions and disbursement readiness.',
        isCompleted:
            ['approved', 'disbursed', 'rejected'].contains(loan.status),
        isCurrent:
            loan.currentLevel == 'head_office' && loan.status == 'submitted',
      ),
      LoanTimelineItem(
        status: 'need_documents',
        title: 'Need Documents',
        description: loan.deficiencyReasons.isNotEmpty
            ? 'Customer action is required before approval: ${loan.deficiencyReasons.join(', ')}.'
            : 'No document deficiency is blocking this application.',
        isCompleted: loan.deficiencyReasons.isEmpty,
        isCurrent:
            loan.deficiencyReasons.isNotEmpty && loan.status == 'submitted',
      ),
      LoanTimelineItem(
        status: 'approved',
        title: 'Approved',
        description: loan.status == 'approved'
            ? 'The loan is approved. Watch for disbursement and repayment reminders.'
            : 'Approval is still pending. Upload any requested documents quickly.',
        isCompleted: loan.status == 'approved',
        isCurrent: loan.status == 'approved',
      ),
      LoanTimelineItem(
        status: 'rejected',
        title: 'Rejected',
        description: loan.status == 'rejected'
            ? 'The application was rejected after review.'
            : 'Rejected only appears if the application cannot proceed.',
        isCompleted: loan.status == 'rejected',
        isCurrent: loan.status == 'rejected',
      ),
      LoanTimelineItem(
        status: 'disbursed',
        title: 'Disbursed',
        description: loan.status == 'disbursed'
            ? 'Funds have been released to your account.'
            : 'Disbursement follows final approval and operations checks.',
        isCompleted: loan.status == 'disbursed',
        isCurrent: loan.status == 'disbursed',
      ),
    ];
  }

  @override
  Future<Map<String, dynamic>> uploadLoanDocument(
    String loanId, {
    required String documentType,
    required String originalFileName,
    String? storageKey,
    String? mimeType,
    int? sizeBytes,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    return {
      'id': 'loan_doc_${DateTime.now().millisecondsSinceEpoch}',
      'loanId': loanId,
      'documentType': documentType,
      'originalFileName': originalFileName,
      'storageKey': storageKey ?? 'demo/$loanId/$originalFileName',
      'mimeType': mimeType ?? 'application/pdf',
      'sizeBytes': sizeBytes ?? 245000,
    };
  }

  @override
  Future<LoanSummary> submitLoanApplication({
    required String loanType,
    required double amount,
    required double interestRate,
    required int termMonths,
    required String purpose,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));

    return LoanSummary(
      loanId: 'loan_new_demo',
      loanType: loanType,
      amount: amount,
      interestRate: interestRate,
      termMonths: termMonths,
      status: 'submitted',
      currentLevel: 'branch',
      purpose: purpose,
      createdAt: DateTime.now(),
    );
  }
}

class DemoNotificationApi implements NotificationApi {
  final List<AppNotification> _items = [
    AppNotification(
      notificationId: 'notif_login_detected',
      type: 'suspicious_login',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Login Detected',
      message: 'A new login to your Bunna Bank mobile profile was detected.',
      createdAt: DateTime(2026, 3, 12, 11, 18),
      actionLabel: 'Review security',
      priority: 'high',
      deepLink: '/profile/security',
    ),
    AppNotification(
      notificationId: 'notif_1',
      type: 'loan_status',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Loan Needs More Documents',
      message:
          'Your business loan needs more evidence before approval: Upload latest income proof, Replace blurred Fayda back image.',
      createdAt: DateTime(2026, 3, 9, 10, 30),
      actionLabel: 'Review loan',
      priority: 'high',
      deepLink: '/loans/loan_new_demo',
    ),
    AppNotification(
      notificationId: 'notif_2',
      type: 'service_request',
      channel: 'mobile_push',
      status: 'sent',
      title: 'ATM Card Request Updated',
      message:
          'Your ATM card request is under review. Tap to open the request timeline.',
      createdAt: DateTime(2026, 3, 9, 9, 15),
      entityType: 'service_request',
      entityId: 'sr_demo_2',
      actionLabel: 'Open request',
      priority: 'normal',
      deepLink: '/service-requests/sr_demo_2',
    ),
    AppNotification(
      notificationId: 'notif_3',
      type: 'chat',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Support Reply',
      message: 'An Bunna Bank support agent replied to your request.',
      createdAt: DateTime(2026, 3, 11, 11, 5),
      actionLabel: 'Open support',
      priority: 'normal',
      deepLink: '/support/chat_demo_1',
    ),
    AppNotification(
      notificationId: 'notif_4',
      type: 'service_request',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Card Request Under Review',
      message:
          'Your new card request is now under review by branch operations.',
      createdAt: DateTime(2026, 3, 12, 9, 40),
      entityType: 'card',
      entityId: 'card_1',
      actionLabel: 'Open card',
      priority: 'normal',
      deepLink: '/cards/card_1',
    ),
    AppNotification(
      notificationId: 'notif_5',
      type: 'service_request',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Payment Dispute Needs Action',
      message:
          'Your payment dispute needs a receipt upload before review can continue.',
      createdAt: DateTime(2026, 3, 12, 10, 5),
      entityType: 'service_request',
      entityId: 'sr_demo_1',
      actionLabel: 'Open receipts',
      priority: 'high',
      deepLink: '/payments/receipts?filter=disputes',
    ),
    AppNotification(
      notificationId: 'notif_6',
      type: 'payment',
      channel: 'mobile_push',
      status: 'sent',
      title: 'QR Receipt Ready',
      message:
          'Your latest QR payment receipt is available in confirmed payments.',
      createdAt: DateTime(2026, 3, 12, 10, 10),
      entityType: 'payment_receipts',
      actionLabel: 'Open receipts',
      priority: 'normal',
      deepLink: '/payments/receipts?filter=qr',
    ),
  ];

  @override
  Future<List<AppNotification>> fetchMyNotifications() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return List<AppNotification>.from(_items);
  }

  @override
  Future<AppNotification> markAsRead(String notificationId) async {
    final index = _items.indexWhere(
      (entry) => entry.notificationId == notificationId,
    );
    final item = _items[index];
    final updated = AppNotification(
      notificationId: item.notificationId,
      type: item.type,
      channel: item.channel,
      status: 'read',
      title: item.title,
      message: item.message,
      createdAt: item.createdAt,
      entityType: item.entityType,
      entityId: item.entityId,
      actionLabel: item.actionLabel,
      priority: item.priority,
      deepLink: item.deepLink,
    );
    if (index >= 0) {
      _items[index] = updated;
    }
    return updated;
  }

  void addNotification(AppNotification notification) {
    _items.insert(0, notification);
  }

  @override
  Future<void> registerDeviceToken({
    required String deviceId,
    required String platform,
    required String token,
    required String appVersion,
  }) async {}
}

class DemoAutopayApi implements AutopayApi {
  final List<AutopayInstruction> _items = [
    const AutopayInstruction(
      id: 'autopay_water',
      serviceType: 'water',
      accountId: 'primary_account',
      schedule: 'monthly',
      enabled: true,
    ),
    const AutopayInstruction(
      id: 'autopay_school',
      serviceType: 'school_payment',
      accountId: 'primary_account',
      schedule: 'monthly',
      enabled: false,
    ),
    const AutopayInstruction(
      id: 'autopay_savings',
      serviceType: 'transfer_to_savings',
      accountId: 'savings_account',
      schedule: 'weekly',
      enabled: true,
    ),
  ];

  @override
  Future<AutopayInstruction> createInstruction({
    required String provider,
    required String accountId,
    required String schedule,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final existingIndex =
        _items.indexWhere((item) => item.serviceType == provider);
    final next = AutopayInstruction(
      id: existingIndex >= 0 ? _items[existingIndex].id : 'autopay_$provider',
      serviceType: provider,
      accountId: accountId,
      schedule: schedule,
      enabled: true,
    );
    if (existingIndex >= 0) {
      _items[existingIndex] = next;
    } else {
      _items.add(next);
    }
    return next;
  }

  @override
  Future<List<AutopayInstruction>> fetchInstructions() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return List<AutopayInstruction>.from(_items);
  }

  @override
  Future<AutopayInstruction> updateInstructionStatus({
    String? id,
    String? provider,
    required bool enabled,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final index = _items.indexWhere(
      (item) =>
          (id != null && item.id == id) ||
          (provider != null && item.serviceType == provider),
    );
    if (index < 0) {
      throw Exception('Autopay instruction not found.');
    }
    final current = _items[index];
    final next = AutopayInstruction(
      id: current.id,
      serviceType: current.serviceType,
      accountId: current.accountId,
      schedule: current.schedule,
      enabled: enabled,
    );
    _items[index] = next;
    return next;
  }
}

class DemoSecurityApi implements SecurityApi {
  bool _accountLockEnabled = false;

  @override
  Future<SecurityOverview> fetchOverview() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return SecurityOverview(
      accountLockEnabled: _accountLockEnabled,
      highRiskActionVerification: true,
      sessions: [
        MemberAuthSession(
          challengeId: 'demo-session-current',
          loginIdentifier: '0911000001',
          status: 'verified',
          isCurrent: true,
          deviceId: 'ios-primary-device',
          verifiedAt: DateTime(2026, 3, 31, 9, 15),
          updatedAt: DateTime(2026, 3, 31, 9, 15),
          expiresAt: DateTime(2026, 4, 7, 9, 15),
        ),
        MemberAuthSession(
          challengeId: 'demo-session-old',
          loginIdentifier: '0911000001',
          status: 'logged_out',
          isCurrent: false,
          deviceId: 'android-branch-tablet',
          loggedOutAt: DateTime(2026, 3, 25, 18, 30),
          updatedAt: DateTime(2026, 3, 25, 18, 30),
        ),
      ],
      devices: [
        MemberDevice(
          deviceId: 'ios-primary-device',
          rememberDevice: true,
          biometricEnabled: true,
          isCurrent: true,
          lastLoginAt: DateTime(2026, 3, 31, 9, 15),
          updatedAt: DateTime(2026, 3, 31, 9, 15),
        ),
        MemberDevice(
          deviceId: 'android-branch-tablet',
          rememberDevice: false,
          biometricEnabled: false,
          isCurrent: false,
          lastLoginAt: DateTime(2026, 3, 25, 18, 10),
          updatedAt: DateTime(2026, 3, 25, 18, 10),
        ),
      ],
    );
  }

  @override
  Future<void> revokeSession(String challengeId) async {
    await Future<void>.delayed(const Duration(milliseconds: 100));
    if (challengeId.isEmpty) {
      throw Exception('Session not found.');
    }
  }

  @override
  Future<bool> updateAccountLock(bool enabled) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _accountLockEnabled = enabled;
    return _accountLockEnabled;
  }
}

class DemoChatApi implements ChatApi {
  final List<ChatConversation> _conversations = [
    ChatConversation(
      id: 'chat_demo_1',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      status: 'waiting_customer',
      issueCategory: 'loan_issue',
      channel: 'mobile',
      createdAt: DateTime(2026, 3, 11, 9, 0),
      updatedAt: DateTime(2026, 3, 11, 9, 12),
      escalationFlag: false,
      priority: 'high',
      branchName: 'Bahir Dar Branch',
      assignedToStaffName: 'Rahel Desta',
      assignedAgentId: 'support_1',
      responseDueAt: DateTime(2026, 3, 11, 9, 30),
      slaState: 'on_track',
      latestMessage: ChatMessage(
        id: 'msg_2',
        conversationId: 'chat_demo_1',
        senderType: 'agent',
        senderId: 'support_1',
        senderName: 'Rahel Desta',
        message:
            'Your loan file is under branch review. I am checking the latest note.',
        messageType: 'text',
        createdAt: DateTime(2026, 3, 11, 9, 12),
      ),
      messages: [
        ChatMessage(
          id: 'msg_1',
          conversationId: 'chat_demo_1',
          senderType: 'customer',
          senderId: _abebeMemberId,
          senderName: 'Abebe Kebede',
          message: 'I need an update on my loan.',
          messageType: 'text',
          createdAt: DateTime(2026, 3, 11, 9, 0),
        ),
        ChatMessage(
          id: 'msg_2',
          conversationId: 'chat_demo_1',
          senderType: 'agent',
          senderId: 'support_1',
          senderName: 'Rahel Desta',
          message:
              'Your loan file is under branch review. I am checking the latest note.',
          messageType: 'text',
          createdAt: DateTime(2026, 3, 11, 9, 12),
        ),
      ],
    ),
    ChatConversation(
      id: 'chat_demo_2',
      memberName: 'Meseret Alemu',
      phoneNumber: '0911000002',
      status: 'waiting_agent',
      issueCategory: 'kyc_issue',
      channel: 'mobile',
      createdAt: DateTime(2026, 3, 10, 15, 30),
      updatedAt: DateTime(2026, 3, 10, 15, 31),
      escalationFlag: false,
      priority: 'normal',
      branchName: 'Gondar Branch',
      responseDueAt: DateTime(2026, 3, 10, 16, 15),
      slaState: 'attention',
      latestMessage: ChatMessage(
        id: 'msg_4',
        conversationId: 'chat_demo_2',
        senderType: 'system',
        senderId: 'smart-support-assistant',
        senderName: 'Bunna Bank Assistant',
        message:
            'Please describe what you need help with and an agent can join if needed.',
        messageType: 'system',
        createdAt: DateTime(2026, 3, 10, 15, 31),
      ),
      messages: [
        ChatMessage(
          id: 'msg_3',
          conversationId: 'chat_demo_2',
          senderType: 'customer',
          senderId: _abebeMemberId,
          senderName: 'Meseret Alemu',
          message: 'I need help changing a profile detail.',
          messageType: 'text',
          createdAt: DateTime(2026, 3, 10, 15, 30),
        ),
        ChatMessage(
          id: 'msg_4',
          conversationId: 'chat_demo_2',
          senderType: 'system',
          senderId: 'smart-support-assistant',
          senderName: 'Bunna Bank Assistant',
          message:
              'Please describe what you need help with and an agent can join if needed.',
          messageType: 'system',
          createdAt: DateTime(2026, 3, 10, 15, 31),
        ),
      ],
    ),
  ];

  @override
  Future<ChatConversation> createConversation({
    required String issueCategory,
    String? loanId,
    String? initialMessage,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    final now = DateTime(2026, 3, 11, 11, 0);
    String? branchName = 'Bahir Dar Branch';
    String? routingLevel = 'general';

    if (issueCategory == 'loan_issue' && loanId != null && loanId.isNotEmpty) {
      final loan = await DemoLoanApi().fetchLoanDetail(loanId);
      routingLevel = loan.currentLevel;
      if (loan.currentLevel == 'district') {
        branchName = null;
      } else if (loan.currentLevel == 'head_office') {
        branchName = 'Head Office Credit Team';
      }
    }

    final created = ChatConversation(
      id: 'chat_demo_new',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      status: 'waiting_agent',
      loanId: loanId,
      routingLevel: routingLevel,
      issueCategory: issueCategory,
      channel: 'mobile',
      createdAt: now,
      updatedAt: now,
      escalationFlag: false,
      priority: issueCategory == 'loan_issue' ? 'high' : 'normal',
      branchName: branchName,
      responseDueAt: now.add(
        issueCategory == 'loan_issue'
            ? const Duration(minutes: 20)
            : const Duration(minutes: 45),
      ),
      slaState: 'on_track',
      latestMessage: ChatMessage(
        id: 'msg_new_2',
        conversationId: 'chat_demo_new',
        senderType: 'system',
        senderId: 'smart-support-assistant',
        senderName: 'Bunna Bank Assistant',
        message:
            'Welcome to Bunna Bank support. A smart assistant is here first and an agent can join if needed.',
        messageType: 'system',
        createdAt: now,
      ),
      messages: [
        if (initialMessage != null && initialMessage.isNotEmpty)
          ChatMessage(
            id: 'msg_new_1',
            conversationId: 'chat_demo_new',
            senderType: 'customer',
            senderId: _abebeMemberId,
            senderName: 'Abebe Kebede',
            message: initialMessage,
            messageType: 'text',
            createdAt: now.subtract(const Duration(minutes: 1)),
          ),
        ChatMessage(
          id: 'msg_new_2',
          conversationId: 'chat_demo_new',
          senderType: 'system',
          senderId: 'smart-support-assistant',
          senderName: 'Bunna Bank Assistant',
          message:
              'Welcome to Bunna Bank support. A smart assistant is here first and an agent can join if needed.',
          messageType: 'system',
          createdAt: now,
        ),
      ],
    );
    _conversations.insert(0, created);
    return created;
  }

  @override
  Future<ChatConversation> fetchConversation(String conversationId) async {
    final items = await fetchMyConversations();
    return items.firstWhere((item) => item.id == conversationId);
  }

  @override
  Future<List<ChatConversation>> fetchMyConversations() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));

    return List<ChatConversation>.from(_conversations);
  }

  @override
  Future<ChatConversation> sendMessage(
    String conversationId, {
    required String message,
  }) async {
    final conversation = await fetchConversation(conversationId);
    final updatedMessages = [
      ...conversation.messages,
      ChatMessage(
        id: 'msg_sent_${conversation.messages.length + 1}',
        conversationId: conversationId,
        senderType: 'customer',
        senderId: _abebeMemberId,
        senderName: conversation.memberName,
        message: message,
        messageType: 'text',
        createdAt: DateTime.now(),
      ),
    ];

    final updatedConversation = ChatConversation(
      id: conversation.id,
      memberName: conversation.memberName,
      phoneNumber: conversation.phoneNumber,
      status: 'waiting_agent',
      issueCategory: conversation.issueCategory,
      channel: conversation.channel,
      createdAt: conversation.createdAt,
      updatedAt: DateTime.now(),
      escalationFlag: conversation.escalationFlag,
      priority: conversation.priority,
      branchName: conversation.branchName,
      assignedToStaffName: conversation.assignedToStaffName,
      assignedAgentId: conversation.assignedAgentId,
      responseDueAt: conversation.responseDueAt,
      slaState: conversation.slaState,
      latestMessage: updatedMessages.last,
      messages: updatedMessages,
    );
    final index =
        _conversations.indexWhere((item) => item.id == conversation.id);
    if (index >= 0) {
      _conversations[index] = updatedConversation;
    }
    return updatedConversation;
  }
}

class DemoCardApi implements CardApi {
  final List<CardItem> _cards = [
    CardItem(
      id: 'card_1',
      cardType: 'Debit Card',
      last4: '4821',
      status: 'active',
      preferredBranch: 'Bahir Dar Branch',
      channelControls: {
        'atm': true,
        'pos': true,
        'ecommerce': false,
      },
      issuedAt: DateTime(2026, 3, 1, 9, 0),
    ),
  ];

  @override
  Future<List<CardItem>> fetchMyCards() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return List<CardItem>.from(_cards);
  }

  @override
  Future<CardRequestResult> createCardRequest({
    String requestType = 'new_issue',
    String? preferredBranch,
    String? reason,
    String? cardType,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return const CardRequestResult(
      id: 'card_req_1',
      requestType: 'new_issue',
      status: 'submitted',
      cardId: 'card_1',
    );
  }

  @override
  Future<CardItem> lockCard(String cardId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final index = _cards.indexWhere((item) => item.id == cardId);
    final updated = CardItem(
      id: _cards[index].id,
      cardType: _cards[index].cardType,
      last4: _cards[index].last4,
      status: 'locked',
      preferredBranch: _cards[index].preferredBranch,
      channelControls: _cards[index].channelControls,
      issuedAt: _cards[index].issuedAt,
      lockedAt: DateTime(2026, 3, 31, 9, 30),
    );
    _cards[index] = updated;
    return updated;
  }

  @override
  Future<CardRequestResult> requestReplacement(
    String cardId, {
    String? reason,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final index = _cards.indexWhere((item) => item.id == cardId);
    _cards[index] = CardItem(
      id: _cards[index].id,
      cardType: _cards[index].cardType,
      last4: _cards[index].last4,
      status: 'replacement_requested',
      preferredBranch: _cards[index].preferredBranch,
      channelControls: _cards[index].channelControls,
      issuedAt: _cards[index].issuedAt,
    );
    return const CardRequestResult(
      id: 'card_req_replace_1',
      requestType: 'replacement',
      status: 'submitted',
      cardId: 'card_1',
    );
  }

  @override
  Future<CardItem> unlockCard(String cardId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final index = _cards.indexWhere((item) => item.id == cardId);
    final updated = CardItem(
      id: _cards[index].id,
      cardType: _cards[index].cardType,
      last4: _cards[index].last4,
      status: 'active',
      preferredBranch: _cards[index].preferredBranch,
      channelControls: _cards[index].channelControls,
      issuedAt: _cards[index].issuedAt,
    );
    _cards[index] = updated;
    return updated;
  }
}

class DemoServiceRequestApi implements ServiceRequestApi {
  @override
  Future<List<ServiceRequest>> fetchMyRequests() async {
    return [
      ServiceRequest(
        id: 'svc_1',
        type: 'failed_transfer',
        title: 'Interbank transfer failed',
        description:
            'A transfer was debited but has not reached the destination account.',
        status: 'under_review',
        latestNote: 'Operations is validating the transfer reference.',
        createdAt: DateTime(2026, 3, 10, 9, 20),
        payload: const {
          'transactionReference': 'TXN-DEMO-2026-001',
          'amount': 12000,
          'counterparty': 'Dashen Bank',
          'occurredAt': '2026-03-10 09:20',
        },
        attachments: const ['transfer_receipt.png'],
        timeline: const [
          ServiceRequestEvent(
            id: 'svc_1_evt_1',
            eventType: 'created',
            actorType: 'member',
            actorName: 'You',
            note: 'Customer submitted the request.',
          ),
        ],
      ),
      ServiceRequest(
        id: 'svc_2',
        type: 'phone_update',
        title: 'Phone number update',
        description:
            'Requested replacement of the phone number linked to the account.',
        status: 'awaiting_customer',
        latestNote: 'Please upload a clearer verification image.',
        createdAt: DateTime(2026, 3, 9, 14, 20),
        payload: const {
          'requestedPhoneNumber': '0911000099',
        },
        attachments: const ['fayda-front.jpg', 'selfie.jpg'],
      ),
      ServiceRequest(
        id: 'svc_3',
        type: 'account_relationship',
        title: 'Joint account relationship',
        description:
            'Requested spouse relationship update for joint account servicing.',
        status: 'under_review',
        latestNote: 'Relationship evidence is under branch review.',
        createdAt: DateTime(2026, 3, 8, 10, 5),
        payload: const {
          'relationshipType': 'spouse',
          'relatedMemberNumber': 'BUN-100112',
          'relatedCustomerId': 'BUN-100112',
        },
        attachments: const ['marriage-certificate.pdf'],
      ),
      ServiceRequest(
        id: 'svc_4',
        type: 'atm_card_request',
        title: 'ATM card issuance request',
        description: 'Requested debit card issuance with branch pickup.',
        status: 'under_review',
        latestNote:
            'Branch team confirmed the request and is preparing card production.',
        createdAt: DateTime(2026, 3, 9, 8, 40),
        payload: const {
          'preferredBranch': 'Bahir Dar Branch',
          'cardType': 'debit',
          'reason': 'New card issuance for active savings account.',
        },
        attachments: const ['front-1001.png', 'back-1001.png'],
      ),
    ];
  }

  @override
  Future<ServiceRequest> fetchRequestDetail(String requestId) async {
    final items = await fetchMyRequests();
    return items.firstWhere((item) => item.id == requestId,
        orElse: () => items.first);
  }

  @override
  Future<ServiceRequest> createRequest({
    required String type,
    required String title,
    required String description,
    Map<String, dynamic>? payload,
    List<String>? attachments,
  }) async {
    return ServiceRequest(
      id: 'svc_new',
      type: type,
      title: title,
      description: description,
      status: 'submitted',
      latestNote: 'Your request has been submitted.',
      createdAt: DateTime.now(),
      payload: payload ?? const {},
      attachments: attachments ?? const [],
      timeline: const [
        ServiceRequestEvent(
          id: 'svc_new_evt_1',
          eventType: 'created',
          actorType: 'member',
          actorName: 'You',
          note: 'Customer submitted the request.',
        ),
      ],
    );
  }
}

class DemoVotingApi implements VotingApi {
  @override
  Future<List<VoteSummary>> fetchActiveVotes() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return [
      VoteSummary(
        voteId: 'vote_2026',
        title: 'Board Election 2026',
        description: 'Annual shareholder election',
        status: 'open',
        startDate: DateTime(2026, 5, 1),
        endDate: DateTime(2026, 5, 7),
      ),
    ];
  }

  @override
  Future<VoteDetail> fetchVoteDetail(String voteId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));

    return VoteDetail(
      voteId: voteId,
      title: 'Board Election 2026',
      description: 'Annual shareholder election',
      status: 'open',
      startDate: DateTime(2026, 5, 1),
      endDate: DateTime(2026, 5, 7),
      options: const [
        VoteOption(
          optionId: 'option_board_a',
          voteId: 'vote_2026',
          name: 'Candidate A',
          description: 'Support Candidate A for the board seat.',
          displayOrder: 1,
        ),
        VoteOption(
          optionId: 'option_board_b',
          voteId: 'vote_2026',
          name: 'Candidate B',
          description: 'Support Candidate B for the board seat.',
          displayOrder: 2,
        ),
      ],
    );
  }

  @override
  Future<Map<String, dynamic>> submitVote(
    String voteId, {
    required String optionId,
    required String encryptedBallot,
    required String otpCode,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));

    return {
      'voteId': voteId,
      'optionId': optionId,
      'otpVerifiedAt': DateTime(2026, 5, 3, 9, 30).toIso8601String(),
    };
  }
}

String _maskPhoneNumber(String phoneNumber) {
  if (phoneNumber.length <= 4) {
    return phoneNumber;
  }
  return '${phoneNumber.substring(0, 2)}${List.filled(phoneNumber.length - 4, '*').join()}${phoneNumber.substring(phoneNumber.length - 2)}';
}

String _maskEmail(String email) {
  final parts = email.split('@');
  if (parts.length != 2) {
    return email;
  }
  final localPart = parts.first;
  final domain = parts.last;
  final visible = localPart.isEmpty ? '' : localPart[0];
  return '$visible${List.filled(localPart.length > 1 ? localPart.length - 1 : 1, '*').join()}@$domain';
}

String _guessMimeType(String fileName) {
  final normalized = fileName.toLowerCase();
  if (normalized.endsWith('.png')) {
    return 'image/png';
  }
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalized.endsWith('.pdf')) {
    return 'application/pdf';
  }
  return 'application/octet-stream';
}

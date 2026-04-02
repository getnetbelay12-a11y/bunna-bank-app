import '../models/index.dart';
import 'api_contracts.dart';

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
      customerId: 'AMB-000006',
      memberId: 'member_new_1',
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
      memberId: isShareholder ? 'member_shareholder_1' : 'member_regular_2',
      customerId: isShareholder ? 'MBR-1001' : 'MBR-1002',
      fullName: isShareholder ? 'Abebe Kebede' : 'Meseret Alemu',
      phone: isShareholder ? '0911000001' : '0911000002',
      memberType: isShareholder ? MemberType.shareholder : MemberType.member,
      branchName: isShareholder ? 'Bahir Dar Branch' : 'Gondar Branch',
      membershipStatus: isShareholder ? 'active' : 'pending_verification',
      identityVerificationStatus:
          isShareholder ? 'verified' : 'manual_review_required',
      featureFlags: MemberFeatureFlags(
        voting: isShareholder,
        schoolPayment: true,
        loans: true,
        savings: true,
        liveChat: true,
      ),
    );
  }

  @override
  Future<Map<String, dynamic>> requestOtp(String phoneNumber) async {
    return {
      'phoneNumber': phoneNumber,
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
  Future<void> logout() async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
  }
}

class DemoLocationApi implements LocationApi {
  static const _branches = <LocationBranchOption>[
    LocationBranchOption(
      id: 'branch_gondar_main',
      name: 'Gondar Main Branch',
      region: 'Amhara',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_gondar_piazza',
      name: 'Gondar Piazza Branch',
      region: 'Amhara',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_gondar_university',
      name: 'Gondar University Branch',
      region: 'Amhara',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_bahir_dar',
      name: 'Bahir Dar Branch',
      region: 'Amhara',
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
      region: 'Amhara',
      city: 'Gondar',
    ),
    LocationBranchOption(
      id: 'branch_debre_markos',
      name: 'Debre Markos Branch',
      region: 'Amhara',
      city: 'Debre Markos',
    ),
  ];

  @override
  Future<List<String>> fetchRegions() async {
    return const ['Amhara', 'Oromia', 'Addis Ababa', 'Tigray', 'SNNP'];
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

    if (memberId == 'member_shareholder_1') {
      return const MemberProfile(
        memberId: 'member_shareholder_1',
        customerId: 'AMB-000001',
        memberNumber: 'MBR-1001',
        fullName: 'Abebe Kebede',
        phone: '0911000001',
        branchName: 'Bahir Dar Branch',
        memberType: 'shareholder',
        membershipStatus: 'active',
        identityVerificationStatus: 'verified',
      );
    }

    return const MemberProfile(
      memberId: 'member_regular_2',
      customerId: 'AMB-000003',
      memberNumber: 'MBR-1002',
      fullName: 'Meseret Alemu',
      phone: '0911000002',
      branchName: 'Gondar Branch',
      memberType: 'member',
      membershipStatus: 'pending_verification',
      identityVerificationStatus: 'manual_review_required',
    );
  }
}

class DemoIdentityVerificationApi implements IdentityVerificationApi {
  @override
  Future<IdentityVerificationResult> getStatus() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return const IdentityVerificationResult(
      memberId: 'member_regular_2',
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
      memberId: 'member_regular_2',
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
      memberId: 'member_regular_2',
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
      memberId: 'member_regular_2',
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

    if (memberId == 'member_shareholder_1') {
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

    return const [
      SavingsAccount(
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

    return const SchoolPaymentResult(
      schoolPaymentId: 'school_payment_1',
      transactionReference: 'TXN-DEMO-2026-001',
      notificationStatus: 'sent',
    );
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return const [
      {
        'schoolName': 'Blue Nile Academy',
        'amount': 1500.0,
        'status': 'successful',
      },
    ];
  }
}

class DemoLoanApi implements LoanApi {
  @override
  Future<List<LoanSummary>> fetchMyLoans() async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    return const [
      LoanSummary(
        loanId: 'loan_1',
        loanType: 'Business Loan',
        amount: 500000,
        status: 'branch_review',
        currentLevel: 'branch',
        purpose: 'Working capital',
      ),
      LoanSummary(
        loanId: 'loan_2',
        loanType: 'School Expansion Loan',
        amount: 1200000,
        status: 'approved',
        currentLevel: 'head_office',
        purpose: 'Expansion',
      ),
    ];
  }

  @override
  Future<LoanSummary> fetchLoanDetail(String loanId) async {
    final loans = await fetchMyLoans();
    return loans.firstWhere((loan) => loan.loanId == loanId);
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
      status: 'submitted',
      currentLevel: 'branch',
      purpose: purpose,
    );
  }
}

class DemoNotificationApi implements NotificationApi {
  @override
  Future<List<AppNotification>> fetchMyNotifications() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    return [
      AppNotification(
        notificationId: 'notif_1',
        type: 'loan_status',
        status: 'sent',
        title: 'Loan Update',
        message: 'Your business loan is under branch review.',
        createdAt: DateTime(2026, 3, 9, 10, 30),
      ),
      AppNotification(
        notificationId: 'notif_2',
        type: 'payment',
        status: 'read',
        title: 'School Payment Successful',
        message: 'Your payment has been recorded successfully.',
        createdAt: DateTime(2026, 3, 9, 9, 15),
      ),
      AppNotification(
        notificationId: 'notif_3',
        type: 'chat',
        status: 'sent',
        title: 'Support Reply',
        message: 'A Bunna Bank support agent replied to your request.',
        createdAt: DateTime(2026, 3, 11, 11, 5),
      ),
    ];
  }

  @override
  Future<AppNotification> markAsRead(String notificationId) async {
    final items = await fetchMyNotifications();
    return items.firstWhere((item) => item.notificationId == notificationId);
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
      branchName: 'Bahir Dar Branch',
      assignedToStaffName: 'Rahel Desta',
      assignedAgentId: 'support_1',
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
          senderId: 'member_shareholder_1',
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
      branchName: 'Gondar Branch',
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
          senderId: 'member_shareholder_1',
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
    String? initialMessage,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    final now = DateTime(2026, 3, 11, 11, 0);

    final created = ChatConversation(
      id: 'chat_demo_new',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      status: 'waiting_agent',
      issueCategory: issueCategory,
      channel: 'mobile',
      createdAt: now,
      updatedAt: now,
      escalationFlag: false,
      branchName: 'Bahir Dar Branch',
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
            senderId: 'member_shareholder_1',
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
        senderId: 'member_shareholder_1',
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
      branchName: conversation.branchName,
      assignedToStaffName: conversation.assignedToStaffName,
      assignedAgentId: conversation.assignedAgentId,
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

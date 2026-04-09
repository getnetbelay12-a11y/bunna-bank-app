import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';
import '../../../shared/widgets/status_cards.dart';
import 'onboarding_status_screen.dart';

class KycOnboardingScreen extends StatefulWidget {
  const KycOnboardingScreen({
    super.key,
    required this.phoneNumber,
    this.email,
  });

  static const routeName = '/kyc-onboarding';

  final String phoneNumber;
  final String? email;

  @override
  State<KycOnboardingScreen> createState() => _KycOnboardingScreenState();
}

class _KycOnboardingScreenState extends State<KycOnboardingScreen> {
  static const _sampleRegions = <String>[
    'Bunna',
    'Oromia',
    'Addis Ababa',
    'Tigray',
    'SNNP',
  ];

  static const _sampleCities = <String>[
    'Gondar',
    'Bahir Dar',
    'Addis Ababa',
    'Adama',
    'Mekelle',
  ];

  static const _sampleBranches = <String, List<LocationBranchOption>>{
    'Bunna|Gondar': [
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
    ],
    'Bunna|Bahir Dar': [
      LocationBranchOption(
        id: 'branch_bahir_dar_main',
        name: 'Bahir Dar Main Branch',
        region: 'Bunna',
        city: 'Bahir Dar',
      ),
      LocationBranchOption(
        id: 'branch_bahir_dar_lake',
        name: 'Bahir Dar Lake Branch',
        region: 'Bunna',
        city: 'Bahir Dar',
      ),
    ],
    'Addis Ababa|Addis Ababa': [
      LocationBranchOption(
        id: 'branch_addis_main',
        name: 'Addis Main Branch',
        region: 'Addis Ababa',
        city: 'Addis Ababa',
      ),
    ],
    'Oromia|Adama': [
      LocationBranchOption(
        id: 'branch_adama_main',
        name: 'Adama Main Branch',
        region: 'Oromia',
        city: 'Adama',
      ),
    ],
    'Tigray|Mekelle': [
      LocationBranchOption(
        id: 'branch_mekelle_main',
        name: 'Mekelle Main Branch',
        region: 'Tigray',
        city: 'Mekelle',
      ),
    ],
  };

  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _faydaFinController = TextEditingController();
  final _pinController = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();

  String? _selectedRegion = 'Bunna';
  String? _selectedCity = 'Gondar';
  LocationBranchOption? _selectedBranch;
  String _verificationStatus = 'pending_verification';
  String? _message;
  bool _submitting = false;
  _SelectedUpload? _frontIdUpload;
  _SelectedUpload? _backIdUpload;
  _SelectedUpload? _selfieUpload;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _faydaFinController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final progressSteps = _buildProgressSteps();

    return AppScaffold(
      title: 'KYC Onboarding',
      showBack: true,
      resizeToAvoidBottomInset: true,
      body: FutureBuilder<List<String>>(
          future: services.locationApi.fetchRegions(),
          builder: (context, regionSnapshot) {
            final regions = _mergeRegions(regionSnapshot.data);
            final region = _selectedRegion ?? 'Bunna';

            return FutureBuilder<List<String>>(
              future: services.locationApi.fetchCities(region),
              builder: (context, citySnapshot) {
                final cities = _mergeCities(citySnapshot.data);
                final city = _selectedCity ?? 'Gondar';

                return FutureBuilder<List<LocationBranchOption>>(
                  future: services.locationApi.fetchBranches(
                    region: region,
                    city: city,
                  ),
                  builder: (context, branchSnapshot) {
                    final branches = _resolveBranches(
                      region: region,
                      city: city,
                      liveBranches: branchSnapshot.data,
                    );
                    final selectedBranchId = branches.any(
                      (item) => item.id == _selectedBranch?.id,
                    )
                        ? _selectedBranch?.id
                        : null;

                    return SingleChildScrollView(
                      padding: EdgeInsets.fromLTRB(
                        24,
                        24,
                        24,
                        24 + MediaQuery.of(context).viewInsets.bottom,
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AppHeader(
                              title: 'Account opening',
                              subtitle: _headlineCopyForStatus(_verificationStatus),
                            ),
                            const SizedBox(height: 16),
                            AppCard(
                              child: _OnboardingProgressCard(
                                currentStatus: _verificationStatus,
                                steps: progressSteps,
                              ),
                            ),
                            const SizedBox(height: 20),
                            AppCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'Onboarding status',
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleMedium
                                              ?.copyWith(
                                                fontWeight: FontWeight.w700,
                                              ),
                                        ),
                                      ),
                                      AppBadge(
                                        label: _verificationStatus
                                            .replaceAll('_', ' ')
                                            .toUpperCase(),
                                        tone: _statusBadgeTone(
                                          _verificationStatus,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  StatusBannerCard(
                                    title: 'Current step',
                                    message:
                                        _statusBannerCopy(_verificationStatus),
                                    tone: _statusCardTone(
                                      _verificationStatus,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            AppCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Personal details',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 12),
                                  AppInput(
                                    controller: _firstNameController,
                                    label: 'First Name',
                                    validator: (value) =>
                                        (value == null ||
                                                value.trim().isEmpty)
                                            ? 'First name is required.'
                                            : null,
                                  ),
                                  const SizedBox(height: 12),
                                  AppInput(
                                    controller: _lastNameController,
                                    label: 'Last Name',
                                    validator: (value) =>
                                        (value == null ||
                                                value.trim().isEmpty)
                                            ? 'Last name is required.'
                                            : null,
                                  ),
                                  const SizedBox(height: 12),
                                  DropdownButtonFormField<String>(
                                    initialValue: region,
                                    decoration: _dropdownDecoration(
                                      labelText: 'Select your region',
                                    ),
                                    items: regions
                                        .map(
                                          (item) => DropdownMenuItem<String>(
                                            value: item,
                                            child: Text(item),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (value) {
                                      setState(() {
                                        _selectedRegion = value;
                                        _selectedCity = null;
                                        _selectedBranch = null;
                                      });
                                    },
                                    validator: (value) =>
                                        (value == null || value.isEmpty)
                                            ? 'Region is required.'
                                            : null,
                                  ),
                                  const SizedBox(height: 12),
                                  DropdownButtonFormField<String>(
                                    initialValue:
                                        cities.contains(city) ? city : null,
                                    decoration: _dropdownDecoration(
                                      labelText: 'Select your city',
                                    ),
                                    items: cities
                                        .map(
                                          (item) => DropdownMenuItem<String>(
                                            value: item,
                                            child: Text(item),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (value) {
                                      setState(() {
                                        _selectedCity = value;
                                        _selectedBranch = null;
                                      });
                                    },
                                    validator: (value) =>
                                        (value == null || value.isEmpty)
                                            ? 'City is required.'
                                            : null,
                                  ),
                                  const SizedBox(height: 12),
                                  DropdownButtonFormField<String>(
                                    initialValue: selectedBranchId,
                                    decoration: _dropdownDecoration(
                                      labelText:
                                          'Choose your preferred branch',
                                      helperText:
                                          'Branch names are shown here. You do not need to know a branch ID.',
                                    ),
                                    items: branches
                                        .map(
                                          (item) => DropdownMenuItem<String>(
                                            value: item.id,
                                            child: Text(item.name),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: branches.isEmpty
                                        ? null
                                        : (value) {
                                            setState(() {
                                              _selectedBranch = branches
                                                  .firstWhere(
                                                (item) => item.id == value,
                                              );
                                            });
                                          },
                                    validator: (value) {
                                      if (branches.isNotEmpty &&
                                          (value == null ||
                                              value.isEmpty)) {
                                        return 'Preferred branch is required.';
                                      }
                                      return null;
                                    },
                                  ),
                                  if (branches.isEmpty) ...[
                                    const SizedBox(height: 8),
                                    const Text(
                                      'We will recommend a nearby branch after submission.',
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            _UploadCard(
                              title: 'Fayda Front ID Upload',
                              actionLabel: _frontIdUpload == null
                                  ? 'Upload Front ID'
                                  : 'Replace Front ID',
                              upload: _frontIdUpload,
                              onTap: () => _selectDocumentUpload(
                                title: 'Fayda Front ID Upload',
                                onSelected: (value) {
                                  setState(() {
                                    _frontIdUpload = value;
                                  });
                                },
                              ),
                              validator: () => _frontIdUpload == null
                                  ? 'Front ID upload is required.'
                                  : null,
                            ),
                            const SizedBox(height: 12),
                            _UploadCard(
                              title: 'Fayda Back ID Upload',
                              actionLabel: _backIdUpload == null
                                  ? 'Upload Back ID'
                                  : 'Replace Back ID',
                              upload: _backIdUpload,
                              onTap: () => _selectDocumentUpload(
                                title: 'Fayda Back ID Upload',
                                onSelected: (value) {
                                  setState(() {
                                    _backIdUpload = value;
                                  });
                                },
                              ),
                              validator: () => _backIdUpload == null
                                  ? 'Back ID upload is required.'
                                  : null,
                            ),
                            const SizedBox(height: 12),
                            _UploadCard(
                              title: 'Selfie Verification',
                              actionLabel: _selfieUpload == null
                                  ? 'Take Selfie'
                                  : 'Retake Selfie',
                              upload: _selfieUpload,
                              onTap: () => _selectSelfieUpload(
                                onSelected: (value) {
                                  setState(() {
                                    _selfieUpload = value;
                                  });
                                },
                              ),
                              validator: () => _selfieUpload == null
                                  ? 'Selfie verification is required.'
                                  : null,
                            ),
                            const SizedBox(height: 8),
                            AppCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Higher-risk verification checkpoint',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
                                        ?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 6),
                                  const Text(
                                    'A live selfie helps the bank compare the onboarding request with your Fayda documents before account activation, card issuance, or other sensitive services.',
                                  ),
                                  const SizedBox(height: 10),
                                  AppBadge(
                                    label: _selfieUpload == null
                                        ? 'SELFIE NOT CAPTURED'
                                        : 'SELFIE READY FOR REVIEW',
                                    tone: _selfieUpload == null
                                        ? AppBadgeTone.warning
                                        : AppBadgeTone.success,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                            AppCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Identity and PIN',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 12),
                                  InputDecorator(
                                    decoration: const InputDecoration(
                                      labelText: 'Verification Status',
                                    ),
                                    child: Text(
                                      _verificationStatus.replaceAll('_', ' '),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  AppInput(
                                    controller: _faydaFinController,
                                    keyboardType: TextInputType.number,
                                    label: 'Fayda FIN',
                                    helperText:
                                        'This can be auto-filled later if extracted from uploaded Fayda documents.',
                                    validator: (value) =>
                                        (value == null ||
                                                value.trim().length != 12)
                                            ? 'Fayda FIN must be 12 digits.'
                                            : null,
                                  ),
                                  const SizedBox(height: 12),
                                  AppInput(
                                    controller: _pinController,
                                    keyboardType: TextInputType.number,
                                    obscureText: true,
                                    maxLength: 6,
                                    label: 'Choose PIN',
                                    validator: (value) =>
                                        (value == null ||
                                                value.trim().isEmpty)
                                            ? 'PIN is required.'
                                            : null,
                                  ),
                                ],
                              ),
                            ),
                            if (_message != null) ...[
                              const SizedBox(height: 12),
                              Text(_message!),
                            ],
                            const SizedBox(height: 20),
                            AppButton(
                              label: _submitting
                                  ? 'Submitting...'
                                  : 'Create Account',
                              onPressed: _submitting
                                  ? null
                                  : () async {
                                        if (!_formKey.currentState!
                                            .validate()) {
                                          return;
                                        }

                                        final uploadError = _validateUploads();
                                        if (uploadError != null) {
                                          ScaffoldMessenger.of(context)
                                              .showSnackBar(
                                            SnackBar(
                                              content: Text(uploadError),
                                            ),
                                          );
                                          return;
                                        }

                                        setState(() {
                                          _submitting = true;
                                          _verificationStatus =
                                              'documents_submitted';
                                        });

                                        final navigator = Navigator.of(context);
                                        try {
                                          final frontUpload = await services
                                              .documentUploadApi
                                              .uploadDocument(
                                            filePath: _frontIdUpload!.path,
                                            originalFileName:
                                                _frontIdUpload!.name,
                                            domain: 'onboarding',
                                            entityId: widget.phoneNumber,
                                            documentType: 'fayda_front',
                                          );
                                          final backUpload = await services
                                              .documentUploadApi
                                              .uploadDocument(
                                            filePath: _backIdUpload!.path,
                                            originalFileName:
                                                _backIdUpload!.name,
                                            domain: 'onboarding',
                                            entityId: widget.phoneNumber,
                                            documentType: 'fayda_back',
                                          );
                                          final selfieUpload = await services
                                              .documentUploadApi
                                              .uploadDocument(
                                            filePath: _selfieUpload!.path,
                                            originalFileName:
                                                _selfieUpload!.name,
                                            domain: 'onboarding',
                                            entityId: widget.phoneNumber,
                                            documentType: 'selfie',
                                          );
                                          final result =
                                              await services.authApi.register(
                                            firstName: _firstNameController.text
                                                .trim(),
                                            lastName:
                                                _lastNameController.text.trim(),
                                            phoneNumber: widget.phoneNumber,
                                            email: widget.email,
                                            dateOfBirth: '1995-01-15',
                                            region: _selectedRegion ?? region,
                                            city: _selectedCity ?? city,
                                            preferredBranchId:
                                                _selectedBranch?.id,
                                            preferredBranchName:
                                                _selectedBranch?.name,
                                            password:
                                                _pinController.text.trim(),
                                            confirmPassword:
                                                _pinController.text.trim(),
                                            faydaFin:
                                                _faydaFinController.text.trim(),
                                            faydaQrData:
                                                'front:${frontUpload.storageKey}|back:${backUpload.storageKey}|selfie:${selfieUpload.storageKey}',
                                            faydaFrontImage:
                                                frontUpload.storageKey,
                                            faydaBackImage:
                                                backUpload.storageKey,
                                            consentAccepted: true,
                                          );

                                          if (!context.mounted) {
                                            return;
                                          }

                                          setState(() {
                                            _verificationStatus =
                                                'review_in_progress';
                                            _message =
                                                '${result.message} Customer ID: ${result.customerId}';
                                            _submitting = false;
                                          });
                                          navigator.pushReplacement(
                                            MaterialPageRoute<void>(
                                              builder: (_) =>
                                                  OnboardingStatusScreen(
                                                customerId: result.customerId,
                                                phoneNumber:
                                                    widget.phoneNumber,
                                                selectedBranchName:
                                                    _selectedBranch?.name,
                                                reviewStatus:
                                                    _verificationStatus,
                                                statusMessage: result.message,
                                              ),
                                            ),
                                          );
                                        } catch (error) {
                                          if (!mounted) {
                                            return;
                                          }
                                          setState(() {
                                            _submitting = false;
                                            _verificationStatus =
                                                'needs_action';
                                          });
                                          ScaffoldMessenger.of(context)
                                              .showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                _extractErrorMessage(
                                                  error,
                                                  fallback:
                                                      'Unable to complete registration right now.',
                                                ),
                                              ),
                                            ),
                                          );
                                        }
                                      },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
    );
  }

  String? _validateUploads() {
    if (_frontIdUpload == null) {
      return 'Front ID upload is required.';
    }
    if (_backIdUpload == null) {
      return 'Back ID upload is required.';
    }
    if (_selfieUpload == null) {
      return 'Selfie verification is required.';
    }
    return null;
  }

  List<_OnboardingStep> _buildProgressSteps() {
    final documentsReady = _frontIdUpload != null && _backIdUpload != null;
    final selfieReady = _selfieUpload != null;
    final pinReady = _pinController.text.trim().isNotEmpty;

    return [
      const _OnboardingStep(
        title: 'Phone and OTP',
        description: 'Phone number verified before onboarding starts.',
        state: _StepState.done,
      ),
      _OnboardingStep(
        title: 'Profile and branch',
        description: 'Region, city, and preferred branch captured.',
        state: (_selectedRegion?.isNotEmpty == true &&
                _selectedCity?.isNotEmpty == true)
            ? _StepState.done
            : _StepState.current,
      ),
      _OnboardingStep(
        title: 'Fayda documents',
        description: 'Front and back ID evidence prepared for review.',
        state: documentsReady ? _StepState.done : _StepState.current,
      ),
      _OnboardingStep(
        title: 'Selfie and PIN',
        description: 'Higher-risk confirmation and secure PIN setup.',
        state: selfieReady && pinReady ? _StepState.done : _StepState.upcoming,
      ),
      _OnboardingStep(
        title: 'Review outcome',
        description: _reviewOutcomeDescription(_verificationStatus),
        state: _verificationStatus == 'review_in_progress'
            ? _StepState.current
            : _verificationStatus == 'approved'
                ? _StepState.done
                : _StepState.upcoming,
      ),
    ];
  }

  String _headlineCopyForStatus(String status) {
    switch (status) {
      case 'documents_submitted':
        return 'Your onboarding package is being prepared for review. Confirm the remaining details and submit carefully.';
      case 'review_in_progress':
        return 'Your onboarding request is under review. Watch for follow-up requests if any document or selfie check needs attention.';
      case 'needs_action':
        return 'Some onboarding details still need attention. Review the highlighted fields and submit again.';
      default:
        return 'Provide your location, preferred branch, Fayda document uploads, selfie verification, and a secure PIN.';
    }
  }

  String _statusBannerCopy(String status) {
    switch (status) {
      case 'documents_submitted':
        return 'Fayda documents and selfie evidence are staged. Submit now to move the account into review.';
      case 'review_in_progress':
        return 'The onboarding request is now pending branch and verification review.';
      case 'needs_action':
        return 'The last submission needs correction before it can move forward.';
      default:
        return 'Fayda front and back images plus a selfie are required for onboarding review.';
    }
  }

  StatusCardTone _statusCardTone(String status) {
    switch (status) {
      case 'approved':
        return StatusCardTone.success;
      case 'needs_action':
        return StatusCardTone.warning;
      case 'review_in_progress':
      case 'documents_submitted':
        return StatusCardTone.info;
      default:
        return StatusCardTone.info;
    }
  }

  AppBadgeTone _statusBadgeTone(String status) {
    switch (status) {
      case 'approved':
        return AppBadgeTone.success;
      case 'needs_action':
        return AppBadgeTone.warning;
      case 'review_in_progress':
      case 'documents_submitted':
        return AppBadgeTone.primary;
      default:
        return AppBadgeTone.neutral;
    }
  }

  String _reviewOutcomeDescription(String status) {
    switch (status) {
      case 'review_in_progress':
        return 'Branch and KYC teams are checking your documents and selfie.';
      case 'approved':
        return 'Identity review completed successfully.';
      default:
        return 'After submission, the app will show whether review is pending or further action is required.';
    }
  }

  Future<void> _selectDocumentUpload({
    required String title,
    required ValueChanged<_SelectedUpload> onSelected,
  }) async {
    final action = await showCupertinoModalPopup<_UploadAction>(
      context: context,
      builder: (sheetContext) => CupertinoActionSheet(
        title: Text(title),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () =>
                Navigator.of(sheetContext).pop(_UploadAction.takePhoto),
            child: const Text('Take Photo'),
          ),
          CupertinoActionSheetAction(
            onPressed: () =>
                Navigator.of(sheetContext).pop(_UploadAction.choosePhoto),
            child: const Text('Choose from Photos'),
          ),
          CupertinoActionSheetAction(
            onPressed: () =>
                Navigator.of(sheetContext).pop(_UploadAction.chooseFile),
            child: const Text('Choose File'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.of(sheetContext).pop(),
          child: const Text('Cancel'),
        ),
      ),
    );

    if (action == null) {
      return;
    }

    final upload = await _pickUpload(action, allowFiles: true);
    if (upload == null || !mounted) {
      return;
    }

    onSelected(upload);
  }

  Future<void> _selectSelfieUpload({
    required ValueChanged<_SelectedUpload> onSelected,
  }) async {
    final action = await showCupertinoModalPopup<_UploadAction>(
      context: context,
      builder: (sheetContext) => CupertinoActionSheet(
        title: const Text('Selfie Verification'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () =>
                Navigator.of(sheetContext).pop(_UploadAction.takeSelfie),
            child: const Text('Take Selfie'),
          ),
          CupertinoActionSheetAction(
            onPressed: () =>
                Navigator.of(sheetContext).pop(_UploadAction.choosePhoto),
            child: const Text('Choose from Photos'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.of(sheetContext).pop(),
          child: const Text('Cancel'),
        ),
      ),
    );

    if (action == null) {
      return;
    }

    final upload = await _pickUpload(action, allowFiles: false);
    if (upload == null || !mounted) {
      return;
    }

    onSelected(upload);
  }

  Future<_SelectedUpload?> _pickUpload(
    _UploadAction action, {
    required bool allowFiles,
  }) async {
    try {
      switch (action) {
        case _UploadAction.takePhoto:
        case _UploadAction.takeSelfie:
          return _pickImage(ImageSource.camera);
        case _UploadAction.choosePhoto:
          return _pickImage(ImageSource.gallery);
        case _UploadAction.chooseFile:
          if (!allowFiles) {
            return null;
          }
          return _pickFile();
      }
    } catch (error) {
      if (!mounted) {
        return null;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _extractErrorMessage(
              error,
              fallback: 'Unable to open the selected upload source.',
            ),
          ),
        ),
      );
      return null;
    }
  }

  Future<_SelectedUpload?> _pickImage(ImageSource source) async {
    final file = await _imagePicker.pickImage(
      source: source,
      imageQuality: 85,
      preferredCameraDevice:
          source == ImageSource.camera ? CameraDevice.front : CameraDevice.rear,
    );
    if (file == null) {
      return null;
    }

    return _SelectedUpload(
      name: file.name,
      path: file.path,
      kind: 'image',
    );
  }

  Future<_SelectedUpload?> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: false,
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result == null || result.files.isEmpty) {
      return null;
    }

    final file = result.files.single;
    return _SelectedUpload(
      name: file.name,
      path: file.path ?? file.name,
      kind: 'file',
    );
  }

  List<String> _mergeRegions(List<String>? liveRegions) {
    return {
      ..._sampleRegions,
      ...?liveRegions,
    }.toList();
  }

  List<String> _mergeCities(List<String>? liveCities) {
    return {
      ..._sampleCities,
      ...?liveCities,
    }.toList();
  }

  List<LocationBranchOption> _resolveBranches({
    required String? region,
    required String? city,
    List<LocationBranchOption>? liveBranches,
  }) {
    final merged = <LocationBranchOption>[
      ...?liveBranches,
      ..._sampleBranches['${region ?? ''}|${city ?? ''}'] ?? const [],
    ];

    final unique = <String, LocationBranchOption>{};
    for (final branch in merged) {
      unique[branch.id] = branch;
    }
    return unique.values.toList();
  }

  InputDecoration _dropdownDecoration({
    required String labelText,
    String? helperText,
  }) {
    return InputDecoration(
      labelText: labelText,
      helperText: helperText,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 16,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFD8E3F5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFD8E3F5)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFF0F4CBA)),
      ),
    );
  }
}

class _UploadCard extends StatelessWidget {
  const _UploadCard({
    required this.title,
    required this.actionLabel,
    required this.onTap,
    required this.validator,
    this.upload,
  });

  final String title;
  final String actionLabel;
  final VoidCallback onTap;
  final String? Function() validator;
  final _SelectedUpload? upload;

  @override
  Widget build(BuildContext context) {
    return FormField<String>(
      validator: (_) => validator(),
      builder: (field) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: onTap,
            child: Ink(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: field.hasError
                      ? Theme.of(context).colorScheme.error
                      : const Color(0xFFD8E3F5),
                ),
              ),
              child: Row(
                children: [
                  _UploadPreview(upload: upload),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style:
                              Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          upload == null
                              ? actionLabel
                              : '${upload!.name}\nSelected successfully',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: const Color(0xFF475569),
                                  ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded),
                ],
              ),
            ),
          ),
          if (field.hasError) ...[
            const SizedBox(height: 6),
            Text(
              field.errorText!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _UploadPreview extends StatelessWidget {
  const _UploadPreview({required this.upload});

  final _SelectedUpload? upload;

  @override
  Widget build(BuildContext context) {
    if (upload == null) {
      return Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.upload_file_rounded),
      );
    }

    final file = File(upload!.path);
    final isImage = upload!.kind == 'image' && file.existsSync();

    if (isImage) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.file(
          file,
          width: 56,
          height: 56,
          fit: BoxFit.cover,
        ),
      );
    }

    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(Icons.insert_drive_file_rounded),
    );
  }
}

class _SelectedUpload {
  const _SelectedUpload({
    required this.name,
    required this.path,
    required this.kind,
  });

  final String name;
  final String path;
  final String kind;
}

enum _UploadAction {
  takePhoto,
  choosePhoto,
  chooseFile,
  takeSelfie,
}

String _extractErrorMessage(Object error, {required String fallback}) {
  final text = error.toString().replaceFirst('Exception: ', '').trim();
  if (text.isEmpty) {
    return fallback;
  }
  return text;
}

enum _StepState { done, current, upcoming }

class _OnboardingStep {
  const _OnboardingStep({
    required this.title,
    required this.description,
    required this.state,
  });

  final String title;
  final String description;
  final _StepState state;
}

class _OnboardingProgressCard extends StatelessWidget {
  const _OnboardingProgressCard({
    required this.currentStatus,
    required this.steps,
  });

  final String currentStatus;
  final List<_OnboardingStep> steps;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD8E3F5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Onboarding Progress',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Current status: ${currentStatus.replaceAll('_', ' ')}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF475569),
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 16),
          for (final step in steps) ...[
            _ProgressRow(step: step),
            if (step != steps.last) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.step});

  final _OnboardingStep step;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (step.state) {
      _StepState.done => (Icons.check_circle_rounded, const Color(0xFF047857)),
      _StepState.current => (Icons.radio_button_checked_rounded, const Color(0xFF0F4CBA)),
      _StepState.upcoming => (Icons.radio_button_unchecked_rounded, const Color(0xFF94A3B8)),
    };

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                step.title,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                step.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

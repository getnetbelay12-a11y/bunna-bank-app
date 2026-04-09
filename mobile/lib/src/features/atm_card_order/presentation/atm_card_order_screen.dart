import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../shared/widgets/upload_selector_card.dart';

class AtmCardOrderScreen extends StatefulWidget {
  const AtmCardOrderScreen({super.key});

  @override
  State<AtmCardOrderScreen> createState() => _AtmCardOrderScreenState();
}

class _AtmCardOrderScreenState extends State<AtmCardOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _regionController = TextEditingController(text: 'Bunna');
  final _cityController = TextEditingController(text: 'Bahir Dar');
  final _branchController = TextEditingController(text: 'Bahir Dar Branch');
  final _pinController = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();

  _SelectedUpload? _faydaFrontUpload;
  _SelectedUpload? _faydaBackUpload;
  _SelectedUpload? _selfieUpload;
  bool _submitting = false;
  String? _message;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _regionController.dispose();
    _cityController.dispose();
    _branchController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('ATM Card Order'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            20 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFB9DBFF)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Selfie Verification Required',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: abayPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'ATM card requests require verified identity, unlocked account access, matched profile details, PIN setup, branch review, and selfie verification before production.',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                _buildField(_firstNameController, 'First Name'),
                const SizedBox(height: 12),
                _buildField(_lastNameController, 'Last Name'),
                const SizedBox(height: 12),
                _buildField(
                  _phoneController,
                  'Phone Number',
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                _buildField(_regionController, 'Region'),
                const SizedBox(height: 12),
                _buildField(_cityController, 'City'),
                const SizedBox(height: 12),
                _buildField(_branchController, 'Preferred Branch'),
                const SizedBox(height: 12),
                UploadSelectorCard(
                  title: 'Fayda Front ID Upload',
                  actionLabel: _faydaFrontUpload == null
                      ? 'Upload Front ID'
                      : 'Replace Front ID',
                  selectedName: _faydaFrontUpload?.name,
                  selectedPath: _faydaFrontUpload?.path,
                  selectedKind: _faydaFrontUpload?.kind,
                  selectionCaption: 'Selected successfully',
                  onTap: () => _selectDocumentUpload(
                    title: 'Fayda Front ID Upload',
                    onSelected: (value) {
                      setState(() {
                        _faydaFrontUpload = value;
                      });
                    },
                  ),
                  validator: () => _faydaFrontUpload == null
                      ? 'Front ID upload is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                UploadSelectorCard(
                  title: 'Fayda Back ID Upload',
                  actionLabel:
                      _faydaBackUpload == null ? 'Upload Back ID' : 'Replace Back ID',
                  selectedName: _faydaBackUpload?.name,
                  selectedPath: _faydaBackUpload?.path,
                  selectedKind: _faydaBackUpload?.kind,
                  selectionCaption: 'Selected successfully',
                  onTap: () => _selectDocumentUpload(
                    title: 'Fayda Back ID Upload',
                    onSelected: (value) {
                      setState(() {
                        _faydaBackUpload = value;
                      });
                    },
                  ),
                  validator: () => _faydaBackUpload == null
                      ? 'Back ID upload is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                UploadSelectorCard(
                  title: 'Selfie Verification',
                  actionLabel:
                      _selfieUpload == null ? 'Take Selfie' : 'Retake Selfie',
                  selectedName: _selfieUpload?.name,
                  selectedPath: _selfieUpload?.path,
                  selectedKind: _selfieUpload?.kind,
                  selectionCaption: 'Selected successfully',
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
                const SizedBox(height: 12),
                _buildField(
                  _pinController,
                  'Choose PIN',
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  helperText:
                      'Use a strong 4-digit PIN. Avoid 1234, 4321, or repeated digits.',
                ),
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  Text(_message!),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: Text(
                      _submitting
                          ? 'Submitting...'
                          : 'Submit ATM Card Request',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildField(
    TextEditingController controller,
    String label, {
    TextInputType? keyboardType,
    bool obscureText = false,
    String? helperText,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      decoration: InputDecoration(labelText: label, helperText: helperText),
      validator: (value) {
        final trimmed = value?.trim() ?? '';
        if (trimmed.isEmpty) {
          return '$label is required.';
        }
        if (label == 'Choose PIN') {
          if (!RegExp(r'^\d{4}$').hasMatch(trimmed)) {
            return 'PIN must be exactly 4 digits.';
          }
          if (RegExp(r'^(\d)\1{3}$').hasMatch(trimmed) ||
              trimmed == '1234' ||
              trimmed == '4321') {
            return 'Choose a stronger PIN.';
          }
        }
        return null;
      },
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_faydaFrontUpload == null || _faydaBackUpload == null || _selfieUpload == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Front ID, back ID, and selfie are all required.'),
        ),
      );
      return;
    }

    setState(() {
      _submitting = true;
      _message = null;
    });
    final services = AppScope.of(context).services;
    try {
      final frontUpload = await services.documentUploadApi.uploadDocument(
        filePath: _faydaFrontUpload!.path,
        originalFileName: _faydaFrontUpload!.name,
        domain: 'service-requests',
        entityId: _phoneController.text.trim(),
        documentType: 'fayda_front',
      );
      final backUpload = await services.documentUploadApi.uploadDocument(
        filePath: _faydaBackUpload!.path,
        originalFileName: _faydaBackUpload!.name,
        domain: 'service-requests',
        entityId: _phoneController.text.trim(),
        documentType: 'fayda_back',
      );
      final selfieUpload = await services.documentUploadApi.uploadDocument(
        filePath: _selfieUpload!.path,
        originalFileName: _selfieUpload!.name,
        domain: 'service-requests',
        entityId: _phoneController.text.trim(),
        documentType: 'selfie',
      );
      final created = await services.serviceRequestApi.createRequest(
        type: 'atm_card_request',
        title: 'ATM card request',
        description:
            'Request for ATM card issuance with branch selection and identity verification.',
        payload: {
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'phoneNumber': _phoneController.text.trim(),
          'region': _regionController.text.trim(),
          'city': _cityController.text.trim(),
          'preferredBranch': _branchController.text.trim(),
          'faydaFrontImage': frontUpload.storageKey,
          'faydaBackImage': backUpload.storageKey,
          'selfieImage': selfieUpload.storageKey,
          'pin': _pinController.text.trim(),
        },
        attachments: [
          frontUpload.storageKey,
          backUpload.storageKey,
          selfieUpload.storageKey,
        ],
      );

      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
        _message =
            'ATM card request submitted. Request ID: ${created.id} · Status: ${created.status}';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
        _message = error.toString().replaceFirst('Exception: ', '');
      });
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
            error.toString().replaceFirst('Exception: ', ''),
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

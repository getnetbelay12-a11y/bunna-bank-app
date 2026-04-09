import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../shared/widgets/upload_selector_card.dart';

class AccountRelationshipsScreen extends StatefulWidget {
  const AccountRelationshipsScreen({super.key});

  @override
  State<AccountRelationshipsScreen> createState() =>
      _AccountRelationshipsScreenState();
}

class _AccountRelationshipsScreenState extends State<AccountRelationshipsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();
  String _relationshipType = 'family_member';
  _SelectedUpload? _faydaUpload;
  _SelectedUpload? _selfieUpload;
  bool _submitting = false;
  String? _message;

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Add Member On Account'),
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
                        'Selfie Required',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: abayPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Adding a related member is a higher-risk account action, so Fayda identity details and a selfie confirmation are required.',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  initialValue: _relationshipType,
                  decoration: const InputDecoration(
                    labelText: 'Relationship Type',
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'joint_holder',
                      child: Text('Joint Holder'),
                    ),
                    DropdownMenuItem(
                      value: 'nominee',
                      child: Text('Nominee'),
                    ),
                    DropdownMenuItem(
                      value: 'authorized_user',
                      child: Text('Authorized User'),
                    ),
                    DropdownMenuItem(
                      value: 'family_member',
                      child: Text('Family Member'),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _relationshipType = value ?? 'family_member';
                    });
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _fullNameController,
                  decoration: const InputDecoration(labelText: 'Related Member Name'),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Name is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Phone Number'),
                  keyboardType: TextInputType.phone,
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Phone number is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                UploadSelectorCard(
                  title: 'Fayda Document Upload',
                  actionLabel:
                      _faydaUpload == null ? 'Upload Fayda Document' : 'Replace Fayda Document',
                  selectedName: _faydaUpload?.name,
                  selectedPath: _faydaUpload?.path,
                  selectedKind: _faydaUpload?.kind,
                  onTap: () => _selectDocumentUpload(
                    title: 'Fayda Document Upload',
                    onSelected: (value) => setState(() => _faydaUpload = value),
                  ),
                  validator: () => _faydaUpload == null
                      ? 'Fayda document is required.'
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
                  onTap: () => _selectSelfieUpload(
                    onSelected: (value) => setState(() => _selfieUpload = value),
                  ),
                  validator: () => _selfieUpload == null
                      ? 'Selfie verification is required.'
                      : null,
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
                          : 'Submit Relationship Request',
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_faydaUpload == null || _selfieUpload == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Fayda document and selfie verification are required.'),
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
      final faydaUpload = await services.documentUploadApi.uploadDocument(
        filePath: _faydaUpload!.path,
        originalFileName: _faydaUpload!.name,
        domain: 'service-requests',
        entityId: _phoneController.text.trim(),
        documentType: 'relationship_fayda',
      );
      final selfieUpload = await services.documentUploadApi.uploadDocument(
        filePath: _selfieUpload!.path,
        originalFileName: _selfieUpload!.name,
        domain: 'service-requests',
        entityId: _phoneController.text.trim(),
        documentType: 'selfie',
      );
      final created = await services.serviceRequestApi.createRequest(
        type: 'account_relationship',
        title: 'Account relationship request',
        description:
            'Request to add a related member to the account after identity verification.',
        payload: {
          'memberName': _fullNameController.text.trim(),
          'relationship': _relationshipType,
          'phoneNumber': _phoneController.text.trim(),
          'faydaDocument': faydaUpload.storageKey,
          'selfieImage': selfieUpload.storageKey,
        },
        attachments: [
          faydaUpload.storageKey,
          selfieUpload.storageKey,
        ],
      );

      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
        _message =
            'Relationship request submitted. Request ID: ${created.id} · Status: ${created.status}';
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
    if (upload != null && mounted) {
      onSelected(upload);
    }
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
    if (upload != null && mounted) {
      onSelected(upload);
    }
  }

  Future<_SelectedUpload?> _pickUpload(
    _UploadAction action, {
    required bool allowFiles,
  }) async {
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
    return _SelectedUpload(name: file.name, path: file.path, kind: 'image');
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

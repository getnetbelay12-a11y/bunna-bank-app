import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/services/api_config.dart';

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
                              color: cbeBlue,
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
                _UploadCard(
                  title: 'Fayda Document Upload',
                  actionLabel:
                      _faydaUpload == null ? 'Upload Fayda Document' : 'Replace Fayda Document',
                  upload: _faydaUpload,
                  onTap: () => _selectDocumentUpload(
                    title: 'Fayda Document Upload',
                    onSelected: (value) => setState(() => _faydaUpload = value),
                  ),
                  validator: () => _faydaUpload == null
                      ? 'Fayda document is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                _UploadCard(
                  title: 'Selfie Verification',
                  actionLabel:
                      _selfieUpload == null ? 'Take Selfie' : 'Retake Selfie',
                  upload: _selfieUpload,
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
    if (!ApiConfig.hasBaseUrl) {
      setState(() {
        _message = 'API_BASE_URL is not configured. Request was not sent.';
      });
      return;
    }

    setState(() {
      _submitting = true;
      _message = null;
    });
    final token = AppScope.of(context).services.sessionStore.accessToken;
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/account/add-member'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'memberName': _fullNameController.text.trim(),
        'relationship': _relationshipType,
        'phoneNumber': _phoneController.text.trim(),
        'faydaDocument': _faydaUpload!.path,
        'selfieImage': _selfieUpload!.path,
      }),
    );

    if (!mounted) {
      return;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      setState(() {
        _submitting = false;
        _message =
            'Relationship request submitted. Review status: ${data['status'] ?? 'pending_review'}';
      });
      return;
    }

    setState(() {
      _submitting = false;
      _message = _extractErrorMessage(
        response.body,
        fallback: 'Unable to submit relationship request.',
      );
    });
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

  String _extractErrorMessage(String body, {required String fallback}) {
    try {
      final data = jsonDecode(body);
      if (data is Map<String, dynamic> && data['message'] is String) {
        return data['message'] as String;
      }
    } catch (_) {
      // Ignore.
    }
    return fallback;
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
                    child: Text(
                      upload == null
                          ? '$title\n$actionLabel'
                          : '$title\n${upload!.name}',
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
    if (upload!.kind == 'image' && file.existsSync()) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.file(file, width: 56, height: 56, fit: BoxFit.cover),
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

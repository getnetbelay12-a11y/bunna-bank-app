import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/app_scope.dart';

class PhoneNumberUpdateScreen extends StatefulWidget {
  const PhoneNumberUpdateScreen({super.key});

  @override
  State<PhoneNumberUpdateScreen> createState() => _PhoneNumberUpdateScreenState();
}

class _PhoneNumberUpdateScreenState extends State<PhoneNumberUpdateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();
  _SelectedUpload? _frontUpload;
  _SelectedUpload? _backUpload;
  _SelectedUpload? _selfieUpload;
  bool _submitting = false;
  String? _message;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Update Phone Number'),
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
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.verified_user_outlined),
                  title: Text('Security review'),
                  subtitle: Text(
                    'Fayda front/back and selfie verification are required before the new phone number can be reviewed.',
                  ),
                ),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'New Phone Number',
                  ),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'New phone number is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                _UploadCard(
                  title: 'Fayda Front ID Upload',
                  actionLabel:
                      _frontUpload == null ? 'Upload Front ID' : 'Replace Front ID',
                  upload: _frontUpload,
                  onTap: () => _selectDocumentUpload(
                    title: 'Fayda Front ID Upload',
                    onSelected: (value) => setState(() => _frontUpload = value),
                  ),
                  validator: () =>
                      _frontUpload == null ? 'Front ID upload is required.' : null,
                ),
                const SizedBox(height: 12),
                _UploadCard(
                  title: 'Fayda Back ID Upload',
                  actionLabel:
                      _backUpload == null ? 'Upload Back ID' : 'Replace Back ID',
                  upload: _backUpload,
                  onTap: () => _selectDocumentUpload(
                    title: 'Fayda Back ID Upload',
                    onSelected: (value) => setState(() => _backUpload = value),
                  ),
                  validator: () =>
                      _backUpload == null ? 'Back ID upload is required.' : null,
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
                  validator: () =>
                      _selfieUpload == null ? 'Selfie verification is required.' : null,
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
                    child: Text(_submitting ? 'Submitting...' : 'Submit Request'),
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
    if (_frontUpload == null || _backUpload == null || _selfieUpload == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All verification uploads are required.')),
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
        filePath: _frontUpload!.path,
        originalFileName: _frontUpload!.name,
        domain: 'service-requests',
        entityId: _phoneController.text.trim(),
        documentType: 'fayda_front',
      );
      final backUpload = await services.documentUploadApi.uploadDocument(
        filePath: _backUpload!.path,
        originalFileName: _backUpload!.name,
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
        type: 'phone_update',
        title: 'Phone number update request',
        description:
            'Request to update member phone number after identity verification.',
        payload: {
          'phoneNumber': _phoneController.text.trim(),
          'faydaFrontImage': frontUpload.storageKey,
          'faydaBackImage': backUpload.storageKey,
          'selfieImage': selfieUpload.storageKey,
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
            'Phone update request submitted. Request ID: ${created.id} · Status: ${created.status}';
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

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
  final _regionController = TextEditingController(text: 'Amhara');
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
                              color: cbeBlue,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'ATM card requests require Fayda front/back review, PIN setup, branch review, and selfie verification before production.',
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
                _UploadCard(
                  title: 'Fayda Front ID Upload',
                  actionLabel: _faydaFrontUpload == null
                      ? 'Upload Front ID'
                      : 'Replace Front ID',
                  upload: _faydaFrontUpload,
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
                _UploadCard(
                  title: 'Fayda Back ID Upload',
                  actionLabel:
                      _faydaBackUpload == null ? 'Upload Back ID' : 'Replace Back ID',
                  upload: _faydaBackUpload,
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
                _UploadCard(
                  title: 'Selfie Verification',
                  actionLabel:
                      _selfieUpload == null ? 'Take Selfie' : 'Retake Selfie',
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
                const SizedBox(height: 12),
                _buildField(
                  _pinController,
                  'Choose PIN',
                  keyboardType: TextInputType.number,
                  obscureText: true,
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
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      decoration: InputDecoration(labelText: label),
      validator: (value) =>
          value == null || value.trim().isEmpty ? '$label is required.' : null,
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

    if (!ApiConfig.hasBaseUrl) {
      setState(() {
        _message = 'API_BASE_URL is not configured. ATM request was not sent.';
      });
      return;
    }

    setState(() {
      _submitting = true;
      _message = null;
    });

    final token = AppScope.of(context).services.sessionStore.accessToken;
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/atm-card/request'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'phoneNumber': _phoneController.text.trim(),
        'region': _regionController.text.trim(),
        'city': _cityController.text.trim(),
        'preferredBranch': _branchController.text.trim(),
        'faydaFrontImage': _faydaFrontUpload!.path,
        'faydaBackImage': _faydaBackUpload!.path,
        'selfieImage': _selfieUpload!.path,
        'pin': _pinController.text.trim(),
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
            'ATM card request submitted successfully. Request ID: ${data['requestId'] ?? 'pending'}';
      });
      return;
    }

    setState(() {
      _submitting = false;
      _message = _extractErrorMessage(
        response.body,
        fallback: 'Unable to submit ATM card request.',
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

  String _extractErrorMessage(String body, {required String fallback}) {
    try {
      final data = jsonDecode(body);
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
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

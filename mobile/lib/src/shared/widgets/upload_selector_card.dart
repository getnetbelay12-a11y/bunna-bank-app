import 'dart:io';

import 'package:flutter/material.dart';

class UploadSelectorCard extends StatelessWidget {
  const UploadSelectorCard({
    super.key,
    required this.title,
    required this.actionLabel,
    required this.onTap,
    required this.validator,
    this.selectedName,
    this.selectedPath,
    this.selectedKind,
    this.selectionCaption,
  });

  final String title;
  final String actionLabel;
  final VoidCallback onTap;
  final String? Function() validator;
  final String? selectedName;
  final String? selectedPath;
  final String? selectedKind;
  final String? selectionCaption;

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
                  _UploadPreview(
                    selectedPath: selectedPath,
                    selectedKind: selectedKind,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          selectedName == null
                              ? actionLabel
                              : selectionCaption == null
                                  ? selectedName!
                                  : '${selectedName!}\n$selectionCaption',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
  const _UploadPreview({
    required this.selectedPath,
    required this.selectedKind,
  });

  final String? selectedPath;
  final String? selectedKind;

  @override
  Widget build(BuildContext context) {
    if (selectedPath == null) {
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

    final file = File(selectedPath!);
    final isImage = selectedKind == 'image' && file.existsSync();

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

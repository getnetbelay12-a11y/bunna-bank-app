import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import 'create_service_request_screen.dart';
import 'service_request_detail_screen.dart';

class ServiceRequestListScreen extends StatelessWidget {
  const ServiceRequestListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      appBar: AppBar(title: const Text('Service Requests')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const CreateServiceRequestScreen(),
            ),
          );
        },
        icon: const Icon(Icons.add_task_rounded),
        label: const Text('New Request'),
      ),
      body: FutureBuilder(
        future: services.serviceRequestApi.fetchMyRequests(),
        builder: (context, snapshot) {
          final items = snapshot.data ?? const [];
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (items.isEmpty) {
            return const Center(
              child: Text('No service requests yet.'),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemBuilder: (context, index) {
              final item = items[index];
              return ListTile(
                tileColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                title: Text(item.title),
                subtitle: Text('${_formatLabel(item.type)} · ${_formatLabel(item.status)}'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => ServiceRequestDetailScreen(requestId: item.id),
                    ),
                  );
                },
              );
            },
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemCount: items.length,
          );
        },
      ),
    );
  }
}

String _formatLabel(String value) {
  return value
      .replaceAll('_', ' ')
      .split(' ')
      .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

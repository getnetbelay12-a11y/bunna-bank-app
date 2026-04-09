import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../atm_card_order/presentation/atm_card_order_screen.dart';

class CardManagementScreen extends StatefulWidget {
  const CardManagementScreen({
    super.key,
    this.highlightedCardId,
  });

  final String? highlightedCardId;

  @override
  State<CardManagementScreen> createState() => _CardManagementScreenState();
}

class _CardManagementScreenState extends State<CardManagementScreen> {
  Future<List<CardItem>>? _cardsFuture;
  String? _message;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _cardsFuture ??= AppScope.of(context).services.cardApi.fetchMyCards();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Card Management'),
      ),
      body: FutureBuilder<List<CardItem>>(
        future: _cardsFuture,
        builder: (context, snapshot) {
          final cards = snapshot.data ?? const <CardItem>[];

          return SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Container(
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
                        'Manage your card safely',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: abayPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Lock or unlock cards instantly, request replacements, and submit a new card request when needed.',
                      ),
                    ],
                  ),
                ),
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  Text(_message!),
                ],
                const SizedBox(height: 20),
                if (cards.isEmpty)
                  Card(
                    child: ListTile(
                      title: const Text('No cards found'),
                      subtitle: const Text('Submit a new card request to get started.'),
                      trailing: FilledButton(
                        onPressed: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const AtmCardOrderScreen(),
                            ),
                          );
                          if (!mounted) {
                            return;
                          }
                          setState(() {
                            _cardsFuture = services.cardApi.fetchMyCards();
                          });
                        },
                        child: const Text('Request Card'),
                      ),
                    ),
                  )
                else
                  for (final card in cards) ...[
                    _CardTile(
                      card: card,
                      highlighted: widget.highlightedCardId == card.id,
                      onLockToggle: () async {
                        final updated = card.status == 'locked'
                            ? await services.cardApi.unlockCard(card.id)
                            : await services.cardApi.lockCard(card.id);
                        if (!mounted) {
                          return;
                        }
                        setState(() {
                          _message =
                              '${updated.cardType} ending ${updated.last4 ?? 'pending'} is now ${updated.status}.';
                          _cardsFuture = services.cardApi.fetchMyCards();
                        });
                      },
                      onReplacement: () async {
                        final request = await services.cardApi.requestReplacement(
                          card.id,
                          reason: 'Requested from mobile app',
                        );
                        if (!mounted) {
                          return;
                        }
                        setState(() {
                          _message =
                              'Replacement request submitted. Request ID: ${request.id} · Status: ${request.status}.';
                          _cardsFuture = services.cardApi.fetchMyCards();
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                  ],
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const AtmCardOrderScreen(),
                        ),
                      );
                      if (!mounted) {
                        return;
                      }
                      setState(() {
                        _cardsFuture = services.cardApi.fetchMyCards();
                      });
                    },
                    child: const Text('Submit New Card Request'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _CardTile extends StatelessWidget {
  const _CardTile({
    required this.card,
    required this.onLockToggle,
    required this.onReplacement,
    required this.highlighted,
  });

  final CardItem card;
  final Future<void> Function() onLockToggle;
  final Future<void> Function() onReplacement;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: highlighted ? const Color(0xFFFFF7E6) : null,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              card.cardType,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 6),
            Text('Card ending ${card.last4 ?? 'pending issuance'}'),
            const SizedBox(height: 6),
            Text('Status: ${card.status.replaceAll('_', ' ').toUpperCase()}'),
            if (card.preferredBranch != null) ...[
              const SizedBox(height: 6),
              Text('Preferred branch: ${card.preferredBranch}'),
            ],
            if (card.issuedAt != null) ...[
              const SizedBox(height: 6),
              Text('Issued: ${_formatDateTime(card.issuedAt!)}'),
            ],
            if (card.lockedAt != null && card.status == 'locked') ...[
              const SizedBox(height: 6),
              Text('Locked at: ${_formatDateTime(card.lockedAt!)}'),
            ],
            if (card.channelControls.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'Channel controls',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: card.channelControls.entries
                    .map(
                      (entry) => Chip(
                        label: Text(
                          '${entry.key.toUpperCase()}: ${_channelStateLabel(entry.value)}',
                        ),
                        backgroundColor: entry.value == true
                            ? const Color(0xFFE9F7EF)
                            : const Color(0xFFFFF1F0),
                      ),
                    )
                    .toList(),
              ),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                FilledButton.tonal(
                  onPressed: onLockToggle,
                  child: Text(card.status == 'locked' ? 'Unlock Card' : 'Lock Card'),
                ),
                OutlinedButton(
                  onPressed: onReplacement,
                  child: const Text('Request Replacement'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

String _formatDateTime(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '${value.year}-$month-$day $hour:$minute';
}

String _channelStateLabel(dynamic value) {
  return value == true ? 'Enabled' : 'Disabled';
}

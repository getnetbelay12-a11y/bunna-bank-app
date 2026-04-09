import 'recovery_channel_option.dart';

class PinRecoveryOptions {
  const PinRecoveryOptions({
    required this.phoneNumber,
    required this.channels,
  });

  final String phoneNumber;
  final List<RecoveryChannelOption> channels;
}

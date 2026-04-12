class FaydaExtractionResult {
  const FaydaExtractionResult({
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.reviewRequiredFields,
    required this.dateOfBirthCandidates,
    required this.expiryDateCandidates,
    this.dateOfBirth,
    this.sex,
    this.phoneNumber,
    this.nationality,
    this.region,
    this.city,
    this.subCity,
    this.woreda,
    this.faydaFin,
    this.serialNumber,
    this.cardNumber,
    this.extractionMethod = 'sample_fayda_prefill',
  });

  final String firstName;
  final String lastName;
  final String fullName;
  final String? dateOfBirth;
  final String? sex;
  final String? phoneNumber;
  final String? nationality;
  final String? region;
  final String? city;
  final String? subCity;
  final String? woreda;
  final String? faydaFin;
  final String? serialNumber;
  final String? cardNumber;
  final List<String> dateOfBirthCandidates;
  final List<String> expiryDateCandidates;
  final List<String> reviewRequiredFields;
  final String extractionMethod;

  bool get hasConflicts => reviewRequiredFields.isNotEmpty;
}

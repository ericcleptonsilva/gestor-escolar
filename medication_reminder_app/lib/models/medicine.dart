import 'dart:convert';

class Medicine {
  final int id;
  final String name;
  final String dosage;
  final int hour;
  final int minute;
  // Representing days as integers (1 = Monday, 7 = Sunday)
  final List<int> days;

  Medicine({
    required this.id,
    required this.name,
    required this.dosage,
    required this.hour,
    required this.minute,
    required this.days,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'dosage': dosage,
      'hour': hour,
      'minute': minute,
      'days': days,
    };
  }

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['id'],
      name: json['name'],
      dosage: json['dosage'],
      hour: json['hour'],
      minute: json['minute'],
      days: List<int>.from(json['days']),
    );
  }

  String get timeString {
    final h = hour.toString().padLeft(2, '0');
    final m = minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

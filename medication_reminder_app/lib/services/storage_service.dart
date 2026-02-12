import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/medicine.dart';

class StorageService {
  static const String _keyMedicines = 'medicines';

  Future<void> saveMedicines(List<Medicine> medicines) async {
    final prefs = await SharedPreferences.getInstance();
    final String encodedData = jsonEncode(
      medicines.map((m) => m.toJson()).toList(),
    );
    await prefs.setString(_keyMedicines, encodedData);
  }

  Future<List<Medicine>> loadMedicines() async {
    final prefs = await SharedPreferences.getInstance();
    final String? encodedData = prefs.getString(_keyMedicines);

    if (encodedData == null) {
      return [];
    }

    final List<dynamic> decodedData = jsonDecode(encodedData);
    return decodedData.map((json) => Medicine.fromJson(json)).toList();
  }
}

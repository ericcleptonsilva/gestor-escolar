import 'package:flutter/material.dart';
import '../models/medicine.dart';
import '../services/notification_service.dart';
import '../services/storage_service.dart';
import '../widgets/medicine_card.dart';
import 'add_medicine_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final StorageService _storageService = StorageService();
  final NotificationService _notificationService = NotificationService();
  List<Medicine> _medicines = [];

  @override
  void initState() {
    super.initState();
    _loadMedicines();
  }

  Future<void> _loadMedicines() async {
    final medicines = await _storageService.loadMedicines();
    setState(() {
      _medicines = medicines;
    });
  }

  Future<void> _addMedicine() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const AddMedicineScreen()),
    );

    if (result != null && result is Medicine) {
      setState(() {
        _medicines.add(result);
      });
      await _storageService.saveMedicines(_medicines);
      await _notificationService.scheduleNotification(
        result.id,
        'Hora do Remédio!',
        'Está na hora de tomar ${result.name} (${result.dosage})',
        result.hour,
        result.minute,
      );
    }
  }

  Future<void> _deleteMedicine(Medicine medicine) async {
    setState(() {
      _medicines.removeWhere((m) => m.id == medicine.id);
    });
    await _storageService.saveMedicines(_medicines);
    await _notificationService.cancelNotification(medicine.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meus Medicamentos'),
        centerTitle: true,
      ),
      body: _medicines.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.medication_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'Nenhum medicamento cadastrado.',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                ],
              ),
            )
          : ListView.builder(
              itemCount: _medicines.length,
              itemBuilder: (context, index) {
                final medicine = _medicines[index];
                return MedicineCard(
                  medicine: medicine,
                  onDelete: () => _deleteMedicine(medicine),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addMedicine,
        child: const Icon(Icons.add),
      ),
    );
  }
}

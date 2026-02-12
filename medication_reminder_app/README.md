# App Lembrete de Medicamentos

Este é um projeto Flutter para gerenciar lembretes de medicamentos com notificações locais.

## Pré-requisitos

- Flutter SDK instalado (versão 3.0.0 ou superior).
- Ambiente configurado para Android e/ou iOS.

## Configuração Necessária (Nativa)

Como este projeto foi gerado apenas com o código Dart, você precisará configurar as permissões nativas ao criar o projeto Flutter final.

### Android

1.  Abra o arquivo `android/app/src/main/AndroidManifest.xml`.
2.  Adicione as seguintes permissões dentro da tag `<manifest>`:

    ```xml
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    ```

3.  Certifique-se de ter um ícone de notificação válido. O código espera um recurso chamado `@mipmap/ic_launcher`. Geralmente, este é o ícone padrão do Flutter, mas verifique se ele existe em `android/app/src/main/res/mipmap-*/`.

### iOS

1.  Abra o arquivo `ios/Runner/Info.plist`.
2.  Nenhuma permissão especial extra é necessária para notificações locais básicas além das solicitadas em tempo de execução, mas certifique-se de que o *Bundle Identifier* esteja configurado corretamente.

## Como Executar

1.  Certifique-se de estar na pasta do projeto.
2.  Baixe as dependências:
    ```bash
    flutter pub get
    ```
3.  Execute o aplicativo:
    ```bash
    flutter run
    ```

## Observações

- **Fuso Horário:** O app utiliza o pacote `flutter_timezone` para obter o fuso horário local do dispositivo. Isso é crucial para que os agendamentos funcionem corretamente.
- **Notificações:** Em dispositivos Android mais recentes (Android 13+), o app solicitará permissão para enviar notificações na primeira execução.
- **Alarmes Exatos:** O uso de `SCHEDULE_EXACT_ALARM` permite que o lembrete toque na hora exata, mesmo em modo de economia de energia (sujeito às restrições do OS).

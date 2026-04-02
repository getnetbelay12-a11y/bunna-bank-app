import 'package:flutter/material.dart';

const Color cbeBlue = Color(0xFF7A1618);
const Color cbeLightBlue = Color(0xFFA43A33);
const Color cbeYellow = Color(0xFFC49A3A);
const Color cbeBackground = Color(0xFFF7F4F1);
const Color cbeCard = Colors.white;
const Color cbeText = Color(0xFF1F2430);

final ThemeData cbeBankTheme = ThemeData(
  useMaterial3: true,
  primaryColor: cbeBlue,
  scaffoldBackgroundColor: cbeBackground,
  cardColor: cbeCard,
  colorScheme: ColorScheme.fromSeed(
    seedColor: cbeBlue,
    primary: cbeBlue,
    secondary: cbeYellow,
    surface: cbeCard,
  ),
  textTheme: const TextTheme(
    headlineSmall: TextStyle(
      color: cbeText,
      fontWeight: FontWeight.bold,
    ),
    titleLarge: TextStyle(
      color: cbeText,
      fontWeight: FontWeight.bold,
    ),
    titleMedium: TextStyle(
      color: cbeText,
      fontWeight: FontWeight.w600,
    ),
    bodyLarge: TextStyle(
      color: cbeText,
      fontWeight: FontWeight.w400,
    ),
    bodyMedium: TextStyle(
      color: cbeText,
      fontWeight: FontWeight.w400,
    ),
  ),
  cardTheme: const CardThemeData(
    elevation: 0,
    color: cbeCard,
    margin: EdgeInsets.zero,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    foregroundColor: cbeText,
    elevation: 0,
    centerTitle: false,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: cbeBlue.withValues(alpha: 0.12)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: cbeBlue.withValues(alpha: 0.12)),
    ),
    focusedBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide(color: cbeBlue, width: 1.4),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: cbeBlue,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(52),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      textStyle: const TextStyle(fontWeight: FontWeight.w700),
    ),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: cbeBlue,
      foregroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      textStyle: const TextStyle(fontWeight: FontWeight.w700),
    ),
  ),
  navigationBarTheme: const NavigationBarThemeData(
    backgroundColor: Colors.white,
    indicatorColor: Color(0x1A7A1618),
    labelTextStyle: WidgetStatePropertyAll(
      TextStyle(fontWeight: FontWeight.w600),
    ),
  ),
);

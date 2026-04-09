import 'package:flutter/material.dart';

const Color amharaBlue = Color(0xFF0A4FA3);
const Color amharaLightBlue = Color(0xFF3E7EDB);
const Color amharaYellow = Color(0xFFF2C94C);
const Color amharaBackground = Color(0xFFF5F7FA);
const Color amharaCard = Colors.white;
const Color amharaText = Color(0xFF1E1E1E);

final ThemeData bunnaBankTheme = ThemeData(
  useMaterial3: true,
  primaryColor: amharaBlue,
  scaffoldBackgroundColor: amharaBackground,
  cardColor: amharaCard,
  colorScheme: ColorScheme.fromSeed(
    seedColor: amharaBlue,
    primary: amharaBlue,
    secondary: amharaYellow,
    surface: amharaCard,
  ),
  textTheme: const TextTheme(
    headlineSmall: TextStyle(
      color: amharaText,
      fontWeight: FontWeight.bold,
    ),
    titleLarge: TextStyle(
      color: amharaText,
      fontWeight: FontWeight.bold,
    ),
    titleMedium: TextStyle(
      color: amharaText,
      fontWeight: FontWeight.w600,
    ),
    bodyLarge: TextStyle(
      color: amharaText,
      fontWeight: FontWeight.w400,
    ),
    bodyMedium: TextStyle(
      color: amharaText,
      fontWeight: FontWeight.w400,
    ),
  ),
  cardTheme: const CardThemeData(
    elevation: 0,
    color: amharaCard,
    margin: EdgeInsets.zero,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    foregroundColor: amharaText,
    elevation: 0,
    centerTitle: false,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: amharaBlue.withValues(alpha: 0.12)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: amharaBlue.withValues(alpha: 0.12)),
    ),
    focusedBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide(color: amharaBlue, width: 1.4),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: amharaBlue,
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
      backgroundColor: amharaBlue,
      foregroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      textStyle: const TextStyle(fontWeight: FontWeight.w700),
    ),
  ),
  navigationBarTheme: const NavigationBarThemeData(
    backgroundColor: Colors.white,
    indicatorColor: Color(0x1A0A4FA3),
    labelTextStyle: WidgetStatePropertyAll(
      TextStyle(fontWeight: FontWeight.w600),
    ),
  ),
);

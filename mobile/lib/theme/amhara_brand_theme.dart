import 'package:flutter/material.dart';

const Color abayPrimary = Color(0xFF7A1618);
const Color abayPrimaryDark = Color(0xFF5F1012);
const Color abaySecondary = Color(0xFFA43A33);
const Color abayAccent = Color(0xFFC49A3A);
const Color abayBackground = Color(0xFFF7F4F1);
const Color abaySurfaceAlt = Color(0xFFF2E3DE);
const Color abayBorder = Color(0xFFE2D8D6);
const Color abayCard = Colors.white;
const Color abayText = Color(0xFF1F2430);
const Color abayTextSoft = Color(0xFF6F737B);
const Color abaySuccess = Color(0xFF2F7A57);
const Color abaySuccessBg = Color(0xFFE7F2EC);
const Color abayWarning = Color(0xFFB07A2A);
const Color abayWarningBg = Color(0xFFF9F0E1);
const Color abayDanger = Color(0xFFB23A3A);
const Color abayDangerBg = Color(0xFFF9E8E8);
const Color abayInfo = abaySecondary;
const Color abayInfoBg = Color(0xFFF2E3DE);
const Color abaySecondarySoft = Color(0xFFF2E3DE);
const Color abayAccentSoft = Color(0xFFF4E5C7);
const Color abayShadow = Color(0x141F2430);
const Color abayPrimarySoft = Color(0xFFF2E3DE);
const Color abayBorderStrong = Color(0xFFD2C3BF);
const Color abaySurfaceElevated = Color(0xFFFDF8F6);
const Color abayTextMutedDark = Color(0xFF5D6067);
const Color abayAccentText = Color(0xFF7A1618);
const Color abayTopBarForeground = Color(0xFFF4E5C7);
const Color abayTopBarMuted = Color(0xFFF7E7BF);
const Color abayNavUnselected = Color(0xFFE2CDA9);

const Color abayPrimaryDeep = abayPrimaryDark;
const Color abayRoseTint = abaySecondarySoft;
const Color abaySurfaceTint = abaySurfaceAlt;
const Color abayMutedText = abayTextSoft;

final ThemeData amharaBrandTheme = ThemeData(
  useMaterial3: true,
  primaryColor: abayPrimary,
  scaffoldBackgroundColor: abayBackground,
  cardColor: abayCard,
  colorScheme: const ColorScheme(
    brightness: Brightness.light,
    primary: abayPrimary,
    onPrimary: Colors.white,
    secondary: abaySecondary,
    onSecondary: Colors.white,
    error: abayDanger,
    onError: Colors.white,
    surface: abayCard,
    onSurface: abayText,
    tertiary: abayAccent,
    onTertiary: abayText,
  ),
  textTheme: const TextTheme(
    headlineSmall: TextStyle(color: abayText, fontWeight: FontWeight.w700, fontSize: 28),
    titleLarge: TextStyle(color: abayText, fontWeight: FontWeight.w700, fontSize: 20),
    titleMedium: TextStyle(color: abayText, fontWeight: FontWeight.w600),
    bodyLarge: TextStyle(color: abayText, fontWeight: FontWeight.w400),
    bodyMedium: TextStyle(color: abayText, fontWeight: FontWeight.w400),
    bodySmall: TextStyle(color: abayTextSoft, fontWeight: FontWeight.w400),
    labelLarge: TextStyle(color: abayPrimary, fontWeight: FontWeight.w700),
  ),
  cardTheme: const CardThemeData(
    elevation: 0,
    color: abayCard,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      side: BorderSide(color: abayBorder),
    ),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: abayPrimary,
    foregroundColor: abayTopBarForeground,
    elevation: 0,
    centerTitle: false,
    shape: Border(
      bottom: BorderSide(
        color: abayAccent,
        width: 4,
      ),
    ),
    titleTextStyle: TextStyle(
      color: abayTopBarForeground,
      fontWeight: FontWeight.w700,
      fontSize: 20,
    ),
    iconTheme: IconThemeData(
      color: abayTopBarForeground,
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: abaySurfaceAlt,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: abayBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: abayBorder),
    ),
    focusedBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide(color: abaySecondary, width: 1.6),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: abayPrimary,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: const TextStyle(fontWeight: FontWeight.w700),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: abayPrimary,
      side: const BorderSide(color: abayPrimary),
      minimumSize: const Size.fromHeight(48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: const TextStyle(fontWeight: FontWeight.w700),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: abayPrimary,
      textStyle: const TextStyle(fontWeight: FontWeight.w700),
    ),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: abayPrimary,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: const TextStyle(fontWeight: FontWeight.w700),
    ),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: abayPrimary,
    selectedItemColor: abayAccent,
    unselectedItemColor: abayNavUnselected,
    elevation: 10,
    type: BottomNavigationBarType.fixed,
  ),
  navigationBarTheme: const NavigationBarThemeData(
    backgroundColor: abayPrimary,
    indicatorColor: Color(0x33F2C94C),
    labelTextStyle: WidgetStatePropertyAll(
      TextStyle(fontWeight: FontWeight.w600),
    ),
  ),
  chipTheme: ChipThemeData(
    backgroundColor: abayAccentSoft,
    selectedColor: abayAccentSoft,
    secondarySelectedColor: abayAccentSoft,
    side: const BorderSide(color: abayBorder),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    labelStyle: const TextStyle(color: abayAccentText, fontWeight: FontWeight.w600),
  ),
  dividerTheme: const DividerThemeData(
    color: abayBorder,
    thickness: 1,
    space: 1,
  ),
);

import 'package:flutter/material.dart';

const Color bunnaPrimary = Color(0xFF7A1618);
const Color bunnaSecondary = Color(0xFFA43A33);
const Color bunnaAccent = Color(0xFFC49A3A);
const Color bunnaBackground = Color(0xFFF7F4F1);
const Color bunnaCard = Colors.white;
const Color bunnaText = Color(0xFF1F2430);
const Color bunnaBorder = Color(0xFFE2D8D6);
const Color bunnaBorderStrong = Color(0xFFD2C3BF);
const Color bunnaTextSoft = Color(0xFF6F737B);
const Color bunnaSurfaceTint = Color(0xFFF2E3DE);
const Color bunnaAccentSoft = Color(0xFFF4E5C7);
const Color bunnaSuccess = Color(0xFF2F7A57);
const Color bunnaSuccessBg = Color(0xFFE7F2EC);
const Color bunnaWarning = Color(0xFFB07A2A);
const Color bunnaWarningBg = Color(0xFFF9F0E1);
const Color bunnaDanger = Color(0xFFB23A3A);
const Color bunnaDangerBg = Color(0xFFF9E8E8);

// Shared source screens consume the existing Abay-style token names.
const Color abayPrimary = bunnaPrimary;
const Color abayPrimaryDark = bunnaPrimary;
const Color abayPrimaryDeep = bunnaPrimary;
const Color abayPrimarySoft = bunnaSurfaceTint;
const Color abayRoseTint = bunnaSurfaceTint;
const Color abayAccent = bunnaAccent;
const Color abayAccentSoft = bunnaAccentSoft;
const Color abayBackground = bunnaBackground;
const Color abayCard = bunnaCard;
const Color abayBorder = bunnaBorder;
const Color abayBorderStrong = bunnaBorderStrong;
const Color abayText = bunnaText;
const Color abayTextSoft = bunnaTextSoft;
const Color abaySurfaceAlt = bunnaSurfaceTint;
const Color abaySurfaceTint = bunnaSurfaceTint;
const Color abaySurfaceElevated = Color(0xFFFDF8F6);
const Color abayShadow = Color(0x141F2430);
const Color abayMutedText = bunnaTextSoft;
const Color abaySecondarySoft = bunnaSurfaceTint;
const Color abayInfoBg = bunnaSurfaceTint;
const Color abayTopBarForeground = bunnaText;
const Color abayTopBarMuted = bunnaTextSoft;
const Color abayNavUnselected = bunnaTextSoft;
const Color abayAccentText = bunnaPrimary;
const Color abaySuccess = bunnaSuccess;
const Color abaySuccessBg = bunnaSuccessBg;
const Color abayWarning = bunnaWarning;
const Color abayWarningBg = bunnaWarningBg;
const Color abayDanger = bunnaDanger;
const Color abayDangerBg = bunnaDangerBg;

final ThemeData bunnaBankTheme = ThemeData(
  useMaterial3: true,
  primaryColor: bunnaPrimary,
  scaffoldBackgroundColor: bunnaBackground,
  cardColor: bunnaCard,
  colorScheme: ColorScheme.fromSeed(
    seedColor: bunnaPrimary,
    primary: bunnaPrimary,
    secondary: bunnaAccent,
    surface: bunnaCard,
  ),
  textTheme: const TextTheme(
    headlineSmall: TextStyle(
      color: bunnaText,
      fontWeight: FontWeight.bold,
    ),
    titleLarge: TextStyle(
      color: bunnaText,
      fontWeight: FontWeight.bold,
    ),
    titleMedium: TextStyle(
      color: bunnaText,
      fontWeight: FontWeight.w600,
    ),
    bodyLarge: TextStyle(
      color: bunnaText,
      fontWeight: FontWeight.w400,
    ),
    bodyMedium: TextStyle(
      color: bunnaText,
      fontWeight: FontWeight.w400,
    ),
  ),
  cardTheme: const CardThemeData(
    elevation: 0,
    color: bunnaCard,
    margin: EdgeInsets.zero,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    foregroundColor: bunnaText,
    elevation: 0,
    centerTitle: false,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: bunnaPrimary.withValues(alpha: 0.12)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: bunnaPrimary.withValues(alpha: 0.12)),
    ),
    focusedBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide(color: bunnaPrimary, width: 1.4),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: bunnaPrimary,
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
      backgroundColor: bunnaPrimary,
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

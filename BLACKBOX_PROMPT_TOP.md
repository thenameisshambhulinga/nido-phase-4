GLOBAL ENTERPRISE DESIGN SYSTEM — STRICT IMPLEMENTATION

You must apply the following DESIGN SYSTEM GLOBALLY across the ENTIRE application without exception.

This includes:

- Shop
- Product pages
- Client pages
- User pages
- Configuration pages
- Vendor pages
- Inventory pages
- Dashboard pages
- Tables
- Forms
- Modals
- Cards
- Navigation
- Product details
- Master catalogue
- All future components

========================================================

1. # GLOBAL FONT SYSTEM (MANDATORY)

PRIMARY FONT:
Inter

OPTIONAL HEADING FONT:
Poppins (ONLY for major page headings if needed)

========================================================
FONT IMPORT
========================================================

Use proper global font import.

## Example:

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap');

Apply globally.

========================================================
GLOBAL TYPOGRAPHY RULES
========================================================

BODY FONT:
font-family: 'Inter', sans-serif;

OPTIONAL PAGE TITLES:
font-family: 'Poppins', sans-serif;

========================================================
FONT SCALE (STRICT)
========================================================

## H1 (Page Titles)

24px
SemiBold
letter-spacing: -0.3px

## H2 (Section Titles)

18px
Medium

## H3 (Card Titles)

16px
Medium

## Body Large

15px
Regular

## Body Default

14px
Regular

## Body Small

13px
Regular

## Labels

13px
Medium

## Helper Text

12px
Regular

## Button Text

14px
Medium

## Table Text

13px
Regular

========================================================
LINE HEIGHTS
========================================================

Headings:
120%–130%

Body:
140%–150%

Tables:
130%

======================================================== 2. ENTERPRISE COLOR SYSTEM
========================================================

## PRIMARY COLORS

Primary Blue:
#2563EB

Primary Hover:
#1D4ED8

Primary Light:
#DBEAFE

========================================================
NEUTRAL COLORS
========================================================

Background:
#F8FAFC

Card Background:
#FFFFFF

Border:
#E5E7EB

Divider:
#F1F5F9

Text Primary:
#111827

Text Secondary:
#6B7280

Text Muted:
#9CA3AF

========================================================
STATUS COLORS
========================================================

## SUCCESS

Green:
#16A34A

Light Green:
#DCFCE7

## WARNING

Amber:
#F59E0B

Light Amber:
#FEF3C7

## ERROR

Red:
#DC2626

Light Red:
#FEE2E2

## INFO

Blue:
#0EA5E9

Light Blue:
#E0F2FE

========================================================
SLA COLORS
========================================================

Within SLA:
#16A34A

Near Breach:
#F59E0B

Breached:
#DC2626

======================================================== 3. GLOBAL SPACING SYSTEM (STRICT 8PT GRID)
========================================================

4px → micro spacing
8px → tight spacing
12px → small spacing
16px → default spacing
20px → medium spacing
24px → section spacing
32px → large spacing
40px → page spacing
48px → major separation

========================================================
USAGE RULES
========================================================

Input padding:
12px–16px

Card padding:
20px–24px

Section gaps:
24px–32px

Table row height:
44px–48px

======================================================== 4. LAYOUT SYSTEM
========================================================

SIDEBAR WIDTH:
240px

CONTENT PADDING:
24px

MAX CONTENT WIDTH:
1440px

GRID:
12-column layout

GRID GUTTER:
24px

======================================================== 5. CARD DESIGN SYSTEM
========================================================

Background:
White

Border:
1px solid #E5E7EB

Border Radius:
12px

Padding:
20px

Shadow:
0 1px 2px rgba(0,0,0,0.05)

========================================================
CARD HOVER
========================================================

Add:

- subtle elevation
- soft shadow increase
- smooth transition

NO aggressive animations.

======================================================== 6. BUTTON SYSTEM
========================================================

## PRIMARY BUTTON

Background:
#2563EB

Text:
White

Radius:
8px

Padding:
10px 16px

Hover:
#1D4ED8

## SECONDARY BUTTON

Border:
#E5E7EB

Text:
#111827

Background:
White

## DANGER BUTTON

Background:
#DC2626

Text:
White

========================================================
BUTTON RULES
========================================================

- consistent height
- medium font weight
- smooth transitions
- enterprise appearance
- no oversized buttons

======================================================== 7. INPUT SYSTEM
========================================================

HEIGHT:
40px

BORDER:
#E5E7EB

RADIUS:
8px

PADDING:
12px

FOCUS:
Blue border (#2563EB)

Add subtle blue glow on focus.

======================================================== 8. DROPDOWNS
========================================================

Must match input styling.

Include:

- chevron down icon
- hover highlight
- smooth transitions

======================================================== 9. TABLE SYSTEM
========================================================

HEADER BACKGROUND:
#F9FAFB

ROW HEIGHT:
44px

BORDER:
#E5E7EB

ROW HOVER:
#F1F5F9

TEXT SIZE:
13px

======================================================== 10. STATUS PILLS / TAGS
========================================================

Border Radius:
999px

Padding:
4px 10px

SUCCESS:
green bg + dark green text

WARNING:
amber bg

ERROR:
red bg

======================================================== 11. SIDEBAR DESIGN
========================================================

BACKGROUND:
White

ACTIVE ITEM:
#DBEAFE

TEXT:
#374151

ICON SIZE:
18px

========================================================
SIDEBAR RULES
========================================================

- clean enterprise layout
- proper vertical spacing
- soft active state
- no oversized icons
- no dark heavy backgrounds

======================================================== 12. TOP NAVBAR
========================================================

HEIGHT:
64px

SEARCH BAR:
Rounded 8px

RIGHT SECTION:

- notifications
- profile
- actions

======================================================== 13. FILE UPLOAD DESIGN
========================================================

Upload Area:

- dashed border
- rounded corners
- drag & drop UI

Border:
#D1D5DB

======================================================== 14. MICRO INTERACTIONS
========================================================

Buttons:
slight darken on hover

Cards:
subtle shadow on hover

Inputs:
blue glow on focus

Tables:
light row hover

Toggles:
smooth animation

======================================================== 15. GLOBAL UI ENFORCEMENT
========================================================

STRICTLY ENFORCE:

- same typography everywhere
- same spacing everywhere
- same card system everywhere
- same shadows everywhere
- same border radius everywhere
- same color usage everywhere

NO:

- random fonts
- inconsistent padding
- mixed button styles
- random card shadows
- mismatched tables
- bootstrap-looking layouts
- inconsistent form heights

======================================================== 16. FINAL GLOBAL VALIDATION
========================================================

Before completion verify:

- ALL pages use Inter font
- spacing system is consistent
- buttons are unified
- cards are unified
- tables are unified
- forms are unified
- shop pages follow enterprise styling
- configuration pages follow enterprise styling
- user pages follow enterprise styling
- vendor pages follow enterprise styling

This is a STRICT enterprise SaaS design system.
No deviations are allowed.

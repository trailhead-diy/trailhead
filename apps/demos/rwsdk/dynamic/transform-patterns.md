# Catalyst UI to Trailhead UI Component Transformation Guide

## Overview

This document details the systematic transformation process for converting original Catalyst UI components to Trailhead UI enhanced components with semantic theming support.

## Universal Transformation Rules

1. **Always add 'use client' directive** as first line (if not already present)
2. **Prefix all exports with "Catalyst"**
3. **Update all relative imports** to use Catalyst versions
4. **Color transformations**:
   - `zinc-*` → `base-*` (neutral colors)
   - `blue-*` → `[var(--color-primary)]` (primary actions/focus)
   - `red-*` → `destructive-*` (errors/invalid states)
5. **Preserve all specific color variants** (orange, amber, yellow, etc.)
6. **Focus states** use CSS variables for runtime theming
7. **forwardRef display names** keep original names for DevTools

## Components Grouped by Transformation Pattern

### Group 1: Form Input Components with Error States

These components share identical transformation patterns for error handling and validation states.

#### Input Component

**'use client' directive**: Already present  
**Component naming**: Input → CatalystInput, InputGroup → CatalystInputGroup

**Color transformations**:

| Original                                    | Transformed                                         | Location                  |
| ------------------------------------------- | --------------------------------------------------- | ------------------------- |
| `text-zinc-500`                             | `text-base-500`                                     | Icon colors in InputGroup |
| `dark:text-zinc-400`                        | `dark:text-base-400`                                | Dark mode icon colors     |
| `ring-blue-500`                             | `ring-[var(--color-primary)]`                       | Focus ring                |
| `has-data-disabled:before:bg-zinc-950/5`    | `has-data-disabled:before:bg-base-950/5`            | Disabled state            |
| `has-data-invalid:before:shadow-red-500/10` | `has-data-invalid:before:shadow-destructive-500/10` | Invalid state shadow      |
| `text-zinc-950`                             | `text-base-950`                                     | Text color                |
| `placeholder:text-zinc-500`                 | `placeholder:text-base-500`                         | Placeholder text          |
| `border-zinc-950/10`                        | `border-base-950/10`                                | Border color              |
| `data-hover:border-zinc-950/20`             | `data-hover:border-base-950/20`                     | Hover border              |
| `data-invalid:border-red-500`               | `data-invalid:border-destructive-500`               | Invalid border            |
| `data-disabled:border-zinc-950/20`          | `data-disabled:border-base-950/20`                  | Disabled border           |

#### Textarea Component

**'use client' directive**: Already present  
**Component naming**: Textarea → CatalystTextarea

**Color transformations**: Identical to Input component

#### Select Component

**'use client' directive**: Already present  
**Component naming**: Select → CatalystSelect

**Color transformations**: Identical to Input component

### Group 2: Selection Components with Color Variants

These components use CSS variables for their checked/selected states and maintain all color variants.

#### Checkbox Component

**'use client' directive**: Already present  
**Component naming**: CheckboxGroup → CatalystCheckboxGroup, CheckboxField → CatalystCheckboxField, Checkbox → CatalystCheckbox

**Focus and border transformations**:

| Original                                      | Transformed                                       | Location            |
| --------------------------------------------- | ------------------------------------------------- | ------------------- |
| `group-data-focus:outline-blue-500`           | `group-data-focus:outline-[var(--color-primary)]` | Focus outline       |
| `border-zinc-950/15`                          | `border-base-950/15`                              | Base border         |
| `group-data-hover:border-zinc-950/30`         | `group-data-hover:border-base-950/30`             | Hover border        |
| `group-data-disabled:border-zinc-950/25`      | `group-data-disabled:border-base-950/25`          | Disabled border     |
| `group-data-disabled:bg-zinc-950/5`           | `group-data-disabled:bg-base-950/5`               | Disabled background |
| `[--checkbox-check:var(--color-zinc-950)]/50` | `[--checkbox-check:var(--color-base-950)]/50`     | Disabled checkmark  |

**Color variant transformations**:

- `dark/zinc` → `dark/base` (default)
- All `zinc-*` references in colors object → `base-*`
- Added 6 semantic variants: primary, secondary, destructive, success, warning, info
- CSS variables: `--checkbox-check`, `--checkbox-checked-bg`, `--checkbox-checked-border`

#### Radio Component

**'use client' directive**: Added  
**Component naming**: RadioGroup → CatalystRadioGroup, RadioField → CatalystRadioField, Radio → CatalystRadio

**Transformations**: Identical pattern to Checkbox

- Uses `--radio-checked-bg`, `--radio-checked-border` variables
- Same zinc → base replacements
- Same semantic variants added

#### Switch Component

**'use client' directive**: Added  
**Component naming**: SwitchGroup → CatalystSwitchGroup, SwitchField → CatalystSwitchField, Switch → CatalystSwitch

**Additional transformations**:

| Original             | Transformed          | Location     |
| -------------------- | -------------------- | ------------ |
| `shadow-zinc-700/10` | `shadow-base-700/10` | Thumb shadow |

**Uses CSS variables**: `--switch-checked-bg`, `--switch-checked-thumb`

### Group 3: Dropdown Selection UI Components

These components handle interactive selection with focus and selected state transformations.

#### Combobox Component

**'use client' directive**: Already present  
**Component naming**: Combobox → CatalystCombobox, ComboboxInput → CatalystComboboxInput, ComboboxOption → CatalystComboboxOption, ComboboxOptions → CatalystComboboxOptions, ComboboxButton → CatalystComboboxButton

**Import updates**: Input → CatalystInput, Button → CatalystButton

**Major transformations**:

| Original                    | Transformed                               | Location                   |
| --------------------------- | ----------------------------------------- | -------------------------- |
| `focus:ring-blue-500`       | `focus:ring-[var(--color-primary)]`       | Input focus ring           |
| `data-selected:bg-blue-500` | `data-selected:bg-[var(--color-primary)]` | Selected option background |
| `data-selected:text-white`  | `data-selected:text-primary-foreground`   | Selected option text       |
| `text-zinc-950`             | `text-base-950`                           | Text colors                |
| `placeholder:text-zinc-500` | `placeholder:text-base-500`               | Placeholder                |
| `border-zinc-950/10`        | `border-base-950/10`                      | Borders                    |
| `data-focus:bg-zinc-950/5`  | `data-focus:bg-base-950/5`                | Focus background           |
| `shadow-zinc-950/10`        | `shadow-base-950/10`                      | Shadows                    |

#### Listbox Component

**'use client' directive**: Already present  
**Component naming**: Listbox → CatalystListbox, ListboxOption → CatalystListboxOption, ListboxLabel → CatalystListboxLabel

**Transformations**: Similar pattern to Combobox with selected states using primary colors

#### Dropdown Component

**'use client' directive**: Already present  
**Component naming**: Dropdown → CatalystDropdown, DropdownButton → CatalystDropdownButton, DropdownMenu → CatalystDropdownMenu, DropdownItem → CatalystDropdownItem, DropdownHeader → CatalystDropdownHeader, DropdownSection → CatalystDropdownSection, DropdownHeading → CatalystDropdownHeading, DropdownDivider → CatalystDropdownDivider, DropdownLabel → CatalystDropdownLabel, DropdownDescription → CatalystDropdownDescription, DropdownShortcut → CatalystDropdownShortcut

**Import updates**: Button → CatalystButton, Link → CatalystLink

**Focus/hover states**: Use primary colors for interactive states

### Group 4: Layout Components

#### AuthLayout Component

**'use client' directive**: Not required  
**Component naming**: AuthLayout → CatalystAuthLayout

**Color transformations**:

| Original              | Transformed            | Location                                     |
| --------------------- | ---------------------- | -------------------------------------------- |
| `lg:ring-zinc-950/5`  | `lg:ring-layout-950/5` | Container ring (introduces layout-\* tokens) |
| `dark:lg:bg-zinc-900` | `dark:lg:bg-base-900`  | Dark mode background                         |

#### SidebarLayout Component

**'use client' directive**: Already present  
**Component naming**: SidebarLayout → CatalystSidebarLayout

**Import updates**: Navbar → CatalystNavbar, Sidebar → CatalystSidebar

**Color transformations**:

| Original           | Transformed        | Location                  |
| ------------------ | ------------------ | ------------------------- |
| `bg-zinc-900`      | `bg-base-900`      | Mobile sidebar background |
| `ring-zinc-950/10` | `ring-base-950/10` | Ring color                |

#### StackedLayout Component

**'use client' directive**: Already present  
**Component naming**: StackedLayout → CatalystStackedLayout

**Import updates**: Navbar → CatalystNavbar, Sidebar → CatalystSidebar

**Transformations**: Similar border color patterns using base tokens

### Group 5: Navigation Components

#### Navbar Component

**'use client' directive**: Already present  
**Component naming**: Navbar → CatalystNavbar, NavbarDivider → CatalystNavbarDivider, NavbarSection → CatalystNavbarSection, NavbarSpacer → CatalystNavbarSpacer, NavbarItem → CatalystNavbarItem

**Color transformations**:

| Original             | Transformed          | Location           |
| -------------------- | -------------------- | ------------------ |
| `shadow-zinc-950/10` | `shadow-base-950/10` | Shadow             |
| `bg-zinc-950/5`      | `bg-base-950/5`      | Background overlay |

#### Sidebar Component

**'use client' directive**: Already present  
**Component naming**: Sidebar → CatalystSidebar, SidebarHeader → CatalystSidebarHeader, SidebarBody → CatalystSidebarBody, SidebarFooter → CatalystSidebarFooter, SidebarSection → CatalystSidebarSection, SidebarDivider → CatalystSidebarDivider, SidebarSpacer → CatalystSidebarSpacer, SidebarHeading → CatalystSidebarHeading, SidebarItem → CatalystSidebarItem, SidebarLabel → CatalystSidebarLabel

**Import updates**: Heading → CatalystHeading, Link → CatalystLink

**Extensive zinc → base replacements throughout all text, borders, and backgrounds**

#### Pagination Component

**'use client' directive**: Added  
**Component naming**: Pagination → CatalystPagination, PaginationPrevious → CatalystPaginationPrevious, PaginationNext → CatalystPaginationNext, PaginationList → CatalystPaginationList, PaginationPage → CatalystPaginationPage, PaginationGap → CatalystPaginationGap

**Import updates**: Button → CatalystButton

**Minimal direct color changes (inherits from Button)**

### Group 6: Display Components

#### Table Component

**'use client' directive**: Added  
**Component naming**: Table → CatalystTable, TableHead → CatalystTableHead, TableBody → CatalystTableBody, TableRow → CatalystTableRow, TableHeader → CatalystTableHeader, TableCell → CatalystTableCell

**Import updates**: Link → CatalystLink

**Color transformations**:

| Original             | Transformed                      | Location            |
| -------------------- | -------------------------------- | ------------------- |
| `border-zinc-950/5`  | `border-base-950/5`              | All border colors   |
| `border-zinc-950/10` | `border-base-950/10`             | Grid borders        |
| `divide-zinc-950/5`  | `divide-base-950/5`              | Dividers            |
| `bg-zinc-950/2.5`    | `bg-base-950/2.5`                | Striped backgrounds |
| `text-zinc-500`      | `text-base-500`                  | Text colors         |
| `outline-blue-500`   | `outline-[var(--color-primary)]` | Focus outline       |

#### Badge Component

**'use client' directive**: Not required  
**Component naming**: Badge → CatalystBadge, BadgeButton → CatalystBadgeButton

**Import updates**: TouchTarget → CatalystTouchTarget, Link → CatalystLink

**Transformations**:

- Default color: `zinc` → `base`
- All `zinc-*` colors in color object → `base-*`
- Added 6 semantic variants at beginning of colors object
- Added `group` class to Badge component
- Focus outline: `data-focus:outline-blue-500` → `data-focus:outline-[var(--color-primary)]`

#### DescriptionList Component

**'use client' directive**: Added  
**Component naming**: DescriptionList → CatalystDescriptionList, DescriptionTerm → CatalystDescriptionTerm, DescriptionDetails → CatalystDescriptionDetails

**Text/border colors use base tokens**

### Group 7: Text and Typography Components

#### Text Component

**'use client' directive**: Added  
**Component naming**: Text → CatalystText, TextLink → CatalystTextLink, Strong → CatalystStrong, Code → CatalystCode

**Import updates**: Link → CatalystLink

**Color transformations**:

| Original                 | Transformed              | Location                    |
| ------------------------ | ------------------------ | --------------------------- |
| `text-zinc-500`          | `text-base-500`          | Text color                  |
| `dark:text-zinc-400`     | `dark:text-base-400`     | Dark mode text              |
| `text-zinc-950`          | `text-base-950`          | TextLink, Strong, Code text |
| `decoration-zinc-950/50` | `decoration-base-950/50` | TextLink decoration         |
| `border-zinc-950/10`     | `border-base-950/10`     | Code border                 |
| `bg-zinc-950/2.5`        | `bg-base-950/2.5`        | Code background             |

#### Heading Component

**'use client' directive**: Added  
**Component naming**: Heading → CatalystHeading, Subheading → CatalystSubheading

**Color transformation**:

| Original        | Transformed     | Location              |
| --------------- | --------------- | --------------------- |
| `text-zinc-500` | `text-base-500` | Subheading text color |

### Group 8: Container/Modal Components

#### Alert Component

**'use client' directive**: Added  
**Component naming**: Alert → CatalystAlert, AlertTitle → CatalystAlertTitle, AlertDescription → CatalystAlertDescription, AlertBody → CatalystAlertBody, AlertActions → CatalystAlertActions

**Import updates**: Text → CatalystText

**Color transformations**:

| Original              | Transformed           | Location                            |
| --------------------- | --------------------- | ----------------------------------- |
| `bg-zinc-950/15`      | `bg-base-950/15`      | DialogBackdrop - light mode overlay |
| `dark:bg-zinc-950/50` | `dark:bg-base-950/50` | DialogBackdrop - dark mode overlay  |
| `ring-zinc-950/10`    | `ring-base-950/10`    | DialogPanel - light mode ring       |
| `dark:bg-zinc-900`    | `dark:bg-base-900`    | DialogPanel - dark mode background  |
| `text-zinc-950`       | `text-base-950`       | AlertTitle - light mode text        |

#### Dialog Component

**'use client' directive**: Added  
**Component naming**: Dialog → CatalystDialog, DialogActions → CatalystDialogActions, DialogBody → CatalystDialogBody, DialogDescription → CatalystDialogDescription, DialogTitle → CatalystDialogTitle

**Minimal color changes in backdrop and panel shadows**

### Group 9: Minimal Transformation Components

#### Link Component

**'use client' directive**: Added  
**Component naming**: Link → CatalystLink  
**No color transformations** (component has no color classes)

#### Divider Component

**'use client' directive**: Added  
**Component naming**: Divider → CatalystDivider

**Color transformation**:

| Original             | Transformed          | Location     |
| -------------------- | -------------------- | ------------ |
| `border-zinc-950/10` | `border-base-950/10` | Border color |

#### Fieldset Component

**'use client' directive**: Already present  
**Component naming**: Fieldset → CatalystFieldset, FieldGroup → CatalystFieldGroup, Field → CatalystField, Label → CatalystLabel, Description → CatalystDescription, ErrorMessage → CatalystErrorMessage

**Color transformations**:

| Original        | Transformed            | Location         |
| --------------- | ---------------------- | ---------------- |
| `text-zinc-500` | `text-base-500`        | Description text |
| `text-red-600`  | `text-destructive-600` | Error message    |

### Group 10: Complex Pattern Components

#### Button Component

**'use client' directive**: Already present  
**Component naming**: Button → CatalystButton, TouchTarget → CatalystTouchTarget

**Import updates**: Link → CatalystLink

**Major transformations**:

1. **Focus outline**: `data-focus:outline-blue-500` → `data-focus:outline-[var(--color-primary)]`

2. **Icon color syntax change**: `text-(--btn-icon)` → `text-[--btn-icon]` (bracket notation)

3. **Outline and plain variants**:
   - All `zinc-950/*` → `base-950/*`
   - All `[--btn-icon:var(--color-zinc-*)]` → `[--btn-icon:var(--color-base-*)]`

4. **Color variants**:
   - `zinc` → `base`
   - `dark/zinc` → `dark/base` (becomes default)
   - Red variant uses `--color-destructive-*` variables
   - Added 6 semantic variants: primary, secondary, destructive, success, warning, info

5. **Default color**: `'dark/zinc'` → `'dark/base'`

#### Avatar Component

**'use client' directive**: Not required  
**Component naming**: Avatar → CatalystAvatar, AvatarButton → CatalystAvatarButton

**Import updates**: TouchTarget → CatalystTouchTarget, Link → CatalystLink

**Color transformation**:

| Original                      | Transformed                                 | Location                   |
| ----------------------------- | ------------------------------------------- | -------------------------- |
| `data-focus:outline-blue-500` | `data-focus:outline-[var(--color-primary)]` | AvatarButton focus outline |

**forwardRef display name remains unchanged**

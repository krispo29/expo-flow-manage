# Analysis of Requirements (Images 1-5)

Based on the provided images, here is the detailed breakdown of the system requirements for the **Organizer** platform.

## 1. Report & Advanced Search (Overview)

- **Objective**: Generate reports for specific events (e.g., ILDEX, HORTI).
- **Search Filters**:
  - **Event**: Select Event.
  - **Keyword**: Text search.
  - **Type of Member**: Dropdown selection including:
    - Total Visitor, Preregister, Group, Onsite, Exhibitor, VIP, Buyer, Speaker, Press, Organizer, Staff.
  - **Report Type**:
    - Print Badge
    - Total Visits
  - **Date Range**: Registration Date Start to End.
  - **Additional Filters**: Invitation Code, Country, Include Questionnaires.

## 2. Manage Conferences Module

- **List View**:
  - Display all conferences categorized/grouped by **Date**.
  - **Searchable**: Search functionality for conferences.
  - **Actions**:
    - Button: **Add Conference** (Single).
    - Button: **Add Conferences (Excel)**.
    - Button: **Download Excel Template**.
  - **Data Columns**:
    - Action (Edit), Date, Time, Topic, Detail (Show more), Photo, Room, Show On Registration Page, Public Session, Capacity, Pre-Registration.

- **Add/Edit Conference Form**:
  - **Topic**: Input Text.
  - **Learn More**: Text Editor.
  - **Speaker Info**: Text Editor.
  - **Photo**: Text Editor / Upload (Remark: .jpg, .png, size 300x300 px).
  - **Date**: Datepicker (Source: API).
  - **Room**: Dropdown (Source: API).
  - **Limit Seats**: Number input.
  - **Time**: Start Time & End Time (Timepicker).
  - **Toggles**:
    - Show On Registration Page (Boolean).
    - Public Session (Boolean).
  - **Edit Specific**: Ability to delete the uploaded photo.

## 3. User Classification & Badges

- **Types of Users**:
  - **Participants**: Visitor (Pre-reg, Group, Onsite), VIP, Speaker, Press, Buyer. _Note: Visitor name + email must be unique._
  - **Exhibitor**: Can request badges involved in "Pre-reg" page.
  - **Organizer**: Admin.
  - **Staff**: User.

- **Badge Codes**:
  - **VI**: Visitor Pre-registration
  - **VO**: Visitor Onsite
  - **VG**: Visitor Group
  - **VP**: VIP
  - **EX**: Exhibitor
  - **OR**: Organizer
  - **ST**: Staff
  - **SP**: Speaker
  - **PR**: Press
  - **BY**: Buyer

## 4. Workflows Scenarios (Page 4-5)

- **Organizer**: Manages Exhibitor data, views Reports, Manages Conferences.
- **Exhibitor**: Requests badges (Exhibitor Badge), cannot currently book conferences via standard flow.
- **Buyer/VIP**: Log in to "Conference Booking". Data comes from Org/Upload.
- **Upload Logic**: Excel Upload for Quota Badges (Username/Password generation) -> Registration Menu.

---

# Implementation Plan

## Phase 1: Project Initialization & Architecture (Day 1)

- **Stack Setup**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4.
- **UI Framework**: Install `shadcn/ui` and configure `next-themes` (Dark/Light mode).
- **Routing**: Set up the App Router structure (`/dashboard`, `/conferences`, `/reports`).
- **Layout**: Create the main `DashboardLayout` with Sidebar Navigation (Organizer, Manage Conferences, Reports).

## Phase 2: Core Data & State Management (Day 2)

- **Data Models**: Define TypeScript interfaces for `Conference`, `Member`, `Event`, `BadgeType`.
- **State Store (Zustand)**:
  - Create `useConferenceStore` for managing conference lists and CRUD operations.
  - Create `useMemberStore` for member types and mock data.
- **Mock API**: Setup Next.js Route Handlers to simulate `API` responses for "Date", "Room", and "Events".

## Phase 3: Manage Conferences Implementation (Day 3-4)

- **Component**: `ConferenceList` (Grouped by Date).
- **Forms**: Create `ConferenceForm` using **React Hook Form** + **Zod**.
  - Implement Rich Text Editor (or Textarea as MVP).
  - Implement File Upload UI (Dropzone).
  - Validation: 300x300px checks, Required fields.
- **Excel Feature**: Implement a mock "Import Excel" button and "Download Template" (static file).

## Phase 4: Report & Advanced Search (Day 5)

- **Component**: `AdvancedSearchForm`.
  - Dynamic Dropdowns for Member Types.
  - Date Range Pickers.
- **Component**: `ReportResultTable`.
  - Display Mock Data rows matching the filters.
  - Columns for Badge Type (VI, VO, etc.).

## Phase 5: Role Logic & Final Polish (Day 6)

- **Visual Polish**: Ensure "Premium" aesthetic using Tailwind v4 compatible colors and gradients.
- **Interactive Elements**: Micro-animations for buttons and transitions.
- **Theme**: Verify Dark Mode support across all forms.
- **Badge System**: Visual indicators for different User Types in the tables.

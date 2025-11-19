# GEMINI Code Companion Report

## Project: LookGen - Social Appearance Transformation App

### 1. Project Overview

This is a React-based social media application that allows users to upload their identity photos, apply AI transformations to create different versions of themselves, and share these transformations with others. The project is a monorepo containing multiple applications, including a user-facing application, an admin application, and a character application. The main application is built with React Native Web, allowing for cross-platform compatibility between web, iOS, and Android.

**Key Technologies:**

*   **Frontend:** React 18, React Native Web, Vite
*   **Styling:** Tamagui, Tailwind CSS
*   **State Management:** Zustand
*   **Routing:** React Router
*   **Backend:** Supabase (for database, storage, and real-time updates)

**Architecture:**

The application follows a component-based architecture with a clear separation of concerns. The `src` directory contains the main application code, which is organized into pages, stores, services, and components. The application uses Zustand for state management, which provides a simple and scalable way to manage the application's state. The application is integrated with Supabase for its backend, which is used for storing user data, photos, and application settings.

### 2. Building and Running

**Installation:**

```bash
npm install
```

**Running the Development Server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`.

**Building for Production:**

```bash
npm run build
```

**Linting:**

```bash
npm run lint
```

### 3. Development Conventions

*   **Code Style:** The project uses ESLint to enforce a consistent code style. The ESLint configuration can be found in the `eslint.config.js` file.
*   **State Management:** The project uses Zustand for state management. The main application store is defined in `src/stores/appStore.js`. The store is organized into slices for different parts of the application's state.
*   **Backend Integration:** The project is integrated with Supabase for its backend. The Supabase client is initialized in `src/services/supabaseClient.js`, and the application interacts with Supabase through various services, such as `settingsService.js` and `configService.js`.
*   **Cross-Platform Development:** The project is built with React Native Web, which allows for cross-platform compatibility between web, iOS, and Android. The application uses React Native primitives, such as `View`, `Text`, and `Image`, to ensure that the UI is consistent across all platforms.

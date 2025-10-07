# **App Name**: MEDALLOC: Hospital Bed Management System

## Core Features:

- User Authentication: Secure user authentication with role-based redirection (admin, hospital, patient).
- Hospital Registration and Approval: Hospitals can register, and administrators can approve or reject them.
- Real-time Bed Availability: Display real-time bed availability for each hospital.
- Bed Demand Forecasting: Forecast future bed demand using historical data and a linear regression tool model to show predicted values for the next 7 days. Data shown on a chart.
- Role-Based Dashboards: Separate dashboards for administrators, hospitals, and patients with relevant functionalities.
- Notifications: Reusable Bootstrap modal for all success, error, and loading notifications.
- Protected Routes: Dashboards are protected, redirecting unauthenticated users to the login page.

## Style Guidelines:

- Primary color: Soft blue (#A0C4FF) for a calm and professional feel.
- Background color: Very light blue (#F0F8FF), almost white, for a clean backdrop.
- Accent color: Slightly darker blue (#BDB2FF) to highlight key UI elements.
- Body and headline font: 'Inter' (sans-serif) for a modern, clean, neutral look.
- Use Font Awesome for consistent and professional icons.
- Responsive design using Bootstrap 5, ensuring the application works seamlessly on all devices.
- Subtle transitions and animations to improve user experience when data is loading or updating.
import React from 'react';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';

export default function AnalyticsPage({ adminView }) {
  if (adminView) {
    return <AdminDashboard />;
  }
  return <TeacherDashboard />;
}

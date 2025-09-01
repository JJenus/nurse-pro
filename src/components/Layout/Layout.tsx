import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationContainer } from '../Notifications/NotificationContainer';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  currentPage, 
  onPageChange 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="flex">
        <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
        
        <div className="flex-1 min-w-0">
          <Header title={title} />
          
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      
      <NotificationContainer />
    </div>
  );
};
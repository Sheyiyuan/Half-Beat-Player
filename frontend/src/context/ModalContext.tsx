import React, { createContext, useContext, ReactNode } from 'react';
import { useModalManager, ModalName, UseModalManagerReturn } from '../hooks/ui/useModalManager';

// ========== Context 创建 ==========
const ModalContext = createContext<UseModalManagerReturn | undefined>(undefined);

// ========== Provider 组件 ==========
export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const modalManager = useModalManager();

  return (
    <ModalContext.Provider value={modalManager}>
      {children}
    </ModalContext.Provider>
  );
};

// ========== Hook ==========
export const useModalContext = (): UseModalManagerReturn => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
};

// ========== 导出类型 ==========
export type { ModalName };

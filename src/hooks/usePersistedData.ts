
import { useState, useEffect } from 'react';

interface PersistedDataOptions<T> {
  key: string;
  maxAgeMinutes?: number;
  initialData?: T[];
}

// Helper function to safely create dates
const safeCreateDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  let dateValue: Date;
  
  if (timestamp instanceof Date) {
    dateValue = timestamp;
  } else if (typeof timestamp === 'number') {
    dateValue = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    dateValue = new Date(timestamp);
  } else {
    console.warn('Invalid timestamp format in usePersistedData:', timestamp);
    return new Date();
  }
  
  // Check if the date is valid
  if (isNaN(dateValue.getTime())) {
    console.warn('Invalid date created from timestamp in usePersistedData:', timestamp);
    return new Date();
  }
  
  return dateValue;
};

export const usePersistedData = <T extends { timestamp: Date | number; id: string }>({
  key,
  maxAgeMinutes = 5,
  initialData = []
}: PersistedDataOptions<T>) => {
  const [data, setData] = useState<T[]>([]);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = new Date();
          const cutoffTime = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);
          
          // Filtrar apenas dados dos últimos N minutos
          const validData = parsed.filter((item: T) => {
            try {
              const itemTime = safeCreateDate(item.timestamp);
              return itemTime > cutoffTime;
            } catch (error) {
              console.error('Erro ao processar timestamp do item:', error, item);
              return false;
            }
          }).map((item: any) => ({
            ...item,
            timestamp: safeCreateDate(item.timestamp)
          }));
          
          console.log(`📦 Carregados ${validData.length} itens do cache para ${key}`);
          setData(validData);
          
          // Atualizar localStorage com dados filtrados
          if (validData.length !== parsed.length) {
            localStorage.setItem(key, JSON.stringify(validData));
          }
        } else {
          console.log(`📦 Nenhum cache encontrado para ${key}, usando dados iniciais`);
          setData(initialData);
        }
      } catch (error) {
        console.error(`Erro ao carregar dados persistidos para ${key}:`, error);
        setData(initialData);
      }
    };

    loadPersistedData();
  }, [key, maxAgeMinutes, initialData]);

  // Função para adicionar novos dados
  const addData = (newItems: T | T[]) => {
    const itemsToAdd = Array.isArray(newItems) ? newItems : [newItems];
    
    setData(prev => {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);
      
      // Combinar dados existentes com novos
      const combined = [...prev, ...itemsToAdd];
      
      // Remover duplicatas baseado no ID e filtrar por tempo
      const unique = combined.filter((item, index, array) => {
        try {
          const itemTime = safeCreateDate(item.timestamp);
          const isRecent = itemTime > cutoffTime;
          const isFirstOccurrence = array.findIndex(i => i.id === item.id) === index;
          return isRecent && isFirstOccurrence;
        } catch (error) {
          console.error('Erro ao processar item na filtragem:', error, item);
          return false;
        }
      });
      
      // Ordenar por timestamp (mais recente primeiro)
      const sorted = unique.sort((a, b) => {
        try {
          const timeA = safeCreateDate(a.timestamp).getTime();
          const timeB = safeCreateDate(b.timestamp).getTime();
          return timeB - timeA;
        } catch (error) {
          console.error('Erro ao ordenar itens:', error);
          return 0;
        }
      });
      
      // Limitar a 100 itens para performance
      const limited = sorted.slice(0, 100);
      
      // Salvar no localStorage
      try {
        localStorage.setItem(key, JSON.stringify(limited));
      } catch (error) {
        console.error(`Erro ao salvar dados para ${key}:`, error);
      }
      
      return limited;
    });
  };

  // Função para limpar dados
  const clearData = () => {
    setData([]);
    localStorage.removeItem(key);
    console.log(`🗑️ Cache limpo para ${key}`);
  };

  return { data, addData, clearData };
};


import { createContext, useContext } from 'react';

interface NavigationContextType {
  openExperienceAccordion: () => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  // Return undefined if not within a provider (e.g., on blog pages)
  // This allows the Header to work without the provider
  return context;
};

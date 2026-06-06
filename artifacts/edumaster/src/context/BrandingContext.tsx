import { createContext, useContext, ReactNode } from "react";
import { useGetSchoolBranding, SchoolBranding } from "@workspace/api-client-react";

interface BrandingContextType {
  branding: SchoolBranding | null;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({ branding: null, isLoading: true });

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { data: branding, isLoading } = useGetSchoolBranding();

  return (
    <BrandingContext.Provider value={{ branding: branding ?? null, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

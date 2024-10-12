"use client";
import { type Template } from "@/server/db/schema";
import { api } from "@/trpc/react";
import React, { createContext, useContext, useState } from "react";

export type Profile = {
  id: number;
  name: string;
  displayImage: unknown;
  FACEBOOK_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  FACEBOOK_BUSINESS_ID: string;
  templates: Template[];
};

interface ContextType {
  profiles: Profile[];
  isLoading: boolean;
  selectedProfile: Profile | null;
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  refetchProfiles: ReturnType<typeof api.profiles.getProfiles.useQuery>["refetch"] | (() => Promise<void>);
}

const ProfileContext = createContext<ContextType>({
  profiles: [],
  isLoading: true,
  selectedProfile: null,
  setSelectedProfile: () => void 0,
  refetchProfiles: () => Promise.resolve(),
});

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: profiles, isLoading, refetch: refetchProfiles } = api.profiles.getProfiles.useQuery();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  return (
    <ProfileContext.Provider
      value={{
        profiles: profiles ?? [],
        isLoading,
        selectedProfile,
        setSelectedProfile,
        refetchProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

"use client";
import { useProfileContext } from "@/context/profile-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const ProfileSelector = () => {
  const { profiles, selectedProfile, setSelectedProfile } = useProfileContext();

  return (
    <Select
      value={selectedProfile?.id.toString() ?? ''}
      onValueChange={(value) => {
        const profile = profiles.find((p) => p.id === Number(value)) ?? null;
        setSelectedProfile(profile);
        toast.success(`Selected profile: ${profile!.name}`);
      }}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select a profile">
          {selectedProfile?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id.toString()}>
          {profile.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

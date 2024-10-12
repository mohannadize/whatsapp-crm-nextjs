"use client";
import { ProfilesTable } from "./profiles-table";
import { ProfileForm } from "./profile-form";
import { useProfileContext, type Profile } from "@/context/profile-context";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { api } from "@/trpc/react";

export function Profiles() {
  const [isClient, setIsClient] = useState(false);
  const { profiles, refetchProfiles } = useProfileContext();
  const addProfile = api.profiles.addProfile.useMutation({
    onSuccess: () => {
      void refetchProfiles();
    },
  });
  const editProfile = api.profiles.editProfile.useMutation({
    onSuccess: () => {
      void refetchProfiles();
    },
  });
  const deleteProfile = api.profiles.deleteProfile.useMutation({
    onSuccess: () => {
      void refetchProfiles();
    },
  });
  const syncTemplates = api.profiles.syncProfileMessageTemplates.useMutation({
    onSuccess: () => {
      void refetchProfiles();
    },
  });
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const handleAddProfile = (newProfile: Profile) => {
    return addProfile.mutate({
      name: newProfile.name,
      FACEBOOK_ACCESS_TOKEN: newProfile.FACEBOOK_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: newProfile.WHATSAPP_PHONE_NUMBER_ID,
      FACEBOOK_BUSINESS_ID: newProfile.FACEBOOK_BUSINESS_ID,
    });
  };

  const handleEditProfile = (updatedProfile: Profile) => {
    return editProfile.mutate({
      id: updatedProfile.id,
      data: {
        name: updatedProfile.name,
        FACEBOOK_ACCESS_TOKEN: updatedProfile.FACEBOOK_ACCESS_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: updatedProfile.WHATSAPP_PHONE_NUMBER_ID,
        FACEBOOK_BUSINESS_ID: updatedProfile.FACEBOOK_BUSINESS_ID,
      },
    });
  };

  const handleDeleteProfile = () => {
    if (profileToDelete) {
      deleteProfile.mutate({ id: profileToDelete.id });
      setProfileToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold">Profiles</h1>
        <ProfileForm
          onSubmit={handleAddProfile}
          triggerButton={
            <Button>
              Add New Profile <PlusIcon className="ml-2 h-4 w-4" />
            </Button>
          }
          title="Add New Profile"
        />
      </div>
      <ProfilesTable
        profiles={profiles}
        onSyncTemplates={(profileId: number) => syncTemplates.mutate({ profileId })}
        onEdit={(profile: Profile) => (
          <ProfileForm
            onSubmit={handleEditProfile}
            initialData={profile}
            triggerButton={
              <Button variant="outline" size="sm">
                Edit
              </Button>
            }
            title="Edit Profile"
          />
        )}
        onDelete={(profile: Profile) => setProfileToDelete(profile)}
      />
      <AlertDialog
        open={!!profileToDelete}
        onOpenChange={() => setProfileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              profile &quot;{profileToDelete?.name}&quot; and remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProfile}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

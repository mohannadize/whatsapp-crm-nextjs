"use client";
import { type Profile, useProfileContext } from "@/context/profile-context";
import { Button } from "@/components/ui/button";
import { type Contact } from "@/server/db/schema";
import RecipientList from "@/app/_components/RecipientList";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Session } from "next-auth";
import { api } from "@/trpc/react";

type DashboardProps = {
  session: Session | null;
};

export default function Dashboard({ session }: DashboardProps) {
  const [isClient, setIsClient] = useState(false);
  const { selectedProfile, refetchProfiles } = useProfileContext();
  const { data: contacts } = api.contacts.getContacts.useQuery({
    profileId: selectedProfile?.id ?? 0,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<
    Profile["templates"][number] | undefined
  >(undefined);
  const syncTemplates = api.profiles.syncProfileMessageTemplates.useMutation({
    onSuccess: () => {
      void refetchProfiles();
    },
    onError: () => {
      toast.error(
        "Failed to sync templates, please check your profile details and try again",
      );
    },
  });
  const sendTemplateMessage =
    api.actions.sendWhatsappTemplateMessage.useMutation({
      onSuccess: () => {
        toast.success("Your messages have been added to the queue.");
      },
    });
  const [selectedRecipients, setSelectedRecipients] = useState<Contact[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }
  if (!session) {
    return <div>Not authenticated</div>;
  }

  if (!selectedProfile) {
    return <div>No profile selected</div>;
  }

  console.log(selectedProfile.templates);

  return (
    <main>
      <div>
        <RecipientList
          recipients={contacts ?? []}
          onSelectRecipients={setSelectedRecipients}
        />
        <hr className="my-4 w-full border-red-600" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="mt-4 text-2xl font-bold">Pick a template</h3>
          <Button
            onClick={() => {
              void syncTemplates.mutate({ profileId: selectedProfile.id });
            }}
          >
            {syncTemplates.isPending ? "Syncing..." : "Sync Templates"}
          </Button>
        </div>
        {!!selectedProfile.templates.length && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              {selectedProfile.templates.map((template) => (
                <div key={template.id} className="flex items-center space-x-2 mb-2">
                  <input
                    type="radio"
                    id={template.id}
                    name="template"
                    value={template.id}
                    onChange={(e) =>
                      setSelectedTemplate(
                        selectedProfile.templates.find((t) => t.id === e.target.value)
                      )
                    }
                  />
                  <label htmlFor={template.id} className="text-sm font-medium leading-none cursor-pointer">
                    {template.name}
                  </label>
                </div>
              ))}
            </div>
            {selectedTemplate && (
              <div className="rounded-md border p-4">
                <h4 className="mb-2 font-bold">Selected Template:</h4>
                <p>{selectedTemplate.name}</p>
              </div>
            )}
          </div>
        )}
        <Button
          className="mt-4"
          disabled={sendTemplateMessage.isPending}
          onClick={() => {
            if (!selectedTemplate) {
              toast.error("Please select a template");
              return;
            }
            if (selectedRecipients.length === 0) {
              toast.error("Please select at least one recipient");
              return;
            }
            void sendTemplateMessage.mutate({
              receipients: selectedRecipients.map((r) => ({
                contactId: r.id,
                components: [],
              })),
              templateId: selectedTemplate.id,
            });
          }}
        >
          {sendTemplateMessage.isPending ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </main>
  );
}

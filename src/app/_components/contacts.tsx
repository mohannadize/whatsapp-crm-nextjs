"use client";
import React, { useEffect, useState } from "react";
import { ContactsTable } from "./contacts-table";
import { ContactForm } from "./contact-form";
import { useProfileContext } from "@/context/profile-context";
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
import { PlusIcon } from "@radix-ui/react-icons";
import { ArrowBigDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { Trash2 } from "lucide-react"; // Add this import
import { type Contact } from "@/server/db/schema";
import { api } from "@/trpc/react";

export function Contacts() {
  const [isClient, setIsClient] = useState(false);
  const { selectedProfile } = useProfileContext();
  const { data: contacts, refetch: refetchContacts } = api.contacts.getContacts.useQuery({
    profileId: selectedProfile?.id,
  });
  const addContact = api.contacts.addContact.useMutation({
    onSuccess: () => {
      void refetchContacts();
    },
  });
  const editContact = api.contacts.editContact.useMutation({
    onSuccess: () => {
      void refetchContacts();
    },
  });
  const deleteContact = api.contacts.deleteContact.useMutation({
    onSuccess: () => {
      void refetchContacts();
    },
  });
  const deleteAllContacts = api.contacts.deleteAllContacts.useMutation({
    onSuccess: () => {
      void refetchContacts();
    },
  });
  const bulkImportContacts = api.contacts.bulkImportContacts.useMutation({
    onSuccess: () => {
      void refetchContacts();
    },
  });
  const [contactToDelete, setContactToDelete] = useState<{
    contact: Contact;
    index: number;
  } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false); // Add this state

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  if (!selectedProfile) {
    return <div>No profile selected</div>;
  }

  const handleAddContact = (newContact: Contact) => {
    addContact.mutate({
      profileId: selectedProfile.id,
      name: newContact.name,
      phone: newContact.phone,
      country: newContact.country,
      address: newContact.address,
    });
  };

  const handleEditContact = (updatedContact: Contact) => {
    editContact.mutate({
      id: updatedContact.id,
      name: updatedContact.name,
      phone: updatedContact.phone,
      country: updatedContact.country,
      address: updatedContact.address,
    });
  };

  const handleDeleteContact = () => {
    if (contactToDelete) {
      deleteContact.mutate({
        id: contactToDelete.contact.id,
      });
      setContactToDelete(null);
    }
  };

  const handleDeleteAllContacts = () => {
    deleteAllContacts.mutate({
      profileId: selectedProfile.id,
    });
    setShowDeleteAllDialog(false);
    toast.success("All contacts have been deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <ContactForm
          onSubmit={handleAddContact}
          triggerButton={
            <Button>
              Add New Contact <PlusIcon className="ml-2 h-4 w-4" />
            </Button>
          }
          title="Add New Contact"
        />
        <div className="flex-1"></div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              Import CSV <ArrowBigDown className="ml-2 h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Import Contacts from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import contacts into your profile.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => {
                // Handle file upload and parsing here
                const file = e.target.files?.[0];
                if (file) {
                  setImportFile(file);
                } else {
                  setImportFile(null);
                }
              }}
            />
            <DialogFooter>
              <Button
                type="submit"
                onClick={() => {
                  if (importFile) {
                    // Read the CSV file
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const csvText = event.target?.result as string;
                      const lines = csvText.split("\n");
                      const headers =
                        lines[0]
                          ?.split(",")
                          .map((header) => header.trim().toLowerCase()) ?? [];

                      // Check if required headers are present
                      if (
                        !headers.includes("name") ||
                        !headers.includes("phone")
                      ) {
                        toast.error(
                          'CSV file must contain "name" and "phone" columns',
                        );
                        return;
                      }

                      let skippedContacts = 0;
                      const newContacts: Partial<Contact>[] = lines
                        .slice(1)
                        .map((line) => {
                          const values = line.split(",");
                          const contact: Partial<Contact> = {
                            name: "",
                            phone: "",
                            country: "",
                            address: "",
                          };

                          headers.forEach((header, index) => {
                            const value = values[index]?.trim() ?? "";
                            if (header === "name") {
                              contact.name = value;
                            } else if (header === "phone") {
                              try {
                                const phoneNumber = parsePhoneNumber(
                                  value,
                                  "KW",
                                );
                                if (
                                  phoneNumber &&
                                  isValidPhoneNumber(phoneNumber.number, "KW")
                                ) {
                                  contact.phone =
                                    phoneNumber.formatInternational();
                                } else {
                                  throw new Error("Invalid phone number");
                                }
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              } catch (error) {
                                skippedContacts++;
                                return null; // Skip this contact
                              }
                            } else if (header === "country") {
                              contact.country = value;
                            } else if (header === "address") {
                              contact.address = value;
                            }
                          });

                          return contact;
                        })
                        .filter((contact) => contact.name && contact.phone);
                      if (skippedContacts > 0) {
                        toast.info(
                          `${skippedContacts} contacts were skipped due to invalid data.`,
                        );
                      }

                      // Add new contacts to the phone book
                      bulkImportContacts.mutate({
                        profileId: selectedProfile.id,
                        contacts: newContacts as Contact[],
                      });
                    };

                    reader.readAsText(importFile);
                  }
                }}
              >
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteAllDialog(true)}
        >
          Delete All Contacts <Trash2 className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <ContactsTable
        contacts={contacts ?? []}
        onEdit={(contact) => (
          <ContactForm
            onSubmit={(updatedContact) =>
              handleEditContact(updatedContact)
            }
            initialData={contact}
            triggerButton={
              <Button variant="outline" size="sm">
                Edit
              </Button>
            }
            title="Edit Contact"
          />
        )}
        onDelete={(contact, index) =>
          setContactToDelete({ contact, index })
        }
      />
      <AlertDialog
        open={!!contactToDelete}
        onOpenChange={() => setContactToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contact &quot;{contactToDelete?.contact.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Contacts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all contacts? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllContacts}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

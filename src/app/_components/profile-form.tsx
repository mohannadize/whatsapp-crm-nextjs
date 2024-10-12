"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Profile } from '@/context/profile-context';

interface ProfileFormProps {
  onSubmit: (profile: Profile) => void;
  initialData?: Profile;
  triggerButton: React.ReactNode;
  title: string;
}

export function ProfileForm({ onSubmit, initialData, triggerButton, title }: ProfileFormProps) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<Profile>({
    defaultValues: initialData ?? {
      id: 0,
      displayImage: '',
      name: '',
      FACEBOOK_ACCESS_TOKEN: '',
      WHATSAPP_PHONE_NUMBER_ID: '',
      FACEBOOK_BUSINESS_ID: '',
      templates: [],
    },
  });

  const handleSubmit = (data: Profile) => {
    onSubmit(data);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" autoComplete="off">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Profile Name" required autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="FACEBOOK_ACCESS_TOKEN"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Access Token</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Facebook Access Token" required type="password" autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="WHATSAPP_PHONE_NUMBER_ID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Phone Number ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="WhatsApp Phone Number ID" required autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="FACEBOOK_BUSINESS_ID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Business ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Facebook Business ID" required autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">{initialData ? 'Update' : 'Add'} Profile</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

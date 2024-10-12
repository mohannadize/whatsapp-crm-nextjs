"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Contact } from "@/server/db/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactFormProps {
  onSubmit: (contact: Contact) => void;
  initialData?: Contact;
  triggerButton: React.ReactNode;
  title: string;
}

const COUNTRY_LIST = [
  {
    value: "KW",
    label: "Kuwait",
  },
  {
    value: "SA",
    label: "Saudi Arabia",
  },
  {
    value: "QA",
    label: "Qatar",
  },
  {
    value: "AE",
    label: "United Arab Emirates",
  },
  {
    value: "OM",
    label: "Oman",
  },
  {
    value: "BH",
    label: "Bahrain",
  },
];

export function ContactForm({ onSubmit, initialData, triggerButton, title }: ContactFormProps) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<Contact>({
    defaultValues: initialData ?? {
      name: '',
      phone: '',
      country: '',
      address: '',
    },
  });

  const handleSubmit = (data: Contact) => {
    // Parse the phone number before submitting
    try {
      const phoneNumber = parsePhoneNumber(data.phone, data.country as CountryCode ?? "KW");
      if (phoneNumber && isValidPhoneNumber(phoneNumber.number, data.country as CountryCode ?? "KW")) {
        const formattedData = {
          ...data,
          phone: phoneNumber.formatInternational(),
        };
        onSubmit(formattedData);
        form.reset();
        setOpen(false);
      } else {
        form.setError('phone', { type: 'manual', message: 'Invalid phone number for the selected country' });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      form.setError('phone', { type: 'manual', message: 'Invalid phone number format' });
    }
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
                    <Input {...field} placeholder="Contact Name" required autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Revalidate phone number when country changes
                      void form.trigger('phone');
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRY_LIST.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Phone Number" required autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Address" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">{initialData ? 'Update' : 'Add'} Contact</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

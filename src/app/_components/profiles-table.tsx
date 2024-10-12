import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { type Profile } from '@/context/profile-context';

interface ProfilesTableProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => React.ReactNode;
  onDelete: (profile: Profile) => void;
  onSyncTemplates: (profileId: number) => void;
}

export function ProfilesTable({ profiles, onEdit, onDelete, onSyncTemplates }: ProfilesTableProps) {
  const maskSensitiveInfo = (_: string) => '*'.repeat(8);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Display Image</TableHead>
          <TableHead>WhatsApp Phone Number ID</TableHead>
          <TableHead>Facebook Business ID</TableHead>
          <TableHead>Facebook Access Token</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => (
          <TableRow key={profile.id}>
            <TableCell>{profile.name}</TableCell>
            <TableCell>{profile.displayImage ? 'Set' : 'Not set'}</TableCell>
            <TableCell>{profile.WHATSAPP_PHONE_NUMBER_ID}</TableCell>
            <TableCell>{profile.FACEBOOK_BUSINESS_ID}</TableCell>
            <TableCell>{maskSensitiveInfo(profile.FACEBOOK_ACCESS_TOKEN)}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onSyncTemplates(profile.id)} className="ml-2">
                Sync Templates
              </Button>
              {onEdit(profile)}
              <Button variant="destructive" size="sm" onClick={() => onDelete(profile)} className="ml-2">
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
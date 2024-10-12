import React, { useCallback, useState } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Button } from "@/components/ui/button";
import { type Contact } from "@/server/db/schema";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact, index: number) => React.ReactNode;
  onDelete: (contact: Contact, index: number) => void;
}

const ITEMS_PER_PAGE = 100;
const ROW_HEIGHT = 50;

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = useCallback(() => {
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm),
    );
  }, [contacts, searchTerm]);

  const visibleContacts = filteredContacts().slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const contact = visibleContacts[index];
      if (!contact) return null;
      return (
        <div style={style} className="flex items-center border-b">
          <div className="flex-1 p-2">{contact.name}</div>
          <div className="flex-1 p-2">{contact.phone}</div>
          <div className="flex-1 p-2">{contact.country}</div>
          <div className="flex-1 p-2">{contact.address}</div>
          <div className="flex-none p-2">
            {onEdit(contact, index)}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(contact, index)}
              className="ml-2"
            >
              Delete
            </Button>
          </div>
        </div>
      );
    },
    [visibleContacts, onEdit, onDelete],
  );

  return (
    <div className="rounded-md border">
      <div className="flex items-center border-b bg-muted">
        <div className="flex-1 p-2 font-medium">Name</div>
        <div className="flex-1 p-2 font-medium">Phone</div>
        <div className="flex-1 p-2 font-medium">Country</div>
        <div className="flex-1 p-2 font-medium">Address</div>
        <div className="flex-none p-2 font-medium">Actions</div>
      </div>
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            height={400}
            itemCount={visibleContacts.length}
            itemSize={ROW_HEIGHT}
            width={width}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

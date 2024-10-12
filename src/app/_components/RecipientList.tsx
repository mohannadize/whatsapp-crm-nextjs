"use client";
import React, { useEffect, useState, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { type Contact } from "@/server/db/schema";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface RecipientListProps {
  recipients: Contact[];
  onSelectRecipients: (recipients: Contact[]) => void;
}

const ITEMS_PER_PAGE = 100;
const ROW_HEIGHT = 35;

export default function RecipientList({
  recipients,
  onSelectRecipients,
}: RecipientListProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const selectedContacts = recipients.filter((r) =>
      selectedRecipients.has(r.phone),
    );
    onSelectRecipients(selectedContacts);
  }, [selectedRecipients, recipients, onSelectRecipients]);

  const toggleRecipient = useCallback((phone: string) => {
    setSelectedRecipients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(phone)) {
        newSet.delete(phone);
      } else {
        newSet.add(phone);
      }
      return newSet;
    });
  }, []);

  const selectAll = () => {
    if (selectedRecipients.size === recipients.length) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(recipients.map((r) => r.phone)));
    }
  };

  const filteredRecipients = useCallback(() => {
    return recipients.filter((recipient) =>
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.phone.includes(searchTerm)
    );
  }, [recipients, searchTerm]);

  const visibleRecipients = filteredRecipients().slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const recipient = visibleRecipients[index];
      if (!recipient) return null;
      return (
        <div style={style} className="flex items-center border-b">
          <div className="w-[50px] flex-none p-2">
            <Checkbox
              checked={selectedRecipients.has(recipient.phone)}
              onCheckedChange={() => toggleRecipient(recipient.phone)}
            />
          </div>
          <div className="flex-1 p-2">{recipient.name}</div>
          <div className="flex-1 p-2">{recipient.phone}</div>
        </div>
      );
    },
    [visibleRecipients, selectedRecipients, toggleRecipient],
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Recipients</h1>
        <Button onClick={selectAll}>
          {selectedRecipients.size === recipients.length
            ? "Deselect All"
            : "Select All"}
        </Button>
        <div className="flex-1 flex justify-end">
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            className="gap-2"
          >
            {expanded ? "Collapse" : "Expand"}{" "}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="mb-4 relative">
          <Input
            type="text"
            placeholder="Search by name or phone number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      )}
      {expanded ? (
        <>
          <div className="rounded-md border">
            <div className="flex items-center border-b bg-muted">
              <div className="w-[50px] flex-none p-2">
                <Checkbox
                  checked={
                    selectedRecipients.size === recipients.length
                      ? true
                      : selectedRecipients.size > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={selectAll}
                />
              </div>
              <div className="flex-1 p-2 font-medium">Name</div>
              <div className="flex-1 p-2 font-medium">Phone</div>
            </div>
            <AutoSizer disableHeight>
              {({ width }) => (
                <List
                  height={400}
                  itemCount={visibleRecipients.length}
                  itemSize={ROW_HEIGHT}
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
          <div className="mt-4 flex justify-between">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of{" "}
              {Math.ceil(filteredRecipients().length / ITEMS_PER_PAGE)}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    Math.ceil(filteredRecipients().length / ITEMS_PER_PAGE),
                    p + 1,
                  ),
                )
              }
              disabled={
                currentPage === Math.ceil(filteredRecipients().length / ITEMS_PER_PAGE)
              }
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          Selected {selectedRecipients.size} of {recipients.length} recipient
          {recipients.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}

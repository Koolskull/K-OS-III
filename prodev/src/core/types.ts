// Core TypeScript interfaces for PRODEV — original design skeleton, kept
// for reference. The real, running data model is db/schema.sql's
// prodev_* tables plus the row shapes returned by src/app/api/prodev/*
// (owner/credits key off real users.id there, not free-form strings).

export interface ChecklistItem {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  owner: string;
  hours: number;
  contributionPercent: number;
  assets: string[]; // linked file paths in K-OS
  children?: ChecklistItem[]; // nested checklists
}

export interface Shot {
  id: string;
  title: string;
  checklist: ChecklistItem;
  layers: any[]; // composition layers
  credits: Record<string, number>; // team member -> %
}

export interface Project {
  id: string;
  name: string;
  modules: ChecklistItem[]; // top level checklists
  blockchainRef: string; // ledger pointer
}

// Extend as needed for sequencer, finance, etc.
import type { Category } from "@/lib/types";

/**
 * Demo categories with the SA-flavoured descriptions from the frontend spec.
 * `software_count` is recomputed in lib/placeholder/index.ts from the roster,
 * mirroring the database trigger — never hardcoded.
 */
export const placeholderCategories: Category[] = [
  {
    id: "cat-accounting",
    name: "Accounting Software",
    slug: "accounting-software",
    icon: "calculator",
    description:
      "Bookkeeping, invoicing, VAT and financial reporting tools for South African businesses.",
    software_count: 0,
    display_order: 1,
  },
  {
    id: "cat-payroll",
    name: "Payroll Software",
    slug: "payroll-software",
    icon: "banknote",
    description:
      "Payroll processing, payslips, SARS submissions, UIF and compliance for SA employers.",
    software_count: 0,
    display_order: 2,
  },
  {
    id: "cat-hr",
    name: "HR Software",
    slug: "hr-software",
    icon: "users",
    description:
      "Leave, onboarding, performance and employee records for growing teams.",
    software_count: 0,
    display_order: 3,
  },
  {
    id: "cat-crm",
    name: "CRM Software",
    slug: "crm-software",
    icon: "heart-handshake",
    description:
      "Pipeline, contact management and sales automation to win and keep customers.",
    software_count: 0,
    display_order: 4,
  },
  {
    id: "cat-erp",
    name: "ERP Software",
    slug: "erp-software",
    icon: "factory",
    description:
      "Integrated finance, inventory, operations and manufacturing management.",
    software_count: 0,
    display_order: 5,
  },
  {
    id: "cat-pm",
    name: "Project Management",
    slug: "project-management",
    icon: "kanban",
    description:
      "Plan work, track projects and collaborate across teams of any size.",
    software_count: 0,
    display_order: 6,
  },
];

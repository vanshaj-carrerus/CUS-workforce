"use client";

import { useState } from "react";
import { ChevronDown, Mail, Phone, MessageCircle, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OPEN_HR_CHAT_EVENT } from "@/components/layout/HrChatWidget";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How do I apply for leave?",
    a: "Go to Leave Management from the sidebar, click 'Apply for Leave', fill in the leave type, dates, and reason, then submit. Your manager will be notified for approval.",
  },
  {
    q: "When are payslips generated?",
    a: "Payslips are generated on the last working day of each month and are available for download under the Payroll section the same evening.",
  },
  {
    q: "How do I request an attendance correction?",
    a: "Visit the Attendance page and click 'Request Attendance Correction'. Provide the date and reason, and HR will review and update your record.",
  },
  {
    q: "Who can see my payroll information?",
    a: "Salary details are only visible to you and authorized HR administrators. Use the 'Show Salary Details' toggle to reveal protected figures.",
  },
  {
    q: "How do I raise an HR request?",
    a: "Go to HR Helpdesk, click 'Raise New HR Request', select a category, describe your issue, and submit. You can track progress and chat with HR from the ticket page.",
  },
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <PageHeader title="Help & Support" subtitle="Find answers or get in touch with the HR support team" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Mail className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Email Support</p>
          <p className="mt-1 text-sm text-muted">aastha@custech.co</p>
        </Card>
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg text-success">
            <Phone className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">HR Helpline</p>
          <p className="mt-1 text-sm text-muted">+91 90999 44486</p>
        </Card>
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-bg text-violet">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Raise a Ticket</p>
          <Link href="/helpdesk">
            <Button size="sm" variant="secondary" className="mt-2">
              Go to Helpdesk
            </Button>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader title="Frequently Asked Questions" />
        <div className="divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={faq.q}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", openIdx === i && "rotate-180")} />
              </button>
              {openIdx === i && <p className="pb-4 text-sm text-muted">{faq.a}</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Still need help?" subtitle="Chat with our HR support assistant" />
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
          <MessageCircle className="h-8 w-8 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">HR Live Chat</p>
            <p className="text-xs text-muted">Available Mon–Fri, 9 AM – 6 PM IST</p>
          </div>
          <Button size="sm" onClick={() => window.dispatchEvent(new Event(OPEN_HR_CHAT_EVENT))}>
            Start Chat
          </Button>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CATEGORIES, STATUS_CONFIG, type Category } from "@/lib/ideas";
import { EcosystemFooter } from "@/components/ecosystem-footer";
import Link from "next/link";

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") return null;
  if (!session?.user) {
    router.push("/auth/signin");
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      tagline: form.get("tagline") as string,
      description: form.get("description") as string,
      category: form.get("category") as string,
      targetMarket: form.get("targetMarket") as string,
      tam: form.get("tam") as string,
      pricing: form.get("pricing") as string,
      stack: (form.get("stack") as string).split(",").map((s) => s.trim()).filter(Boolean),
      effort: form.get("effort") as string,
      revenueModel: form.get("revenueModel") as string,
      tags: (form.get("tags") as string).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      const idea = await res.json();
      router.push(`/idea/${idea.slug}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
        &larr; Back
      </Link>

      <h1 className="mb-2 text-3xl font-black text-white">Submit a New Idea</h1>
      <p className="mb-8 text-zinc-400">Share your AI business idea with the community.</p>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Name" name="name" required placeholder="e.g. AI Recruiter Pro" />
        <Field label="Tagline" name="tagline" required placeholder="One-sentence pitch" />
        <Field label="Description" name="description" required placeholder="Detailed description..." multiline />
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField label="Category" name="category" options={Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <SelectField
            label="Effort"
            name="effort"
            options={[
              { value: "1-week", label: "1 Week" },
              { value: "2-weeks", label: "2 Weeks" },
              { value: "1-month", label: "1 Month" },
              { value: "3-months", label: "3 Months" },
              { value: "6-months", label: "6 Months" },
              { value: "1-year", label: "1 Year" },
            ]}
          />
        </div>
        <Field label="Target Market" name="targetMarket" placeholder="Who is this for?" />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="TAM" name="tam" placeholder="Total addressable market" />
          <Field label="Pricing" name="pricing" placeholder="e.g. €29/mo" />
        </div>
        <Field label="Tech Stack" name="stack" placeholder="Next.js, Claude API, PostgreSQL (comma separated)" />
        <Field label="Revenue Model" name="revenueModel" placeholder="SaaS, pay-per-use, etc." />
        <Field label="Tags" name="tags" placeholder="ai, saas, b2b (comma separated)" />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Idea"}
        </button>
      </form>

      <EcosystemFooter />
    </main>
  );
}

function Field({ label, name, placeholder, required, multiline }: {
  label: string; name: string; placeholder?: string; required?: boolean; multiline?: boolean;
}) {
  const cls = "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors";
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      {multiline ? (
        <textarea name={name} placeholder={placeholder} required={required} className={cls + " resize-none"} rows={4} />
      ) : (
        <input name={name} placeholder={placeholder} required={required} className={cls} />
      )}
    </div>
  );
}

function SelectField({ label, name, options }: {
  label: string; name: string; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      <select
        name={name}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

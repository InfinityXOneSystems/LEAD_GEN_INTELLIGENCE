"use client";

import { useState } from "react";
import { Terminal, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { commandsApi } from "@/lib/api";

export default function CommandBar() {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    try {
      const { data } = await commandsApi.execute(command.trim());
      toast.success(`${data.action}: ${data.message}`);
      setCommand("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Command failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-700"
    >
      <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="scrape epoxy contractors in Texas..."
        className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !command.trim()}
        className="shrink-0 p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}

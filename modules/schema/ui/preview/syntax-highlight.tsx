"use client";

import hljs from "highlight.js/lib/common";
import { useMemo } from "react";
import "highlight.js/styles/github.css";
import "highlight.js/styles/github-dark.css";

interface SyntaxHighlightProps {
  code: string;
  language: string;
}

export function SyntaxHighlight({ code, language }: SyntaxHighlightProps) {
  const html = useMemo(() => {
    try {
      const lang = hljs.getLanguage(language) ? language : "plaintext";
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      return code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [code, language]);

  return (
    <pre className="p-4 font-mono text-xs leading-relaxed dark:[color-scheme:dark]">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: output is escaped by highlight.js; only language tokens are inserted */}
      <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

import React from "react";

/** Minimal markdown -> React renderer for TyRey deliverables (dossier style). */

function inline(text: string, key: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined) parts.push(<strong key={`${key}-${i++}`}>{match[1]}</strong>);
    else if (match[2] !== undefined) parts.push(<em key={`${key}-${i++}`}>{match[2]}</em>);
    else if (match[3] !== undefined) parts.push(<code key={`${key}-${i++}`}>{match[3]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems.map((item, idx) => <li key={idx}>{inline(item, key++)}</li>);
    blocks.push(listOrdered ? <ol key={key++}>{items}</ol> : <ul key={key++}>{items}</ul>);
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const stripped = line.trim();
    const bullet = stripped.match(/^[-*+]\s+(.*)/);
    const ordered = stripped.match(/^\d+\.\s+(.*)/);

    if (bullet) {
      if (listItems.length && listOrdered) flushList();
      listOrdered = false;
      listItems.push(bullet[1]);
      continue;
    }
    if (ordered) {
      if (listItems.length && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(ordered[1]);
      continue;
    }
    flushList();

    if (!stripped) continue;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(stripped)) {
      blocks.push(<hr key={key++} />);
    } else if (stripped.startsWith("### ")) {
      blocks.push(<h3 key={key++}>{inline(stripped.slice(4), key)}</h3>);
    } else if (stripped.startsWith("## ")) {
      blocks.push(<h2 key={key++}>{inline(stripped.slice(3), key)}</h2>);
    } else if (stripped.startsWith("# ")) {
      blocks.push(<h1 key={key++}>{inline(stripped.slice(2), key)}</h1>);
    } else if (stripped.startsWith(">")) {
      blocks.push(
        <blockquote key={key++}>{inline(stripped.replace(/^>+\s?/, ""), key)}</blockquote>
      );
    } else {
      blocks.push(<p key={key++}>{inline(stripped, key)}</p>);
    }
  }
  flushList();

  return <div className="dossier">{blocks}</div>;
}

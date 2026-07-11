import { useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Small hand-rolled rich text editor for admin content fields where a full
 * library like Tiptap would be overkill. Uses contentEditable + the legacy
 * `document.execCommand` API for formatting. execCommand is deprecated on
 * paper but universally implemented in every browser we care about, and
 * for the "type a paragraph, bold a word" workflow it's the right tool.
 * Zero runtime dependencies, ~2KB gzipped.
 *
 * Emits HTML on every keystroke via onChange. Value is only pushed into
 * the DOM when the editor mounts (or when the caller changes the `key`
 * prop) — feeding React state back into a contentEditable div every
 * keystroke would jump the cursor to the end after every character.
 *
 * If the admin toolbar UX ever needs to be smoother (floating menus,
 * inline images, table support), swap this for @tiptap/react — same
 * HTML-in-a-TEXT-column storage model, no migration needed.
 */

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightPx?: number;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeightPx = 220,
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  // One-shot initial content push. Deliberately does NOT include `value`
  // in deps — subsequent value changes come from the editor itself and we
  // must not overwrite them or the cursor jumps. Caller can force a full
  // reset by re-mounting via a changing `key` prop.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    // execCommand only works while the editor has focus. Buttons steal
    // focus on click; refocusing before the command runs keeps the
    // selection intact so "Bold" applies to the highlighted word, not to
    // nothing.
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    // Read the resulting HTML back out and notify the parent so form
    // state stays in lockstep with the DOM.
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function handleLink() {
    const url = window.prompt("Link URL (include https://)");
    if (!url) return;
    exec("createLink", url);
  }

  function handleInput() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  return (
    <div className="rounded-lg border border-line bg-white overflow-hidden focus-within:border-green-700 focus-within:ring-2 focus-within:ring-green-700/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-gray-50 px-2 py-1.5">
        <ToolBtn onClick={() => exec("bold")} title="Bold (Cmd/Ctrl+B)">
          <span className="font-bold">B</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic (Cmd/Ctrl+I)">
          <span className="italic">I</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline (Cmd/Ctrl+U)">
          <span className="underline">U</span>
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => exec("formatBlock", "<p>")} title="Paragraph">
          <span className="text-xs">P</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h2>")} title="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h3>")} title="Heading 3">
          <span className="text-xs font-bold">H3</span>
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <BulletIcon />
        </ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered list">
          <NumberedIcon />
        </ToolBtn>
        <ToolBtn onClick={handleLink} title="Add link">
          <LinkIcon />
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => exec("undo")} title="Undo (Cmd/Ctrl+Z)">
          <UndoIcon />
        </ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo (Cmd/Ctrl+Shift+Z)">
          <RedoIcon />
        </ToolBtn>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder ?? ""}
        className={cn(
          "longdesc-content px-3 py-3 text-ink focus:outline-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted empty:before:pointer-events-none",
        )}
        style={{ minHeight: minHeightPx }}
      />
    </div>
  );
}

/**
 * Toolbar button. `type="button"` is essential — bare <button> defaults
 * to type="submit", which would submit the surrounding <form> every time
 * you clicked Bold. onMouseDown preventDefault stops the button from
 * stealing focus from the editor before exec() gets a chance to run.
 */
function ToolBtn({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="h-8 min-w-[32px] px-2 rounded text-sm text-ink hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-700/20 inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-line mx-1" aria-hidden />;
}

// Tiny icons — SVG so they scale with font and inherit currentColor.
function BulletIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden>
      <circle cx="3" cy="5" r="1.4" />
      <circle cx="3" cy="10" r="1.4" />
      <circle cx="3" cy="15" r="1.4" />
      <rect x="7" y="4.2" width="11" height="1.6" rx="0.8" />
      <rect x="7" y="9.2" width="11" height="1.6" rx="0.8" />
      <rect x="7" y="14.2" width="11" height="1.6" rx="0.8" />
    </svg>
  );
}

function NumberedIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden>
      <text x="1" y="7" fontSize="5" fontFamily="sans-serif">
        1
      </text>
      <text x="1" y="12" fontSize="5" fontFamily="sans-serif">
        2
      </text>
      <text x="1" y="17" fontSize="5" fontFamily="sans-serif">
        3
      </text>
      <rect x="7" y="4.2" width="11" height="1.6" rx="0.8" />
      <rect x="7" y="9.2" width="11" height="1.6" rx="0.8" />
      <rect x="7" y="14.2" width="11" height="1.6" rx="0.8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 12a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1" />
      <path d="M12 8a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 8h9a4 4 0 1 1 0 8h-3" />
      <path d="M4 8 8 4M4 8l4 4" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 8H7a4 4 0 1 0 0 8h3" />
      <path d="m16 8-4-4m4 4-4 4" />
    </svg>
  );
}

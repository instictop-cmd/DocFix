"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function Home() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing...</p>",
  });

  if (!editor) {
    return null;
  }

  return (
    <main>
      <h1>Synora</h1>

      <EditorContent editor={editor} />
    </main>
  );
}
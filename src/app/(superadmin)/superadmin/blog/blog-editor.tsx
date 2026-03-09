"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
  Loader2,
  ArrowLeft,
  Save,
  ChevronDown,
  FileText,
  Globe,
} from "lucide-react";
import Link from "next/link";

interface BlogEditorProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    contentHtml: string;
    metaTitle: string;
    metaDescription: string;
    primaryKeyword: string;
    semanticKeywords: string[];
    status: "DRAFT" | "PUBLISHED";
  };
}

export function BlogEditor({ post }: BlogEditorProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [primaryKeyword, setPrimaryKeyword] = useState(post?.primaryKeyword ?? "");
  const [keywordsInput, setKeywordsInput] = useState(
    (post?.semanticKeywords ?? []).join(", ")
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(post?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const closeStatus = useCallback(() => setStatusOpen(false), []);

  useEffect(() => {
    if (!statusOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        closeStatus();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") closeStatus();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [statusOpen, closeStatus]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: post?.contentHtml ?? "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none min-h-[300px] px-4 py-3 focus:outline-none",
      },
    },
  });

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    // Auto-generate slug from title only for new posts
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSave() {
    if (!title.trim() || !editor) return;

    setSaving(true);
    setError("");

    const contentHtml = editor.getHTML();
    const semanticKeywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const body = {
      title,
      slug: slug || generateSlug(title),
      excerpt,
      contentHtml,
      metaTitle: metaTitle || title,
      metaDescription,
      primaryKeyword,
      semanticKeywords,
      status,
    };

    try {
      const url = isEditing
        ? `/api/admin/blog/${post.id}`
        : "/api/admin/blog";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        router.push("/superadmin/blog");
      } else {
        setError(json.error ?? "Failed to save post");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function handleSetLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Link URL:", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/superadmin/blog"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.5} className="text-gray-500" />
          </Link>
          <h1 className="text-title-small sm:text-title text-gray-900">
            {isEditing ? "Edit Post" : "New Post"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={statusRef}>
            <button
              type="button"
              onClick={() => setStatusOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={statusOpen}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
                status === "PUBLISHED"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              {status === "PUBLISHED" ? (
                <Globe size={14} strokeWidth={1.5} />
              ) : (
                <FileText size={14} strokeWidth={1.5} />
              )}
              {status === "PUBLISHED" ? "Published" : "Draft"}
              <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform duration-200 ${statusOpen ? "rotate-180" : ""}`} />
            </button>
            <div
              role="listbox"
              aria-label="Post status"
              className={`absolute right-0 top-full mt-1 w-36 sm:w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-20 transition-all duration-150 origin-top-right ${
                statusOpen
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <button
                type="button"
                role="option"
                aria-selected={status === "DRAFT"}
                onClick={() => { setStatus("DRAFT"); setStatusOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors hover:bg-gray-50 ${status === "DRAFT" ? "text-amber-700 font-medium bg-amber-50/50" : "text-gray-600"}`}
              >
                <FileText size={14} strokeWidth={1.5} />
                Draft
              </button>
              <button
                type="button"
                role="option"
                aria-selected={status === "PUBLISHED"}
                onClick={() => { setStatus("PUBLISHED"); setStatusOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors hover:bg-gray-50 ${status === "PUBLISHED" ? "text-emerald-700 font-medium bg-emerald-50/50" : "text-gray-600"}`}
              >
                <Globe size={14} strokeWidth={1.5} />
                Published
              </button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? (
              <Loader2 size={16} className="mr-1.5 animate-spin" />
            ) : (
              <Save size={16} strokeWidth={1.5} className="mr-1.5" />
            )}
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Input
            id="post-title"
            label="Title"
            placeholder="Article title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />

          {/* TipTap Editor */}
          <Card className="!p-0">
            {editor && (
              <div className="border-b border-gray-100 px-2 py-1.5 flex items-center gap-0.5 flex-wrap">
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  active={editor.isActive("bold")}
                  title="Bold"
                >
                  <Bold size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  active={editor.isActive("italic")}
                  title="Italic"
                >
                  <Italic size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  active={editor.isActive("heading", { level: 2 })}
                  title="Heading 2"
                >
                  <Heading2 size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  active={editor.isActive("heading", { level: 3 })}
                  title="Heading 3"
                >
                  <Heading3 size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  active={editor.isActive("bulletList")}
                  title="Bullet List"
                >
                  <List size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  active={editor.isActive("orderedList")}
                  title="Ordered List"
                >
                  <ListOrdered size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={handleSetLink}
                  active={editor.isActive("link")}
                  title="Link"
                >
                  <LinkIcon size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton
                  onClick={() => editor.chain().focus().undo().run()}
                  active={false}
                  title="Undo"
                >
                  <Undo size={16} strokeWidth={1.5} />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().redo().run()}
                  active={false}
                  title="Redo"
                >
                  <Redo size={16} strokeWidth={1.5} />
                </ToolbarButton>
              </div>
            )}
            <EditorContent editor={editor} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">
              Post Details
            </h3>
            <div className="space-y-3">
              <Input
                id="post-slug"
                label="Slug"
                placeholder="url-friendly-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <div>
                <label
                  htmlFor="post-excerpt"
                  className="block text-[13px] font-medium text-gray-700 mb-1"
                >
                  Excerpt
                </label>
                <textarea
                  id="post-excerpt"
                  placeholder="Brief summary for card display"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all resize-y"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">
              SEO
            </h3>
            <div className="space-y-3">
              <Input
                id="post-meta-title"
                label="Meta Title"
                placeholder="SEO page title (max 60 chars)"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={60}
              />
              <div>
                <label
                  htmlFor="post-meta-desc"
                  className="block text-[13px] font-medium text-gray-700 mb-1"
                >
                  Meta Description
                </label>
                <textarea
                  id="post-meta-desc"
                  placeholder="SEO description (150-160 chars)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={4}
                  maxLength={160}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all resize-y"
                />
                <p className={`text-[11px] mt-1 transition-colors ${
                  metaDescription.length >= 155
                    ? "text-red-500"
                    : metaDescription.length >= 140
                      ? "text-amber-500"
                      : "text-gray-400"
                }`}>
                  {metaDescription.length}/160
                  {metaDescription.length >= 150 && metaDescription.length < 160 && " — ideal length"}
                </p>
              </div>
              <Input
                id="post-keyword"
                label="Primary Keyword"
                placeholder="e.g. performance review"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
              />
              <div>
                <label
                  htmlFor="post-keywords"
                  className="block text-[13px] font-medium text-gray-700 mb-1"
                >
                  Semantic Keywords
                </label>
                <textarea
                  id="post-keywords"
                  placeholder="Comma-separated keywords"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all resize-y"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-gray-200 text-gray-900"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BlogEditor } from "../blog-editor";
import { Loader2 } from "lucide-react";

interface BlogPost {
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
}

export default function EditBlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/blog/${params.id}`);
        const json = await res.json();
        if (json.success) {
          setPost(json.data);
        } else {
          setError(json.error ?? "Post not found");
        }
      } catch {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-[14px] text-gray-500">{error || "Post not found"}</p>
      </div>
    );
  }

  return <BlogEditor post={post} />;
}

"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  MonitorPlay as YoutubeIcon,
  Type,
  Upload,
  ExternalLink,
} from "lucide-react";
import { useEffect } from "react";

export default function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Image modal state ---
  const [imageModal, setImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // --- Link modal state ---
  const [linkModal, setLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // --- Youtube modal state ---
  const [ytModal, setYtModal] = useState(false);
  const [ytUrl, setYtUrl] = useState("");

  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: () => forceUpdate((n) => n + 1),
    onTransaction: () => forceUpdate((n) => n + 1),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base prose-slate max-w-none focus:outline-none min-h-[300px] px-4 py-4 border-2 border-slate-100 rounded-2xl bg-white",
      },
    },
  });

  // Sync external content changes (e.g. loading saved post)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (editor.getHTML() === "<p></p>" && content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  // ---- Link ----
  const openLinkModal = () => {
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkModal(true);
  };
  const confirmLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    }
    setLinkModal(false);
    setLinkUrl("");
  };

  // ---- Image from URL ----
  const insertImageUrl = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    }
    setImageModal(false);
    setImageUrl("");
    setUploadError("");
  };

  // ---- Image upload ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
        setImageModal(false);
        setImageUrl("");
      } else {
        setUploadError("Lỗi tải ảnh: " + (data.message || "Unknown error"));
      }
    } catch {
      setUploadError("Lỗi kết nối khi tải ảnh.");
    } finally {
      setUploading(false);
    }
  };

  // ---- YouTube ----
  const confirmYoutube = () => {
    if (ytUrl.trim()) {
      editor.commands.setYoutubeVideo({ src: ytUrl.trim(), width: 640, height: 480 });
    }
    setYtModal(false);
    setYtUrl("");
  };

  const transformText = (type: "uppercase" | "lowercase" | "capitalize" | "sentence") => {
    const { state } = editor;
    const { from, to } = state.selection;
    if (from === to) return;
    const text = state.doc.textBetween(from, to, " ");
    let newText = text;
    if (type === "uppercase") newText = text.toUpperCase();
    if (type === "lowercase") newText = text.toLowerCase();
    if (type === "capitalize") newText = text.replace(/\b\w/g, (l) => l.toUpperCase());
    if (type === "sentence") newText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    editor.chain().focus().insertContentAt({ from, to }, newText).run();
  };

  const TB = ({
    icon: Icon,
    onClick,
    isActive = false,
    title,
  }: {
    icon: any;
    onClick: () => void;
    isActive?: boolean;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
        isActive ? "bg-[#1d4ed8] text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  // Shared modal wrapper
  const Modal = ({
    open,
    onClose,
    title,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* TOOLBAR */}
      <div className="relative z-30 flex flex-wrap gap-1 p-2 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
        <TB icon={Heading1} title="Tiêu đề 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} />
        <TB icon={Heading2} title="Tiêu đề 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} />
        <TB icon={Heading3} title="Tiêu đề 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        <TB icon={Bold} title="In đậm" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} />
        <TB icon={Italic} title="In nghiêng" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} />
        <TB icon={Strikethrough} title="Gạch ngang" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        {/* Text Transform */}
        <div className="relative group flex items-center justify-center">
          <button type="button" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1" title="Chuyển đổi kiểu chữ">
            <Type className="w-4 h-4" />
            <span className="text-[10px] font-bold">Aa</span>
          </button>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 min-w-[140px]">
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onMouseDown={(e) => e.preventDefault()} onClick={() => transformText("uppercase")}>UPPERCASE</button>
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onMouseDown={(e) => e.preventDefault()} onClick={() => transformText("lowercase")}>lowercase</button>
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onMouseDown={(e) => e.preventDefault()} onClick={() => transformText("capitalize")}>Capitalize Each Word</button>
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onMouseDown={(e) => e.preventDefault()} onClick={() => transformText("sentence")}>Sentence case</button>
          </div>
        </div>

        <TB icon={SubscriptIcon} title="Chỉ số dưới" onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive("subscript")} />
        <TB icon={SuperscriptIcon} title="Chỉ số trên" onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive("superscript")} />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        <TB icon={AlignLeft} title="Căn trái" onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} />
        <TB icon={AlignCenter} title="Căn giữa" onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} />
        <TB icon={AlignRight} title="Căn phải" onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} />
        <TB icon={AlignJustify} title="Căn đều" onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        <TB icon={List} title="Danh sách dấu chấm" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} />
        <TB icon={ListOrdered} title="Danh sách số" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} />
        <TB icon={Quote} title="Trích dẫn" onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        <TB icon={LinkIcon} title="Chèn Link" onClick={openLinkModal} isActive={editor.isActive("link")} />
        <TB icon={ImageIcon} title="Chèn Ảnh" onClick={() => { setImageModal(true); setUploadError(""); setImageUrl(""); }} />
        <TB icon={YoutubeIcon} title="Chèn Video YouTube" onClick={() => { setYtModal(true); setYtUrl(""); }} />

        {/* Colors */}
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="color"
            title="Màu chữ"
            onChange={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes("textStyle").color || "#000000"}
            className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
          />
          <TB icon={Highlighter} title="Tô sáng (Vàng)" onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} isActive={editor.isActive("highlight")} />
        </div>
      </div>

      {/* EDITOR AREA */}
      <EditorContent editor={editor} />

      {/* ---- LINK MODAL ---- */}
      <Modal open={linkModal} onClose={() => setLinkModal(false)} title="Chèn đường dẫn">
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#1d4ed8] focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && confirmLink()}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setLinkModal(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button type="button" onClick={confirmLink} className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Xác nhận</button>
        </div>
      </Modal>

      {/* ---- IMAGE MODAL ---- */}
      <Modal open={imageModal} onClose={() => setImageModal(false)} title="Chèn ảnh">
        {/* Upload from device */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 hover:border-[#1d4ed8] hover:text-[#1d4ed8] transition-colors disabled:opacity-60"
        >
          <Upload className="w-5 h-5 shrink-0" />
          {uploading ? "Đang tải lên…" : "Tải ảnh từ máy tính"}
        </button>

        <div className="my-3 flex items-center gap-2 text-xs text-slate-400">
          <div className="h-[1px] flex-1 bg-slate-200" />
          hoặc nhập URL
          <div className="h-[1px] flex-1 bg-slate-200" />
        </div>

        {/* URL input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#1d4ed8] focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && insertImageUrl()}
          />
          <button type="button" onClick={insertImageUrl} className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 flex items-center gap-1">
            <ExternalLink className="w-4 h-4" /> Chèn
          </button>
        </div>

        {uploadError && (
          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{uploadError}</p>
        )}

        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => setImageModal(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Đóng</button>
        </div>
      </Modal>

      {/* ---- YOUTUBE MODAL ---- */}
      <Modal open={ytModal} onClose={() => setYtModal(false)} title="Nhúng video YouTube">
        <input
          type="url"
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#1d4ed8] focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && confirmYoutube()}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setYtModal(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button type="button" onClick={confirmYoutube} className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nhúng</button>
        </div>
      </Modal>
    </div>
  );
}

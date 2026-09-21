"use client";

import { useRef } from "react";

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
  Underline,
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
} from "lucide-react";
import { useEffect } from "react";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

export default function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base prose-slate max-w-none focus:outline-none min-h-[300px] px-4 py-4 border-2 border-slate-100 rounded-2xl bg-white",
      },
    },
  });

  // Keep content in sync if it changes externally (e.g. loading)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (editor.getHTML() === "<p></p>" && content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Nhập đường dẫn (URL):", previousUrl);

    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    if (window.confirm("Tải ảnh lên từ máy tính?\n\nChọn [OK] để tải lên.\nChọn [Cancel] để nhập URL ảnh.")) {
      fileInputRef.current?.click();
    } else {
      const url = window.prompt("Nhập đường dẫn ảnh (URL):");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // reset
    e.target.value = "";

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert("Lỗi tải ảnh: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Lỗi kết nối khi tải ảnh.");
    }
  };

  const addYoutube = () => {
    const url = window.prompt("Nhập đường dẫn YouTube:");
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
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

  const ToolbarButton = ({
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

  return (
    <div className="flex flex-col gap-2">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      {/* TOOLBAR */}
      <div className="sticky top-0 z-10 flex flex-wrap gap-1 p-2 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
        {/* Headings */}
        <ToolbarButton
          icon={Heading1}
          title="Tiêu đề 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
        />
        <ToolbarButton
          icon={Heading2}
          title="Tiêu đề 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
        />
        <ToolbarButton
          icon={Heading3}
          title="Tiêu đề 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
        />
        
        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        {/* Formats */}
        <ToolbarButton
          icon={Bold}
          title="In đậm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        />
        <ToolbarButton
          icon={Italic}
          title="In nghiêng"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        />
        <ToolbarButton
          icon={Strikethrough}
          title="Gạch ngang"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
        />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        {/* Text Transform (Custom) */}
        <div className="relative group flex items-center justify-center">
          <button type="button" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1" title="Chuyển đổi kiểu chữ">
            <Type className="w-4 h-4" />
            <span className="text-[10px] font-bold">Aa</span>
          </button>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 min-w-[120px]">
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onClick={() => transformText("uppercase")}>UPPERCASE</button>
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onClick={() => transformText("lowercase")}>lowercase</button>
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onClick={() => transformText("capitalize")}>Capitalize Each Word</button>
            <button type="button" className="text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg" onClick={() => transformText("sentence")}>Sentence case</button>
          </div>
        </div>

        {/* Sub/Sup */}
        <ToolbarButton
          icon={SubscriptIcon}
          title="Chỉ số dưới"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive("subscript")}
        />
        <ToolbarButton
          icon={SuperscriptIcon}
          title="Chỉ số trên"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive("superscript")}
        />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />
        
        {/* Alignment */}
        <ToolbarButton
          icon={AlignLeft}
          title="Căn trái"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
        />
        <ToolbarButton
          icon={AlignCenter}
          title="Căn giữa"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
        />
        <ToolbarButton
          icon={AlignRight}
          title="Căn phải"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
        />
        <ToolbarButton
          icon={AlignJustify}
          title="Căn đều"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
        />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        {/* Lists */}
        <ToolbarButton
          icon={List}
          title="Danh sách dấu chấm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        />
        <ToolbarButton
          icon={ListOrdered}
          title="Danh sách số"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        />
        <ToolbarButton
          icon={Quote}
          title="Trích dẫn"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
        />

        <div className="w-[1px] bg-slate-200 mx-1 my-1" />

        {/* Media & Links */}
        <ToolbarButton
          icon={LinkIcon}
          title="Chèn Link"
          onClick={toggleLink}
          isActive={editor.isActive("link")}
        />
        <ToolbarButton
          icon={ImageIcon}
          title="Chèn Ảnh"
          onClick={addImage}
        />
        <ToolbarButton
          icon={YoutubeIcon}
          title="Chèn Video YouTube"
          onClick={addYoutube}
        />

        {/* Colors */}
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="color"
            title="Màu chữ"
            onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes("textStyle").color || "#000000"}
            className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
          />
          <ToolbarButton
            icon={Highlighter}
            title="Tô sáng (Vàng)"
            onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
            isActive={editor.isActive("highlight")}
          />
        </div>
      </div>

      {/* EDITOR AREA */}
      <EditorContent editor={editor} />
    </div>
  );
}

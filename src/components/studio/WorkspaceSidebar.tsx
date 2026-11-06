"use client";

/* Workspace sidebar: folders, boards, search, favourites, recents,
   board CRUD (create / rename inline / duplicate / archive / delete).
   Width 272px on desktop; slides over as a drawer on mobile. */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, Search, Star, Archive, Trash2, Copy, X, FolderOpen,
  MoreHorizontal, Pencil, Clock, Sparkles,
} from "lucide-react";
import { useStudio } from "./store";
import type { Board } from "./types";

type Filter = "all" | "fav" | "recent" | "archive";

export default function WorkspaceSidebar() {
  const open = useStudio((s) => s.sidebarOpen);
  const folders = useStudio((s) => s.folders);
  const boards = useStudio((s) => s.boards);
  const activeId = useStudio((s) => s.activeBoardId);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [folderId, setFolderId] = useState<string | "all">("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const list = useMemo(() => {
    const all = Object.values(boards);
    let out = all.filter((b) => (filter === "archive" ? b.archived : !b.archived));
    if (filter === "fav") out = out.filter((b) => b.favorite);
    if (folderId !== "all" && filter !== "recent") out = out.filter((b) => b.folderId === folderId);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((b) => b.title.toLowerCase().includes(q));
    }
    out.sort((a, b) => (filter === "recent" ? b.updated - a.updated : Number(b.favorite) - Number(a.favorite) || b.updated - a.updated));
    if (filter === "recent") out = out.slice(0, 6);
    return out;
  }, [boards, query, filter, folderId]);

  const st = useStudio.getState;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* mobile scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/45 md:hidden"
            onClick={() => st().toggle("sidebarOpen")}
            aria-hidden
          />
          <motion.aside
            key="panel"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="st-glass absolute bottom-0 left-0 top-0 z-40 flex w-[272px] flex-col rounded-none border-y-0 border-l-0 md:z-10"
            aria-label="Workspace"
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.28em] text-[var(--st-faint)]">
                my workspace
              </span>
              <button type="button" className="st-btn h-7 w-7 md:hidden" onClick={() => st().toggle("sidebarOpen")} aria-label="Close sidebar">
                <X size={13} />
              </button>
            </div>

            {/* search */}
            <div className="px-3.5 pb-2">
              <div className="relative">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--st-faint)]" />
                <input
                  className="st-input w-full py-2 pl-9 pr-3 text-[12.5px]"
                  placeholder="Search boards…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search boards"
                />
              </div>
            </div>

            {/* filters */}
            <div className="flex gap-1 px-3.5 pb-2">
              {([["all", "All"], ["fav", "Starred"], ["recent", "Recent"], ["archive", "Archive"]] as const).map(([f, label]) => (
                <button
                  key={f}
                  type="button"
                  className="st-btn flex-1 px-0 py-1.5 text-[10.5px]"
                  data-active={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* folders */}
            <div className="flex gap-1 overflow-x-auto px-3.5 pb-2 [scrollbar-width:none]">
              <button
                type="button"
                className="st-chip shrink-0"
                data-active-style={folderId === "all"}
                style={folderId === "all" ? { color: "var(--st-ink)", borderColor: "var(--st-line-2)" } : undefined}
                onClick={() => setFolderId("all")}
              >
                every world
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="st-chip shrink-0"
                  style={folderId === f.id ? { color: "var(--st-ink)", borderColor: "var(--st-line-2)" } : undefined}
                  onClick={() => setFolderId(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* new board */}
            <div className="px-3.5 pb-2">
              <button
                type="button"
                className="st-btn st-btn-primary w-full py-2 text-[12px]"
                onClick={() => st().createBoard(folderId === "all" ? null : folderId)}
              >
                <Plus size={14} />
                New board
              </button>
            </div>

            {/* board list */}
            <div className="st-scroll flex-1 overflow-y-auto px-2 pb-4">
              {list.length === 0 && (
                <p className="px-4 py-6 text-center text-[11.5px] leading-relaxed text-[var(--st-faint)]">
                  {filter === "archive" ? "Nothing archived." : "No boards match. Create one above — or open a starter board from an empty canvas."}
                </p>
              )}
              {list.map((b) => (
                <BoardRow
                  key={b.id}
                  board={b}
                  active={b.id === activeId}
                  menuOpen={menuFor === b.id}
                  onMenu={() => setMenuFor(menuFor === b.id ? null : b.id)}
                  closeMenu={() => setMenuFor(null)}
                />
              ))}
            </div>

            <div className="border-t border-[var(--st-line)] px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] text-[var(--st-faint)]">
                <Sparkles size={11} className="text-[var(--st-violet)]" />
                CODE Studio · part of The Mind Code
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function BoardRow({
  board,
  active,
  menuOpen,
  onMenu,
  closeMenu,
}: {
  board: Board;
  active: boolean;
  menuOpen: boolean;
  onMenu: () => void;
  closeMenu: () => void;
}) {
  const st = useStudio.getState;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(board.title);
  const folderName = useStudio((s) => s.folders.find((f) => f.id === board.folderId)?.name);
  const count = Object.keys(board.objects).length;

  return (
    <div className="group relative">
      {renaming ? (
        <input
          className="st-input mx-2 my-1 w-[calc(100%-16px)] px-2.5 py-2 text-[12.5px]"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            st().renameBoard(board.id, name.trim() || board.title);
            setRenaming(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setName(board.title);
              setRenaming(false);
            }
          }}
          aria-label="Board name"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            st().openBoard(board.id);
            closeMenu();
            if (window.innerWidth < 768) st().toggle("sidebarOpen");
          }}
          className={`flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left transition-colors ${
            active ? "bg-[rgba(255,158,61,0.14)] shadow-[inset_0_0_0_1px_rgba(255,158,61,0.4)]" : "hover:bg-[rgba(255,171,98,0.07)]"
          }`}
          aria-current={active ? "true" : undefined}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border border-[var(--st-line)] bg-[rgba(12,13,18,0.5)]"
            style={active ? { borderColor: "rgba(255,158,61,0.55)" } : undefined}
          >
            {board.favorite ? <Star size={11} fill="var(--st-amber)" color="var(--st-amber)" /> : folderName ? <FolderOpen size={11} className="text-[var(--st-faint)]" /> : <Clock size={11} className="text-[var(--st-faint)]" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[12.5px] font-medium ${active ? "text-[var(--st-ink)]" : "text-[var(--st-dim)]"}`}>
              {board.title}
            </span>
            <span className="block truncate font-[family-name:var(--font-code-mono)] text-[8.5px] uppercase tracking-[0.16em] text-[var(--st-faint)]">
              {folderName ?? "unfiled"} · {count} obj{count === 1 ? "" : "s"}
            </span>
          </span>
          <span
            role="button"
            tabIndex={0}
            className="st-btn h-6 w-6 shrink-0 border-none opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onMenu();
            }}
            onKeyDown={(e) => e.key === "Enter" && onMenu()}
            aria-label={`Board actions for ${board.title}`}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={12} />
          </span>
        </button>
      )}

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="st-glass absolute right-2 top-11 z-50 w-[190px] rounded-[13px] p-1.5"
            role="menu"
          >
            {[
              { label: "Rename", icon: Pencil, fn: () => setRenaming(true) },
              { label: board.favorite ? "Unstar" : "Star", icon: Star, fn: () => st().toggleFavorite(board.id) },
              { label: "Duplicate", icon: Copy, fn: () => st().duplicateBoard(board.id) },
              { label: board.archived ? "Unarchive" : "Archive", icon: Archive, fn: () => st().setArchived(board.id, !board.archived) },
              { label: "Delete", icon: Trash2, danger: true, fn: () => st().deleteBoard(board.id) },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[12px] transition-colors ${
                  item.danger ? "text-[var(--st-rose)] hover:bg-[var(--st-rose-soft)]" : "text-[var(--st-dim)] hover:bg-[rgba(255,171,98,0.09)] hover:text-[var(--st-ink)]"
                }`}
                onClick={() => {
                  item.fn();
                  closeMenu();
                }}
                role="menuitem"
              >
                <item.icon size={12.5} />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";

type PortfolioItem = {
  id: number;
  type: "image" | "video";
  url: string;
  caption: string;
};

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([
    {
      id: 1,
      type: "image",
      url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
      caption: "Soft glam look",
    },
  ]);

  const [type, setType] = useState<"image" | "video">("image");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [saved, setSaved] = useState(false);

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim()) return;

    const newItem: PortfolioItem = {
      id: Date.now(),
      type,
      url: url.trim(),
      caption: caption.trim(),
    };

    setItems((prev) => [newItem, ...prev]);
    setUrl("");
    setCaption("");
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <p className="text-sm text-[#8a6b5b]">Provider Setup</p>
        <h1 className="text-3xl font-bold">Your Portfolio</h1>
        <p className="text-[#6b5d54] mt-2">
          Add photos and videos to showcase your work.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Add Form */}
        <section className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Add new item</h2>

          <form onSubmit={handleAddItem} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "image" | "video")}
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Media URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste image or video link"
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Caption</label>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe this look"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <button className="w-full bg-[#5f3b2f] text-white py-3 rounded-xl font-semibold">
              Add to portfolio
            </button>
          </form>

          {saved && (
            <div className="mt-4 text-sm text-green-600">
              Added successfully
            </div>
          )}
        </section>

        {/* Preview Grid */}
        <section className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Preview</h2>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden group"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-40 object-cover"
                    controls
                  />
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                >
                  Remove
                </button>

                {/* Caption */}
                {item.caption && (
                  <div className="absolute bottom-0 w-full bg-black/50 text-white text-xs p-2">
                    {item.caption}
                  </div>
                )}
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <p className="text-sm text-[#6b5d54] mt-4">
              No items yet. Start adding your work.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
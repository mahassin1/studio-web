"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, uploadMultipleImages } from "@/lib/supabase/storage";

type ProviderProfileRow = {
  id?: string;
  user_id?: string;
  business_name: string | null;
  handle: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  profile_image: string | null;
  cover_image: string | null;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  contact_email: string | null;
  specialties: string | null;
  experience: string | null;
  primary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  font_family: string | null;
  portfolio_images: string[] | null;
};

export default function ProviderProfileSetupPage() {
  const supabase = createClient();

  const [businessName, setBusinessName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("Makeup Artist");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [bio, setBio] = useState("");

  const [profileImage, setProfileImage] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [specialties, setSpecialties] = useState("");
  const [experience, setExperience] = useState("");

  const [primaryColor, setPrimaryColor] = useState("#5f3b2f");
  const [accentColor, setAccentColor] = useState("#f3e8de");
  const [backgroundColor, setBackgroundColor] = useState("#fcfaf8");
  const [fontFamily, setFontFamily] = useState("font-sans");

  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [portfolioImageFiles, setPortfolioImageFiles] = useState<File[]>([]);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const publicUrl = useMemo(() => {
    return handle ? `/b/${handle}` : "/b/your-handle";
  }, [handle]);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        setMessage("You must be logged in to edit your profile.");
        return;
      }

      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<ProviderProfileRow>();

      if (error) {
        console.error("Failed to load profile:", error);
        setMessage("Could not load your profile.");
        setLoading(false);
        return;
      }

      if (data) {
        setBusinessName(data.business_name || "");
        setHandle(data.handle || "");
        setCategory(data.category || "Makeup Artist");
        setCity(data.city || "");
        setState(data.state || "CA");
        setBio(data.bio || "");
        setProfileImage(data.profile_image || "");
        setCoverImage(data.cover_image || "");
        setInstagram(data.instagram || "");
        setTiktok(data.tiktok || "");
        setWebsite(data.website || "");
        setContactEmail(data.contact_email || "");
        setSpecialties(data.specialties || "");
        setExperience(data.experience || "");
        setPrimaryColor(data.primary_color || "#5f3b2f");
        setAccentColor(data.accent_color || "#f3e8de");
        setBackgroundColor(data.background_color || "#fcfaf8");
        setFontFamily(data.font_family || "font-sans");
        setPortfolioImages(data.portfolio_images || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setMessage("");

    const normalizedHandle = handle.trim().toLowerCase().replace(/\s+/g, "-");

    if (!normalizedHandle) {
      setSaving(false);
      setMessage("Please add a public handle.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      setMessage("You must be logged in to save your profile.");
      return;
    }

    let uploadedProfileImage = profileImage || null;
    let uploadedCoverImage = coverImage || null;
    let uploadedPortfolioImages = [...portfolioImages];

    try {
      if (profileImageFile) {
        uploadedProfileImage = await uploadImage(
          profileImageFile,
          `profiles/${user.id}`
        );
      }

      if (coverImageFile) {
        uploadedCoverImage = await uploadImage(
          coverImageFile,
          `covers/${user.id}`
        );
      }

      if (portfolioImageFiles.length > 0) {
        const newPortfolioUrls = await uploadMultipleImages(
          portfolioImageFiles,
          `portfolio/${user.id}`
        );
        uploadedPortfolioImages = [...uploadedPortfolioImages, ...newPortfolioUrls];
      }
    } catch (uploadError) {
      console.error("Image upload failed:", uploadError);
      setSaving(false);
      setMessage("Image upload failed. Please try again.");
      return;
    }

    const payload = {
      user_id: user.id,
      business_name: businessName || null,
      handle: normalizedHandle,
      category: category || null,
      city: city || null,
      state: state || null,
      bio: bio || null,
      profile_image: uploadedProfileImage,
      cover_image: uploadedCoverImage,
      instagram: instagram || null,
      tiktok: tiktok || null,
      website: website || null,
      contact_email: contactEmail || null,
      specialties: specialties || null,
      experience: experience || null,
      primary_color: primaryColor,
      accent_color: accentColor,
      background_color: backgroundColor,
      font_family: fontFamily,
      portfolio_images: uploadedPortfolioImages,
    };

    const { error } = await supabase
      .from("provider_profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      console.error("Failed to save profile:", error);
      setMessage(error.message || "Failed to save profile.");
      return;
    }

    setProfileImage(uploadedProfileImage || "");
    setCoverImage(uploadedCoverImage || "");
    setPortfolioImages(uploadedPortfolioImages);
    setHandle(normalizedHandle);
    setProfileImageFile(null);
    setCoverImageFile(null);
    setPortfolioImageFiles([]);
    setSaved(true);
    setMessage("Profile saved successfully.");
    setTimeout(() => setSaved(false), 2000);
  }

  function removePortfolioImage(indexToRemove: number) {
    setPortfolioImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  }

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#8a6b5b]">Provider Setup</p>
        <h1 className="mt-2 text-3xl font-bold">Customize your profile</h1>
        <p className="mt-2 max-w-2xl text-[#6b5d54]">
          Add your images, social links, specialties, brand colors, font style,
          portfolio gallery, and booking notification email.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <div className="grid gap-5">
            <input
              placeholder="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] p-3"
            />

            <input
              placeholder="Handle (glam-by-amira)"
              value={handle}
              onChange={(e) =>
                setHandle(e.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              className="rounded-xl border border-[#e3d6cb] p-3"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <input
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-[#e3d6cb] p-3"
              />
              <input
                placeholder="Years of experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="rounded-xl border border-[#e3d6cb] p-3"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border border-[#e3d6cb] p-3"
              />
              <input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="rounded-xl border border-[#e3d6cb] p-3"
                maxLength={2}
              />
            </div>

            <textarea
              placeholder="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] p-3"
              rows={4}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Profile image upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setProfileImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full rounded-xl border border-[#e3d6cb] bg-white p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Cover image upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setCoverImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full rounded-xl border border-[#e3d6cb] bg-white p-3"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Portfolio image uploads
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setPortfolioImageFiles(Array.from(e.target.files));
                  }
                }}
                className="w-full rounded-xl border border-[#e3d6cb] bg-white p-3"
              />
            </div>

            {portfolioImages.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium">Current portfolio</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {portfolioImages.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-[#eadfd4]"
                    >
                      <img
                        src={image}
                        alt={`Portfolio ${index + 1}`}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-semibold shadow"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Primary color
                </label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#e3d6cb] bg-white p-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Accent color
                </label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#e3d6cb] bg-white p-2"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Background color
                </label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#e3d6cb] bg-white p-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Font style
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full rounded-xl border border-[#e3d6cb] p-3"
                >
                  <option value="font-sans">Modern Sans</option>
                  <option value="font-serif">Elegant Serif</option>
                  <option value="font-mono">Minimal Mono</option>
                </select>
              </div>
            </div>

            <input
              placeholder="Instagram link"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] p-3"
            />

            <input
              placeholder="TikTok link"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] p-3"
            />

            <input
              placeholder="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] p-3"
            />

            <input
              placeholder="Contact email (for booking notifications)"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] p-3"
            />

            <input
              placeholder="Specialties (e.g. Bridal, Soft Glam, Natural Hair)"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] p-3"
            />

            <button
              disabled={saving}
              className="rounded-xl bg-[#5f3b2f] py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            {saved && <p className="text-sm text-green-600">Profile saved.</p>}
            {message && !saved && (
              <p className="text-sm text-[#6b5d54]">{message}</p>
            )}
          </div>
        </form>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Live preview</h2>

          <div
            className={`mt-5 overflow-hidden rounded-3xl border border-[#eadfd4] ${fontFamily}`}
            style={{ backgroundColor }}
          >
            <div
              className="h-40 bg-cover bg-center"
              style={{
                backgroundImage: coverImage
                  ? `url(${coverImage})`
                  : "linear-gradient(to right, #ead7c4, #f1e3d7, #f7efe8)",
              }}
            />

            <div className="px-5 pb-5">
              <div className="-mt-10 flex items-end gap-4">
                <img
                  src={
                    profileImage ||
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop"
                  }
                  alt="Profile preview"
                  className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-md"
                />
                <div className="pb-1">
                  <p className="text-sm" style={{ color: primaryColor }}>
                    {category || "Category"}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {businessName || "Your business name"}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm text-[#6b5d54]">
                {city || "City"}, {state || "ST"}
              </p>

              <p className="mt-3 text-sm leading-6 text-[#5f5148]">
                {bio || "Your bio will appear here."}
              </p>

              <p className="mt-4 text-sm">
                <span className="font-semibold">Specialties:</span>{" "}
                {specialties || "Add specialties"}
              </p>

              <p className="mt-2 text-sm">
                <span className="font-semibold">Experience:</span>{" "}
                {experience || "0"} years
              </p>

              {portfolioImages.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-semibold">Portfolio preview</p>
                  <div className="grid grid-cols-2 gap-3">
                    {portfolioImages.slice(0, 4).map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`Portfolio preview ${index + 1}`}
                        className="h-24 w-full rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Example brand button
              </div>

              <p className="mt-4 text-sm text-[#8a6b5b]">Public URL</p>
              <p className="font-medium">{publicUrl}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
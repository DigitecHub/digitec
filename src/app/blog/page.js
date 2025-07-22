"use client";
import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../styles/BlogHome.module.css";

export default function BlogPage() {
  const [user, setUser] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    tags: "",
    meta_title: "",
    meta_description: "",
    read_time_minutes: "",
    featured_image_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(user);
        if (!user) {
          setLoading(false);
          return;
        }
        // Check superuser
        const { data: superuserData, error: superuserError } = await supabase
          .from("superusers")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (superuserData) setIsSuperuser(true);
      } catch (err) {
        setError("Failed to authenticate or check superuser status.");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    async function fetchPosts() {
      setPostsLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, published_at, tags")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) {
        setPosts([]);
      } else {
        setPosts(data || []);
      }
      setPostsLoading(false);
    }
    fetchPosts();
  }, [success, supabase]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });
    setUploading(false);
    if (error) {
      setError("Image upload failed: " + error.message);
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    let imageUrl = form.featured_image_url;
    if (imageFile) {
      imageUrl = await handleUploadImage();
      if (!imageUrl) return;
    }
    // Insert blog post
    const { error: insertError } = await supabase.from("blog_posts").insert({
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      featured_image_url: imageUrl,
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      read_time_minutes: form.read_time_minutes ? parseInt(form.read_time_minutes) : null,
      author_id: user.id,
      status: "published",
      published_at: new Date().toISOString(),
    });
    if (insertError) {
      setError("Failed to add blog post: " + insertError.message);
      return;
    }
    setSuccess("Blog post added successfully!");
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      tags: "",
      meta_title: "",
      meta_description: "",
      read_time_minutes: "",
      featured_image_url: "",
    });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(false);
  };

  return (
    <div className={styles.blogHomeContainer}>
      <div className={styles.blogHeader}>
        <h1>Digitec Blog</h1>
        <div className="subtitle">Inspiration. Knowledge. Growth.</div>
        <p>
          Explore our world-class articles, stories, and guides. Stay inspired and keep learning.
        </p>
      </div>

      {/* Floating Action Button for Superuser */}
      {isSuperuser && !showModal && (
        <button className={styles.fab} aria-label="Add Blog Post" onClick={() => setShowModal(true)}>
          +
        </button>
      )}

      {/* Modal for Add Blog Form */}
      {isSuperuser && showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} aria-label="Close" onClick={() => setShowModal(false)}>&times;</button>
            <h2>Add New Blog Post</h2>
            <form onSubmit={handleSubmit}>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="Slug (unique, e.g. my-first-blog)" required />
              <input name="excerpt" value={form.excerpt} onChange={handleChange} placeholder="Excerpt" />
              <textarea name="content" value={form.content} onChange={handleChange} placeholder="Content (HTML allowed)" rows={8} required />
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="Tags (comma separated)" />
              <input name="meta_title" value={form.meta_title} onChange={handleChange} placeholder="Meta Title" />
              <input name="meta_description" value={form.meta_description} onChange={handleChange} placeholder="Meta Description" />
              <input name="read_time_minutes" value={form.read_time_minutes} onChange={handleChange} placeholder="Read Time (minutes)" type="number" min="1" />
              <div style={{ marginBottom: 16 }}>
                <label>Featured Image: </label>
                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className={styles.fileInput} />
                {uploading && <span className={styles.uploading}>Uploading...</span>}
              </div>
              <button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Add Blog Post'}
              </button>
              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Blog Posts List */}
      <div className="container">
        {postsLoading ? (
          <div className={styles.loading}>Loading blog posts...</div>
        ) : posts.length === 0 ? (
          <div className={styles.error}>No blog posts yet.</div>
        ) : (
          <div className={styles.blogGrid}>
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.blogCard}>
                  {post.featured_image_url && (
                    <div className={styles.blogImageWrapper}>
                      <img src={post.featured_image_url} alt={post.title} className={styles.blogImage} />
                    </div>
                  )}
                  <div className={styles.blogCardContent}>
                    <h3 className={styles.blogCardTitle}>{post.title}</h3>
                    <div className={styles.blogCardMeta}>
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                    </div>
                    <div className={styles.blogCardExcerpt}>{post.excerpt}</div>
                    <div className={styles.blogCardTags}>
                      {post.tags && post.tags.length > 0 && post.tags.map(tag => (
                        <span key={tag} className={styles.blogTag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
